import React, { useEffect, useState } from 'https://esm.sh/react@18?dev'
import * as pdfjsLib from 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.mjs'
import ReactMarkdown from 'https://esm.sh/react-markdown@9.0.1?deps=react@18&dev'
import remarkGfm from 'https://esm.sh/remark-gfm@4.0.0?deps=react@18&dev'

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

const DEFAULT_SEARCH_PROMPT = `你是资深研究助理。基于给定基础文献集，针对指定网站进行大规模相关文献检索，返回覆盖广泛的扩展文献集（JSON数组，仅数据，无Markdown）。字段：title, author, source, year, doi。`
const DEFAULT_REVIEW_PROMPT = `你是资深学术写作助手。基于用户勾选的基础文献（≥10）与扩展检索文献，生成结构化中文综述（Markdown）。必须包含：摘要、引言、方法、结果与讨论、结论、参考文献。重点分析基础文献，整合扩展文献保证覆盖面，保持学术严谨与引用规范（按作者-年份或编号一致）。只返回Markdown文本。`

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error('Render error', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return h('div', { className: 'card', style: { color: 'red', padding: 16 } },
        h('h3', null, '渲染出错'),
        h('pre', { style: { whiteSpace: 'pre-wrap' } }, this.state.error && this.state.error.toString())
      )
    }
    return this.props.children
  }
}

export default function DirectionDetail({ project, onExit }) {
  return h(ErrorBoundary, null, h(DirectionDetailContent, { project, onExit }))
}

function DirectionDetailContent({ project, onExit }) {
  const [proj, setProj] = useState(null)
  const d = project.currentDirection || project
  const [status, setStatus] = useState(d.status || '未生成综述')
  const [apis, setApis] = useState([])
  const [searchApiName, setSearchApiName] = useState('')
  const [reviewApiName, setReviewApiName] = useState('')
  const [sites, setSites] = useState([])
  const [siteSelected, setSiteSelected] = useState({})
  const [manualSiteSelected, setManualSiteSelected] = useState({})
  const [keywords, setKeywords] = useState('')
  const [uploaded, setUploaded] = useState([])
  const [results, setResults] = useState([])
  const [promptText, setPromptText] = useState('')
  const [searchPromptTpl, setSearchPromptTpl] = useState(DEFAULT_SEARCH_PROMPT)
  const [reviewPromptTpl, setReviewPromptTpl] = useState(DEFAULT_REVIEW_PROMPT)
  const [reviewMd, setReviewMd] = useState('')
  const [citationStats, setCitationStats] = useState(null)
  const [termsReport, setTermsReport] = useState(null)
  const [msg, setMsg] = useState('')
  const [page, setPage] = useState(1)
  const [searching, setSearching] = useState(false)
  const [anchoring, setAnchoring] = useState(false)
  const [anchorStep, setAnchorStep] = useState('idle')
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
        if (a.length > 0) {
           // Default to first API if not set
           setSearchApiName(prev => prev || a[0].api_name)
           setReviewApiName(prev => prev || a[0].api_name)
        }
        const s = await api('/config/sites'); setSites(s); 
        const sel = {}; s.forEach(it => sel[it.id] = true); 
        setSiteSelected(sel)
        setManualSiteSelected(sel)
      } catch {}
    })()
  }, [])
  
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dir_' + d.id)
      if (raw) {
        const saved = JSON.parse(raw)
        // Migration logic for apiName -> searchApiName/reviewApiName
        if (saved.searchApiName) setSearchApiName(saved.searchApiName)
        else if (saved.apiName) setSearchApiName(saved.apiName)
        
        if (saved.reviewApiName) setReviewApiName(saved.reviewApiName)
        else if (saved.apiName) setReviewApiName(saved.apiName)

        if (saved.keywords) setKeywords(saved.keywords)
        if (saved.uploaded) setUploaded(saved.uploaded)
        if (saved.results) setResults(saved.results)
        if (saved.siteSelected) setSiteSelected(saved.siteSelected)
        if (saved.manualSiteSelected) setManualSiteSelected(saved.manualSiteSelected)
        if (saved.page) setPage(saved.page)
        
        if (saved.searchPromptTpl) setSearchPromptTpl(saved.searchPromptTpl)
        else setSearchPromptTpl(DEFAULT_SEARCH_PROMPT)
        
        if (saved.reviewPromptTpl) setReviewPromptTpl(saved.reviewPromptTpl)
        else setReviewPromptTpl(DEFAULT_REVIEW_PROMPT)
        
        if (saved.reviewMd) setReviewMd(saved.reviewMd)
        if (saved.citationStats) setCitationStats(saved.citationStats)
      }
    } catch {}
  }, [])
  
  useEffect(() => {
    const data = { 
      searchApiName, 
      reviewApiName, 
      keywords, 
      uploaded, 
      results, 
      siteSelected, 
      manualSiteSelected,
      page, 
      searchPromptTpl, 
      reviewPromptTpl, 
      reviewMd, 
      citationStats 
    }
    try { localStorage.setItem('dir_' + d.id, JSON.stringify(data)) } catch {}
  }, [searchApiName, reviewApiName, keywords, uploaded, results, siteSelected, manualSiteSelected, page, searchPromptTpl, reviewPromptTpl, reviewMd, citationStats])
  
  function selectedCount() {
    const arr = [...uploaded.filter(x => x.selected), ...results.filter(x => x.selected)]
    return arr.length
  }
  
  function selectedSitesCount() {
    return Object.keys(siteSelected).filter(k => siteSelected[k]).length
  }
  
  function combinedList() {
    return [...uploaded, ...results]
  }
  
  function pageItems() {
    const list = combinedList()
    const start = (page - 1) * pageSize
    return list.slice(start, start + pageSize)
  }
  
  function normalizeTitle(t) {
    return String(t || '').toLowerCase().replace(/\s+/g, ' ').trim().replace(/[\u3000]/g, ' ').replace(/[.,;:!?'"`~@#$%^&*()\[\]{}<>\/\\|+-=_]/g, '')
  }
  
  function isValidDOI(doi) {
    if (!doi) return false
    const re = /^10\.\d{4,9}\/[-._;()\/:A-Z0-9]+$/i
    return re.test(String(doi).trim())
  }
  
  async function parsePDF(file) {
    try {
      const buf = await file.arrayBuffer()
      const doc = await pdfjsLib.getDocument({ data: buf, disableWorker: !hasWorkerOptions }).promise
      let meta = { info: {} }
      try { meta = await doc.getMetadata() } catch {}
      const title = (meta.info && meta.info.Title) ? meta.info.Title : file.name.replace(/\.pdf$/i, '')
      const item = { id: 'u_' + Math.random().toString(36).slice(2), title, source: 'uploaded', selected: true, source_type: 'uploaded' }
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
  
  function genSearchPrompt(reqId, tplOverride, targetSites) {
    const sitesToUse = targetSites || siteSelected
    const siteInfo = sites.filter(s => sitesToUse[s.id]).map(s => `${s.site_name} (${s.url})`)
    const basePapers = combinedList().filter(x => x.selected).map(x => ({
      title: x.title || '',
      author: x.author || '',
      source: x.source || '',
      year: x.year || '',
      doi: x.doi || ''
    }))
    // Use override if provided, else current template, else default
    const tplRaw = tplOverride !== undefined ? tplOverride : searchPromptTpl
    const tpl = tplRaw && tplRaw.trim().length > 0 ? tplRaw.trim() : DEFAULT_SEARCH_PROMPT
    const txt = `${tpl}\n\n研究方向：${name}\n关键词：${keywords}\n文献网站：${siteInfo.join(', ')}\n基础文献集（>=10）：${JSON.stringify(basePapers)}`
    setPromptText(txt)
    appendLog({ id: reqId, step: 'render_start', vars: { name, keywords, siteIds: Object.keys(sitesToUse).filter(k => sitesToUse[k]), siteNames: siteInfo, selectedCount: selectedCount() } })
    appendLog({ id: reqId, step: 'render_done', promptLength: txt.length })
    return txt
  }
  
  async function sendPrompt() {
    if (searching) return
    const requestId = genReqId()
    setSearching(true)
    try {
      const manualSelectedCount = Object.keys(manualSiteSelected).filter(k => manualSiteSelected[k]).length
      if (manualSelectedCount < 1) {
        setMsg('请至少选择一个文献网站')
        appendLog({ id: requestId, step: 'validation_failed', error: 'no_sites_selected' })
        return
      }
      const p = genSearchPrompt(requestId, undefined, manualSiteSelected)
      if (!searchApiName) {
        const error = new Error('请选择用于搜索的AI-API')
        appendLog({ id: requestId, step: 'validation_failed', searchApiName, error: error.message })
        setMsg('调用失败：' + error.message)
        return
      }
      const headers = { 'Content-Type': 'application/json' }
      const t = localStorage.getItem('jwt')
      if (t) headers['Authorization'] = `Bearer ${t}`
      
      appendLog({ id: requestId, step: 'prompt_generated', apiName: searchApiName, prompt: p.slice(0, 500) })
      const start = Date.now()
      appendLog({ id: requestId, step: 'send_start', url: '/config/ai/prompt', headers, payload: { apiName: searchApiName, prompt: p, debug: true, requestId }, attempt: 1 })
      let r = null, err = null
      try {
        r = await api('/config/ai/prompt', { method: 'POST', body: { apiName: searchApiName, prompt: p, debug: true, requestId }, timeoutMs: 300000 })
      } catch (e1) {
        err = e1
        appendLog({ id: requestId, step: 'send_fail', error: String(e1 && e1.message || e1), stack: e1 && e1.stack ? e1.stack : null, latency_ms: Date.now() - start, attempt: 1 })
        const wait = 1000
        await new Promise(res => setTimeout(res, wait))
        appendLog({ id: requestId, step: 'retry', delay_ms: wait, attempt: 2 })
        r = await api('/config/ai/prompt', { method: 'POST', body: { apiName: searchApiName, prompt: p, debug: true, requestId }, timeoutMs: 300000 })
      }
      
      appendLog({ id: requestId, step: 'send_done', status: r && r.status, latency_ms: Date.now() - start, serverDebug: r && r.debug ? r.debug : null, responseLength: r && r.answer ? r.answer.length : 0 })
      
      if (r && r.answer) {
        let items = []
        try {
          let raw = r.answer.trim()
          appendLog({ id: requestId, step: 'parse_start', rawSample: raw.slice(0, 200) })

          let parsed = null
          try { parsed = JSON.parse(raw) } catch {}

          if (parsed && parsed.choices && Array.isArray(parsed.choices) && parsed.choices[0] && parsed.choices[0].message) {
             let content = parsed.choices[0].message.content
             const match = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
             if (match) content = match[1]
             try {
               parsed = JSON.parse(content)
             } catch (e) {
               console.warn('Inner content parse failed', e)
             }
          } else {
             const match = raw.match(/```json\s*([\s\S]*?)\s*```/) || raw.match(/```\s*([\s\S]*?)\s*```/)
             if (match) {
                try { parsed = JSON.parse(match[1]) } catch {}
             }
          }

          if (Array.isArray(parsed)) {
            items = parsed
          } else if (typeof parsed === 'object' && parsed !== null) {
            const arrayProp = Object.values(parsed).find(v => Array.isArray(v))
            if (arrayProp) items = arrayProp
          }
        } catch (e) {
          appendLog({ id: requestId, step: 'parse_fail', error: e.message, raw: r.answer.slice(0, 500) })
        }
        
        if (Array.isArray(items)) {
          let newItems = items.map(x => {
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
          
          const seen = new Set()
          const existingKeys = new Set()
          combinedList().forEach(x => {
            const key = x.doi ? ('doi:' + String(x.doi).trim().toLowerCase()) : ('t:' + normalizeTitle(x.title))
            existingKeys.add(key)
          })
          newItems = newItems.filter(x => {
            const doiValid = isValidDOI(x.doi)
            x.doi_valid = !!doiValid
            const key = x.doi && doiValid ? ('doi:' + String(x.doi).trim().toLowerCase()) : ('t:' + normalizeTitle(x.title))
            if (existingKeys.has(key)) return false
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          
          setResults(prev => [...newItems, ...prev])
          setMsg(`成功获取 ${newItems.length} 条文献，已发送至 ${searchApiName}，延迟 ${r.latency_ms}ms`)
          
          appendLog({ 
            id: requestId, 
            step: 'process_success', 
            itemsCount: newItems.length, 
            firstItemSample: newItems[0] || null,
            rawItemSample: items[0] || null
          })
        } else {
           setMsg(`获取数据格式错误，已发送至 ${searchApiName}`)
           appendLog({ id: requestId, step: 'process_invalid_format', type: typeof items })
        }
      } else {
        setMsg(`未获取到有效回答，已发送至 ${searchApiName}`)
      }
    } catch (e) { 
      appendLog({ id: requestId, step: 'request_failed', error: String(e && e.message || e) })
      setMsg('AI-API调用失败：' + (e && e.message ? e.message : String(e))) 
    } finally { 
      setSearching(false) 
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

  function toggleManualSite(id) {
    const next = { ...manualSiteSelected, [id]: !manualSiteSelected[id] }
    setManualSiteSelected(next)
  }
  
  function buildCitationStats() {
    const items = combinedList().filter(x => x.selected)
    const bySource = {}
    const byYear = {}
    let doiValid = 0, doiInvalid = 0
    items.forEach(x => {
      const s = (x.source || '未知来源').trim()
      bySource[s] = (bySource[s] || 0) + 1
      const y = (x.year || '年份未知').toString()
      byYear[y] = (byYear[y] || 0) + 1
      const valid = isValidDOI(x.doi)
      if (valid) doiValid++; else doiInvalid++
    })
    return { total: items.length, bySource, byYear, doi: { valid: doiValid, invalid: doiInvalid } }
  }
  
  function genReviewPrompt(reqId, explicitExpanded) {
    const base = combinedList().filter(x => x.selected).map(x => ({
      title: x.title || '',
      author: x.author || '',
      source: x.source || '',
      year: x.year || '',
      doi: x.doi || ''
    }))
    const sourceExpanded = explicitExpanded || results
    const expanded = sourceExpanded.map(x => ({
      title: x.title || '',
      author: x.author || '',
      source: x.source || '',
      year: x.year || '',
      doi: x.doi || ''
    }))
    const tpl = reviewPromptTpl && reviewPromptTpl.trim().length > 0 ? reviewPromptTpl.trim() : DEFAULT_REVIEW_PROMPT
    const txt = `${tpl}\n\n研究方向：${name}\n关键词：${keywords}\n基础文献：${JSON.stringify(base)}\n扩展文献：${JSON.stringify(expanded)}`
    setPromptText(txt)
    appendLog({ id: reqId, step: 'render_review_start', vars: { selectedCount: selectedCount(), expandedCount: results.length } })
    appendLog({ id: reqId, step: 'render_review_done', promptLength: txt.length })
    return txt
  }

  async function autoAnchor() {
    if (selectedCount() < 10) { setMsg('请至少选择10篇基础文献'); return }
    if (selectedSitesCount() < 1) { setMsg('请至少选择一个文献网站（步骤1）'); return }
    if (!searchApiName) { setMsg('请选择搜索API（步骤1）'); return }
    if (!reviewApiName) { setMsg('请选择综述API（步骤2）'); return }
    
    setAnchoring(true)
    setAnchorStep('searching')
    const requestId = genReqId()
    let newItems = []
    
    try {
      setMsg('正在执行步骤1：文献扩展搜索...')
      // 锚定过程强制使用默认 Prompt 模板，不依赖用户编辑状态，且使用 siteSelected (锚定专用)
      // 优化：仅提取关键字段以减小 Prompt 长度，避免 400 错误
      const siteInfo = sites.filter(s => siteSelected[s.id]).map(s => `${s.site_name} (${s.url})`)
      const basePapers = combinedList().filter(x => x.selected).map(x => ({
        title: x.title || '',
        author: x.author || '',
        year: x.year || '',
        doi: x.doi || ''
      }))
      const tpl = DEFAULT_SEARCH_PROMPT
      const p = `${tpl}\n\n研究方向：${name}\n关键词：${keywords}\n文献网站：${siteInfo.join(', ')}\n基础文献集（>=10）：${JSON.stringify(basePapers)}`
      
      appendLog({ id: requestId, step: 'auto_search_start', apiName: searchApiName })
      
      let r = null
      const searchBody = { apiName: searchApiName, prompt: p, debug: true, requestId }
      try {
        const startT = Date.now()
        appendLog({ id: requestId, step: 'auto_search_send_1' })
        r = await api('/config/ai/prompt', { method: 'POST', body: searchBody, timeoutMs: 300000 })
        appendLog({ id: requestId, step: 'auto_search_success', latency: Date.now() - startT })
      } catch (e1) {
        console.warn('Step 1 attempt 1 failed', e1)
        appendLog({ id: requestId, step: 'auto_search_fail_1', error: e1.message })
        await new Promise(res => setTimeout(res, 1000))
        try {
             const startRetry = Date.now()
             appendLog({ id: requestId, step: 'auto_search_retry' })
             r = await api('/config/ai/prompt', { method: 'POST', body: searchBody, timeoutMs: 300000 })
             appendLog({ id: requestId, step: 'auto_search_retry_success', latency: Date.now() - startRetry })
        } catch (e2) {
             throw new Error('步骤1搜索失败: ' + e2.message)
        }
      }
      
      if (r && r.answer) {
         let raw = r.answer.trim()
         let parsed = null
         try { parsed = JSON.parse(raw) } catch {}
         if (!parsed) {
             const match = raw.match(/```json\s*([\s\S]*?)\s*```/) || raw.match(/```\s*([\s\S]*?)\s*```/)
             if (match) try { parsed = JSON.parse(match[1]) } catch {}
         }
         if (parsed && parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
             let content = parsed.choices[0].message.content
             const match = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
             if (match) content = match[1]
             try { parsed = JSON.parse(content) } catch {}
         }
         let items = []
         if (Array.isArray(parsed)) items = parsed
         else if (typeof parsed === 'object' && parsed !== null) {
            const arrayProp = Object.values(parsed).find(v => Array.isArray(v))
            if (arrayProp) items = arrayProp
         }
         
         if (Array.isArray(items)) {
            newItems = items.map(x => ({
              id: 'ai_' + Math.random().toString(36).slice(2), 
              title: x.title || x.Title || '无标题', 
              author: x.author || x.Author || '未知作者', 
              source: x.source || x.Source || '未知来源', 
              year: x.year || x.Year || '年份未知', 
              doi: x.doi || x.DOI || null,
              selected: false, 
              source_type: 'ai' 
            }))
            // Bug Fix 2: 扩展检索结果不直接显示在列表中，仅传递给下一步
            // setResults(prev => [...newItems, ...prev])
         }
      }
      
      setAnchorStep('reviewing')
      setMsg(`步骤1完成，获取到 ${newItems.length} 条新文献。正在执行步骤2：综述生成...`)
      
      const combinedResults = [...newItems, ...results]
      // 优化：仅提取关键字段，并限制数量防止 Prompt 过长
      const baseForReview = combinedList().filter(x => x.selected).map(x => ({
        title: x.title || '',
        author: x.author || '',
        year: x.year || ''
      }))
      const expandedForReview = combinedResults.map(x => ({
        title: x.title || '',
        author: x.author || '',
        year: x.year || ''
      }))
      // 限制扩展文献数量，防止超长
      const limitedExpanded = expandedForReview.slice(0, 50)
      
      const reviewTpl = reviewPromptTpl && reviewPromptTpl.trim().length > 0 ? reviewPromptTpl.trim() : DEFAULT_REVIEW_PROMPT
      const reviewP = `${reviewTpl}\n\n研究方向：${name}\n关键词：${keywords}\n基础文献：${JSON.stringify(baseForReview)}\n扩展文献：${JSON.stringify(limitedExpanded)}`
      
      const reviewBody = { apiName: reviewApiName, prompt: reviewP, debug: true, requestId }
      let rr = null
      try {
         const startT = Date.now()
         appendLog({ id: requestId, step: 'auto_review_send_1' })
         rr = await api('/config/ai/prompt', { method: 'POST', body: reviewBody, timeoutMs: 300000 })
         appendLog({ id: requestId, step: 'auto_review_success', latency: Date.now() - startT })
      } catch (e1) {
         console.warn('Step 2 attempt 1 failed', e1)
         appendLog({ id: requestId, step: 'auto_review_fail_1', error: e1.message })
         await new Promise(res => setTimeout(res, 1000))
         try {
            const startRetry = Date.now()
            appendLog({ id: requestId, step: 'auto_review_retry' })
            rr = await api('/config/ai/prompt', { method: 'POST', body: reviewBody, timeoutMs: 300000 })
            appendLog({ id: requestId, step: 'auto_review_retry_success', latency: Date.now() - startRetry })
         } catch (e2) {
            throw new Error('步骤2综述生成失败: ' + e2.message)
         }
      }
      
      const answer = rr && rr.answer ? String(rr.answer) : ''
      let finalMd = answer
      try {
        const parsed = JSON.parse(answer)
        if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
          finalMd = parsed.choices[0].message.content || ''
        } else if (parsed.content) {
          finalMd = parsed.content
        }
      } catch (e) {}
      const match = finalMd.match(/^```markdown\s*([\s\S]*?)\s*```$/) || finalMd.match(/^```\s*([\s\S]*?)\s*```$/)
      if (match) finalMd = match[1]
      
      setReviewMd(finalMd)
      const stats = buildCitationStats()
      setCitationStats(stats)
      setTermsReport(buildTermsReport(finalMd))
      await api('/directions/' + d.id, { method: 'PUT', body: { status: '已生成综述', review_md: finalMd, citation_stats: stats } })
      setStatus('已生成综述')
      setMsg('全流程锚定完成')
      
    } catch (e) {
      setMsg('流程异常：' + e.message)
      console.error(e)
    } finally {
      setAnchoring(false)
      setAnchorStep('idle')
    }
  }
  
  async function anchor() {
    if (selectedCount() < 10) { setMsg('请至少选择10篇文献'); return }
    if (selectedSitesCount() < 1) { setMsg('请至少选择一个文献网站'); return }
    if (!reviewApiName) { setMsg('请选择用于综述生成的AI-API'); return }
    const requestId = genReqId()
    setSending(true)
    try {
      const p = genReviewPrompt(requestId)
      appendLog({ id: requestId, step: 'send_review_start' })
      const r = await api('/config/ai/prompt', { method: 'POST', body: { apiName: reviewApiName, prompt: p, debug: true, requestId }, timeoutMs: 300000 })
      const answer = r && r.answer ? String(r.answer) : ''
      let finalMd = answer
      try {
        const parsed = JSON.parse(answer)
        // Handle standard chat completion structure
        if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
          finalMd = parsed.choices[0].message.content || ''
        } else if (parsed.content) {
          // Handle direct content object
          finalMd = parsed.content
        }
      } catch (e) {
        // Not JSON, assume raw markdown
      }
      // Strip outer markdown code blocks if present
      const match = finalMd.match(/^```markdown\s*([\s\S]*?)\s*```$/) || finalMd.match(/^```\s*([\s\S]*?)\s*```$/)
      if (match) finalMd = match[1]
      
      setReviewMd(finalMd)
      const stats = buildCitationStats()
      setCitationStats(stats)
      setTermsReport(buildTermsReport(finalMd))
      await api('/directions/' + d.id, { method: 'PUT', body: { status: '已生成综述', review_md: finalMd, citation_stats: stats } })
      setStatus('已生成综述')
      setMsg('综述已生成并保存')
    } catch (e) {
      setMsg('综述生成失败：' + (e && e.message ? e.message : String(e)))
    } finally {
      setSending(false)
    }
  }
  
  function mdToPlain(md) {
    return String(md || '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]+)\]\((.*?)\)/g, '$1 ($2)')
      .replace(/[#>*_`~\-]{1,}/g, '')
      .replace(/\r\n/g, '\n')
  }
  
  function buildTermsReport(text) {
    const plain = mdToPlain(text)
    const kw = String(keywords || '').split(/[,\s，；;]+/).map(s => s.trim()).filter(Boolean)
    const items = kw.map(term => {
      const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      const count = (plain.match(re) || []).length
      return { term, count }
    })
    const variants = []
    kw.forEach(term => {
      const alt = term.replace(/\s+/g, '-')
      if (alt !== term) {
        const re = new RegExp(alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        const c = (plain.match(re) || []).length
        if (c > 0) variants.push(`${term} 的连字符变体：${alt}（${c}次）`)
      }
      const upper = term.toUpperCase()
      if (upper !== term) {
        const re2 = new RegExp(upper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        const c2 = (plain.match(re2) || []).length
        if (c2 > 0) variants.push(`${term} 的大写变体：${upper}（${c2}次）`)
      }
    })
    return { items, variants }
  }
  
  function createSimplePDF(text) {
    const lines = mdToPlain(text).split('\n').map(s => s.trim())
    const contentLines = lines.filter(s => s.length > 0).slice(0, 1000)
    const objects = []
    const offsets = []
    const pushObj = (s) => { offsets.push(objects.join('').length); objects.push(s) }
    pushObj('%PDF-1.4\n')
    const fontObj = '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n'
    const pageKidsRef = '3 0 R'
    const catalogObj = '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n'
    pushObj(catalogObj)
    const pagesObj = '2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n'
    pushObj(pagesObj)
    const resources = '<< /Font << /F1 5 0 R >> >>'
    const pageObj = '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources ' + resources + ' >> endobj\n'
    pushObj(pageObj)
    const leading = 14
    let contentStream = 'BT /F1 12 Tf 72 750 Td\n'
    contentLines.forEach((ln, idx) => {
      const escaped = ln.replace(/([()\\])/g, '\\$1')
      if (idx === 0) {
        contentStream += `(${escaped}) Tj\n`
      } else {
        contentStream += `T* (${escaped}) Tj\n`
      }
    })
    contentStream += 'ET'
    const content = `4 0 obj << /Length ${contentStream.length} >> stream\n${contentStream}\nendstream\nendobj\n`
    pushObj(content)
    pushObj(fontObj)
    const xrefStart = objects.join('').length
    let xref = 'xref\n0 6\n0000000000 65535 f \n'
    const calc = (idx) => String(offsets[idx]).padStart(10, '0')
    xref += calc(0) + ' 00000 n \n'
    xref += calc(1) + ' 00000 n \n'
    xref += calc(2) + ' 00000 n \n'
    xref += calc(3) + ' 00000 n \n'
    xref += calc(4) + ' 00000 n \n'
    const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
    const full = objects.join('') + xref + trailer
    return new Blob([full], { type: 'application/pdf' })
  }
  
  function downloadMd() {
    if (!reviewMd) return
    const blob = new Blob([reviewMd], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${name}-综述.md`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  
  function downloadPdf() {
    if (!reviewMd) return
    const blob = createSimplePDF(reviewMd)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${name}-综述.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
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
        h('div', { style: { display: 'flex', flexDirection: 'column' } },
          h('select', { value: searchApiName, onChange: e => setSearchApiName(e.target.value), title: '选择搜索用的AI-API' },
            ...apis.map(a => h('option', { key: a.api_name, value: a.api_name }, a.api_name))
          ),
          h('span', { style: { fontSize: '0.8em', color: '#666' } }, '搜索 API')
        ),
        h('button', { 
            onClick: sendPrompt, 
            disabled: searching || Object.keys(manualSiteSelected).filter(k => manualSiteSelected[k]).length < 1 || !searchApiName 
        }, searching ? '发送中...' : '文献搜索')
      ),
      h('div', { style: { marginTop: 8 } },
        h('span', { className: 'muted', style: { marginRight: 8 } }, '目标网站：'),
        h('div', { style: { display: 'inline-flex', flexWrap: 'wrap', gap: 8, verticalAlign: 'middle' } },
           ...sites.map(s => h('label', { key: s.id, style: { display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#f9fafb', padding: '2px 6px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: '0.9em' } },
              h('input', { type: 'checkbox', checked: !!manualSiteSelected[s.id], onChange: () => toggleManualSite(s.id), style: { marginRight: 4 } }),
              h('span', null, s.site_name)
           ))
        )
      ),
      h('div', { style: { marginTop: 12 } },
        h('div', { style: { marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
           h('span', { className: 'muted' }, '搜索 Prompt 模板：'),
           h('button', { 
             className: 'secondary btn-small',
             onClick: () => setSearchPromptTpl(DEFAULT_SEARCH_PROMPT)
           }, '恢复默认')
        ),
        h('textarea', { 
          placeholder: '搜索Prompt模板（可选，自定义扩展检索行为）', 
          value: searchPromptTpl, 
          onChange: e => setSearchPromptTpl(e.target.value), 
          rows: 4, 
          style: { width: '100%', borderColor: !searchPromptTpl ? '#faad14' : '#d9d9d9' } 
        }),
        !searchPromptTpl ? h('div', { style: { color: '#faad14', fontSize: '0.85em', marginTop: 4 } }, '⚠ 提示：输入框为空，建议恢复默认 Prompt 以获得最佳效果') : null
      ),
      h('div', { className: 'muted', style: { marginTop: 6 } }, '当前步骤：收集文献；下一步：选择与锚定')
    ),
    h('div', { className: 'card' },
      h('h3', null, '文献选择'),
      h('div', { className: 'muted', style: { margin: '6px 0' } }, `已选基础文献（需>=10）：${selectedCount()}`),
      ...pageItems().map(it => h('div', { key: it.id, className: 'row', style: { display: 'flex', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid #f0f0f0' } },
         
         // 1. Checkbox Column
         h('div', { style: { flex: '1 0 0', minWidth: 0, display: 'flex', paddingTop: 4, justifyContent: 'center' } },
           h('input', { type: 'checkbox', checked: !!it.selected, onChange: () => toggleItem(it), style: { cursor: 'pointer', margin: 0 } })
         ),

         // 2. Main Content Column
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

         // 3. Right Status Column
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
            it.doi ? h('span', { style: { fontSize: '0.75em', marginBottom: 8, color: it.doi_valid ? '#52c41a' : '#ff4d4f' } }, it.doi_valid ? 'DOI有效' : 'DOI格式异常') : null,
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
      h('div', { style: { marginTop: 20, borderTop: '1px solid #eee', paddingTop: 12 } },
        h('h4', { style: { margin: '0 0 12px 0' } }, '锚定设置'),
        
        // Step 1
        h('div', { style: { border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, marginBottom: 12, background: '#f9fafb' } },
           h('div', { style: { fontWeight: 'bold', marginBottom: 8, color: '#374151' } }, '第一步：文献扩展搜索'),
           h('div', { style: { marginBottom: 8 } }, 
             h('span', { className: 'muted' }, '目标数据源（多选）：'),
             h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 } },
               ...sites.map(s => h('label', { key: s.id, style: { display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#fff', padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db' } },
                  h('input', { type: 'checkbox', checked: !!siteSelected[s.id], onChange: () => toggleSite(s.id), style: { marginRight: 4 } }),
                  h('a', { href: s.url, target: '_blank', onClick: e => e.stopPropagation() }, s.site_name)
               ))
             )
           ),
           h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } },
              h('span', { className: 'muted' }, '搜索 API：'),
              h('select', { value: searchApiName, onChange: e => setSearchApiName(e.target.value), style: { maxWidth: 200 } },
                 ...apis.map(a => h('option', { key: a.api_name, value: a.api_name }, a.api_name))
              )
           )
        ),
        
        // Step 2
        h('div', { style: { border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, marginBottom: 12, background: '#f9fafb' } },
           h('div', { style: { fontWeight: 'bold', marginBottom: 8, color: '#374151' } }, '第二步：综述生成'),
           h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } },
              h('span', { className: 'muted' }, '生成 API：'),
              h('select', { value: reviewApiName, onChange: e => setReviewApiName(e.target.value), style: { maxWidth: 200 } },
                 ...apis.map(a => h('option', { key: a.api_name, value: a.api_name }, a.api_name))
              )
           ),
           h('div', null,
             h('div', { style: { marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                h('span', { className: 'muted' }, '综述 Prompt 模板：'),
                h('button', { className: 'secondary btn-small', onClick: () => setReviewPromptTpl(DEFAULT_REVIEW_PROMPT) }, '恢复默认')
             ),
             h('textarea', { value: reviewPromptTpl, onChange: e => setReviewPromptTpl(e.target.value), rows: 3, style: { width: '100%', fontSize: '0.9em', borderColor: !reviewPromptTpl ? '#faad14' : '#d9d9d9' } })
           )
        ),
        
        // Action
        h('div', { style: { marginTop: 16 } },
          h('button', { 
            disabled: anchoring || selectedCount() < 10 || selectedSitesCount() < 1 || !searchApiName || !reviewApiName, 
            onClick: autoAnchor,
            style: { width: '100%', padding: '10px', fontSize: '16px', fontWeight: 'bold', background: anchoring ? '#ccc' : '#111827', color: '#fff', cursor: anchoring ? 'not-allowed' : 'pointer' }
          }, anchoring ? `执行中... (${anchorStep === 'searching' ? 'Step 1: 扩展搜索' : anchorStep === 'reviewing' ? 'Step 2: 综述生成' : '准备中'})` : '开始锚定')
        )
      ),
      h('div', { className: 'muted', style: { marginTop: 6 } }, '当前步骤：选择文献；下一步：生成综述')
    ),
    reviewMd ? h('div', { className: 'card' },
      h('h3', null, '综述预览'),
      h('div', { className: 'markdown-body', style: { maxHeight: 600, overflow: 'auto', border: '1px solid #eee', padding: 24, borderRadius: 8, background: '#fff' } },
        h(ReactMarkdown, { remarkPlugins: [remarkGfm] }, reviewMd)
      ),
      h('div', { className: 'row', style: { marginTop: 12 } },
        h('button', { className: 'secondary', onClick: downloadMd }, '下载MD'),
        h('button', { className: 'secondary', onClick: downloadPdf }, '下载PDF')
      )
    ) : null,
    citationStats ? h('div', { className: 'card' },
      h('h3', null, '引用来源统计'),
      h('div', null, `总计：${citationStats.total}`),
      h('div', null, '按来源：'),
      h('div', null, Object.entries(citationStats.bySource).map(([k,v]) => h('div', { key: k }, `${k}: ${v}`))),
      h('div', null, '按年份：'),
      h('div', null, Object.entries(citationStats.byYear).map(([k,v]) => h('div', { key: k }, `${k}: ${v}`))),
      h('div', null, `DOI有效：${citationStats.doi.valid}，无效：${citationStats.doi.invalid}`)
    ) : null,
    termsReport ? h('div', { className: 'card' },
      h('h3', null, '术语一致性检查'),
      h('div', null, '根据关键词推断术语使用情况（区分大小写与连字符）：'),
      h('div', null, termsReport.items.map(it => h('div', { key: it.term }, `${it.term}: ${it.count} 次`))),
      termsReport.variants.length > 0 ? h('div', null, '检测到可能的变体：') : null,
      termsReport.variants.length > 0 ? h('div', null, termsReport.variants.map(v => h('div', { key: v }, v))) : null
    ) : null,
    msg ? h('div', { className: 'muted', style: { marginTop: 8 } }, msg) : null
  )
}
