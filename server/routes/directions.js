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
    return res.json(rows.map((row) => ({ 
      id: row._id,
      project_id: row.project_id,
      name: row.name,
      description: row.description,
      status: row.status || '未生成综述',
      created_at: row.created_at,
      updated_at: row.updated_at,
      deep_tendency: row.deep_tendency || '',
      deep_files: row.deep_files || [],
      conclusion_files: row.conclusion_files || [],
      paper_md: row.paper_md || '',
      supplementary_md: row.supplementary_md || '',
      paper_extra_req: row.paper_extra_req || '',
      cover_letter: row.cover_letter || '',
      submission_status: row.submission_status || '',
      reviews: row.reviews || [],
      response_content: row.response_content || '',
      response_raw: row.response_raw || '',
      final_paper_md: row.final_paper_md || '',
      final_supplementary_md: row.final_supplementary_md || '',
      
      // Step 1: Literature Collection
      keywords: row.keywords || '',
      search_api_name: row.search_api_name || '',
      search_prompt_tpl: row.search_prompt_tpl || '',
      manual_site_selected: row.manual_site_selected || {},
      search_results: row.search_results || [],
      uploaded_files: row.uploaded_files || [],

      // Step 2: Research Anchoring
      review_api_name: row.review_api_name || '',
      review_prompt_tpl: row.review_prompt_tpl || '',

      // Step 3: Deep Research
      deep_api_name: row.deep_api_name || '',
      deep_prompt_tpl: row.deep_prompt_tpl || '',
      deep_result: row.deep_result || '',

      // Step 3.5: Data Analysis
      data_api_name: row.data_api_name || '',
      data_prompt_tpl: row.data_prompt_tpl || '',
      data_result: row.data_result || '',
      data_files: row.data_files || [],

      // Step 3.6: Conclusion
      conclusion_api_name: row.conclusion_api_name || '',
      conclusion_prompt_tpl: row.conclusion_prompt_tpl || '',
      conclusion_result: row.conclusion_result || '',

      // Step 4: Paper Writing
      paper_api_name: row.paper_api_name || '',
      paper_prompt_tpl: row.paper_prompt_tpl || ''
    })))
  } else {
    const projs = await db.projects.find({ user_id: req.user.id })
    const projIds = projs.map(p => p._id)
    const rows = await db.directions.find({ project_id: { $in: projIds } }).sort({ _id: -1 })
    return res.json(rows.map(({ _id, project_id, name, description, status, created_at, updated_at, deep_tendency, deep_files, conclusion_files, paper_md, supplementary_md, paper_extra_req, cover_letter, submission_status, reviews, response_content, response_raw, final_paper_md, final_supplementary_md, keywords, search_api_name, search_prompt_tpl, manual_site_selected, search_results, uploaded_files, review_api_name, review_prompt_tpl, deep_api_name, deep_prompt_tpl, deep_result, data_api_name, data_prompt_tpl, data_result, data_files, conclusion_api_name, conclusion_prompt_tpl, conclusion_result, paper_api_name, paper_prompt_tpl, ...row }) => ({ 
      id: _id, project_id, name, description, status: status || '未生成综述', created_at, updated_at,
      deep_tendency: deep_tendency || '',
      deep_files: deep_files || [],
      conclusion_files: conclusion_files || [],
      paper_md: paper_md || '',
      supplementary_md: supplementary_md || '',
      paper_extra_req: paper_extra_req || '',
      cover_letter: cover_letter || '',
      submission_status: submission_status || '',
      reviews: reviews || [],
      response_content: response_content || '',
      response_raw: response_raw || '',
      final_paper_md: final_paper_md || '',
      final_supplementary_md: final_supplementary_md || '',

      // Step 1
      keywords: keywords || '',
      search_api_name: search_api_name || '',
      search_prompt_tpl: search_prompt_tpl || '',
      manual_site_selected: manual_site_selected || {},
      search_results: search_results || [],
      uploaded_files: uploaded_files || [],

      // Step 2
      review_api_name: review_api_name || '',
      review_prompt_tpl: review_prompt_tpl || '',

      // Step 3
      deep_api_name: deep_api_name || '',
      deep_prompt_tpl: deep_prompt_tpl || '',
      deep_result: deep_result || '',

      // Step 3.5
      data_api_name: data_api_name || '',
      data_prompt_tpl: data_prompt_tpl || '',
      data_result: data_result || '',
      data_files: data_files || [],

      // Step 3.6
      conclusion_api_name: conclusion_api_name || '',
      conclusion_prompt_tpl: conclusion_prompt_tpl || '',
      conclusion_result: conclusion_result || '',

      // Step 4
      paper_api_name: paper_api_name || '',
      paper_prompt_tpl: paper_prompt_tpl || ''
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
  body('status').optional().isString(),
  body('review_md').optional().isString().isLength({ max: 500000 }),
  body('deep_tendency').optional().isString().isLength({ max: 50000 }),
  body('paper_md').optional().isString().isLength({ max: 500000 }),
  body('supplementary_md').optional().isString().isLength({ max: 500000 }),
  body('paper_extra_req').optional().isString().isLength({ max: 10000 }),
  body('citation_stats').optional().isObject(),
  
  // New Fields Validation
  body('keywords').optional().isString(),
  body('search_api_name').optional().isString(),
  body('search_prompt_tpl').optional().isString(),
  body('manual_site_selected').optional().isObject(),
  body('search_results').optional().isArray(),
  body('uploaded_files').optional().isArray(),
  
  body('review_api_name').optional().isString(),
  body('review_prompt_tpl').optional().isString(),
  
  body('deep_api_name').optional().isString(),
  body('deep_prompt_tpl').optional().isString(),
  body('deep_result').optional().isString(),
  
  body('data_api_name').optional().isString(),
  body('data_prompt_tpl').optional().isString(),
  body('data_result').optional().isString(),
  body('data_files').optional().isArray(),
  
  body('conclusion_api_name').optional().isString(),
  body('conclusion_prompt_tpl').optional().isString(),
  body('conclusion_result').optional().isString(),
  
  body('paper_api_name').optional().isString(),
  body('paper_prompt_tpl').optional().isString(),

  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { id } = req.params
    const dir = await db.directions.findOne({ _id: id })
    if (!dir) return res.status(404).json({ error: 'Direction not found' })
    const proj = await db.projects.findOne({ _id: dir.project_id })
    if (!proj || proj.user_id !== req.user.id) return res.status(404).json({ error: 'Direction not found' })
    const { name, description, status, review_md, citation_stats, deep_tendency, paper_md, supplementary_md, paper_extra_req } = req.body
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
    if (typeof paper_md === 'string') nextSet.paper_md = paper_md
    if (typeof supplementary_md === 'string') nextSet.supplementary_md = supplementary_md
    if (typeof paper_extra_req === 'string') nextSet.paper_extra_req = paper_extra_req

    // New Fields Processing
    const { 
        keywords, search_api_name, search_prompt_tpl, manual_site_selected, search_results, uploaded_files,
        review_api_name, review_prompt_tpl,
        deep_api_name, deep_prompt_tpl, deep_result,
        data_api_name, data_prompt_tpl, data_result, data_files,
        conclusion_api_name, conclusion_prompt_tpl, conclusion_result,
        paper_api_name, paper_prompt_tpl
    } = req.body

    if (typeof keywords === 'string') nextSet.keywords = keywords
    if (typeof search_api_name === 'string') nextSet.search_api_name = search_api_name
    if (typeof search_prompt_tpl === 'string') nextSet.search_prompt_tpl = search_prompt_tpl
    if (manual_site_selected && typeof manual_site_selected === 'object') nextSet.manual_site_selected = manual_site_selected
    if (Array.isArray(search_results)) nextSet.search_results = search_results
    if (Array.isArray(uploaded_files)) nextSet.uploaded_files = uploaded_files

    if (typeof review_api_name === 'string') nextSet.review_api_name = review_api_name
    if (typeof review_prompt_tpl === 'string') nextSet.review_prompt_tpl = review_prompt_tpl

    if (typeof deep_api_name === 'string') nextSet.deep_api_name = deep_api_name
    if (typeof deep_prompt_tpl === 'string') nextSet.deep_prompt_tpl = deep_prompt_tpl
    if (typeof deep_result === 'string') nextSet.deep_result = deep_result

    if (typeof data_api_name === 'string') nextSet.data_api_name = data_api_name
    if (typeof data_prompt_tpl === 'string') nextSet.data_prompt_tpl = data_prompt_tpl
    if (typeof data_result === 'string') nextSet.data_result = data_result
    if (Array.isArray(data_files)) nextSet.data_files = data_files

    if (typeof conclusion_api_name === 'string') nextSet.conclusion_api_name = conclusion_api_name
    if (typeof conclusion_prompt_tpl === 'string') nextSet.conclusion_prompt_tpl = conclusion_prompt_tpl
    if (typeof conclusion_result === 'string') nextSet.conclusion_result = conclusion_result

    if (typeof paper_api_name === 'string') nextSet.paper_api_name = paper_api_name
    if (typeof paper_prompt_tpl === 'string') nextSet.paper_prompt_tpl = paper_prompt_tpl

    // Submission Simulation Fields
    const { cover_letter, submission_status, reviews, response_content, response_raw, final_paper_md, final_supplementary_md } = req.body
    if (typeof cover_letter === 'string') nextSet.cover_letter = cover_letter
    if (typeof submission_status === 'string') nextSet.submission_status = submission_status
    if (Array.isArray(reviews)) nextSet.reviews = reviews
    if (typeof response_content === 'string') nextSet.response_content = response_content
    if (typeof response_raw === 'string') nextSet.response_raw = response_raw
    if (typeof final_paper_md === 'string') nextSet.final_paper_md = final_paper_md
    if (typeof final_supplementary_md === 'string') nextSet.final_supplementary_md = final_supplementary_md
    
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
      conclusion_files: row.conclusion_files || [],
      paper_md: row.paper_md || '',
      supplementary_md: row.supplementary_md || '',
      paper_extra_req: row.paper_extra_req || '',
      // Return new fields
      cover_letter: row.cover_letter || '',
      submission_status: row.submission_status || '',
      reviews: row.reviews || [],
      response_content: row.response_content || '',
      response_raw: row.response_raw || '',
      final_paper_md: row.final_paper_md || '',
      final_supplementary_md: row.final_supplementary_md || '',
      created_at: row.created_at, 
      updated_at: row.updated_at 
    })
  }
)

router.post('/:id/files', param('id').isString(), upload.single('file'), async (req, res) => {
  const { id } = req.params
  const type = req.query.type || 'deep'
  const dir = await db.directions.findOne({ _id: id })
  if (!dir) return res.status(404).json({ error: 'Direction not found' })
  const proj = await db.projects.findOne({ _id: dir.project_id })
  if (!proj || proj.user_id !== req.user.id) return res.status(404).json({ error: 'Permission denied' })
  
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  
  const fileMeta = {
    id: (type === 'conclusion' ? 'cf_' : (type === 'data' ? 'daf_' : 'df_')) + Math.random().toString(36).slice(2),
    filename: req.file.originalname,
    path: req.file.filename, // Store just filename in uploadDir
    size: req.file.size,
    type: req.file.mimetype,
    created_at: new Date().toISOString()
  }
  
  const field = type === 'conclusion' ? 'conclusion_files' : (type === 'data' ? 'data_files' : 'deep_files')
  await db.directions.update({ _id: id }, { $push: { [field]: fileMeta } })
  res.json(fileMeta)
})

router.delete('/:id/files/:fileId', param('id').isString(), param('fileId').isString(), async (req, res) => {
  const { id, fileId } = req.params
  const type = req.query.type || 'deep'
  const dir = await db.directions.findOne({ _id: id })
  if (!dir) return res.status(404).json({ error: 'Direction not found' })
  const proj = await db.projects.findOne({ _id: dir.project_id })
  if (!proj || proj.user_id !== req.user.id) return res.status(404).json({ error: 'Permission denied' })
  
  const field = type === 'conclusion' ? 'conclusion_files' : (type === 'data' ? 'data_files' : 'deep_files')
  const files = dir[field] || []
  const found = files.find(f => f.id === fileId)
  if (!found) return res.status(404).json({ error: 'File not found' })
  
  try {
    const p = path.join(uploadDir, found.path)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  } catch (e) {
    console.error('Delete file error', e)
  }
  
  await db.directions.update({ _id: id }, { $pull: { [field]: { id: fileId } } })
  res.json({ ok: true })
})

router.get('/:id/files/:fileId', param('id').isString(), param('fileId').isString(), async (req, res) => {
  const { id, fileId } = req.params
  const dir = await db.directions.findOne({ _id: id })
  if (!dir) return res.status(404).json({ error: 'Direction not found' })
  const proj = await db.projects.findOne({ _id: dir.project_id })
  if (!proj || proj.user_id !== req.user.id) return res.status(404).json({ error: 'Permission denied' })
  
  const files = [...(dir.deep_files || []), ...(dir.conclusion_files || [])]
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

