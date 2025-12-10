import express from 'express'
import { body, param, query, validationResult } from 'express-validator'
import db from '../db.js'

const router = express.Router()

router.get('/', query('projectId').optional().isString(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  const { projectId } = req.query
  if (projectId) {
    const proj = await db.projects.findOne({ _id: projectId })
    if (!proj || proj.user_id !== req.user.id) return res.status(404).json({ error: 'Project not found' })
    const rows = await db.directions.find({ project_id: projectId }).sort({ _id: -1 })
    return res.json(rows.map(({ _id, project_id, name, description, status, created_at, updated_at }) => ({ id: _id, project_id, name, description, status: status || '未生成综述', created_at, updated_at })))
  } else {
    const projs = await db.projects.find({ user_id: req.user.id })
    const projIds = projs.map(p => p._id)
    const rows = await db.directions.find({ project_id: { $in: projIds } }).sort({ _id: -1 })
    return res.json(rows.map(({ _id, project_id, name, description, status, created_at, updated_at }) => ({ id: _id, project_id, name, description, status: status || '未生成综述', created_at, updated_at })))
  }
})

router.post(
  '/',
  body('projectId').isString().isLength({ min: 1 }),
  body('name').isString().isLength({ min: 1, max: 128 }).trim(),
  body('description').optional().isString().isLength({ max: 2000 }),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { projectId, name, description } = req.body
    const proj = await db.projects.findOne({ _id: projectId })
    if (!proj || proj.user_id !== req.user.id) return res.status(404).json({ error: 'Project not found' })
    const now = new Date().toISOString()
    const doc = await db.directions.insert({ project_id: projectId, name, description: description || null, status: '未生成综述', created_at: now, updated_at: now })
    res.json({ id: doc._id, project_id: projectId, name, description: description || null, status: '未生成综述', created_at: now, updated_at: now })
  }
)

router.put(
  '/:id',
  param('id').isString().isLength({ min: 1 }),
  body('name').optional().isString().isLength({ min: 1, max: 128 }).trim(),
  body('description').optional().isString().isLength({ max: 2000 }),
  body('status').optional().isString().isIn(['未生成综述','已生成综述']),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { id } = req.params
    const dir = await db.directions.findOne({ _id: id })
    if (!dir) return res.status(404).json({ error: 'Direction not found' })
    const proj = await db.projects.findOne({ _id: dir.project_id })
    if (!proj || proj.user_id !== req.user.id) return res.status(404).json({ error: 'Direction not found' })
    const { name, description, status } = req.body
    const now = new Date().toISOString()
    await db.directions.update({ _id: id }, { $set: { name: name ?? dir.name, description: description ?? dir.description, status: status ?? dir.status ?? '未生成综述', updated_at: now } })
    const row = await db.directions.findOne({ _id: id })
    res.json({ id: row._id, project_id: row.project_id, name: row.name, description: row.description, status: row.status || '未生成综述', created_at: row.created_at, updated_at: row.updated_at })
  }
)

router.delete('/:id', param('id').isString().isLength({ min: 1 }), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  const { id } = req.params
  const dir = await db.directions.findOne({ _id: id })
  if (!dir) return res.status(404).json({ error: 'Direction not found' })
  const proj = await db.projects.findOne({ _id: dir.project_id })
  if (!proj || proj.user_id !== req.user.id) return res.status(404).json({ error: 'Direction not found' })
  await db.directions.remove({ _id: id }, {})
  res.json({ ok: true })
})

export default router
