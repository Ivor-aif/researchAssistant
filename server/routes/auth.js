import express from 'express'
import { body, validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()

router.post(
  '/register',
  body('username').isString().isLength({ min: 3, max: 32 }).trim(),
  body('password').isString().isLength({ min: 6, max: 128 }),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { username, password } = req.body
    const now = new Date().toISOString()
    const hash = bcrypt.hashSync(password, 10)
    try {
      const doc = await db.users.insert({ username, password_hash: hash, created_at: now, updated_at: now })
      return res.json({ id: doc._id, username })
    } catch (e) {
      if (String(e).includes('unique')) return res.status(409).json({ error: 'Username already exists' })
      return res.status(500).json({ error: 'Server error' })
    }
  }
)

router.post(
  '/login',
  body('username').isString().trim(),
  body('password').isString(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { username, password } = req.body
    const row = await db.users.findOne({ username })
    if (!row) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = bcrypt.compareSync(password, row.password_hash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ sub: row._id, username }, process.env.JWT_SECRET, { expiresIn: '7d' })
    return res.json({ token })
  }
)

export default router
