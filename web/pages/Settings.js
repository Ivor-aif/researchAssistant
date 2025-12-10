import React, { useEffect, useState } from 'https://esm.sh/react@18'
import { setTimezone } from '../time.js'
import { api } from '../apiClient.js'
const h = React.createElement


export default function Settings() {
  const [tz, setTz] = useState('Asia/Shanghai')
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
      const list = await api('/config/ai')
      setApis(list)
      const ss = await api('/config/sites')
      setSites(ss)
    } catch {}
  }
  useEffect(() => { load() }, [])

  async function saveSettings() {
    try { await api('/config/settings', { method: 'POST', body: { timezone: tz } }); setTimezone(tz); setMsg('设置已保存') } catch (e) { setMsg('保存失败') }
  }
  async function saveApi() {
    try {
      await api('/config/ai', { method: 'POST', body: { apiName, type, url, apiKey, modelPath, paramsJson } })
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
      await api('/config/sites', { method: 'POST', body: { siteName, url: siteUrl, auth: siteAuth } })
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
      h('h3', null, '时区设置'),
      h('div', { className: 'row' },
        h('select', { value: tz, onChange: e => setTz(e.target.value) }, ...tzOptions.map(z => h('option', { key: z, value: z }, z))),
        h('button', { onClick: saveSettings }, '保存时区')
      )
    ),
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
