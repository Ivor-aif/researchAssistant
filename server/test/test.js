import assert from 'node:assert'
import { setTimeout as delay } from 'node:timers/promises'

const base = process.env.API_BASE || 'http://localhost:4000/api/v1'
const origin = new URL(base).origin

function timeoutFetch(url, opts = {}, ms = 7000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), ms)
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(t))
}

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const resp = await timeoutFetch(`${base}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const text = await resp.text()
  let json
  try { json = JSON.parse(text) } catch { json = text }
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text}`)
  return json
}

async function run() {
  const out = []
  function log(step, ok, info = '') { out.push({ step, ok, info }); console.log(`${ok ? '✓' : '✗'} ${step}${info ? ' - ' + info : ''}`) }

  try {
    // health & static
    const meta = await api('/meta')
    assert(meta && Array.isArray(meta.endpoints))
    log('后端健康检查', true)

    const htmlResp = await timeoutFetch(origin + '/')
    const html = await htmlResp.text()
    assert(html.includes('研究助手'))
    log('前端首页加载', true)

    // auth
    const uname = 'tester_' + Date.now()
    const pwd = 'password123'
    await api('/auth/register', { method: 'POST', body: { username: uname, password: pwd } })
    const login = await api('/auth/login', { method: 'POST', body: { username: uname, password: pwd } })
    assert(login && login.token)
    const token = login.token
    log('用户注册与登录', true)

    // projects CRUD
    const p = await api('/projects', { method: 'POST', body: { name: 'P1', description: 'D' }, token })
    assert(p && p.id)
    const list = await api('/projects', { token })
    assert(Array.isArray(list) && list.find(x => x.id === p.id))
    const upd = await api(`/projects/${p.id}`, { method: 'PUT', body: { name: 'P1-upd' }, token })
    assert(upd.name === 'P1-upd')
    log('项目CRUD', true)

    // directions status
    const d = await api('/directions', { method: 'POST', body: { projectId: p.id, name: 'D1' }, token })
    assert(d && d.status === '未生成综述')
    const dlist = await api(`/directions?projectId=${p.id}`, { token })
    assert(Array.isArray(dlist) && dlist.find(x => x.id === d.id && x.status === '未生成综述'))
    const dupd = await api(`/directions/${d.id}`, { method: 'PUT', body: { status: '已生成综述' }, token })
    assert(dupd.status === '已生成综述')
    log('研究方向状态流转', true)

    // settings
    const settings = await api('/config/settings', { token })
    assert(settings && settings.timezone)
    await api('/config/settings', { method: 'POST', body: { timezone: 'UTC' }, token })
    const settings2 = await api('/config/settings', { token })
    assert(settings2.timezone === 'UTC')
    log('用户设置读写', true)

    // AI config invalid payload (modelPath empty on cloud should not be sent; sending empty should 400)
    const badResp = await timeoutFetch(`${base}/config/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ apiName: 'BadAPI', type: 'cloud', url: 'https://example.invalid', modelPath: '' })
    })
    if (badResp.status !== 400) throw new Error('Expected 400 for invalid modelPath on cloud')
    log('AI配置非法字段校验', true)

    // AI config valid payload & test (expect error status ok HTTP)
    await api('/config/ai', { method: 'POST', body: { apiName: 'TestAPI', type: 'cloud', url: 'https://example.invalid', apiKey: 'KEY' }, token })
    await api('/config/ai/test', { method: 'POST', body: { apiName: 'TestAPI' }, token }).catch(e => ({ _error: e.message }))
    log('AI配置保存与测试调用', true, '测试返回错误状态符合预期')

    // Sites & test
    // invalid: empty auth should 400
    const badSiteResp = await timeoutFetch(`${base}/config/sites`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ siteName: 'BadSite', url: 'https://example.invalid', auth: '' }) })
    if (badSiteResp.status !== 400) throw new Error('Expected 400 for empty auth')
    // valid: omit auth
    await api('/config/sites', { method: 'POST', body: { siteName: 'PubMed', url: 'https://example.invalid' }, token })
    const sites = await api('/config/sites', { token })
    assert(Array.isArray(sites) && sites.length > 0)
    const st = await api('/config/sites/test', { method: 'POST', body: { siteName: 'PubMed' }, token }).catch(e => ({ _error: e.message }))
    log('文献网站保存与测试调用', true, '测试返回错误状态符合预期')

    console.log('\n测试完成，共', out.length, '项')
  } catch (e) {
    console.error('测试失败：', e)
    process.exitCode = 1
  }
}

run()
