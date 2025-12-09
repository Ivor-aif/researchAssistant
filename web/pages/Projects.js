import React, { useEffect, useState } from 'https://esm.sh/react@18'
import { api } from '../apiClient.js'
import { formatDate } from '../time.js'
const h = React.createElement

export default function Projects({ onSelectProject }) {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [sortField, setSortField] = useState('updated_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const list = await api('/projects')
    const settings = await api('/config/settings').catch(() => null)
    if (settings && settings.config_json) {
      try {
        const cfg = JSON.parse(settings.config_json)
        if (cfg.sort_projects) { setSortField(cfg.sort_projects.field || 'updated_at'); setSortOrder(cfg.sort_projects.order || 'desc') }
      } catch {}
    }
    setItems(applySort(list))
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  useEffect(() => { const f=()=>setItems(items=>applySort(items)); window.addEventListener('tzChange', f); return ()=>window.removeEventListener('tzChange', f) }, [])

  async function create() {
    await api('/projects', { method: 'POST', body: { name, description: desc } })
    setName(''); setDesc(''); await load()
  }

  function applySort(list) {
    const arr = [...list]
    arr.sort((a, b) => {
      let av = a[sortField] || ''
      let bv = b[sortField] || ''
      if (sortField === 'name') { av = String(av).toLowerCase(); bv = String(bv).toLowerCase() }
      const cmp = av > bv ? 1 : av < bv ? -1 : 0
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return arr
  }

  async function savePref() {
    try {
      const s = await api('/config/settings')
      let cfg = {}
      if (s && s.config_json) { try { cfg = JSON.parse(s.config_json) } catch {} }
      cfg.sort_projects = { field: sortField, order: sortOrder }
      await api('/config/settings', { method: 'POST', body: { config_json: JSON.stringify(cfg) } })
      setMsg('排序偏好已保存')
      setItems(applySort(items))
    } catch (e) { setMsg('保存失败') }
  }

  async function saveProject(p, patch) {
    try {
      const updated = await api('/projects/' + p.id, { method: 'PUT', body: patch })
      setItems(applySort(items.map(it => it.id === p.id ? updated : it)))
      setMsg('项目已保存')
    } catch (e) { setMsg('保存失败') }
  }

  return h('div', null,
    h('div', { className: 'card' },
      h('div', { className: 'row' },
        h('input', { placeholder: '项目名称', value: name, onChange: e => setName(e.target.value) }),
        h('input', { placeholder: '描述', value: desc, onChange: e => setDesc(e.target.value) }),
        h('button', { onClick: create }, '创建')
      )
    ),
    h('div', { className: 'card' },
      h('div', { className: 'row' },
        h('select', { value: sortField, onChange: e => { setSortField(e.target.value); setItems(applySort(items)) } },
          h('option', { value: 'name' }, '按名称'),
          h('option', { value: 'created_at' }, '按创建时间'),
          h('option', { value: 'updated_at' }, '按修改时间')
        ),
        h('select', { value: sortOrder, onChange: e => { setSortOrder(e.target.value); setItems(applySort(items)) } },
          h('option', { value: 'asc' }, '升序'),
          h('option', { value: 'desc' }, '降序')
        ),
        h('button', { onClick: savePref }, '保存排序偏好')
      )
    ),
    loading ? h('div', { className: 'muted' }, '加载中...') : null,
    ...items.map(p => h('div', { key: p.id, className: 'card', style: { display: 'flex', justifyContent: 'space-between' } },
      h('div', { style: { flex: 1, marginRight: 8 } },
        h('div', null,
          h('input', { value: p.name || '', onChange: e => { p.name = e.target.value; setItems([...items]) }, onBlur: () => saveProject(p, { name: p.name }) })
        ),
        h('div', null,
          h('input', { value: p.description || '', onChange: e => { p.description = e.target.value; setItems([...items]) }, onBlur: () => saveProject(p, { description: p.description }) })
        ),
        h('div', { className: 'muted' }, `创建: ${formatDate(p.created_at)} 修改: ${formatDate(p.updated_at)}`)
      ),
      h('div', null, h('button', { onClick: () => onSelectProject(p) }, '进入'))
    ))
    , msg ? h('div', { className: 'muted', style: { marginTop: 8 } }, msg) : null
  )
}
