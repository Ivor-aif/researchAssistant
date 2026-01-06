import React, { useEffect, useState } from 'https://esm.sh/react@18?dev'
import { setTimezone } from '../time.js'
import { api } from '../apiClient.js'
const h = React.createElement


export default function Settings() {
  const [tz, setTz] = useState('Asia/Shanghai')
  const [authorName, setAuthorName] = useState('')
  const [affiliations, setAffiliations] = useState([])
  const [email, setEmail] = useState('')
  const [emailUrl, setEmailUrl] = useState('')
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [tempUrl, setTempUrl] = useState('')
  
  const [apis, setApis] = useState([])
  const [apiName, setApiName] = useState('')
  const [type, setType] = useState('cloud')
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [modelPath, setModelPath] = useState('')
  const [paramsJson, setParamsJson] = useState('')
  const [msg, setMsg] = useState('')
  const [sites, setSites] = useState([])
  const [siteName, setSiteName] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [siteAuth, setSiteAuth] = useState('')

  async function load() {
    try {
      const s = await api('/config/settings')
      setTz(s.timezone || 'Asia/Shanghai')
      setAuthorName(s.author_name || '')
      setAffiliations(s.affiliations || [])
      setEmail(s.email || '')
      setEmailUrl(s.email_url || '')
      const list = await api('/config/ai')
      setApis(list)
      const ss = await api('/config/sites')
      setSites(ss)
    } catch {}
  }
  useEffect(() => { load() }, [])

  async function saveSettings() {
    try { 
      await api('/config/settings', { 
        method: 'POST', 
        body: { 
          timezone: tz,
          author_name: authorName,
          affiliations,
          email,
          email_url: emailUrl
        } 
      })
      setTimezone(tz)
      setMsg('基础设置已保存') 
    } catch (e) { setMsg('保存失败') }
  }
  
  function addAffiliation() {
    setAffiliations([...affiliations, ''])
  }
  function updateAffiliation(i, val) {
    const newAff = [...affiliations]
    newAff[i] = val
    setAffiliations(newAff)
  }
  function removeAffiliation(i) {
    const newAff = [...affiliations]
    newAff.splice(i, 1)
    setAffiliations(newAff)
  }

  function openUrlModal() {
    setTempUrl(emailUrl)
    setShowUrlModal(true)
  }
  function saveUrlModal() {
    setEmailUrl(tempUrl)
    setShowUrlModal(false)
  }

  async function saveApi() {
    try {
      const payload = { apiName: (apiName || '').trim(), type }
      if (!payload.apiName) { setMsg('请填写API名称'); return }
      if (type === 'cloud') {
        const u = (url || '').trim()
        if (!u) { setMsg('云端API需填写URL'); return }
        payload.url = u
        const k = (apiKey || '').trim(); if (k) payload.apiKey = k
      } else {
        const mp = (modelPath || '').trim()
        if (!mp) { setMsg('本地模型需填写模型路径'); return }
        payload.modelPath = mp
        const pj = (paramsJson || '').trim(); if (pj) payload.paramsJson = pj
      }
      await api('/config/ai', { method: 'POST', body: payload })
      setMsg('API配置已保存')
      setApiName(''); setUrl(''); setApiKey(''); setModelPath(''); setParamsJson('');
      const list = await api('/config/ai'); setApis(list)
    } catch (e) { setMsg('API保存失败：' + e.message) }
  }
  async function testApi(name) {
    try { const r = await api('/config/ai/test', { method: 'POST', body: { apiName: name } }); setMsg(`测试 ${name}：${JSON.stringify(r)}`) } catch (e) { setMsg('测试失败：' + e.message) }
  }

  async function saveSite() {
    try {
      const name = (siteName || '').trim()
      const url = (siteUrl || '').trim()
      const auth = (siteAuth || '').trim()
      if (!name) { setMsg('请填写网站名称'); return }
      if (!url) { setMsg('请填写访问URL'); return }
      const payload = { siteName: name, url }
      if (auth) payload.auth = auth
      await api('/config/sites', { method: 'POST', body: payload })
      setMsg('文献网站已保存')
      setSiteName(''); setSiteUrl(''); setSiteAuth('')
      const ss = await api('/config/sites'); setSites(ss)
    } catch (e) { setMsg('网站保存失败：' + e.message) }
  }

  async function testSite(s) {
    try {
      const r = await api('/config/sites/test', { method: 'POST', body: { siteId: s.id } })
      setMsg(`测试 ${s.site_name}：${r.status}，响应时间 ${r.latency_ms}ms${r.message ? '，信息：' + r.message : ''}`)
    } catch (e) { setMsg('测试失败：' + e.message) }
  }

  const tzOptions = ['Asia/Shanghai','UTC','Asia/Tokyo','Asia/Seoul','Europe/London','America/New_York']

  return h('div', null,
    h('div', { className: 'card' },
      h('h3', null, '基础设置'),
      h('div', { style: { display: 'flex', flexDirection: 'column' } },
        h('label', { className: 'muted', style: { marginBottom: 4 } }, '时区'),
        h('select', { value: tz, onChange: e => setTz(e.target.value), style: { marginBottom: 16, padding: 4 } }, ...tzOptions.map(z => h('option', { key: z, value: z }, z))),

        h('div', { style: { borderTop: '1px solid #eee', margin: '0 0 16px 0' } }),
        h('h4', { style: { margin: '0 0 12px 0' } }, '署名信息'),

        h('label', { className: 'muted', style: { marginBottom: 4 } }, '作者姓名 (英文/拼音)'),
        h('input', { value: authorName, onChange: e => setAuthorName(e.target.value), placeholder: 'San Zhang', style: { marginBottom: 12, padding: 6 } }),

        h('label', { className: 'muted', style: { marginBottom: 4 } }, '单位 (Affiliations)'),
        ...affiliations.map((aff, i) => 
          h('div', { key: i, style: { display: 'flex', width: '100%', marginBottom: 8 } },
            h('input', { value: aff, onChange: e => updateAffiliation(i, e.target.value), placeholder: 'University of ...', style: { flex: 1, padding: 6 } }),
            h('button', { onClick: () => removeAffiliation(i), style: { marginLeft: 8 } }, '删除')
          )
        ),
        h('div', { style: { marginBottom: 12 } },
          h('button', { onClick: addAffiliation, className: 'muted' }, '+ 添加单位')
        ),

        h('label', { className: 'muted', style: { marginBottom: 4 } }, '邮箱'),
        h('div', { style: { display: 'flex', marginBottom: 16 } },
          h('input', { value: email, onChange: e => setEmail(e.target.value), placeholder: 'name@example.com', style: { flex: 1, padding: 6, marginRight: 8 } }),
          h('button', { onClick: openUrlModal, style: { marginRight: 8, padding: '0 12px', whiteSpace: 'nowrap' }, title: '设置邮箱访问地址' }, '设置地址'),
          h('button', { onClick: () => window.open(emailUrl, '_blank'), disabled: !emailUrl, style: { padding: '0 12px', whiteSpace: 'nowrap' }, title: '打开邮箱' }, '访问邮箱')
        ),

        h('button', { onClick: saveSettings }, '保存基础设置')
      )
    ),
    showUrlModal ? h('div', { style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 } },
      h('div', { className: 'card', style: { width: '400px', maxWidth: '90%', background: 'white', padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' } },
        h('h3', { style: { marginTop: 0 } }, '设置邮箱访问地址'),
        h('p', { className: 'muted' }, '请输入点击“访问邮箱”按钮时跳转的网址：'),
        h('input', { value: tempUrl, onChange: e => setTempUrl(e.target.value), placeholder: 'https://mail.google.com...', style: { width: '100%', padding: 8, marginBottom: 16, boxSizing: 'border-box' } }, ),
        h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8 } },
          h('button', { onClick: () => setShowUrlModal(false), style: { background: '#eee', color: '#333' } }, '取消'),
          h('button', { onClick: saveUrlModal }, '确定')
        )
      )
    ) : null,
    h('div', { className: 'card' },
      h('h3', null, 'API 配置'),
      h('div', { className: 'row' },
        h('input', { placeholder: 'API名称（唯一）', value: apiName, onChange: e => setApiName(e.target.value) }),
        h('select', { value: type, onChange: e => setType(e.target.value) },
          h('option', { value: 'cloud' }, '云端API'),
          h('option', { value: 'local' }, '本地模型')
        ),
        ...(type === 'cloud'
          ? [ h('input', { placeholder: 'API URL', value: url, onChange: e => setUrl(e.target.value) }),
              h('input', { placeholder: 'API Key', value: apiKey, onChange: e => setApiKey(e.target.value) }) ]
          : [ h('input', { placeholder: '模型路径', value: modelPath, onChange: e => setModelPath(e.target.value) }),
              h('input', { placeholder: '参数JSON', value: paramsJson, onChange: e => setParamsJson(e.target.value) }) ]
        ),
        h('button', { onClick: saveApi }, '保存API配置')
      ),
      h('div', { style: { marginTop: 8 } },
        h('div', { className: 'muted' }, '已保存的API：'),
        ...apis.map(a => h('div', { key: a.api_name, style: { display: 'flex', justifyContent: 'space-between', padding: '6px 0' } },
          h('div', null, `${a.api_name} (${a.type})`),
          h('div', null, h('button', { onClick: () => testApi(a.api_name) }, '测试'))
        ))
      )
    ),
    h('div', { className: 'card' },
      h('h3', null, '文献网站管理'),
      h('div', { className: 'row' },
        h('input', { placeholder: '网站名称（如 PubMed）', value: siteName, onChange: e => setSiteName(e.target.value) }),
        h('input', { placeholder: '访问 URL', value: siteUrl, onChange: e => setSiteUrl(e.target.value) }),
        h('input', { placeholder: '认证信息（可选）', value: siteAuth, onChange: e => setSiteAuth(e.target.value) }),
        h('button', { onClick: saveSite }, '添加/更新网站')
      ),
      h('div', { style: { marginTop: 8 } },
        h('div', { className: 'muted' }, '已保存的网站：'),
        ...sites.map(s => h('div', { key: s.id, style: { display: 'flex', justifyContent: 'space-between', padding: '6px 0' } },
          h('div', null, `${s.site_name} - ${s.url}`),
          h('div', null, h('button', { onClick: () => testSite(s) }, '测试访问'))
        ))
      )
    ),
    msg ? h('div', { className: 'muted', style: { marginTop: 8 } }, msg) : null
  )
}
