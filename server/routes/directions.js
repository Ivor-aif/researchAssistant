import express from 'express'
import { body, param, query, validationResult } from 'express-validator'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import db from '../db.js'

const router = express.Router()

const uploadDir = path.join(process.cwd(), 'server', 'data', 'direction_files')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})
const upload = multer({ storage: storage })

router.get('/', query('projectId').optional().isString(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  const { projectId } = req.query
  if (projectId) {
    const proj = await db.projects.findOne({ _id: projectId })
    if (!proj || proj.user_id !== req.user.id) return res.status(404).json({ error: 'Project not found' })
    const rows = await db.directions.find({ project_id: projectId }).sort({ _id: -1 })
    return res.json(rows.map(({ _id, project_id, name, description, status, created_at, updated_at, deep_tendency, deep_files }) => ({ 
      id: _id, project_id, name, description, status: status || '未生成综述', created_at, updated_at,
      deep_tendency: deep_tendency || '',
      deep_files: deep_files || []
    })))
  } else {
    const projs = await db.projects.find({ user_id: req.user.id })
    const projIds = projs.map(p => p._id)
    const rows = await db.directions.find({ project_id: { $in: projIds } }).sort({ _id: -1 })
    return res.json(rows.map(({ _id, project_id, name, description, status, created_at, updated_at, deep_tendency, deep_files }) => ({ 
      id: _id, project_id, name, description, status: status || '未生成综述', created_at, updated_at,
      deep_tendency: deep_tendency || '',
      deep_files: deep_files || []
    })))
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
  body('review_md').optional().isString().isLength({ max: 500000 }),
  body('deep_tendency').optional().isString().isLength({ max: 50000 }),
  body('citation_stats').optional().isObject(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { id } = req.params
    const dir = await db.directions.findOne({ _id: id })
    if (!dir) return res.status(404).json({ error: 'Direction not found' })
    const proj = await db.projects.findOne({ _id: dir.project_id })
    if (!proj || proj.user_id !== req.user.id) return res.status(404).json({ error: 'Direction not found' })
    const { name, description, status, review_md, citation_stats, deep_tendency } = req.body
    const now = new Date().toISOString()
    const nextSet = { 
      name: name ?? dir.name, 
      description: description ?? dir.description, 
      status: status ?? dir.status ?? '未生成综述', 
      updated_at: now 
    }
    if (typeof review_md === 'string') nextSet.review_md = review_md
    if (citation_stats && typeof citation_stats === 'object') nextSet.citation_stats = citation_stats
    if (typeof deep_tendency === 'string') nextSet.deep_tendency = deep_tendency
    
    await db.directions.update({ _id: id }, { $set: nextSet })
    const row = await db.directions.findOne({ _id: id })
    res.json({ 
      id: row._id, 
      project_id: row.project_id, 
      name: row.name, 
      description: row.description, 
      status: row.status || '未生成综述', 
      review_md: row.review_md || null,
      citation_stats: row.citation_stats || null,
      deep_tendency: row.deep_tendency || '',
      deep_files: row.deep_files || [],
      created_at: row.created_at, 
      updated_at: row.updated_at 
    })
  }
)

router.post('/:id/files', param('id').isString(), upload.single('file'), async (req, res) => {
  const { id } = req.params
  const dir = await db.directions.findOne({ _id: id })
  if (!dir) return res.status(404).json({ error: 'Direction not found' })
  const proj = await db.projects.findOne({ _id: dir.project_id })
  if (!proj || proj.user_id !== req.user.id) return res.status(404).json({ error: 'Permission denied' })
  
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  
  const fileMeta = {
    id: 'df_' + Math.random().toString(36).slice(2),
    filename: req.file.originalname,
    path: req.file.filename, // Store just filename in uploadDir
    size: req.file.size,
    type: req.file.mimetype,
    created_at: new Date().toISOString()
  }
  
  await db.directions.update({ _id: id }, { $push: { deep_files: fileMeta } })
  res.json(fileMeta)
})

router.delete('/:id/files/:fileId', param('id').isString(), param('fileId').isString(), async (req, res) => {
  const { id, fileId } = req.params
  const dir = await db.directions.findOne({ _id: id })
  if (!dir) return res.status(404).json({ error: 'Direction not found' })
  const proj = await db.projects.findOne({ _id: dir.project_id })
  if (!proj || proj.user_id !== req.user.id) return res.status(404).json({ error: 'Permission denied' })
  
  const files = dir.deep_files || []
  const found = files.find(f => f.id === fileId)
  if (!found) return res.status(404).json({ error: 'File not found' })
  
  try {
    const p = path.join(uploadDir, found.path)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  } catch (e) {
    console.error('Delete file error', e)
  }
  
  await db.directions.update({ _id: id }, { $pull: { deep_files: { id: fileId } } })
  res.json({ ok: true })
})

router.get('/:id/files/:fileId', param('id').isString(), param('fileId').isString(), async (req, res) => {
  const { id, fileId } = req.params
  const dir = await db.directions.findOne({ _id: id })
  if (!dir) return res.status(404).json({ error: 'Direction not found' })
  const proj = await db.projects.findOne({ _id: dir.project_id })
  if (!proj || proj.user_id !== req.user.id) return res.status(404).json({ error: 'Permission denied' })
  
  const files = dir.deep_files || []
  const found = files.find(f => f.id === fileId)
  if (!found) return res.status(404).json({ error: 'File not found' })
  
  const p = path.join(uploadDir, found.path)
  if (!fs.existsSync(p)) return res.status(404).json({ error: 'File content missing' })
  
  res.download(p, found.filename)
})

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
