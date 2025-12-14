import React, { useEffect, useState } from 'https://esm.sh/react@18?dev'
import { api } from '../apiClient.js'
const h = React.createElement

export default function Config() {
  const [type, setType] = useState('cloud')
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [modelPath, setModelPath] = useState('')
  const [paramsJson, setParamsJson] = useState('')
  const [result, setResult] = useState('')

  useEffect(() => {
    (async () => {
      const cfg = await api('/config/ai').catch(() => null)
      if (cfg) {
        setType(cfg.type)
        setModelPath(cfg.model_path || '')
        setParamsJson(cfg.params_json || '')
      }
    })()
  }, [])

  async function save() {
    await api('/config/ai', { method: 'POST', body: { type, url, apiKey, modelPath, paramsJson } })
  }
  async function test() {
    const r = await api('/config/ai/test', { method: 'POST' }).catch(e=>({ status:'error', message:String(e) }))
    setResult(JSON.stringify(r))
  }

  return h('div', { className: 'card' },
    h('div', { className: 'row' },
      h('select', { value: type, onChange: e=>setType(e.target.value) },
        h('option', { value: 'cloud' }, '云端API'),
        h('option', { value: 'local' }, '本地模型')
      ),
      ...(type === 'cloud'
        ? [
            h('input', { placeholder: 'API URL', value: url, onChange: e => setUrl(e.target.value) }),
            h('input', { placeholder: 'API Key', value: apiKey, onChange: e => setApiKey(e.target.value) })
          ]
        : [
            h('input', { placeholder: '模型路径', value: modelPath, onChange: e => setModelPath(e.target.value) }),
            h('input', { placeholder: '参数JSON', value: paramsJson, onChange: e => setParamsJson(e.target.value) })
          ]
      ),
      h('button', { onClick: save }, '保存'),
      h('button', { onClick: test }, '测试')
    ),
    result ? h('div', { className: 'muted', style: { marginTop: 8 } }, result) : null
  )
}
