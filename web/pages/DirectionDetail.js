import React, { useEffect, useState } from 'https://esm.sh/react@18'
import { api } from '../apiClient.js'
import { formatDate } from '../time.js'
const h = React.createElement

export default function DirectionDetail({ project, onExit }) {
  const [proj, setProj] = useState(null)
  const d = project.currentDirection || project
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
  return h('div', null,
    h('div', { className: 'card' },
      h('h2', null, '研究方向'),
      h('div', null, `名称：${name}`),
      h('div', null, `创建时间：${d.created_at ? formatDate(d.created_at) : '未知'}`),
      h('div', null, `描述：${d.description || ''}`),
      proj ? h('div', null, `所属项目：${proj.name}`) : null,
      h('div', null, h('button', { onClick: () => onExit && onExit() }, '退出研究方向')),
      h('div', { className: 'muted' }, '该页面为预留框架，等待后续迭代开发')
    )
  )
}
