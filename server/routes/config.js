import express from 'express'
import { body, param, validationResult } from 'express-validator'
import db from '../db.js'
import { encrypt, decrypt } from '../utils/crypto.js'
import fs from 'fs'
import http from 'http'
import https from 'https'
import { URL } from 'url'

const router = express.Router()

// List AI configs for current user (redacted sensitive fields)
router.get('/ai', async (req, res) => {
  const rows = await db.aiConfigs.find({ user_id: req.user.id })
  res.json(rows.map(r => ({
    api_name: r.api_name,
    type: r.type,
    url_redacted: !!r.url_enc,
    model_path: r.model_path || null,
    params_json: r.params_json || null,
    updated_at: r.updated_at
  })))
})

router.get('/ai/:apiName', param('apiName').isString().isLength({ min: 3, max: 32 }).matches(/^[A-Za-z0-9_-]+$/), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  const row = await db.aiConfigs.findOne({ user_id: req.user.id, api_name: req.params.apiName })
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json({
    api_name: row.api_name,
    type: row.type,
    url_redacted: !!row.url_enc,
    model_path: row.model_path || null,
    params_json: row.params_json || null,
    updated_at: row.updated_at
  })
})

router.post(
  '/ai',
  body('apiName').isString().isLength({ min: 3, max: 32 }).matches(/^[A-Za-z0-9_-]+$/),
  body('type').isIn(['cloud', 'local']),
  body('url').optional().isString().isLength({ min: 1, max: 2000 }).trim(),
  body('apiKey').optional().isString().isLength({ min: 1, max: 4096 }),
  body('modelPath').optional().isString().isLength({ min: 1, max: 4096 }),
  body('paramsJson').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { apiName, type, url, apiKey, modelPath, paramsJson } = req.body
    const now = new Date().toISOString()
    const existing = await db.aiConfigs.findOne({ user_id: req.user.id, api_name: apiName })
    if (existing) {
      await db.aiConfigs.update({ _id: existing._id }, { $set: { type, url_enc: encrypt(url || null), api_key_enc: encrypt(apiKey || null), model_path: modelPath || null, params_json: paramsJson || null, updated_at: now } })
    } else {
      // Enforce uniqueness of api_name per user manually
      const nameClash = await db.aiConfigs.findOne({ user_id: req.user.id, api_name: apiName })
      if (nameClash) return res.status(409).json({ error: 'apiName already exists' })
      await db.aiConfigs.insert({ user_id: req.user.id, api_name: apiName, type, url_enc: encrypt(url || null), api_key_enc: encrypt(apiKey || null), model_path: modelPath || null, params_json: paramsJson || null, created_at: now, updated_at: now })
    }
    res.json({ ok: true })
  }
)

router.post('/ai/test', body('apiName').isString().isLength({ min: 3, max: 32 }).matches(/^[A-Za-z0-9_-]+$/), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  const cfg = await db.aiConfigs.findOne({ user_id: req.user.id, api_name: req.body.apiName })
  if (!cfg) return res.status(404).json({ error: 'No config' })
  const start = performance.now()
  try {
    if (cfg.type === 'cloud') {
      const url = decrypt(cfg.url_enc)
      const key = decrypt(cfg.api_key_enc)
      if (!url) return res.status(400).json({ error: 'Missing URL' })
      await new Promise((resolve, reject) => {
        const reqHttps = https.request(url, { method: 'GET', headers: { Authorization: `Bearer ${key || ''}` } }, (resp) => {
          resp.on('data', () => {})
          resp.on('end', resolve)
        })
        reqHttps.on('error', reject)
        reqHttps.end()
      })
    } else {
      if (!cfg.model_path) return res.status(400).json({ error: 'Missing modelPath' })
      await fs.promises.access(cfg.model_path)
    }
    const ms = Math.round(performance.now() - start)
    res.json({ status: 'ok', latency_ms: ms })
  } catch (e) {
    const ms = Math.round(performance.now() - start)
    res.status(200).json({ status: 'error', latency_ms: ms, message: e.message })
  }
})

router.post('/ai/prompt',
  body('apiName').isString().isLength({ min: 3, max: 32 }).matches(/^[A-Za-z0-9_-]+$/),
  body('prompt').isString().isLength({ min: 1, max: 1000000 }),
  body('debug').optional().isBoolean(),
  body('requestId').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const cfg = await db.aiConfigs.findOne({ user_id: req.user.id, api_name: req.body.apiName })
    if (!cfg) return res.status(404).json({ error: 'No config' })
    const start = performance.now()
    try {
      if (cfg.type === 'cloud') {
        const urlStrRaw = decrypt(cfg.url_enc)
        const key = decrypt(cfg.api_key_enc)
        if (!urlStrRaw) return res.status(400).json({ error: 'Missing URL' })
        
        let targetUrl = urlStrRaw
        let payload = { prompt: req.body.prompt }
        const params = cfg.params_json ? JSON.parse(cfg.params_json) : {}
        const model = params.model || 'deepseek-chat'
        
        // Intelligent adaptation for OpenAI-compatible APIs (DeepSeek, OpenAI, etc)
        const isChatPath = /\/chat\/completions$/.test(targetUrl)
        const isKnownBase = /api\.(deepseek|openai)\.com\/?$/.test(targetUrl)
        
        if (isChatPath || isKnownBase) {
           if (isKnownBase && !targetUrl.includes('/v1') && !targetUrl.includes('/chat')) {
             // auto-append standard endpoint
             targetUrl = targetUrl.replace(/\/$/, '') + '/chat/completions' 
           }
           payload = {
             model: model,
             messages: [
               { role: 'user', content: req.body.prompt }
             ]
           }
        }

        let u
        try { u = new URL(targetUrl) } catch { return res.status(400).json({ error: 'Invalid URL' }) }
        const proto = u.protocol === 'https:' ? https : http
        const debug = !!req.body.debug
        let extStatus = null
        let extBody = ''
        await new Promise((resolve, reject) => {
          const reqOpt = { method: 'POST', headers: { 'Content-Type': 'application/json' } }
          if (key) reqOpt.headers['Authorization'] = `Bearer ${key}`
          const r = proto.request(targetUrl, reqOpt, (resp) => {
            extStatus = resp.statusCode || null
            resp.on('data', (chunk) => { extBody += chunk.toString() })
            resp.on('end', resolve)
          })
          r.setTimeout(300000, () => { r.destroy(new Error('Timeout')) })
          r.on('error', reject)
          try { r.end(JSON.stringify(payload)) } catch (e) { reject(e) }
        })
        
        const ms = Math.round(performance.now() - start)
        const dbg = debug ? { 
          requestId: req.body.requestId || null, 
          url: targetUrl, 
          headersSent: { Authorization: key ? 'Bearer ****' : undefined, 'Content-Type': 'application/json' }, 
          statusCode: extStatus, 
          latency_ms: ms, 
          body_sample: extBody.slice(0, 512), 
          payload_preview: JSON.stringify(payload).slice(0, 200) 
        } : undefined

        if (debug && extStatus >= 400) console.warn('[PromptWarning]', { requestId: req.body.requestId, status: extStatus, url: targetUrl })
        
        return res.json({ status: 'ok', latency_ms: ms, answer: extBody, debug: dbg })
      }
      const ms = Math.round(performance.now() - start)
      res.json({ status: 'ok', latency_ms: ms })
    } catch (e) {
      const ms = Math.round(performance.now() - start)
      const dbg = !!req.body.debug ? { requestId: req.body.requestId || null, error: e.message, stack: e.stack || null } : undefined
      res.status(200).json({ status: 'error', latency_ms: ms, message: e.message, debug: dbg })
    }
  }
)

router.post('/ai/:apiName/prompt-files',
  param('apiName').isString().isLength({ min: 3, max: 32 }).matches(/^[A-Za-z0-9_-]+$/),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const cfg = await db.aiConfigs.findOne({ user_id: req.user.id, api_name: req.params.apiName })
    if (!cfg) return res.status(404).json({ error: 'No config' })
    const start = performance.now()
    try {
      if (cfg.type !== 'cloud') return res.status(400).json({ error: 'Only cloud AI supports file forwarding' })
      const targetUrl = decrypt(cfg.url_enc)
      const key = decrypt(cfg.api_key_enc)
      if (!targetUrl) return res.status(400).json({ error: 'Missing URL' })

      let u
      try { u = new URL(targetUrl) } catch { return res.status(400).json({ error: 'Invalid URL' }) }
      const proto = u.protocol === 'https:' ? https : http
      const debug = String(req.query.debug || '').toLowerCase()
      const debugOn = debug === '1' || debug === 'true' || debug === 'yes'
      const requestId = req.query.requestId ? String(req.query.requestId) : null

      const contentType = req.headers['content-type']
      if (!contentType || !String(contentType).toLowerCase().startsWith('multipart/form-data')) {
        return res.status(400).json({ error: 'Content-Type must be multipart/form-data' })
      }

      let extStatus = null
      let extBody = ''
      await new Promise((resolve, reject) => {
        const headers = {}
        headers['Content-Type'] = String(contentType)
        const contentLength = req.headers['content-length']
        if (contentLength) headers['Content-Length'] = String(contentLength)
        if (key) headers['Authorization'] = `Bearer ${key}`

        const r = proto.request(targetUrl, { method: 'POST', headers }, (resp) => {
          extStatus = resp.statusCode || null
          resp.on('data', (chunk) => { extBody += chunk.toString() })
          resp.on('end', resolve)
        })
        r.setTimeout(600000, () => { r.destroy(new Error('Timeout')) })
        r.on('error', reject)
        req.on('aborted', () => { try { r.destroy(new Error('Client aborted')) } catch {} })
        req.pipe(r)
      })

      const ms = Math.round(performance.now() - start)
      const dbg = debugOn ? {
        requestId,
        url: targetUrl,
        headersSent: { Authorization: key ? 'Bearer ****' : undefined, 'Content-Type': 'multipart/form-data' },
        statusCode: extStatus,
        latency_ms: ms,
        body_sample: extBody.slice(0, 512)
      } : undefined
      if (debugOn && extStatus >= 400) console.warn('[PromptFilesWarning]', { requestId, status: extStatus, url: targetUrl })
      return res.json({ status: 'ok', latency_ms: ms, answer: extBody, debug: dbg })
    } catch (e) {
      const ms = Math.round(performance.now() - start)
      const debug = String(req.query.debug || '').toLowerCase()
      const debugOn = debug === '1' || debug === 'true' || debug === 'yes'
      const dbg = debugOn ? { requestId: req.query.requestId ? String(req.query.requestId) : null, error: e.message, stack: e.stack || null } : undefined
      return res.status(200).json({ status: 'error', latency_ms: ms, message: e.message, debug: dbg })
    }
  }
)

// -------- Literature sites management --------
router.get('/sites', async (req, res) => {
  const rows = await db.literatureSites.find({ user_id: req.user.id }).sort({ updated_at: -1 })
  res.json(rows.map(r => ({ id: r._id, site_name: r.site_name, url: r.url, auth_redacted: !!r.auth_enc, updated_at: r.updated_at })))
})

router.post(
  '/sites',
  body('siteName').isString().isLength({ min: 2, max: 64 }).trim(),
  body('url').isString().isLength({ min: 4, max: 2000 }).trim(),
  body('auth').optional().isString().isLength({ min: 1, max: 4096 }),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { siteName, url, auth } = req.body
    const now = new Date().toISOString()
    const existing = await db.literatureSites.findOne({ user_id: req.user.id, site_name: siteName })
    if (existing) {
      await db.literatureSites.update({ _id: existing._id }, { $set: { url, auth_enc: encrypt(auth || null), updated_at: now } })
      return res.json({ ok: true, id: existing._id })
    }
    const clash = await db.literatureSites.findOne({ user_id: req.user.id, site_name: siteName })
    if (clash) return res.status(409).json({ error: 'siteName already exists' })
    const doc = await db.literatureSites.insert({ user_id: req.user.id, site_name: siteName, url, auth_enc: encrypt(auth || null), created_at: now, updated_at: now })
    res.json({ ok: true, id: doc._id })
  }
)

router.post(
  '/sites/test',
  body('siteId').optional().isString().isLength({ min: 1 }),
  body('siteName').optional().isString().isLength({ min: 2, max: 64 }).trim(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { siteId, siteName } = req.body
    let site = null
    if (siteId) site = await db.literatureSites.findOne({ _id: siteId })
    if (!site && siteName) site = await db.literatureSites.findOne({ user_id: req.user.id, site_name: siteName })
    if (!site || site.user_id !== req.user.id) return res.status(404).json({ error: 'Site not found' })
    const urlStr = site.url
    let u
    try { u = new URL(urlStr) } catch { return res.status(400).json({ error: 'Invalid URL' }) }
    const proto = u.protocol === 'https:' ? https : http
    const start = performance.now()
    const timeoutMs = 5000
    const maxRetries = 2
    async function attempt() {
      return new Promise((resolve, reject) => {
        const reqOpt = { method: 'GET', timeout: timeoutMs, headers: {} }
        const key = decrypt(site.auth_enc)
        if (key) reqOpt.headers['Authorization'] = key
        const r = proto.request(urlStr, reqOpt, (resp) => {
          resp.on('data', () => {})
          resp.on('end', resolve)
        })
        r.on('timeout', () => { r.destroy(new Error('Timeout')) })
        r.on('error', reject)
        r.end()
      })
    }
    try {
      let lastErr = null
      for (let i = 0; i <= maxRetries; i++) {
        try { await attempt(); lastErr = null; break } catch (e) { lastErr = e; await new Promise(r => setTimeout(r, 300 * (i + 1))) }
      }
      const ms = Math.round(performance.now() - start)
      if (lastErr) return res.status(200).json({ status: 'error', latency_ms: ms, message: lastErr.message })
      return res.json({ status: 'ok', latency_ms: ms })
    } catch (e) {
      const ms = Math.round(performance.now() - start)
      return res.status(200).json({ status: 'error', latency_ms: ms, message: e.message })
    }
  }
)

router.get('/settings', async (req, res) => {
  const row = await db.userSettings.findOne({ user_id: req.user.id })
  if (!row) return res.json({ theme: 'light', layout: 'default', timezone: 'Asia/Shanghai', config_json: null })
  if (!row.timezone) row.timezone = 'Asia/Shanghai'
  res.json(row)
})

router.post(
  '/settings',
  body('theme').optional().isString().isIn(['light', 'dark']),
  body('layout').optional().isString().isLength({ min: 1, max: 64 }),
  body('timezone').optional().isString().isLength({ min: 1, max: 64 }),
  body('config_json').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const now = new Date().toISOString()
    // validate timezone
    if (req.body.timezone) {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: req.body.timezone }).format(new Date())
      } catch (e) {
        return res.status(400).json({ error: 'Invalid timezone' })
      }
    }
    const existing = await db.userSettings.findOne({ user_id: req.user.id })
    if (existing) {
      await db.userSettings.update({ user_id: req.user.id }, { $set: { theme: req.body.theme ?? existing.theme, layout: req.body.layout ?? existing.layout, timezone: req.body.timezone ?? existing.timezone ?? 'Asia/Shanghai', config_json: req.body.config_json ?? existing.config_json, updated_at: now } })
    } else {
      await db.userSettings.insert({ user_id: req.user.id, theme: req.body.theme || 'light', layout: req.body.layout || 'default', timezone: req.body.timezone || 'Asia/Shanghai', config_json: req.body.config_json || null, updated_at: now })
    }
    res.json({ ok: true })
  }
)

export default router
