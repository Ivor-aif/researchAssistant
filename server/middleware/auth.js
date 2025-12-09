import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const hdr = req.headers['authorization'] || ''
  const m = hdr.match(/^Bearer\s+(.*)$/i)
  const token = m ? m[1] : null
  if (!token) return res.status(401).json({ error: 'Missing Authorization header' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub, username: payload.username }
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
