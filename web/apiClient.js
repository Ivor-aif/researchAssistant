export const apiBase = 'http://localhost:4000/api/v1'

function getToken() {
  return localStorage.getItem('jwt')
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const resp = await fetch(`${apiBase}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  if (!resp.ok) throw new Error(await resp.text())
  return resp.json()
}

export async function login(username, password) {
  const data = await api('/auth/login', { method: 'POST', body: { username, password } })
  localStorage.setItem('jwt', data.token)
  return data
}

export async function register(username, password) {
  return api('/auth/register', { method: 'POST', body: { username, password } })
}
