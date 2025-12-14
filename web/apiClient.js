export const apiBase = (typeof window !== 'undefined' && (window.__API_BASE__ || `${window.location.origin}/api/v1`)) || 'http://localhost:4000/api/v1'

function getToken() {
  return localStorage.getItem('jwt')
}

export async function api(path, { method = 'GET', body, timeoutMs = 10000 } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const controller = new AbortController()
  const to = setTimeout(() => { try { controller.abort(new Error(`Request timed out after ${timeoutMs}ms`)) } catch {} }, timeoutMs)
  try {
    const resp = await fetch(`${apiBase}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: controller.signal })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      console.error('API response error', { method, url: `${apiBase}${path}`, status: resp.status, body: text })
      throw new Error(text || `HTTP ${resp.status}`)
    }
    return resp.json()
  } catch (e) {
    console.error('API request failed', { method, url: `${apiBase}${path}`, error: String(e && e.message || e) })
    throw e
  }
  finally { clearTimeout(to) }
}

export async function login(username, password) {
  const data = await api('/auth/login', { method: 'POST', body: { username, password } })
  localStorage.setItem('jwt', data.token)
  return data
}

export async function register(username, password) {
  return api('/auth/register', { method: 'POST', body: { username, password } })
}
