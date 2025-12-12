import React, { useEffect, useState } from 'https://esm.sh/react@18'
import * as pdfjsLib from 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.mjs'
const hasWorkerOptions = !!(pdfjsLib && pdfjsLib.GlobalWorkerOptions)
if (hasWorkerOptions) {
  try { pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.mjs' } catch (e) { console.error('pdfjs workerSrc set failed', e) }
} else {
  console.log('pdfjs GlobalWorkerOptions not available; using disableWorker')
}
import { api } from '../apiClient.js'
import { genReqId, appendLog } from '../log.js'
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
  const [sending, setSending] = useState(false)
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
  function genPrompt(reqId) {
    const siteInfo = sites.filter(s => siteSelected[s.id]).map(s => `${s.site_name} (${s.url})`)
    const txt = `研究方向：${name}\n关键词：${keywords}\n文献网站：${siteInfo.join(', ')}\n\n请检索并返回至少10篇相关文献。要求返回JSON格式的数组，每个元素包含：title, author, source, year, doi。请只返回JSON数据，不要包含Markdown代码块标记。`
    setPromptText(txt)
    appendLog({ id: reqId, step: 'render_start', vars: { name, keywords, siteIds: Object.keys(siteSelected).filter(k => siteSelected[k]), siteNames: siteInfo, selectedCount: selectedCount() } })
    appendLog({ id: reqId, step: 'render_done', promptLength: txt.length })
    return txt
  }
  async function sendPrompt() {
    if (sending) return
    const requestId = genReqId()
    setSending(true)
    try {
      const p = genPrompt(requestId)
      if (!apiName) {
        const error = new Error('请选择AI-API')
        appendLog({ id: requestId, step: 'validation_failed', apiName, error: error.message })
        setMsg('AI-API调用失败：' + error.message)
        return
      }
      const headers = { 'Content-Type': 'application/json' }
      const t = localStorage.getItem('jwt')
      if (t) headers['Authorization'] = `Bearer ${t}`
      
      appendLog({ id: requestId, step: 'prompt_generated', apiName, prompt: p.slice(0, 500) })
      const start = Date.now()
      appendLog({ id: requestId, step: 'send_start', url: '/config/ai/prompt', headers, payload: { apiName, prompt: p, debug: true, requestId }, attempt: 1 })
      let r = null, err = null
      try {
        // Timeout increased to 120s for long-running AI generation
        r = await api('/config/ai/prompt', { method: 'POST', body: { apiName, prompt: p, debug: true, requestId }, timeoutMs: 120000 })
      } catch (e1) {
        err = e1
        appendLog({ id: requestId, step: 'send_fail', error: String(e1 && e1.message || e1), stack: e1 && e1.stack ? e1.stack : null, latency_ms: Date.now() - start, attempt: 1 })
        const wait = 1000
        await new Promise(res => setTimeout(res, wait))
        appendLog({ id: requestId, step: 'retry', delay_ms: wait, attempt: 2 })
        r = await api('/config/ai/prompt', { method: 'POST', body: { apiName, prompt: p, debug: true, requestId }, timeoutMs: 120000 })
      }
      
      appendLog({ id: requestId, step: 'send_done', status: r && r.status, latency_ms: Date.now() - start, serverDebug: r && r.debug ? r.debug : null, responseLength: r && r.answer ? r.answer.length : 0 })
      
      if (r && r.answer) {
        let items = []
        try {
          let raw = r.answer.trim()
          
          // Debug raw answer from AI
          appendLog({ id: requestId, step: 'parse_start', rawSample: raw.slice(0, 200) })

          let parsed = null
          try { parsed = JSON.parse(raw) } catch {}

          // 1. Handle OpenAI/DeepSeek API response structure first
          if (parsed && parsed.choices && Array.isArray(parsed.choices) && parsed.choices[0] && parsed.choices[0].message) {
             let content = parsed.choices[0].message.content
             // Extract JSON from content if wrapped in markdown
             const match = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
             if (match) content = match[1]
             try {
               parsed = JSON.parse(content)
             } catch (e) {
               console.warn('Inner content parse failed', e)
               // Fallback: maybe content is just text? let it fail in next checks
             }
          } else {
             // 2. If not API response, maybe raw string was markdown wrapped?
             const match = raw.match(/```json\s*([\s\S]*?)\s*```/) || raw.match(/```\s*([\s\S]*?)\s*```/)
             if (match) {
                try { parsed = JSON.parse(match[1]) } catch {}
             }
          }

          // 3. Now check if we have the items array
          if (Array.isArray(parsed)) {
            items = parsed
          } else if (typeof parsed === 'object' && parsed !== null) {
            // Try to find the first array property (e.g. { "papers": [...] })
            const arrayProp = Object.values(parsed).find(v => Array.isArray(v))
            if (arrayProp) items = arrayProp
          }
        } catch (e) {
          appendLog({ id: requestId, step: 'parse_fail', error: e.message, raw: r.answer.slice(0, 500) })
        }
        
        if (Array.isArray(items)) {
          // Robust field mapping with fallbacks and case-insensitivity
          const newItems = items.map(x => {
            const author = x.author || x.Author || x.authors || x.Authors || '未知作者'
            const source = x.source || x.Source || x.journal || x.Journal || '未知来源'
            const year = x.year || x.Year || x.date || x.Date || '年份未知'
            const title = x.title || x.Title || '无标题'
            const doi = x.doi || x.DOI || x.Doi || null
            
            return { 
              id: 'ai_' + Math.random().toString(36).slice(2), 
              title, 
              author, 
              source, 
              year, 
              doi,
              selected: false, 
              source_type: 'ai' 
            }
          })
          
          setResults(prev => [...newItems, ...prev])
          setMsg(`成功获取 ${newItems.length} 条文献，已发送至 ${apiName}，延迟 ${r.latency_ms}ms`)
          
          // Log parsing details for debugging
          appendLog({ 
            id: requestId, 
            step: 'process_success', 
            itemsCount: newItems.length, 
            firstItemSample: newItems[0] || null,
            rawItemSample: items[0] || null
          })
        } else {
           setMsg(`获取数据格式错误，已发送至 ${apiName}`)
           appendLog({ id: requestId, step: 'process_invalid_format', type: typeof items })
        }
      } else {
        setMsg(`未获取到有效回答，已发送至 ${apiName}`)
      }
    } catch (e) { 
      appendLog({ id: requestId, step: 'request_failed', error: String(e && e.message || e) })
      setMsg('AI-API调用失败：' + (e && e.message ? e.message : String(e))) 
    } finally { 
      setSending(false) 
    }
  }
  function toggleItem(it) {
    it.selected = !it.selected
    setUploaded([...uploaded])
    setResults([...results])
  }
  function removeItem(it) {
    if (it.source === 'uploaded') {
      setUploaded(prev => prev.filter(x => x.id !== it.id))
    } else {
      setResults(prev => prev.filter(x => x.id !== it.id))
    }
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
  return h('div', { style: { maxWidth: 1200, margin: '0 auto', padding: '0 20px', width: '100%' } },
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
        h('button', { onClick: sendPrompt, disabled: sending }, sending ? '发送中...' : '生成并发送Prompt')
      ),
      h('div', { className: 'muted', style: { marginTop: 6 } }, '当前步骤：收集文献；下一步：选择与锚定')
    ),
    h('div', { className: 'card' },
      h('h3', null, '文献选择'),
      h('div', null, '可用文献网站：'),
      h('div', { className: 'row' },
        ...sites.map(s => h('div', { key: s.id, style: { marginRight: 12, display: 'inline-flex', alignItems: 'center' } },
          h('input', { type: 'checkbox', id: 'site_' + s.id, checked: !!siteSelected[s.id], onChange: () => toggleSite(s.id) }),
          h('a', { href: s.url, target: '_blank', title: '访问文献网站', style: { marginLeft: 4 } }, s.site_name)
        ))
      ),
      h('div', { className: 'muted', style: { margin: '6px 0' } }, `已选文献：${selectedCount()} / 10`),
      ...pageItems().map(it => h('div', { key: it.id, className: 'row', style: { display: 'flex', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid #f0f0f0' } },
         
         // 1. Checkbox Column (Flex 1 part ~5%)
         h('div', { style: { flex: '1 0 0', minWidth: 0, display: 'flex', paddingTop: 4, justifyContent: 'center' } },
           h('input', { type: 'checkbox', checked: !!it.selected, onChange: () => toggleItem(it), style: { cursor: 'pointer', margin: 0 } })
         ),

         // 3. Main Content Column (Flex 17 parts ~85%)
         h('div', { style: { flex: '17 0 0', minWidth: 0, padding: '0 12px' } },
            it.doi ? 
              h('a', { 
                href: it.doi.startsWith('http') ? it.doi : `https://doi.org/${it.doi}`, 
                target: '_blank', 
                rel: 'noopener noreferrer',
                style: { fontWeight: 'bold', fontSize: '1.05em', lineHeight: '1.4', textDecoration: 'none', color: '#0066cc', display: 'block', wordBreak: 'break-word' },
                title: '点击访问 DOI 链接'
              }, it.title) :
              h('span', { style: { fontWeight: 'bold', fontSize: '1.05em', lineHeight: '1.4', display: 'block', wordBreak: 'break-word' } }, it.title),
            h('div', { className: 'muted', style: { fontSize: '0.9em', marginTop: 4, lineHeight: '1.4' } }, 
              `${it.author || '未知作者'} (${it.year || '年份未知'}) - ${it.source || '未知来源'}`
            )
         ),

         // 2. Right Status Column (Flex 2 parts ~10%)
         h('div', { style: { flex: '2 0 0', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } },
            h('span', { 
              style: { 
                fontSize: '0.75em', 
                padding: '2px 8px', 
                borderRadius: 10, 
                background: it.source_type === 'ai' ? '#e6f7ff' : '#f6ffed', 
                color: it.source_type === 'ai' ? '#1890ff' : '#52c41a',
                border: `1px solid ${it.source_type === 'ai' ? '#91d5ff' : '#b7eb8f'}`,
                marginBottom: 8,
                whiteSpace: 'nowrap',
                textAlign: 'center'
              } 
            }, it.source_type === 'ai' ? '新检索' : '用户上传'),
            h('button', { 
              onClick: () => removeItem(it), 
              style: { width: 28, height: 28, padding: 0, border: '1px solid #ff4d4f', color: '#ff4d4f', background: 'transparent', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
              title: '删除条目',
              onMouseEnter: (e) => { e.currentTarget.style.background = '#ff4d4f'; e.currentTarget.style.color = '#fff' },
              onMouseLeave: (e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ff4d4f' }
            }, '×')
         )
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
