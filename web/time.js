import { api } from './apiClient.js'
let currentTimezone = 'Asia/Shanghai'

export async function loadTimezone() {
  try {
    const data = await api('/config/settings')
    currentTimezone = (data && data.timezone) ? data.timezone : 'Asia/Shanghai'
  } catch (e) {
    try { console.error('loadTimezone failed', e && e.message ? e.message : e) } catch {}
  }
}

export function setTimezone(tz) {
  currentTimezone = tz || 'Asia/Shanghai'
  try { window.dispatchEvent(new Event('tzChange')) } catch {}
}

export function formatDate(iso) {
  try {
    const d = new Date(iso)
    const fmt = new Intl.DateTimeFormat('zh-CN', { timeZone: currentTimezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    return fmt.format(d)
  } catch {
    return iso
  }
}

function tokenHeader() { return {} }
