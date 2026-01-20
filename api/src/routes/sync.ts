import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Apply auth middleware to all sync routes
router.use(authMiddleware)

// Push changes from client to server
router.post('/push', async (req: AuthRequest, res) => {
  try {
    const { products, customers, sales, categories, creditTransactions } = req.body
    const businessId = req.businessId!
    const results = { products: 0, customers: 0, sales: 0, categories: 0, creditTransactions: 0 }

    // Sync categories
    if (categories?.length) {
      for (const cat of categories) {
        await prisma.category.upsert({
          where: { id: cat.id || 0 },
          create: { businessId, name: cat.name, icon: cat.icon, sortOrder: cat.sortOrder || 0 },
          update: { name: cat.name, icon: cat.icon, sortOrder: cat.sortOrder || 0 }
        })
        results.categories++
      }
    }

    // Sync products
    if (products?.length) {
      for (const prod of products) {
        await prisma.product.upsert({
          where: { localId: prod.localId || `local-${prod.id}` },
          create: {
            businessId,
            localId: prod.localId || `local-${prod.id}`,
            name: prod.name,
            price: prod.price,
            cost: prod.cost || 0,
            barcode: prod.barcode,
            categoryId: prod.categoryId,
            stockQuantity: prod.stockQuantity,
            lowStockThreshold: prod.lowStockThreshold || 5,
            unitType: prod.unitType || 'unit',
            isActive: prod.isActive !== false
          },
          update: {
            name: prod.name,
            price: prod.price,
            cost: prod.cost || 0,
            barcode: prod.barcode,
            categoryId: prod.categoryId,
            stockQuantity: prod.stockQuantity,
            lowStockThreshold: prod.lowStockThreshold || 5,
            isActive: prod.isActive !== false
          }
        })
        results.products++
      }
    }

    // Sync customers
    if (customers?.length) {
      for (const cust of customers) {
        await prisma.customer.upsert({
          where: { localId: cust.localId || `local-${cust.id}` },
          create: {
            businessId,
            localId: cust.localId || `local-${cust.id}`,
            name: cust.name,
            phone: cust.phone,
            notes: cust.notes,
            creditBalance: cust.creditBalance || 0
          },
          update: {
            name: cust.name,
            phone: cust.phone,
            notes: cust.notes,
            creditBalance: cust.creditBalance || 0
          }
        })
        results.customers++
      }
    }

    // Sync sales
    if (sales?.length) {
      for (const sale of sales) {
        const existingSale = await prisma.sale.findUnique({ where: { localId: sale.localId } })
        
        if (!existingSale) {
          // Find server IDs for customer
          let customerId = null
          if (sale.customerId) {
            const customer = await prisma.customer.findFirst({
              where: { businessId, localId: { contains: String(sale.customerId) } }
            })
            customerId = customer?.id
          }

          const newSale = await prisma.sale.create({
            data: {
              businessId,
              localId: sale.localId,
              userId: sale.userId,
              customerId,
              subtotal: sale.subtotal,
              discount: sale.discount || 0,
              discountType: sale.discountType || 'fixed',
              tax: sale.tax || 0,
              total: sale.total,
              status: sale.status || 'completed',
              createdAt: new Date(sale.createdAt)
            }
          })

          // Create sale items
          if (sale.items?.length) {
            for (const item of sale.items) {
              const product = await prisma.product.findFirst({
                where: { businessId, localId: { contains: String(item.productId) } }
              })
              
              await prisma.saleItem.create({
                data: {
                  saleId: newSale.id,
                  productId: product?.id || item.productId,
                  productName: item.productName,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  discount: item.discount || 0,
                  subtotal: item.subtotal
                }
              })
            }
          }

          // Create payments
          if (sale.payments?.length) {
            for (const payment of sale.payments) {
              await prisma.payment.create({
                data: {
                  saleId: newSale.id,
                  method: payment.method,
                  amount: payment.amount,
                  status: payment.status || 'completed'
                }
              })
            }
          }

          results.sales++
        }
      }
    }

    // Sync credit transactions
    if (creditTransactions?.length) {
      for (const trans of creditTransactions) {
        const customer = await prisma.customer.findFirst({
          where: { businessId, localId: { contains: String(trans.customerId) } }
        })
        
        if (customer) {
          await prisma.creditTransaction.create({
            data: {
              customerId: customer.id,
              amount: trans.amount,
              type: trans.type,
              balanceAfter: trans.balanceAfter,
              notes: trans.notes,
              createdAt: new Date(trans.createdAt)
            }
          })
          results.creditTransactions++
        }
      }
    }

    res.json({ success: true, synced: results })
  } catch (error) {
    console.error('Push sync error:', error)
    res.status(500).json({ error: 'Sync failed' })
  }
})

// Pull all data from server to client
router.get('/pull', async (req: AuthRequest, res) => {
  try {
    const businessId = req.businessId!
    const since = req.query.since ? new Date(req.query.since as string) : new Date(0)

    const [products, customers, sales, categories, users] = await Promise.all([
      prisma.product.findMany({ where: { businessId, updatedAt: { gte: since } } }),
      prisma.customer.findMany({ where: { businessId, updatedAt: { gte: since } } }),
      prisma.sale.findMany({ 
        where: { businessId, updatedAt: { gte: since } },
        include: { items: true, payments: true }
      }),
      prisma.category.findMany({ where: { businessId } }),
      prisma.user.findMany({ where: { businessId, isActive: true }, select: { id: true, name: true, phone: true, role: true } })
    ])

    res.json({
      products,
      customers,
      sales,
      categories,
      users,
      syncedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Pull sync error:', error)
    res.status(500).json({ error: 'Sync failed' })
  }
})

export default router
