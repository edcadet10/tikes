import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

// Get business info
router.get('/', async (req: AuthRequest, res) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.businessId },
      include: {
        users: { where: { isActive: true }, select: { id: true, name: true, phone: true, role: true } }
      }
    })
    res.json(business)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch business' })
  }
})

// Update business
router.put('/', async (req: AuthRequest, res) => {
  try {
    if (req.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can update business' })
    }

    const { name, phone, address } = req.body
    const business = await prisma.business.update({
      where: { id: req.businessId },
      data: { name, phone, address }
    })
    res.json(business)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update business' })
  }
})

// Add employee
router.post('/employees', async (req: AuthRequest, res) => {
  try {
    if (req.role !== 'owner' && req.role !== 'manager') {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const { name, phone, pin, role } = req.body
    if (!name || !pin || pin.length !== 4) {
      return res.status(400).json({ error: 'Name and 4-digit PIN required' })
    }

    const hashedPin = await bcrypt.hash(pin, 10)
    const user = await prisma.user.create({
      data: {
        businessId: req.businessId!,
        name,
        phone,
        pin: hashedPin,
        role: role || 'cashier'
      }
    })

    res.json({ id: user.id, name: user.name, phone: user.phone, role: user.role })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add employee' })
  }
})

// Update employee
router.put('/employees/:id', async (req: AuthRequest, res) => {
  try {
    if (req.role !== 'owner' && req.role !== 'manager') {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const { name, phone, pin, role, isActive } = req.body
    const employeeId = parseInt(req.params.id as string)

    const data: any = { name, phone, role }
    if (pin && pin.length === 4) {
      data.pin = await bcrypt.hash(pin, 10)
    }
    if (typeof isActive === 'boolean') {
      data.isActive = isActive
    }

    const user = await prisma.user.update({
      where: { id: employeeId },
      data
    })

    res.json({ id: user.id, name: user.name, phone: user.phone, role: user.role })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee' })
  }
})

export default router
