import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { initSchema } from './db.js'
import path from 'path'
import authRoutes from './routes/auth.js'
import projectsRoutes from './routes/projects.js'
import directionsRoutes from './routes/directions.js'
import configRoutes from './routes/config.js'
import { requireAuth } from './middleware/auth.js'

const app = express()
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }))
app.use(cors({ origin: true }))
app.use(express.json({ limit: '50mb' }))
app.set('trust proxy', 1)

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 })
app.use(limiter)

if ((process.env.ENFORCE_HTTPS || 'false').toLowerCase() === 'true') {
  app.use((req, res, next) => {
    if (req.secure) return next()
    return res.status(400).json({ error: 'HTTPS required' })
  })
}

await initSchema()

app.get('/api/v1/meta', (req, res) => {
  res.json({
    version: 'v1',
    endpoints: [
      'POST /api/v1/auth/register',
      'POST /api/v1/auth/login',
      'GET  /api/v1/projects',
      'POST /api/v1/projects',
      'PUT  /api/v1/projects/:id',
      'DELETE /api/v1/projects/:id',
      'GET  /api/v1/directions?projectId=',
      'POST /api/v1/directions',
      'PUT  /api/v1/directions/:id',
      'DELETE /api/v1/directions/:id',
      'GET  /api/v1/config/ai',
      'GET  /api/v1/config/ai/:apiName',
      'POST /api/v1/config/ai',
      'POST /api/v1/config/ai/test',
      'POST /api/v1/config/ai/prompt',
      'GET  /api/v1/config/sites',
      'POST /api/v1/config/sites',
      'POST /api/v1/config/sites/test',
      'GET  /api/v1/config/settings',
      'POST /api/v1/config/settings'
    ]
  })
})

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/projects', requireAuth, projectsRoutes)
app.use('/api/v1/directions', requireAuth, directionsRoutes)
app.use('/api/v1/config', requireAuth, configRoutes)

app.use((err, req, res, next) => {
  console.error('Unhandled error', err)
  res.status(500).json({ error: 'Server error' })
})

const port = Number(process.env.PORT || 4000)
const server = app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`)
})
server.setTimeout(600000) // 10 minutes timeout to allow long AI generation

// Dev static serving for the front-end (keeps FE→BE separation at API boundary)
app.use(express.static(path.resolve(process.cwd(), '..', 'web')))
