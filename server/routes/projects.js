import express from 'express'
import { body, param, validationResult } from 'express-validator'
import db from '../db.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const rows = await db.projects.find({ user_id: req.user.id }).sort({ updated_at: -1 })
  const map = rows.map(({ _id, name, description, created_at, updated_at }) => ({ id: _id, name, description, created_at, updated_at }))
  res.json(map)
})

router.post(
  '/',
  body('name').isString().isLength({ min: 1, max: 128 }).trim(),
  body('description').optional().isString().isLength({ max: 2000 }),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { name, description } = req.body
    const now = new Date().toISOString()
    const doc = await db.projects.insert({ user_id: req.user.id, name, description: description || null, created_at: now, updated_at: now })
    res.json({ id: doc._id, name, description: description || null, created_at: now, updated_at: now })
  }
)

router.put(
  '/:id',
  param('id').isString().isLength({ min: 1 }),
  body('name').optional().isString().isLength({ min: 1, max: 128 }).trim(),
  body('description').optional().isString().isLength({ max: 2000 }),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { id } = req.params
    const { name, description } = req.body
    const now = new Date().toISOString()
    const existing = await db.projects.findOne({ _id: id, user_id: req.user.id })
    if (!existing) return res.status(404).json({ error: 'Project not found' })
    await db.projects.update({ _id: id }, { $set: { name: name ?? existing.name, description: description ?? existing.description, updated_at: now } })
    const row = await db.projects.findOne({ _id: id })
    res.json({ id: row._id, name: row.name, description: row.description, created_at: row.created_at, updated_at: row.updated_at })
  }
)

router.delete('/:id', param('id').isString().isLength({ min: 1 }), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  const { id } = req.params
  const row = await db.projects.findOne({ _id: id, user_id: req.user.id })
  if (!row) return res.status(404).json({ error: 'Project not found' })
  await db.projects.remove({ _id: id }, {})
  await db.directions.remove({ project_id: id }, { multi: true })
  res.json({ ok: true })
})

export default router
