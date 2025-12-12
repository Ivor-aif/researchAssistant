export function genReqId() {
  return 'req_' + Math.random().toString(36).slice(2) + Date.now()
}
export function appendLog(entry) {
  try {
    const now = new Date().toISOString()
    const e = { ts: now, ...entry }
    const raw = localStorage.getItem('promptLogs')
    let arr = []
    if (raw) { try { arr = JSON.parse(raw) } catch {} }
    arr.push(e)
    localStorage.setItem('promptLogs', JSON.stringify(arr))
    console.log('PROMPT_LOG', e)
  } catch (err) {
    try { console.error('PROMPT_LOG_FAIL', String(err && err.message || err)) } catch {}
  }
}
