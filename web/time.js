let currentTimezone = 'Asia/Shanghai'

export async function loadTimezone() {
  try {
    const resp = await fetch('http://localhost:4000/api/v1/config/settings', { headers: tokenHeader() })
    if (resp.ok) {
      const data = await resp.json()
      currentTimezone = data.timezone || 'Asia/Shanghai'
    }
  } catch {}
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

function tokenHeader() {
  const t = localStorage.getItem('jwt')
  return t ? { Authorization: `Bearer ${t}` } : {}
}
