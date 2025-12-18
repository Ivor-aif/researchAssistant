import React, { useEffect, useState } from 'https://esm.sh/react@18?dev'
import ReactMarkdown from 'https://esm.sh/react-markdown@9.0.1?deps=react@18&dev'
import remarkGfm from 'https://esm.sh/remark-gfm@4.0.0?deps=react@18&dev'
import { marked } from 'https://esm.sh/marked@12.0.0'

import { api } from '../apiClient.js'
import { genReqId, appendLog } from '../log.js'
import { formatDate } from '../time.js'
const h = React.createElement

const DEFAULT_SEARCH_PROMPT = `你是资深研究助理。基于给定基础文献集和关键词主题，针对指定网站进行大规模相关文献检索，返回覆盖广泛的扩展文献集（JSON数组，仅数据，无Markdown）。字段：title, author, source, year, doi。`
const DEFAULT_REVIEW_PROMPT = `你是资深学术写作助手，十分擅长于总结并写出综述。基于用户勾选的基础文献（≥10）与扩展检索文献，生成结构化中文综述（Markdown）。必须包含：摘要、引言、方法、结果与讨论、结论、参考文献。重点分析基础文献，整合扩展文献（这一部分可以列表格）保证覆盖面，保持学术严谨与引用规范（按作者-年份或编号一致）。不要返回别的信息，只返回综述本身的Markdown文本。`

const DEFAULT_DEEP_PROMPT = `你是世界顶尖的科研专家。
用户希望基于提供的文献上下文和指定的研究倾向，进行深度的研究工作。

请遵循以下步骤进行严谨、详尽的推理与生成：
1. **分析文献**：深入阅读提供的所有文献内容，提取核心理论、方法、数据和结论。
2. **结合倾向**：根据用户的研究倾向（如建立理论、模拟实验、代码生成等），筛选并整合相关信息。
3. **制定方案**：
  - 如果是理论构建：推导新的理论框架或模型公式，论证其合理性。
  - 如果是模拟实验：设计详细的实验步骤、参数设置、预期结果及验证方法。
  - 如果是代码生成：编写完整的、可运行的核心代码片段（Python/Matlab/C++等），并附带注释与说明。
  - 其他倾向：根据具体需求提供专业、深度的内容。
4. **生成报告**：输出一份结构清晰、内容详实的Markdown报告。

**要求**：
- 内容必须极度严谨，符合学术标准。
- 上下文非常长，请确保逻辑连贯。
- 必须包含具体的公式、代码或数据支持，拒绝空泛的描述。
- 输出格式为 Markdown。`

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
  const [reviewExpanded, setReviewExpanded] = useState(true)
  const [listExpanded, setListExpanded] = useState(true)
  const [msg, setMsg] = useState('')
  const [page, setPage] = useState(1)
  const [searching, setSearching] = useState(false)
  const [anchoring, setAnchoring] = useState(false)
  const [anchorStep, setAnchorStep] = useState('idle')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadPickerHover, setUploadPickerHover] = useState(false)
  const [uploadPickerActive, setUploadPickerActive] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [uploadParsing, setUploadParsing] = useState(false)
  
  // Deep Research State
  const [deepTendency, setDeepTendency] = useState('')
  const [deepApiName, setDeepApiName] = useState('')
  const [deepPromptTpl, setDeepPromptTpl] = useState(DEFAULT_DEEP_PROMPT)
  const [deepResult, setDeepResult] = useState('')
  const [deepRunning, setDeepRunning] = useState(false)
  const [deepExpanded, setDeepExpanded] = useState(true)
  const [deepFiles, setDeepFiles] = useState([])

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

        if (saved.deepPromptTpl) setDeepPromptTpl(saved.deepPromptTpl)
        else setDeepPromptTpl(DEFAULT_DEEP_PROMPT)
        if (saved.deepResult) setDeepResult(saved.deepResult)
        if (saved.deepFiles) setDeepFiles(saved.deepFiles)

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
      deepTendency,
      deepApiName,
      deepPromptTpl,
      deepResult
    }
    try { localStorage.setItem('dir_' + d.id, JSON.stringify(data)) } catch {}
  }, [searchApiName, reviewApiName, keywords, uploaded, results, siteSelected, manualSiteSelected, page, searchPromptTpl, reviewPromptTpl, reviewMd, deepTendency, deepApiName, deepPromptTpl, deepResult])

  useEffect(() => {
    if (!uploadModalOpen) return
    setUploadMsg('')
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setUploadModalOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [uploadModalOpen])
  
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
  
  function addPDF(file) {
    const title = file.name.replace(/\.pdf$/i, '')
    const item = { id: 'u_' + Math.random().toString(36).slice(2), title, filename: file.name, source: 'uploaded', selected: true, source_type: 'uploaded', content: '' }
    setUploaded(prev => [item, ...prev])
    setUploadMsg('已添加（未解析）：' + title)
    setMsg('已添加（未解析）：' + title)
  }

  async function parseMd(file) {
    try {
      const text = await file.text()
      const title = file.name.replace(/\.md$/i, '')
      const item = { id: 'u_' + Math.random().toString(36).slice(2), title, filename: file.name, source: 'uploaded', selected: true, source_type: 'uploaded', content: text }
      setUploaded(prev => [item, ...prev])
      setUploadMsg('已导入：' + title)
      setMsg('已导入：' + title)
    } catch (e) {
      setUploadMsg('文献导入失败：' + e.message)
      setMsg('文献导入失败：' + e.message)
    }
  }
  
  async function onUpload(e) {
    const files = Array.from(e.target.files || [])
    if (files.length < 1) return
    setUploadParsing(true)
    try {
      for (const f of files) {
        const ext = String(f.name || '').toLowerCase().split('.').pop()
        setUploadMsg('处理中：' + f.name)
        if (ext === 'md') await parseMd(f)
        else addPDF(f)
      }
    } finally {
      setUploadParsing(false)
    }
    try { e.target.value = '' } catch {}
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
    // Deprecated
    return null
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
      const p = `${tpl}\n\n研究方向：${name}\n文献网站：${siteInfo.join(', ')}\n基础文献集（>=10）：${JSON.stringify(basePapers)}`
      
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
        if (Array.isArray(parsed)) {
            items = parsed
        } else if (typeof parsed === 'object' && parsed !== null) {
            // 尝试查找对象中是否包含数组字段 (如 { "papers": [...] })
            const arrayProp = Object.values(parsed).find(v => Array.isArray(v))
            if (arrayProp) {
                items = arrayProp
            } else {
                // 如果对象本身不是数组且没有数组属性，但可能就是单个文献对象
                // 此时将其包装为数组
                if (parsed.title || parsed.Title) {
                    items = [parsed]
                }
            }
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
      
      const reviewTpl = reviewPromptTpl && reviewPromptTpl.trim().length > 0 ? reviewPromptTpl.trim() : DEFAULT_REVIEW_PROMPT
      const reviewP = `${reviewTpl}\n\n研究方向：${name}\n基础文献：${JSON.stringify(baseForReview)}\n扩展文献：${JSON.stringify(expandedForReview)}`
      
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
      await api('/directions/' + d.id, { method: 'PUT', body: { status: '已生成综述', review_md: finalMd } })
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
      await api('/directions/' + d.id, { method: 'PUT', body: { status: '已生成综述', review_md: finalMd } })
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
    // Deprecated
    return null
  }

  function downloadMd() {
    if (!reviewMd) return
    const blob = new Blob([reviewMd], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${name}-综述.md`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  
  async function downloadPdf() {
    if (!reviewMd) return
    
    // 使用原生浏览器打印功能 (Save as PDF) 以确保最佳渲染效果
    const htmlContent = marked.parse(reviewMd)
    
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    
    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${name} - 文献综述</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.0/github-markdown-light.min.css">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"; }
          .markdown-body { 
            box-sizing: border-box; 
            min-width: 200px; 
            max-width: 980px; 
            margin: 0 auto; 
            padding: 45px; 
          }
          @media print {
            .markdown-body { padding: 0; max-width: none; }
            @page { margin: 2cm; size: A4; }
          }
        </style>
      </head>
      <body class="markdown-body">
        <h1 style="text-align: center; border-bottom: none; margin-bottom: 40px;">${name} - 文献综述</h1>
        ${htmlContent}
      </body>
      </html>
    `)
    doc.close()
    
    setMsg('正在调用浏览器打印...')
    
    // 等待资源加载
    setTimeout(() => {
      try {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
        setMsg('请在打印窗口中选择"另存为 PDF"')
      } catch (e) {
        setMsg('打印调用失败: ' + e.message)
      } finally {
        // 打印对话框关闭后移除 iframe (部分浏览器会阻塞，部分不会，延迟移除较安全)
        setTimeout(() => document.body.removeChild(iframe), 2000)
      }
    }, 1000)
  }

  function onDeepUpload(e) {
    const files = Array.from(e.target.files || [])
    const added = files.map(file => ({
      id: 'd_' + Math.random().toString(36).slice(2),
      title: file.name.replace(/\.pdf$/i, ''),
      filename: file.name,
      size: file.size,
      type: file.type || 'application/pdf',
      file
    }))
    if (added.length > 0) setDeepFiles(prev => [...added, ...prev])
  }

  function removeDeepFile(id) {
    setDeepFiles(prev => prev.filter(x => x.id !== id))
  }
  
  function downloadDeepMd() {
    if (!deepResult) return
    const blob = new Blob([deepResult], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${name}-深度研究报告.md`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  
  async function startDeepResearch() {
    if (!deepApiName) { setMsg('选择 API'); return }
    if (!deepTendency) { setMsg('请输入研究倾向'); return }
    if (deepFiles.length < 1) { setMsg('请上传 PDF'); return }

    setDeepRunning(true)
    const requestId = genReqId()
    try {
        const baseMeta = combinedList().filter(x => x.selected).map(x => ({
          title: x.title || '',
          author: x.author || '',
          source: x.source || '',
          year: x.year || '',
          doi: x.doi || ''
        }))
        const fileList = deepFiles.map((f, i) => {
          const sz = typeof f.size === 'number' ? `${Math.round(f.size / 1024)}KB` : ''
          return `${i + 1}. ${f.filename || f.title}${sz ? ` (${sz})` : ''}`
        }).join('\n')
        const tpl = deepPromptTpl || DEFAULT_DEEP_PROMPT
        const prompt = `${tpl}\n\nUser Research Tendency:\n${deepTendency}\n\nBase Literature Metadata:\n${JSON.stringify(baseMeta)}\n\nAttached Files:\n${fileList}`
        
        appendLog({ id: requestId, step: 'deep_research_start', apiName: deepApiName, promptLength: prompt.length })
        
        const fd = new FormData()
        fd.append('prompt', prompt)
        for (const f of deepFiles) {
          if (f && f.file) fd.append('files', f.file, f.filename || f.file.name)
        }

        const r = await api(`/config/ai/${encodeURIComponent(deepApiName)}/prompt-files?debug=1&requestId=${encodeURIComponent(requestId)}`, { 
            method: 'POST', 
            body: fd, 
            timeoutMs: 600000 
        })
        
        let answer = r && r.answer ? String(r.answer) : ''
        
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
        
        setDeepResult(finalMd)
        setMsg('深度研究报告生成完毕')
    } catch (e) {
        setMsg('深度研究失败：' + e.message)
        appendLog({ id: requestId, step: 'deep_research_fail', error: e.message })
    } finally {
        setDeepRunning(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(combinedList().length / pageSize))
  return h('div', { style: { maxWidth: 1200, margin: '0 auto', padding: '0 20px', width: '100%' } },
    h('div', { className: 'card' },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        h('h2', { style: { margin: 0 } }, '研究方向'),
        h('button', { onClick: () => onExit && onExit() }, '返回')
      ),
      h('div', null, `名称：${name}`),
      h('div', null, `创建时间：${d.created_at ? formatDate(d.created_at) : '未知'}`),
      h('div', null, `描述：${d.description || ''}`),
      proj ? h('div', null, `所属项目：${proj.name}`) : null,
      h('div', null, `状态：${status}`),
    ),
    h('div', { className: 'card' },
      h('h3', null, '第一步：文献收集'),
      h('div', { className: 'row' },
        h('button', { 
            onClick: () => setUploadModalOpen(true),
            style: { border: '1px solid #ccc', borderRadius: '6px', background: '#fff', color: '#666', height: '38px', cursor: 'pointer', fontSize: '14px' } 
        }, `上传/管理文献 (${uploaded.length})`),
        h('input', { placeholder: '关键词', value: keywords, onChange: e => setKeywords(e.target.value), style: { textAlign: 'center' } }),
        h('div', { style: { display: 'flex', flexDirection: 'column' } },
          h('select', { value: searchApiName, onChange: e => setSearchApiName(e.target.value), title: '选择搜索用的AI-API' },
            ...apis.map(a => h('option', { key: a.api_name, value: a.api_name }, a.api_name))
          ),
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
          rows: 10, 
          style: { width: '100%', fontSize: '14pt', borderColor: !searchPromptTpl ? '#faad14' : '#d9d9d9' } 
        }),
        !searchPromptTpl ? h('div', { style: { color: '#faad14', fontSize: '0.85em', marginTop: 4 } }, '⚠ 提示：输入框为空，建议恢复默认 Prompt 以获得最佳效果') : null
      ),
      h('div', { className: 'muted', style: { marginTop: 6 } }, '当前步骤：收集文献；下一步：选择与锚定')
    ),
    h('div', { className: 'card' },
      h('h3', null, '第二步：研究锚定'),
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        h('h4', null, '文献选择'),
        h('button', { className: 'secondary btn-small', onClick: () => setListExpanded(!listExpanded) }, listExpanded ? '折叠列表' : '展开列表')
      ),
      h('div', { className: 'muted', style: { margin: '6px 0' } }, `已选基础文献（需>=10）：${selectedCount()}`),
      listExpanded ? pageItems().map(it => h('div', { key: it.id, className: 'row', style: { display: 'flex', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid #f0f0f0' } },
        
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
      )) : null,
      listExpanded ? h('div', { className: 'row', style: { marginTop: 8 } },
        h('button', { onClick: () => setPage(p => Math.max(1, p - 1)) }, '上一页'),
        h('div', { className: 'muted', style: { fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, `${page}/${totalPages}`),
        h('button', { onClick: () => setPage(p => Math.min(totalPages, p + 1)) }, '下一页')
      ) : null,
      h('div', { style: { marginTop: 20, borderTop: '1px solid #eee', paddingTop: 12 } },
        h('h4', { style: { margin: '0 0 12px 0' } }, '锚定设置'),
        
        // Step 1
        h('div', { style: { border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, marginBottom: 12, background: '#f9fafb' } },
          h('div', { style: { fontWeight: 'bold', marginBottom: 8, color: '#374151' } }, '文献扩展搜索配置'),
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
          h('div', { style: { fontWeight: 'bold', marginBottom: 8, color: '#374151' } }, '综述生成配置'),
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
            h('textarea', { value: reviewPromptTpl, onChange: e => setReviewPromptTpl(e.target.value), rows: 10, style: { width: '100%', fontSize: '14pt', borderColor: !reviewPromptTpl ? '#faad14' : '#d9d9d9' } })
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
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
        h('h3', { style: { margin: 0 } }, '综述预览'),
        h('div', { style: { display: 'flex', gap: 8 } },
          h('button', { className: 'secondary btn-small', onClick: downloadMd }, '下载MD'),
          h('button', { className: 'secondary btn-small', onClick: downloadPdf }, '下载PDF'),
          h('button', { 
            className: 'secondary btn-small',
            onClick: () => setReviewExpanded(!reviewExpanded)
          }, reviewExpanded ? '折叠' : '展开')
        )
      ),
      reviewExpanded ? h('div', null,
        h('div', { className: 'markdown-body', style: { maxHeight: 600, overflow: 'auto', border: '1px solid #eee', padding: 24, borderRadius: 8, background: '#fff' } },
          h(ReactMarkdown, { remarkPlugins: [remarkGfm] }, reviewMd)
        )
      ) : null
    ) : null,

    // Step 3: Deep Research
    h('div', { className: 'card', style: { marginTop: 12 } },
      h('h3', null, '第三步：深度研究'),
      h('div', { className: 'muted', style: { marginBottom: 12 } }, '基于此处上传的文献，结合研究倾向，开展深度研究。'),
      
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
        
        // 1. File Upload
        h('div', { style: { border: '1px solid #eee', padding: 12, borderRadius: 8, background: '#fafafa' } },
          h('div', { style: { fontWeight: 'bold', marginBottom: 8 } }, '文献上传'),
          h('input', { type: 'file', multiple: true, accept: '.pdf', onChange: onDeepUpload, style: { marginBottom: 8 } }),
          
          deepFiles.length > 0 ? h('div', { style: { maxHeight: 200, overflow: 'auto' } },
            deepFiles.map(f => h('div', { key: f.id, style: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9em' } },
              h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 } }, f.title),
              h('button', { 
                onClick: () => removeDeepFile(f.id),
                style: { border: 'none', background: 'transparent', color: '#ff4d4f', cursor: 'pointer', fontWeight: 'bold' }
              }, '删除')
            ))
          ) : h('div', { className: 'muted' }, '暂无文献，请上传 PDF')
        ),

        // 2. Tendency Input
        h('div', null,
            h('div', { style: { fontWeight: 'bold', marginBottom: 4 } }, '研究倾向'),
            h('textarea', { 
                placeholder: '请输入具体的研究倾向，例如：\n- 建立关于...的理论模型\n- 设计...的模拟实验\n- 生成...的核心算法代码', 
                value: deepTendency, 
                onChange: e => setDeepTendency(e.target.value), 
                rows: 15, 
                style: { width: '100%', fontSize: '14pt', borderColor: !deepTendency ? '#faad14' : '#d9d9d9' } 
            })
        ),

        // 3. API & Prompt
        h('div', { style: { display: 'flex', gap: 12, flexWrap: 'wrap' } },
            h('div', { style: { flex: 1, minWidth: 200 } },
                h('div', { style: { fontWeight: 'bold', marginBottom: 4 } }, '选择 API'),
                h('select', { value: deepApiName, onChange: e => setDeepApiName(e.target.value), style: { width: '100%' } },
                    ...apis.map(a => h('option', { key: a.api_name, value: a.api_name }, a.api_name))
                )
            ),
            h('div', { style: { flex: 2, minWidth: 300 } },
                h('div', { style: { fontWeight: 'bold', marginBottom: 4, display: 'flex', justifyContent: 'space-between' } }, 
                    h('span', null, 'Prompt 模板'),
                    h('button', { className: 'secondary btn-small', onClick: () => setDeepPromptTpl(DEFAULT_DEEP_PROMPT) }, '恢复默认')
                ),
                h('textarea', { 
                    value: deepPromptTpl, 
                    onChange: e => setDeepPromptTpl(e.target.value), 
                    rows: 10, 
                    style: { width: '100%', fontSize: '14pt' } 
                })
            )
        ),

        // 4. Action
        h('div', null,
            h('button', { 
                disabled: deepRunning || !deepApiName || !deepTendency || deepFiles.length === 0, 
                onClick: startDeepResearch,
                style: { width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', background: deepRunning ? '#ccc' : '#111827', color: '#fff', border: '1px solid #111827', cursor: deepRunning ? 'not-allowed' : 'pointer' } 
            }, deepRunning ? '正在进行深度研究...' : '开始深度研究')
        )
      ),

      // Result Display
      deepResult ? h('div', { style: { marginTop: 20, borderTop: '1px solid #eee', paddingTop: 12 } },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
            h('h4', { style: { margin: 0 } }, '深度研究报告'),
            h('div', { style: { display: 'flex', gap: 8 } },
                h('button', { className: 'secondary btn-small', onClick: downloadDeepMd }, '下载报告'),
                h('button', { className: 'secondary btn-small', onClick: () => setDeepExpanded(!deepExpanded) }, deepExpanded ? '折叠' : '展开')
            )
        ),
        deepExpanded ? h('div', { className: 'markdown-body', style: { maxHeight: 600, overflow: 'auto', border: '1px solid #eee', padding: 24, borderRadius: 8, background: '#fff' } },
            h(ReactMarkdown, { remarkPlugins: [remarkGfm] }, deepResult)
        ) : null
      ) : null
    ),
    
    msg ? h('div', { className: 'muted', style: { marginTop: 8 } }, msg) : null,

    uploadModalOpen ? h('div', { onClick: () => setUploadModalOpen(false), style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      h('div', { onClick: e => e.stopPropagation(), style: { background: '#fff', padding: 24, borderRadius: 8, width: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' } },
        h('h3', { style: { marginTop: 0, marginBottom: 16 } }, '上传文献'),
        
        h('div', { style: { flex: 1, overflowY: 'auto', border: '1px solid #eee', borderRadius: 4, padding: 12, marginBottom: 20, minHeight: 200 } },
          uploaded.length > 0 ? uploaded.map(f => h('div', { key: f.id, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5' } },
            h('div', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 12, flex: 1 } },
                h('span', { style: { fontWeight: 'bold' } }, f.title || '无标题'),
                h('div', { className: 'muted', style: { fontSize: '0.85em' } }, f.filename || '')
            ),
            h('button', { 
                onClick: () => removeItem(f), 
                style: { color: '#ff4d4f', background: 'none', border: '1px solid #ffccc7', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '12px' } 
            }, '删除')
          )) : h('div', { className: 'muted', style: { textAlign: 'center', padding: 40 } }, '暂无上传文献')
        ),
        
        h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 12 } },
          h('div', { 
            style: { position: 'relative' },
            onMouseEnter: () => setUploadPickerHover(true),
            onMouseLeave: () => { setUploadPickerHover(false); setUploadPickerActive(false) },
            onMouseDown: () => setUploadPickerActive(true),
            onMouseUp: () => setUploadPickerActive(false)
          },
            h('button', { disabled: uploadParsing, style: { background: uploadParsing ? '#9ca3af' : uploadPickerActive ? '#1f2937' : uploadPickerHover ? '#374151' : '#111827', transform: uploadParsing ? 'none' : uploadPickerActive ? 'scale(0.98)' : 'none', transition: 'background-color 0.2s, transform 0.1s', cursor: uploadParsing ? 'not-allowed' : 'pointer' } }, uploadParsing ? '处理中...' : '上传'),
            h('input', { 
              type: 'file', 
              multiple: true, 
              accept: 'application/pdf,.pdf,text/markdown,.md', 
              onChange: onUpload, 
              disabled: uploadParsing,
              title: ' ',
              style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: uploadParsing ? 'not-allowed' : 'pointer' } 
            })
          ),
          h('button', { onClick: () => setUploadModalOpen(false) }, '确认')
        ),
        uploadMsg ? h('div', { className: 'muted', style: { marginTop: 10 } }, uploadMsg) : null
      )
    ) : null
  )
}
