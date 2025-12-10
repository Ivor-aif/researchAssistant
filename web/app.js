import React, { useEffect, useState } from 'https://esm.sh/react@18'
import { createRoot } from 'https://esm.sh/react-dom@18/client'
import Login from './pages/Login.js'
import Projects from './pages/Projects.js'
import Directions from './pages/Directions.js'
import Settings from './pages/Settings.js'
import DirectionDetail from './pages/DirectionDetail.js'
import { loadTimezone } from './time.js'
const h = React.createElement

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('Render error', error, info) }
  render() {
    if (this.state.error) {
      return h('div', { className: 'card' },
        h('h3', null, '页面渲染失败'),
        h('div', { className: 'muted' }, String(this.state.error && this.state.error.message || this.state.error))
      )
    }
    return this.props.children
  }
}

function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('jwt'))
  const [page, setPage] = useState('projects')
  const [project, setProject] = useState(null)
  const [direction, setDirection] = useState(null)

  useEffect(() => {
    const nav = document.getElementById('nav')
    if (!authed) { nav.innerHTML = '' ; return }
    nav.innerHTML = ''
    const links = [
      ['项目', () => { setPage('projects'); setProject(null) }],
      ['设置', () => setPage('settings')],
      ['退出', () => { localStorage.removeItem('jwt'); setAuthed(false) }]
    ]
    links.forEach(([text, fn]) => { const a=document.createElement('a'); a.href='#'; a.onclick=e=>{e.preventDefault(); fn()}; a.textContent=text; nav.appendChild(a) })
  }, [authed, page])

  useEffect(() => { if (authed) loadTimezone() }, [authed])

  useEffect(() => {
    function onOpen(e) { setDirection(e.detail); setPage('directionDetail') }
    window.addEventListener('openDirection', onOpen)
    return () => window.removeEventListener('openDirection', onOpen)
  }, [])

  let view = null
  if (!authed) {
    view = h(Login, { onAuthed: () => setAuthed(true) })
  } else if (page === 'settings') {
    view = h(Settings)
  } else if (page === 'directionDetail' && direction) {
    view = h(DirectionDetail, { project: direction, onExit: () => setPage('directions') })
  } else if (project) {
    view = h('div', null,
      h('div', { className: 'card', style: { display: 'flex', justifyContent: 'space-between' } },
        h('div', null, h('b', null, `项目: ${project.name}`)),
        h('div', null, h('button', { onClick: () => { setProject(null); setPage('projects') } }, '返回项目列表'))
      ),
      h(Directions, { project })
    )
  } else {
    view = h(Projects, { onSelectProject: p => { setProject(p); setPage('directions') } })
  }
  return view
}

const rootEl = document.getElementById('root') || (() => { const d=document.createElement('div'); d.id='root'; document.body.appendChild(d); return d })()
window.addEventListener('error', (e) => {
  const el = document.getElementById('global-error') || (() => { const n=document.createElement('div'); n.id='global-error'; n.className='card'; n.style.margin='12px'; document.body.appendChild(n); return n })()
  el.textContent = '脚本错误：' + (e.message || '未知错误')
})
window.addEventListener('unhandledrejection', (e) => {
  const el = document.getElementById('global-error') || (() => { const n=document.createElement('div'); n.id='global-error'; n.className='card'; n.style.margin='12px'; document.body.appendChild(n); return n })()
  el.textContent = '未处理的异步错误：' + (e.reason && e.reason.message || String(e.reason))
})
createRoot(rootEl).render(h(ErrorBoundary, null, h(App)))
