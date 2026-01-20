import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = Router()
const prisma = new PrismaClient()

// Register a new business with owner
router.post('/register', async (req, res) => {
  try {
    const { businessName, ownerName, phone, pin } = req.body

    if (!businessName || !ownerName || !pin || pin.length !== 4) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Create business and owner in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const business = await tx.business.create({
        data: { name: businessName, phone }
      })

      const hashedPin = await bcrypt.hash(pin, 10)
      const owner = await tx.user.create({
        data: {
          businessId: business.id,
          name: ownerName,
          phone,
          pin: hashedPin,
          role: 'owner'
        }
      })

      return { business, owner }
    })

    const token = jwt.sign(
      { userId: result.owner.id, businessId: result.business.id, role: 'owner' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    )

    res.json({
      token,
      user: { id: result.owner.id, name: result.owner.name, role: result.owner.role },
      business: { id: result.business.id, name: result.business.name }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login with PIN
router.post('/login', async (req, res) => {
  try {
    const { businessId, pin } = req.body

    if (!businessId || !pin) {
      return res.status(400).json({ error: 'Missing business ID or PIN' })
    }

    // Find users in business
    const users = await prisma.user.findMany({
      where: { businessId: parseInt(businessId), isActive: true },
      include: { business: true }
    })

    // Check PIN against all users
    for (const user of users) {
      const validPin = await bcrypt.compare(pin, user.pin)
      if (validPin) {
        const token = jwt.sign(
          { userId: user.id, businessId: user.businessId, role: user.role },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '30d' }
        )

        return res.json({
          token,
          user: { id: user.id, name: user.name, role: user.role, phone: user.phone },
          business: { id: user.business.id, name: user.business.name }
        })
      }
    }

    res.status(401).json({ error: 'Invalid PIN' })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { business: true }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found' })
    }

    res.json({
      user: { id: user.id, name: user.name, role: user.role, phone: user.phone },
      business: { id: user.business.id, name: user.business.name }
    })
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
