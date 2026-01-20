import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: number
  businessId?: number
  role?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any

    req.userId = decoded.userId
    req.businessId = decoded.businessId
    req.role = decoded.role

    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}
