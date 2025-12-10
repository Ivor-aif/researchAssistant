import React, { useEffect, useState } from 'https://esm.sh/react@18'
import * as pdfjsLib from 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.mjs'
const hasWorkerOptions = !!(pdfjsLib && pdfjsLib.GlobalWorkerOptions)
if (hasWorkerOptions) {
  try { pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.mjs' } catch (e) { console.error('pdfjs workerSrc set failed', e) }
} else {
  console.log('pdfjs GlobalWorkerOptions not available; using disableWorker')
}
import { api } from '../apiClient.js'
import { formatDate } from '../time.js'
const h = React.createElement

export default function DirectionDetail({ project, onExit }) {
  const [proj, setProj] = useState(null)
  const d = project.currentDirection || project
  const [status, setStatus] = useState(d.status || '未生成综述')
  const [apis, setApis] = useState([])
  const [apiName, setApiName] = useState('')
  const [sites, setSites] = useState([])
  const [siteSelected, setSiteSelected] = useState({})
  const [keywords, setKeywords] = useState('')
  const [uploaded, setUploaded] = useState([])
  const [results, setResults] = useState([])
  const [promptText, setPromptText] = useState('')
  const [msg, setMsg] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20
  const name = d.name || '(未命名)'
  useEffect(() => {
    (async () => {
      try {
        const list = await api('/projects')
        const found = list.find(p => p.id === d.project_id)
        setProj(found || null)
      } catch {}
    })()
  }, [d.project_id])
  useEffect(() => {
    (async () => {
      try {
        const a = await api('/config/ai'); setApis(a)
        if (a.length > 0) setApiName(a[0].api_name)
        const s = await api('/config/sites'); setSites(s); const sel = {}; s.forEach(it => sel[it.id] = true); setSiteSelected(sel)
      } catch {}
    })()
  }, [])
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dir_' + d.id)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.apiName) setApiName(saved.apiName)
        if (saved.keywords) setKeywords(saved.keywords)
        if (saved.uploaded) setUploaded(saved.uploaded)
        if (saved.results) setResults(saved.results)
        if (saved.siteSelected) setSiteSelected(saved.siteSelected)
        if (saved.page) setPage(saved.page)
      }
    } catch {}
  }, [])
  useEffect(() => {
    const data = { apiName, keywords, uploaded, results, siteSelected, page }
    try { localStorage.setItem('dir_' + d.id, JSON.stringify(data)) } catch {}
  }, [apiName, keywords, uploaded, results, siteSelected, page])
  function selectedCount() {
    const arr = [...uploaded.filter(x => x.selected), ...results.filter(x => x.selected)]
    return arr.length
  }
  function combinedList() {
    return [...uploaded, ...results]
  }
  function pageItems() {
    const list = combinedList()
    const start = (page - 1) * pageSize
    return list.slice(start, start + pageSize)
  }
  async function parsePDF(file) {
    try {
      const buf = await file.arrayBuffer()
      const doc = await pdfjsLib.getDocument({ data: buf, disableWorker: !hasWorkerOptions }).promise
      let meta = { info: {} }
      try { meta = await doc.getMetadata() } catch {}
      const title = (meta.info && meta.info.Title) ? meta.info.Title : file.name.replace(/\.pdf$/i, '')
      const item = { id: 'u_' + Math.random().toString(36).slice(2), title, source: 'uploaded', selected: true }
      setUploaded(prev => [item, ...prev])
      setMsg('已解析：' + title)
    } catch (e) {
      setMsg('文献解析失败：' + e.message)
    }
  }
  function onUpload(e) {
    const files = Array.from(e.target.files || [])
    files.forEach(f => parsePDF(f))
  }
  function genPrompt() {
    const siteNames = sites.filter(s => siteSelected[s.id]).map(s => s.site_name)
    const txt = `研究方向：${name}\n关键词：${keywords}\n文献网站：${siteNames.join(', ')}\n要求：返回标题、作者、来源、年份。`
    setPromptText(txt)
    return txt
  }
  async function sendPrompt() {
    try {
      const p = genPrompt()
      if (!apiName) { setMsg('请选择AI-API'); return }
      const r = await api('/config/ai/prompt', { method: 'POST', body: { apiName, prompt: p } })
      setMsg(`已发送至 ${apiName}：${r.status}，延迟 ${r.latency_ms}ms`)
    } catch (e) { setMsg('AI-API调用失败：' + e.message) }
  }
  function toggleItem(it) {
    it.selected = !it.selected
    setUploaded([...uploaded])
    setResults([...results])
  }
  function toggleSite(id) {
    const next = { ...siteSelected, [id]: !siteSelected[id] }
    setSiteSelected(next)
  }
  async function anchor() {
    if (selectedCount() < 10) { setMsg('请至少选择10篇文献'); return }
    try {
      const titles = combinedList().filter(x => x.selected).map(x => x.title)
      const md = [
        `# ${name} 综述`,
        `\n## 摘要\n`,
        `\n## 引言\n`,
        `\n## 方法\n`,
        `\n## 结果与讨论\n`,
        `\n## 结论\n`,
        `\n## 参考文献\n`,
        ...titles.map((t, i) => `- ${i + 1}. ${t}`)
      ].join('\n')
      setMsg('综述已生成')
      await api('/directions/' + d.id, { method: 'PUT', body: { status: '已生成综述' } })
      setStatus('已生成综述')
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${name}-综述.md`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) { setMsg('综述生成失败：' + e.message) }
  }
  const totalPages = Math.max(1, Math.ceil(combinedList().length / pageSize))
  return h('div', null,
    h('div', { className: 'card' },
      h('h2', null, '研究方向'),
      h('div', null, `名称：${name}`),
      h('div', null, `创建时间：${d.created_at ? formatDate(d.created_at) : '未知'}`),
      h('div', null, `描述：${d.description || ''}`),
      proj ? h('div', null, `所属项目：${proj.name}`) : null,
      h('div', null, `状态：${status}`),
      h('div', null, h('button', { onClick: () => onExit && onExit() }, '返回'))
    ),
    h('div', { className: 'card' },
      h('h3', null, '文献收集方式'),
      h('div', { className: 'row' },
        h('input', { type: 'file', multiple: true, accept: '.pdf', onChange: onUpload }),
        h('input', { placeholder: '关键词', value: keywords, onChange: e => setKeywords(e.target.value) }),
        h('select', { value: apiName, onChange: e => setApiName(e.target.value) },
          ...apis.map(a => h('option', { key: a.api_name, value: a.api_name }, a.api_name))
        ),
        h('button', { onClick: sendPrompt }, '生成并发送Prompt')
      ),
      h('div', { className: 'muted', style: { marginTop: 6 } }, '当前步骤：收集文献；下一步：选择与锚定')
    ),
    h('div', { className: 'card' },
      h('h3', null, '文献选择'),
      h('div', null, '可用文献网站：'),
      h('div', { className: 'row' },
        ...sites.map(s => h('label', { key: s.id, style: { marginRight: 12 } },
          h('input', { type: 'checkbox', checked: !!siteSelected[s.id], onChange: () => toggleSite(s.id) }),
          ' ', s.site_name
        ))
      ),
      h('div', { className: 'muted', style: { margin: '6px 0' } }, `已选文献：${selectedCount()} / 10`),
      ...pageItems().map(it => h('div', { key: it.id, className: 'row', style: { justifyContent: 'space-between' } },
        h('label', null,
          h('input', { type: 'checkbox', checked: !!it.selected, onChange: () => toggleItem(it) }),
          ' ', it.title
        ),
        h('div', { className: 'muted' }, it.source === 'uploaded' ? '用户上传' : '新检索')
      )),
      h('div', { className: 'row', style: { marginTop: 8 } },
        h('button', { onClick: () => setPage(p => Math.max(1, p - 1)) }, '上一页'),
        h('div', { className: 'muted' }, `${page}/${totalPages}`),
        h('button', { onClick: () => setPage(p => Math.min(totalPages, p + 1)) }, '下一页')
      ),
      h('div', { style: { marginTop: 8 } },
        h('button', { disabled: selectedCount() < 10, onClick: anchor }, '锚定')
      ),
      h('div', { className: 'muted', style: { marginTop: 6 } }, '当前步骤：选择文献；下一步：生成综述')
    ),
    msg ? h('div', { className: 'muted', style: { marginTop: 8 } }, msg) : null
  )
}
