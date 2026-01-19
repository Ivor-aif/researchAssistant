import React, { useEffect, useState, useRef } from 'https://esm.sh/react@18?dev'
import ReactMarkdown from 'https://esm.sh/react-markdown@9.0.1?deps=react@18&dev'
import remarkGfm from 'https://esm.sh/remark-gfm@4.0.0?deps=react@18&dev'
import remarkMath from 'https://esm.sh/remark-math@6.0.0?deps=remark-parse@11.0.0&dev'
import rehypeKatex from 'https://esm.sh/rehype-katex@7.0.0?deps=rehype-parse@9.0.0&dev'
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

const DEFAULT_DATA_PREDICT_PROMPT = `你是资深数据分析师。基于提供的深度研究报告，请预测相关的实验数据或结果。
请生成包含详细数据、图表描述（如建议使用折线图、柱状图等）的预期结果报告。
你需要：
1. 分析研究报告中的假设和理论。
2. 预测可能的实验数据（提供具体的模拟数据点）。
3. 以Markdown表格形式展示数据。
4. 描述数据趋势及其统计意义。
5. 若可能，请提供用于可视化的Python/Matlab代码片段（可选）。`

const DEFAULT_DATA_PROCESS_PROMPT = `你是资深数据分析师。基于提供的深度研究报告和用户上传的原始数据文件，请进行数据处理和分析。
请生成包含图表描述、统计分析的最终结果报告。
你需要：
1. 读取并理解上传的数据文件内容（CSV/TXT/MD）。
2. 结合研究报告的背景进行分析。
3. 生成清洗后的数据表（Markdown格式）。
4. 进行统计检验或趋势分析。
5. 得出基于数据的结论。`

const DEFAULT_CONCLUSION_PROMPT = `你是资深学术专家。请基于前序研究步骤（综述、深度研究、数据分析）完成最后的“结论与讨论”部分。

**任务流程**：
1. **图表来源确认**：
  - 若用户提供了图表/文件，请直接基于这些材料进行分析。
  - 若未提供（预期模式），你需要先结合前序报告，逻辑推演并生成一系列维度多样、美观丰富、符合学术规范的“预期结果图表”（以Markdown表格、Mermaid图或详细文字描述呈现）。

2. **结果分析**：
  - 对图表结果进行深入解读，阐述其统计意义或理论价值。

3. **结论 (Conclusion)**：
  - 总结全文核心发现，回答研究问题。

4. **讨论 (Discussion)**：
  - 将结果与前人研究对比。
  - 探讨研究局限性。
  - 提出未来展望。

**要求**：
- 逻辑严密，论证充分。
- 语言学术化，引用规范。
- 输出为完整的Markdown报告。`

const DEFAULT_PAPER_PROMPT = `你是资深学术论文写作者。请基于前序所有研究报告（综述、深度研究、数据分析、结论）撰写一篇完整的学术论文。

**输入信息**：
1. **作者信息**：
  - 第一作者/通讯作者：{{userAuthorName}} (Email: {{userAuthorEmail}})
  - 第二作者：{{aiAuthorName}} (AI)
2. **致谢 (Acknowledgements)**：
  - {{acknowledgements}}
  - (请务必将 AI 作者 {{aiAuthorName}} 也加入致谢中)
3. **研究内容**：
  - 综述 (Review)
  - 深度研究 (Deep Research)
  - 数据分析 (Data Analysis)
  - 结论与讨论 (Conclusion)

**写作要求**：
1. **格式**：严格遵循标准学术论文格式（Title, Abstract, Introduction, Methods, Results, Discussion, Conclusion, References, Acknowledgements）。
2. **篇幅**：
  - 正文 (Body) 应详实、完整，不要过度精简。请尽可能详细地描述方法、推导过程和讨论分析。
  - 仅当内容极度冗长时（例如原始数据表或超长代码），才将其移至补充材料 (Supplementary Materials)。
3. **风格**：与当前研究方向的学术风格一致，语言专业、严谨。
4. **输出格式**：
  - 请务必严格遵守以下自定义分隔符格式返回内容，不要使用 JSON：
  
[PAPER_BODY_START]
(在此处填写论文正文的 Markdown 内容)
[PAPER_BODY_END]

[SUPPLEMENTARY_START]
(在此处填写补充材料的 Markdown 内容，如果没有则留空)
[SUPPLEMENTARY_END]

  - 即使没有补充材料，也必须保留 [SUPPLEMENTARY_START] 和 [SUPPLEMENTARY_END] 标记。`


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

  // Data Analysis State
  const [dataFiles, setDataFiles] = useState([])
  const [dataApiName, setDataApiName] = useState('')
  const [dataPromptTpl, setDataPromptTpl] = useState(DEFAULT_DATA_PREDICT_PROMPT)
  const [dataResult, setDataResult] = useState('')
  const [dataRunning, setDataRunning] = useState(false)
  const [dataExpanded, setDataExpanded] = useState(true)
  const [dataMode, setDataMode] = useState('prediction') // 'prediction' | 'processing'
  const [dataUploadHover, setDataUploadHover] = useState(false)
  const [dataUploadActive, setDataUploadActive] = useState(false)
  const dataInputRef = useRef(null)

  // Conclusion & Discussion State
  const [conclusionFiles, setConclusionFiles] = useState([])
  const [conclusionApiName, setConclusionApiName] = useState('')
  const [conclusionPromptTpl, setConclusionPromptTpl] = useState(DEFAULT_CONCLUSION_PROMPT)
  const [conclusionResult, setConclusionResult] = useState('')
  const [conclusionRunning, setConclusionRunning] = useState(false)
  const [conclusionExpanded, setConclusionExpanded] = useState(true)
  const [conclusionUploadHover, setConclusionUploadHover] = useState(false)
  const [conclusionUploadActive, setConclusionUploadActive] = useState(false)
  const conclusionInputRef = useRef(null)

  // Paper Writing State
  const [paperApiName, setPaperApiName] = useState('')
  const [paperPromptTpl, setPaperPromptTpl] = useState(DEFAULT_PAPER_PROMPT)
  const [paperResult, setPaperResult] = useState('')
  const [supplementaryResult, setSupplementaryResult] = useState('')
  const [paperExtraReq, setPaperExtraReq] = useState('')
  const [acknowledgements, setAcknowledgements] = useState([])
  const [paperRunning, setPaperRunning] = useState(false)
  const [paperExpanded, setPaperExpanded] = useState(true)
  const [supplementaryExpanded, setSupplementaryExpanded] = useState(false)
  const [userAuthorName, setUserAuthorName] = useState('')
  const [userAuthorEmail, setUserAuthorEmail] = useState('')
  
  // Acknowledgement Modal State
  const [ackModalOpen, setAckModalOpen] = useState(false)
  const [ackType, setAckType] = useState('person')
  const [ackForm, setAckForm] = useState({ name: '', help: '', fundNo: '', fundInfo: '' })

  // Inject KaTeX CSS
  useEffect(() => {
    if (!document.getElementById('katex-css')) {
        const link = document.createElement('link')
        link.id = 'katex-css'
        link.rel = 'stylesheet'
        link.href = 'https://esm.sh/katex@0.16.9/dist/katex.min.css'
        document.head.appendChild(link)
    }
  }, [])

  // Load User Settings
  useEffect(() => {
    (async () => {
        try {
            const s = await api('/config/settings')
            if (s.author_name) setUserAuthorName(s.author_name)
            if (s.email) setUserAuthorEmail(s.email)
        } catch {}
    })()
  }, [])

  // Reload direction to get backend saved deepTendency/deepFiles/conclusionFiles
  useEffect(() => {
    (async () => {
        try {
            const list = await api(`/directions?projectId=${d.project_id}`)
            const fresh = list.find(x => x.id === d.id)
            if (fresh) {
                if (fresh.deep_tendency) setDeepTendency(fresh.deep_tendency)
                if (fresh.deep_files && fresh.deep_files.length > 0) setDeepFiles(fresh.deep_files)
                if (fresh.conclusion_files && fresh.conclusion_files.length > 0) setConclusionFiles(fresh.conclusion_files)
                if (fresh.paper_md) setPaperResult(fresh.paper_md)
        if (fresh.supplementary_md) setSupplementaryResult(fresh.supplementary_md)
        if (fresh.paper_extra_req) setPaperExtraReq(fresh.paper_extra_req)
        if (fresh.status) setStatus(fresh.status)
      }
    } catch {}
  })()
}, [d.id])

// Auto-save deepTendency
useEffect(() => {
  const t = setTimeout(() => {
    if (deepTendency) {
      api(`/directions/${d.id}`, { method: 'PUT', body: { deep_tendency: deepTendency } }).catch(() => {})
    }
  }, 1000)
  return () => clearTimeout(t)
}, [deepTendency])

// Auto-save Paper Data (Paper, Supplementary, ExtraReq)
useEffect(() => {
  const t = setTimeout(() => {
    if (paperResult || supplementaryResult || paperExtraReq) {
      api(`/directions/${d.id}`, { 
        method: 'PUT', 
        body: { 
          paper_md: paperResult, 
          supplementary_md: supplementaryResult,
          paper_extra_req: paperExtraReq
        } 
      }).catch(() => {})
    }
  }, 2000) // 2s debounce
  return () => clearTimeout(t)
}, [paperResult, supplementaryResult, paperExtraReq])

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
          setDeepApiName(prev => prev || a[0].api_name)
          setDataApiName(prev => prev || a[0].api_name)
          setConclusionApiName(prev => prev || a[0].api_name)
          setPaperApiName(prev => prev || a[0].api_name)
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
        if (saved.deepApiName) setDeepApiName(saved.deepApiName)

        if (saved.dataApiName) setDataApiName(saved.dataApiName)
        if (saved.dataPromptTpl) setDataPromptTpl(saved.dataPromptTpl)
        if (saved.dataResult) setDataResult(saved.dataResult)
        if (saved.dataFiles) setDataFiles(saved.dataFiles)

        if (saved.conclusionApiName) setConclusionApiName(saved.conclusionApiName)
        if (saved.conclusionPromptTpl) setConclusionPromptTpl(saved.conclusionPromptTpl)
        if (saved.conclusionResult) setConclusionResult(saved.conclusionResult)
        if (saved.conclusionFiles) setConclusionFiles(saved.conclusionFiles)

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

        if (saved.paperApiName) setPaperApiName(saved.paperApiName)
        if (saved.paperPromptTpl) setPaperPromptTpl(saved.paperPromptTpl)
        if (saved.paperResult) setPaperResult(saved.paperResult)
        if (saved.supplementaryResult) setSupplementaryResult(saved.supplementaryResult)
        if (saved.paperExtraReq) setPaperExtraReq(saved.paperExtraReq)
        if (saved.acknowledgements) setAcknowledgements(saved.acknowledgements)
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
      deepResult,
      deepFiles,
      dataApiName,
      dataPromptTpl,
      dataResult,
      dataFiles,
      conclusionApiName,
      conclusionPromptTpl,
      conclusionResult,
      conclusionFiles,
      paperApiName,
      paperPromptTpl,
      paperResult,
      supplementaryResult,
      paperExtraReq,
      acknowledgements
    }
    try { localStorage.setItem('dir_' + d.id, JSON.stringify(data)) } catch {}
  }, [searchApiName, reviewApiName, keywords, uploaded, results, siteSelected, manualSiteSelected, page, searchPromptTpl, reviewPromptTpl, reviewMd, deepTendency, deepApiName, deepPromptTpl, deepResult, deepFiles, dataApiName, dataPromptTpl, dataResult, dataFiles, conclusionApiName, conclusionPromptTpl, conclusionResult, conclusionFiles, paperApiName, paperPromptTpl, paperResult, supplementaryResult, paperExtraReq, acknowledgements])

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

  async function onDeepUpload(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    // Upload files immediately
    const uploadedFiles = []
    for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        try {
            const res = await api(`/directions/${d.id}/files`, { method: 'POST', body: fd })
            // res is { id, filename, path, size, type, created_at }
            // We can also attach the original 'file' object if we want to use it immediately without re-downloading
            // But better to stick to one source of truth. However, for startDeepResearch we need Blob.
            // Let's store the File object temporarily in a property that is not saved to backend (backend ignores extra props on upload anyway)
            // Actually, we just updated deepFiles from backend response which only has metadata.
            // We can attach .file = file to it for local usage.
            res.file = file
            uploadedFiles.push(res)
        } catch (err) {
            console.error('Upload failed', err)
            setMsg('文件上传失败: ' + file.name)
        }
    }

    if (uploadedFiles.length > 0) setDeepFiles(prev => [...prev, ...uploadedFiles])
    try { e.target.value = '' } catch {}
  }

  async function removeDeepFile(id) {
    if (!confirm('确定删除此文件吗？')) return
    try {
        await api(`/directions/${d.id}/files/${id}`, { method: 'DELETE' })
        setDeepFiles(prev => prev.filter(x => x.id !== id))
    } catch (e) {
        setMsg('删除失败')
    }
  }
  
  function downloadDeepMd() {
    if (!deepResult) return
    const blob = new Blob([deepResult], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${name}-深度研究报告.md`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  
  async function startDeepResearch() {
    if (!reviewMd) { setMsg('请先生成综述（步骤2）'); return }
    if (!deepApiName) { setMsg('选择 API'); return }
    if (!deepTendency) { setMsg('请输入研究倾向'); return }
    if (deepFiles.length < 1) { setMsg('请先上传文献'); return }

    setDeepRunning(true)
    const requestId = genReqId()
    setStatus('已进入深度研究')
    api('/directions/' + d.id, { method: 'PUT', body: { status: '已进入深度研究' } }).catch(() => {})
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
        const prompt = `${tpl}\n\nReview Markdown:\n${reviewMd}\n\nUser Research Tendency:\n${deepTendency}\n\nBase Literature Metadata:\n${JSON.stringify(baseMeta)}\n\nAttached Files:\n${fileList}`
        
        appendLog({ id: requestId, step: 'deep_research_start', apiName: deepApiName, promptLength: prompt.length })
        
        const fd = new FormData()
        fd.append('prompt', prompt)
        
        const token = localStorage.getItem('jwt')
        const apiBase = (typeof window !== 'undefined' && (window.__API_BASE__ || `${window.location.origin}/api/v1`)) || 'http://localhost:4000/api/v1'

        for (const f of deepFiles) {
          if (f.file) {
            fd.append('files', f.file, f.filename || f.file.name)
          } else {
             // Fetch from backend
             try {
                 const res = await fetch(`${apiBase}/directions/${d.id}/files/${f.id}`, {
                     headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                 })
                 if (res.ok) {
                     const blob = await res.blob()
                     fd.append('files', blob, f.filename)
                 } else {
                     console.error('Failed to fetch file', f.filename)
                 }
             } catch(e) {
                 console.error('Fetch file error', e)
             }
          }
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

  // Data Analysis Handlers
  useEffect(() => {
    const mode = dataFiles.length > 0 ? 'processing' : 'prediction'
    setDataMode(mode)
    if (mode === 'processing') {
         if (dataPromptTpl === DEFAULT_DATA_PREDICT_PROMPT) setDataPromptTpl(DEFAULT_DATA_PROCESS_PROMPT)
    } else {
         if (dataPromptTpl === DEFAULT_DATA_PROCESS_PROMPT) setDataPromptTpl(DEFAULT_DATA_PREDICT_PROMPT)
    }
  }, [dataFiles.length])

  async function onDataUpload(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const newFiles = []
    for (const f of files) {
        newFiles.push({
            id: Math.random().toString(36).slice(2),
            name: f.name,
            file: f,
            size: f.size
        })
    }
    setDataFiles(prev => [...prev, ...newFiles])
    try { e.target.value = '' } catch {}
  }

  function removeDataFile(id) {
    setDataFiles(prev => prev.filter(x => x.id !== id))
  }
  
  function downloadDataMd() {
    if (!dataResult) return
    const blob = new Blob([dataResult], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${name}-数据分析报告.md`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function startDataAnalysis() {
    if (!deepResult) { setMsg('请先完成深度研究（步骤3）'); return }
    if (!dataApiName) { setMsg('请选择 API'); return }
    
    setDataRunning(true)
    const reqId = genReqId()
    
    try {
        const tpl = dataPromptTpl
        const prompt = `${tpl}\n\nDeep Research Report:\n${deepResult}\n\nUser Research Tendency:\n${deepTendency}`
        
        appendLog({ id: reqId, step: 'data_analysis_start', mode: dataMode, fileCount: dataFiles.length })
        
        const fd = new FormData()
        fd.append('prompt', prompt)
        
        for (const f of dataFiles) {
            fd.append('files', f.file, f.name)
        }
        
        const r = await api(`/config/ai/${encodeURIComponent(dataApiName)}/prompt-files?debug=1&requestId=${encodeURIComponent(reqId)}`, { 
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
        
        setDataResult(finalMd)
        setMsg('数据分析报告生成完毕')
    } catch (e) {
        setMsg('分析失败: ' + e.message)
        appendLog({ id: reqId, step: 'data_analysis_fail', error: e.message })
    } finally {
        setDataRunning(false)
    }
  }

  // Conclusion & Discussion Handlers
  async function onConclusionUpload(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    const uploadedFiles = []
    for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        try {
            const res = await api(`/directions/${d.id}/files?type=conclusion`, { method: 'POST', body: fd })
            res.file = file
            uploadedFiles.push(res)
        } catch (err) {
            console.error('Upload failed', err)
            setMsg('文件上传失败: ' + file.name)
        }
    }

    if (uploadedFiles.length > 0) setConclusionFiles(prev => [...prev, ...uploadedFiles])
    try { e.target.value = '' } catch {}
  }

  async function removeConclusionFile(id) {
    if (!confirm('确定删除此文件吗？')) return
    try {
        await api(`/directions/${d.id}/files/${id}?type=conclusion`, { method: 'DELETE' })
        setConclusionFiles(prev => prev.filter(x => x.id !== id))
    } catch (e) {
        setMsg('删除失败')
    }
  }
  
  function downloadConclusionMd() {
    if (!conclusionResult) return
    const blob = new Blob([conclusionResult], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${name}-结论与讨论.md`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function startConclusion() {
    // We allow running conclusion even if Data Analysis is skipped, but usually it follows.
    // However, the prompt says "Review, Deep Research Report, Analysis Result Report".
    // If Analysis Result Report is missing, we might want to warn or just proceed.
    // Let's assume Deep Research is mandatory.
    if (!deepResult) { setMsg('请先完成深度研究（步骤3）'); return }
    if (!conclusionApiName) { setMsg('请选择 API'); return }
    
    setConclusionRunning(true)
    const reqId = genReqId()
    
    try {
        const fileList = conclusionFiles.map((f, i) => {
          const sz = typeof f.size === 'number' ? `${Math.round(f.size / 1024)}KB` : ''
          return `${i + 1}. ${f.filename || f.title}${sz ? ` (${sz})` : ''}`
        }).join('\n')
        
        const tpl = conclusionPromptTpl || DEFAULT_CONCLUSION_PROMPT
        let context = `${tpl}\n\n`
        context += `## Review (综述)\n${reviewMd || '(未提供)'}\n\n`
        context += `## Deep Research Report (深度研究报告)\n${deepResult}\n\n`
        context += `## Data Analysis Report (数据分析报告)\n${dataResult || '(未提供)'}\n\n`
        
        if (conclusionFiles.length > 0) {
            context += `## User Provided Charts/Files (用户提供图表/文件)\n${fileList}\n\n`
            context += `(Mode: User Provided Files Analysis)`
        } else {
            context += `(Mode: Expected Results Generation & Analysis)`
        }
        
        const fd = new FormData()
        fd.append('prompt', context)
        
        const token = localStorage.getItem('jwt')
        const apiBase = (typeof window !== 'undefined' && (window.__API_BASE__ || `${window.location.origin}/api/v1`)) || 'http://localhost:4000/api/v1'

        for (const f of conclusionFiles) {
          if (f.file) {
            fd.append('files', f.file, f.filename || f.file.name)
          } else {
             // Fetch from backend
             try {
                 const res = await fetch(`${apiBase}/directions/${d.id}/files/${f.id}?type=conclusion`, {
                     headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                 })
                 if (res.ok) {
                     const blob = await res.blob()
                     fd.append('files', blob, f.filename)
                 }
             } catch(e) {}
          }
        }
        
        appendLog({ id: reqId, step: 'conclusion_start', apiName: conclusionApiName, fileCount: conclusionFiles.length })
        
        const r = await api(`/config/ai/${encodeURIComponent(conclusionApiName)}/prompt-files?debug=1&requestId=${encodeURIComponent(reqId)}`, { 
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
        
        setConclusionResult(finalMd)
        setMsg('结论与讨论生成完毕')
    } catch (e) {
        setMsg('生成失败: ' + e.message)
        appendLog({ id: reqId, step: 'conclusion_fail', error: e.message })
    } finally {
        setConclusionRunning(false)
    }
  }

  // Paper Writing Functions
  function confirmAck() {
    let text = ''
    if (ackType === 'person') {
        if (!ackForm.name) return setMsg('请输入人名')
        text = `感谢 ${ackForm.name} ${ackForm.help ? `提供的${ackForm.help}` : ''}。`
    } else {
        if (!ackForm.fundNo) return setMsg('请输入基金号')
        text = `本研究由 ${ackForm.fundInfo || '基金'} (基金号: ${ackForm.fundNo}) 支持。`
    }
    setAcknowledgements([...acknowledgements, text])
    setAckModalOpen(false)
  }

  function addAcknowledgement() {
    setAcknowledgements([...acknowledgements, ''])
  }
  function updateAcknowledgement(i, val) {
    const newAck = [...acknowledgements]
    newAck[i] = val
    setAcknowledgements(newAck)
  }
  function removeAcknowledgement(i) {
    const newAck = [...acknowledgements]
    newAck.splice(i, 1)
    setAcknowledgements(newAck)
  }

  async function downloadPdfContent(content, titleSuffix) {
    if (!content) return
    const htmlContent = marked.parse(content)
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
        <title>${name} - ${titleSuffix}</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.0/github-markdown-light.min.css">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
          .markdown-body { box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto; padding: 45px; }
          @media print { .markdown-body { padding: 0; max-width: none; } @page { margin: 2cm; size: A4; } }
        </style>
      </head>
      <body class="markdown-body">
        <h1 style="text-align: center; margin-bottom: 40px;">${name} - ${titleSuffix}</h1>
        ${htmlContent}
      </body>
      </html>
    `)
    doc.close()
    setMsg('正在调用浏览器打印...')
    setTimeout(() => {
      try {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
        setMsg('请在打印窗口中选择"另存为 PDF"')
      } catch (e) {
        setMsg('打印失败: ' + e.message)
      } finally {
        setTimeout(() => document.body.removeChild(iframe), 2000)
      }
    }, 1000)
  }

  function normalizeMarkdown(text) {
    if (!text) return ''
    // 1. Replace literal "\n" with newline
    let normalized = text.replace(/\\n/g, '\n')
    
    // 2. Fix \\t -> \t
    normalized = normalized.replace(/\\t/g, '\t')

    // 3. Convert \[ ... \] to $$ ... $$ and \( ... \) to $ ... $
    // We use lookbehind to ensure we don't match escaped brackets if any (though unlikely in this context)
    // Note: We use a try-catch block for regex in case of older browser environments, though modern ones support lookbehind.
    try {
        // Convert \[ \] to $$ $$
        // Match \[ that is not preceded by \ (to avoid matching \\[ which is line break)
        // Actually, \\[ is line break. \[ is display math.
        // In regex string: \\\[ matches \[
        // (?<!\\) ensures no preceding backslash.
        normalized = normalized.replace(/(?<!\\)\\\[/g, '$$$$')
        normalized = normalized.replace(/(?<!\\)\\\]/g, '$$$$')
        
        // Convert \( \) to $ $
        normalized = normalized.replace(/(?<!\\)\\\(/g, '$')
        normalized = normalized.replace(/(?<!\\)\\\)/g, '$')
    } catch (e) {
        // Fallback for environments without lookbehind support
        // Just replace blindly, might break \\[ in edge cases but better than no math.
        normalized = normalized.replace(/\\\[/g, '$$$$')
        normalized = normalized.replace(/\\\]/g, '$$$$')
        normalized = normalized.replace(/\\\(/g, '$')
        normalized = normalized.replace(/\\\)/g, '$')
    }

    // 4. Fix double escaped backslashes for common LaTeX commands
    // e.g. \\frac -> \frac, \\begin -> \begin
    // Match \\ followed by a letter.
    // Caution: \\ followed by space is newline, we don't touch that.
    normalized = normalized.replace(/\\\\([a-zA-Z])/g, '\\$1')

    return normalized
  }

  async function startPaperWriting() {
    if (!conclusionResult) { setMsg('请先完成结论与讨论（步骤3）'); return }
    if (!paperApiName) { setMsg('请选择 API'); return }
    
    setPaperRunning(true)
    setStatus('正在撰写论文')
    api('/directions/' + d.id, { method: 'PUT', body: { status: '正在撰写论文' } }).catch(() => {})
    const reqId = genReqId()
    
    try {
        const ackText = acknowledgements.map((a, i) => `${i+1}. ${a}`).join('\n')
        let prompt = paperPromptTpl || DEFAULT_PAPER_PROMPT
        prompt = prompt.replace('{{userAuthorName}}', userAuthorName || 'Author')
        prompt = prompt.replace('{{userAuthorEmail}}', userAuthorEmail || '')
        prompt = prompt.replace(/{{aiAuthorName}}/g, paperApiName)
        prompt = prompt.replace('{{acknowledgements}}', ackText || 'None')
        
        prompt += `\n\n## Review (综述)\n${reviewMd}\n\n`
        prompt += `## Deep Research (深度研究)\n${deepResult}\n\n`
        prompt += `## Data Analysis (数据分析)\n${dataResult || '(Skipped)'}\n\n`
        prompt += `## Conclusion (结论)\n${conclusionResult}\n`
        
        if (paperExtraReq) {
            prompt += `\n\n## Extra Requirements (额外需求)\n${paperExtraReq}\n`
        }

        appendLog({ id: reqId, step: 'paper_writing_start', apiName: paperApiName })
        
        let fullAnswer = ''
        let loopCount = 0
        const MAX_LOOPS = 5
        let currentPrompt = prompt
        
        while (loopCount < MAX_LOOPS) {
            if (loopCount > 0) {
                setMsg(`正在撰写论文 (Part ${loopCount + 1})...`)
            }

            const r = await api('/config/ai/prompt', { 
                method: 'POST', 
                body: { apiName: paperApiName, prompt: currentPrompt, debug: true, requestId: reqId + '_' + loopCount }, 
                timeoutMs: 1800000 // 30 mins
            })
            
            const partAnswer = r && r.answer ? String(r.answer) : ''
            fullAnswer += partAnswer
            
            // Check if finished
            // The prompt asks for [SUPPLEMENTARY_END] as the final marker.
            // If we find it, we are done.
            if (fullAnswer.includes('[SUPPLEMENTARY_END]')) {
                break
            }
            
            // If not finished, prepare next prompt
            loopCount++
            if (loopCount < MAX_LOOPS) {
                // Take the last 2000 chars as context to avoid huge prompt, but ensure continuity
                const context = fullAnswer.slice(-2000)
                currentPrompt = `You are a continuous writer. You were writing a paper but the output was cut off due to length limits.
The last part of your output was:
"""
...${context}
"""

Please continue writing exactly from where you stopped. 
Do NOT repeat the last sentence. 
Do NOT output [PAPER_BODY_START] again if you are already inside the body.
Just output the remaining content until the paper and supplementary materials are finished with [SUPPLEMENTARY_END].`
            }
        }
        
        const answer = fullAnswer
        
        let body = ''
        let supp = ''
        
        // Strategy 1: Delimiter Parsing (New Format)
        // Since we might have multiple parts, we just look for the delimiters in the full string.
        const bodyMatch = answer.match(/\[PAPER_BODY_START\]([\s\S]*?)\[PAPER_BODY_END\]/)
        if (bodyMatch) {
            body = bodyMatch[1].trim()
            const suppMatch = answer.match(/\[SUPPLEMENTARY_START\]([\s\S]*?)\[SUPPLEMENTARY_END\]/)
            if (suppMatch) supp = suppMatch[1].trim()
        } else {
            // Strategy 2: JSON Parsing (Legacy/Fallback)
            let parsed = null
            try {
                parsed = JSON.parse(answer)
            } catch (e) {
                const match = answer.match(/```json\s*([\s\S]*?)\s*```/) || answer.match(/```\s*([\s\S]*?)\s*```/)
                if (match) try { parsed = JSON.parse(match[1]) } catch {}
            }
            
            if (parsed && (parsed.body || parsed.supplementary)) {
                body = parsed.body || ''
                supp = parsed.supplementary || ''
            } else {
                // Strategy 3: Raw Content Fallback
                // If the content looks like it contains the JSON structure but parsing failed (e.g. user issue), try to rescue
                let content = answer
                
                // If it's wrapped in code blocks, strip them
                const m = content.match(/^```(?:json|markdown)?\s*([\s\S]*?)\s*```$/)
                if (m) content = m[1]
                
                // If the content is a JSON string literal (e.g. starts with " and contains escaped chars), unescape it
                if (content.trim().startsWith('"') && content.trim().endsWith('"')) {
                    try {
                        const unescaped = JSON.parse(content)
                        if (typeof unescaped === 'string') content = unescaped
                    } catch {}
                }
                
                // Final check: if it looks like a JSON object but we failed to parse it earlier, maybe it was double escaped?
                // Just use the content as is for now.
                body = content
            }
        }
        
        setPaperResult(normalizeMarkdown(body))
        setSupplementaryResult(normalizeMarkdown(supp))
        
        await api(`/directions/${d.id}`, { 
            method: 'PUT', 
            body: { paper_md: normalizeMarkdown(body), supplementary_md: normalizeMarkdown(supp), status: '论文撰写完成' } 
        })
        
        setStatus('论文撰写完成')
        setMsg('论文撰写完成')
    } catch (e) {
        setMsg('撰写失败: ' + e.message)
        appendLog({ id: reqId, step: 'paper_writing_fail', error: e.message })
    } finally {
        setPaperRunning(false)
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
          h(ReactMarkdown, { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeKatex] }, reviewMd)
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
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
            h('div', { style: { fontWeight: 'bold' } }, '文献上传'),
            h('div', { style: { position: 'relative', display: 'inline-block' } },
              h('button', { style: { padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#111827', color: '#fff', cursor: 'pointer' } }, '添加文献 (PDF/MD)'),
              h('input', { 
                type: 'file', 
                multiple: true, 
                accept: '.pdf,.md', 
                onChange: onDeepUpload, 
                title: '上传研究起始文献',
                style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' } 
              })
            )
          ),
          
          deepFiles.length > 0 ? h('div', { style: { maxHeight: 200, overflow: 'auto' } },
            deepFiles.map(f => h('div', { key: f.id, style: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9em' } },
              h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 } }, f.title || f.filename),
              h('button', { 
                onClick: () => removeDeepFile(f.id),
                style: { border: 'none', background: 'transparent', color: '#ff4d4f', cursor: 'pointer', fontWeight: 'bold', padding: '0 0px' }
              }, '删除')
            ))
          ) : h('div', { className: 'muted' }, '暂无文献，请上传 PDF/MD')
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
                disabled: deepRunning, 
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
            h(ReactMarkdown, { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeKatex] }, deepResult)
        ) : null
      ) : null,

      // Data Analysis Section (Appended to Deep Research)
      h('div', { style: { marginTop: 24, borderTop: '1px solid #eee', paddingTop: 16 } },
        h('h4', { style: { margin: '0 0 12px 0' } }, '数据处理/结果预测'),
        h('div', { className: 'muted', style: { marginBottom: 12 } }, '基于深度研究报告，进行数据预测或处理用户上传的数据。'),
        
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
          
          // 1. File Upload & Mode
          h('div', { style: { border: '1px solid #eee', padding: 12, borderRadius: 8, background: '#fafafa' } },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
              h('div', { style: { fontWeight: 'bold' } }, '数据文件 (CSV/TXT/MD)'),
              h('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
                  h('div', { 
                      style: { padding: '4px 8px', borderRadius: 4, background: dataMode === 'processing' ? '#e6f7ff' : '#fff7e6', color: dataMode === 'processing' ? '#1890ff' : '#fa8c16', border: `1px solid ${dataMode === 'processing' ? '#91d5ff' : '#ffd591'}`, fontSize: '0.9em' } 
                  }, dataMode === 'processing' ? '模式：数据处理' : '模式：预期结果'),
                  h('div', { 
                      style: { position: 'relative', display: 'inline-block' }
                  },
                      h('button', { 
                          onClick: () => dataInputRef.current && dataInputRef.current.click(),
                          onMouseEnter: () => setDataUploadHover(true),
                          onMouseLeave: () => { setDataUploadHover(false); setDataUploadActive(false) },
                          onMouseDown: () => setDataUploadActive(true),
                          onMouseUp: () => setDataUploadActive(false),
                          style: { 
                              padding: '6px 12px', 
                              border: '1px solid #d9d9d9', 
                              borderRadius: '4px', 
                              background: dataUploadActive ? '#1f2937' : dataUploadHover ? '#374151' : '#111827', 
                              color: '#fff', 
                              cursor: 'pointer',
                              transform: dataUploadActive ? 'scale(0.98)' : 'none',
                              transition: 'background-color 0.2s, transform 0.1s'
                          } 
                      }, '上传数据'),
                      h('input', { 
                          ref: dataInputRef,
                          type: 'file', 
                          multiple: true, 
                          accept: '.csv,.txt,.md', 
                          onChange: onDataUpload, 
                          title: '上传数据文件',
                          style: { display: 'none' } 
                      })
                  )
              )
            ),
            
            dataFiles.length > 0 ? h('div', { style: { maxHeight: 200, overflow: 'auto' } },
              dataFiles.map(f => h('div', { key: f.id, style: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9em' } },
                h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 } }, `${f.name} (${Math.round(f.size/1024)}KB)`),
                h('button', { 
                  onClick: () => removeDataFile(f.id),
                  style: { border: 'none', background: 'transparent', color: '#ff4d4f', cursor: 'pointer', fontWeight: 'bold' }
                }, '删除')
              ))
            ) : h('div', { className: 'muted' }, '未上传文件，将使用预期模式')
          ),

          // 2. API & Prompt
          h('div', { style: { display: 'flex', gap: 12, flexWrap: 'wrap' } },
              h('div', { style: { flex: 1, minWidth: 200 } },
                  h('div', { style: { fontWeight: 'bold', marginBottom: 4 } }, '选择 API'),
                  h('select', { value: dataApiName, onChange: e => setDataApiName(e.target.value), style: { width: '100%' } },
                      ...apis.map(a => h('option', { key: a.api_name, value: a.api_name }, a.api_name))
                  )
              ),
              h('div', { style: { flex: 2, minWidth: 300 } },
                  h('div', { style: { fontWeight: 'bold', marginBottom: 4, display: 'flex', justifyContent: 'space-between' } }, 
                      h('span', null, 'Prompt 模板'),
                      h('button', { className: 'secondary btn-small', onClick: () => setDataPromptTpl(dataMode === 'processing' ? DEFAULT_DATA_PROCESS_PROMPT : DEFAULT_DATA_PREDICT_PROMPT) }, '恢复默认')
                  ),
                  h('textarea', { 
                      value: dataPromptTpl, 
                      onChange: e => setDataPromptTpl(e.target.value), 
                      rows: 10, 
                      style: { width: '100%', fontSize: '14pt' } 
                  })
              )
          ),

          // 3. Action
          h('div', null,
              h('button', { 
                  disabled: dataRunning, 
                  onClick: startDataAnalysis,
                  style: { width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', background: dataRunning ? '#ccc' : '#111827', color: '#fff', border: '1px solid #111827', cursor: dataRunning ? 'not-allowed' : 'pointer' } 
              }, dataRunning ? '正在分析数据...' : '开始数据分析')
          )
        ),

        // Result Display
        dataResult ? h('div', { style: { marginTop: 20, borderTop: '1px solid #eee', paddingTop: 12 } },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
              h('h4', { style: { margin: 0 } }, '分析结果报告'),
              h('div', { style: { display: 'flex', gap: 8 } },
                  h('button', { className: 'secondary btn-small', onClick: downloadDataMd }, '下载报告'),
                  h('button', { className: 'secondary btn-small', onClick: () => setDataExpanded(!dataExpanded) }, dataExpanded ? '折叠' : '展开')
              )
          ),
          dataExpanded ? h('div', { className: 'markdown-body', style: { maxHeight: 600, overflow: 'auto', border: '1px solid #eee', padding: 24, borderRadius: 8, background: '#fff' } },
              h(ReactMarkdown, { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeKatex] }, dataResult)
          ) : null
        ) : null,

        // Conclusion Section (Appended to Deep Research)
        h('div', { style: { marginTop: 24, borderTop: '1px solid #eee', paddingTop: 16 } },
          h('h4', { style: { margin: '0 0 12px 0' } }, '结论与讨论'),
          h('div', { className: 'muted', style: { marginBottom: 12 } }, '基于前序所有步骤及可选的图表文件，生成最终结论与讨论。'),
          
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
            
            // 1. File Upload
            h('div', { style: { border: '1px solid #eee', padding: 12, borderRadius: 8, background: '#fafafa' } },
              h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
                h('div', { style: { fontWeight: 'bold' } }, '图表/文件上传 (可选)'),
                h('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
                    h('div', { 
                        style: { padding: '4px 8px', borderRadius: 4, background: conclusionFiles.length > 0 ? '#e6f7ff' : '#fff7e6', color: conclusionFiles.length > 0 ? '#1890ff' : '#fa8c16', border: `1px solid ${conclusionFiles.length > 0 ? '#91d5ff' : '#ffd591'}`, fontSize: '0.9em' } 
                    }, conclusionFiles.length > 0 ? '模式：用户图表分析' : '模式：预期结果生成'),
                    h('div', { 
                        style: { position: 'relative', display: 'inline-block' }
                    },
                        h('button', { 
                            onClick: () => conclusionInputRef.current && conclusionInputRef.current.click(),
                            onMouseEnter: () => setConclusionUploadHover(true),
                            onMouseLeave: () => { setConclusionUploadHover(false); setConclusionUploadActive(false) },
                            onMouseDown: () => setConclusionUploadActive(true),
                            onMouseUp: () => setConclusionUploadActive(false),
                            style: { 
                                padding: '6px 12px', 
                                border: '1px solid #d9d9d9', 
                                borderRadius: '4px', 
                                background: conclusionUploadActive ? '#1f2937' : conclusionUploadHover ? '#374151' : '#111827', 
                                color: '#fff', 
                                cursor: 'pointer',
                                transform: conclusionUploadActive ? 'scale(0.98)' : 'none',
                                transition: 'background-color 0.2s, transform 0.1s'
                            } 
                        }, '上传文件'),
                        h('input', { 
                            ref: conclusionInputRef,
                            type: 'file', 
                            multiple: true, 
                            accept: '.png,.jpg,.jpeg,.pdf,.md,.csv,.txt', 
                            onChange: onConclusionUpload, 
                            title: '上传图表或数据文件',
                            style: { display: 'none' } 
                        })
                    )
                )
              ),
              
              conclusionFiles.length > 0 ? h('div', { style: { maxHeight: 200, overflow: 'auto' } },
                conclusionFiles.map(f => h('div', { key: f.id, style: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9em' } },
                  h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 } }, `${f.filename || f.title} (${f.size ? Math.round(f.size/1024) : 0}KB)`),
                  h('button', { 
                    onClick: () => removeConclusionFile(f.id),
                    style: { border: 'none', background: 'transparent', color: '#ff4d4f', cursor: 'pointer', fontWeight: 'bold' }
                  }, '删除')
                ))
              ) : h('div', { className: 'muted' }, '未上传文件，将进入预期模式 (AI 生成图表)')
            ),

            // 2. API & Prompt
            h('div', { style: { display: 'flex', gap: 12, flexWrap: 'wrap' } },
                h('div', { style: { flex: 1, minWidth: 200 } },
                    h('div', { style: { fontWeight: 'bold', marginBottom: 4 } }, '选择 API'),
                    h('select', { value: conclusionApiName, onChange: e => setConclusionApiName(e.target.value), style: { width: '100%' } },
                        ...apis.map(a => h('option', { key: a.api_name, value: a.api_name }, a.api_name))
                    )
                ),
                h('div', { style: { flex: 2, minWidth: 300 } },
                    h('div', { style: { fontWeight: 'bold', marginBottom: 4, display: 'flex', justifyContent: 'space-between' } }, 
                        h('span', null, 'Prompt 模板'),
                        h('button', { className: 'secondary btn-small', onClick: () => setConclusionPromptTpl(DEFAULT_CONCLUSION_PROMPT) }, '恢复默认')
                    ),
                    h('textarea', { 
                        value: conclusionPromptTpl, 
                        onChange: e => setConclusionPromptTpl(e.target.value), 
                        rows: 10, 
                        style: { width: '100%', fontSize: '14pt' } 
                    })
                )
            ),

            // 3. Action
            h('div', null,
                h('button', { 
                    disabled: conclusionRunning, 
                    onClick: startConclusion,
                    style: { width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', background: conclusionRunning ? '#ccc' : '#111827', color: '#fff', border: '1px solid #111827', cursor: conclusionRunning ? 'not-allowed' : 'pointer' } 
                }, conclusionRunning ? '正在生成结论与讨论...' : '开始生成')
            )
          ),

          // Result Display
          conclusionResult ? h('div', { style: { marginTop: 20, borderTop: '1px solid #eee', paddingTop: 12 } },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
                h('h4', { style: { margin: 0 } }, '结论与讨论报告'),
                h('div', { style: { display: 'flex', gap: 8 } },
                    h('button', { className: 'secondary btn-small', onClick: downloadConclusionMd }, '下载报告'),
                    h('button', { className: 'secondary btn-small', onClick: () => setConclusionExpanded(!conclusionExpanded) }, conclusionExpanded ? '折叠' : '展开')
                )
            ),
            conclusionExpanded ? h('div', { className: 'markdown-body', style: { maxHeight: 600, overflow: 'auto', border: '1px solid #eee', padding: 24, borderRadius: 8, background: '#fff' } },
                h(ReactMarkdown, { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeKatex] }, conclusionResult)
            ) : null
          ) : null
        )
      )
    ),

    // Step 4: Paper Writing
    h('div', { className: 'card', style: { marginTop: 12 } },
      h('h3', null, '第四步：论文撰写'),
      h('div', { className: 'muted', style: { marginBottom: 12 } }, '基于前序所有报告，撰写完整学术论文。'),
      
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
        
        // 1. Author Info Display (Hidden per user request)
        /*
        h('div', { style: { border: '1px solid #eee', padding: 12, borderRadius: 8, background: '#fafafa' } },
            h('div', { style: { fontWeight: 'bold', marginBottom: 8 } }, '署名信息 (自动引用)'),
            h('div', { style: { fontSize: '0.9em' } }, `第一作者/通讯作者: ${userAuthorName || '(未设置，请在设置页配置)'}`),
            h('div', { style: { fontSize: '0.9em' } }, `第二作者: ${paperApiName || '(待选择)'} (AI)`)
        ),
        */

        // 2. Acknowledgements
        h('div', { style: { border: '1px solid #eee', padding: 12, borderRadius: 8, background: '#fafafa' } },
            h('div', { style: { fontWeight: 'bold', marginBottom: 8 } }, '致谢 (Acknowledgements)'),
            h('div', { className: 'muted', style: { fontSize: '0.85em', marginBottom: 8 } }, '请添加基金号、帮助过的人等信息 (AI作者将自动添加)'),
            ...acknowledgements.map((ack, i) => 
                h('div', { key: i, style: { display: 'flex', width: '100%', marginBottom: 8 } },
                    h('input', { 
                        value: ack, 
                        onChange: e => updateAcknowledgement(i, e.target.value), 
                        placeholder: '例如：This work was supported by...', 
                        style: { flex: 1, padding: 6 } 
                    }),
                    h('button', { onClick: () => removeAcknowledgement(i), style: { marginLeft: 8, color: '#ff4d4f' } }, '删除')
                )
            ),
            h('button', { onClick: () => { setAckModalOpen(true); setAckForm({ name: '', help: '', fundNo: '', fundInfo: '' }); setAckType('person'); }, className: 'secondary btn-small' }, '+ 添加条目')
        ),

        // 3. API & Prompt
        h('div', { style: { display: 'flex', gap: 12, flexWrap: 'wrap' } },
            h('div', { style: { flex: 1, minWidth: 200 } },
                h('div', { style: { fontWeight: 'bold', marginBottom: 4 } }, '选择 API'),
                h('select', { value: paperApiName, onChange: e => setPaperApiName(e.target.value), style: { width: '100%' } },
                    ...apis.map(a => h('option', { key: a.api_name, value: a.api_name }, a.api_name))
                )
            ),
            h('div', { style: { flex: 2, minWidth: 300 } },
                h('div', { style: { fontWeight: 'bold', marginBottom: 4, display: 'flex', justifyContent: 'space-between' } }, 
                    h('span', null, 'Prompt 模板'),
                    h('button', { className: 'secondary btn-small', onClick: () => setPaperPromptTpl(DEFAULT_PAPER_PROMPT) }, '恢复默认')
                ),
                h('textarea', { 
                    value: paperPromptTpl, 
                    onChange: e => setPaperPromptTpl(e.target.value), 
                    rows: 10, 
                    style: { width: '100%', fontSize: '14pt' } 
                })
            )
        ),

        // 3.5 Extra Requirements
        h('div', { style: { marginBottom: 12 } },
            h('div', { style: { fontWeight: 'bold', marginBottom: 4 } }, '额外需求 (Extra Requirements)'),
            h('textarea', {
                placeholder: '例如：请重点讨论... / 请生成 Letter 格式 / 请增加关于...的对比',
                value: paperExtraReq,
                onChange: e => setPaperExtraReq(e.target.value),
                rows: 3,
                style: { width: '100%', fontSize: '14px', padding: 8, borderColor: '#d9d9d9', borderRadius: 6 }
            })
        ),

        // 4. Action
        h('div', null,
            h('button', { 
                disabled: paperRunning, 
                onClick: startPaperWriting,
                style: { width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', background: paperRunning ? '#ccc' : '#111827', color: '#fff', border: '1px solid #111827', cursor: paperRunning ? 'not-allowed' : 'pointer' } 
            }, paperRunning ? '正在撰写论文...' : '开始撰写')
        )
      ),

      // Result Display
      paperResult ? h('div', { style: { marginTop: 20, borderTop: '1px solid #eee', paddingTop: 12 } },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
            h('h4', { style: { margin: 0 } }, '论文正文 (Paper Body)'),
            h('div', { style: { display: 'flex', gap: 8 } },
                h('button', { className: 'secondary btn-small', onClick: () => downloadPdfContent(paperResult, 'Paper_Body') }, '下载PDF'),
                h('button', { className: 'secondary btn-small', onClick: () => setPaperExpanded(!paperExpanded) }, paperExpanded ? '折叠' : '展开')
            )
        ),
        paperExpanded ? h('div', { className: 'markdown-body', style: { maxHeight: 'none', overflow: 'visible', border: '1px solid #eee', padding: 40, borderRadius: 8, background: '#fff', fontSize: '13px', lineHeight: '1.6' } },
            h(ReactMarkdown, { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeKatex] }, paperResult)
        ) : null
      ) : null,

      supplementaryResult ? h('div', { style: { marginTop: 20, borderTop: '1px solid #eee', paddingTop: 12 } },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
            h('h4', { style: { margin: 0 } }, '补充材料 (Supplementary Materials)'),
            h('div', { style: { display: 'flex', gap: 8 } },
                h('button', { className: 'secondary btn-small', onClick: () => downloadPdfContent(supplementaryResult, 'Supplementary') }, '下载PDF'),
                h('button', { className: 'secondary btn-small', onClick: () => setSupplementaryExpanded(!supplementaryExpanded) }, supplementaryExpanded ? '折叠' : '展开')
            )
        ),
        supplementaryExpanded ? h('div', { className: 'markdown-body', style: { maxHeight: 'none', overflow: 'visible', border: '1px solid #eee', padding: 40, borderRadius: 8, background: '#fff', fontSize: '13px', lineHeight: '1.6' } },
            h(ReactMarkdown, { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeKatex] }, supplementaryResult)
        ) : null
      ) : null
    ),
    
    msg ? h('div', { className: 'muted', style: { marginTop: 8 } }, msg) : null,

    ackModalOpen ? h('div', { onClick: () => setAckModalOpen(false), style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      h('div', { onClick: e => e.stopPropagation(), style: { background: '#fff', padding: 24, borderRadius: 8, width: 500, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' } },
        h('h3', { style: { marginTop: 0, marginBottom: 16 } }, '添加致谢/基金'),
        h('div', { style: { marginBottom: 16 } },
            h('label', { style: { marginRight: 16, cursor: 'pointer' } },
                h('input', { type: 'radio', name: 'ackType', checked: ackType === 'person', onChange: () => setAckType('person'), style: { marginRight: 4 } }),
                ' 人名'
            ),
            h('label', { style: { cursor: 'pointer' } },
                h('input', { type: 'radio', name: 'ackType', checked: ackType === 'fund', onChange: () => setAckType('fund'), style: { marginRight: 4 } }),
                ' 基金'
            )
        ),
        ackType === 'person' ? h('div', null,
            h('div', { style: { marginBottom: 8 } }, '人名:'),
            h('input', { style: { width: '100%', marginBottom: 12, padding: 8, boxSizing: 'border-box' }, value: ackForm.name, onChange: e => setAckForm({...ackForm, name: e.target.value}) }),
            h('div', { style: { marginBottom: 8 } }, '帮助信息:'),
            h('input', { style: { width: '100%', marginBottom: 12, padding: 8, boxSizing: 'border-box' }, value: ackForm.help, onChange: e => setAckForm({...ackForm, help: e.target.value}) })
        ) : h('div', null,
            h('div', { style: { marginBottom: 8 } }, '基金号:'),
            h('input', { style: { width: '100%', marginBottom: 12, padding: 8, boxSizing: 'border-box' }, value: ackForm.fundNo, onChange: e => setAckForm({...ackForm, fundNo: e.target.value}) }),
            h('div', { style: { marginBottom: 8 } }, '其他基金信息:'),
            h('input', { style: { width: '100%', marginBottom: 12, padding: 8, boxSizing: 'border-box' }, value: ackForm.fundInfo, onChange: e => setAckForm({...ackForm, fundInfo: e.target.value}) })
        ),
        h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 } },
            h('button', { onClick: () => setAckModalOpen(false) }, '取消'),
            h('button', { onClick: confirmAck, style: { background: '#111827', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' } }, '确认')
        )
      )
    ) : null,

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
