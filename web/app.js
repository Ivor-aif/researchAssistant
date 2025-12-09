import React, { useEffect, useState } from 'https://esm.sh/react@18'
import { createRoot } from 'https://esm.sh/react-dom@18/client'
import Login from './pages/Login.js'
import Projects from './pages/Projects.js'
import Directions from './pages/Directions.js'
import Settings from './pages/Settings.js'
import DirectionDetail from './pages/DirectionDetail.js'
import { loadTimezone } from './time.js'
const h = React.createElement

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

  if (!authed) return h(Login, { onAuthed: () => setAuthed(true) })
  useEffect(() => {
    function onOpen(e) { setDirection(e.detail); setPage('directionDetail') }
    window.addEventListener('openDirection', onOpen)
    return () => window.removeEventListener('openDirection', onOpen)
  }, [])

  if (page === 'settings') return h(Settings)
  if (page === 'directionDetail' && direction) return h(DirectionDetail, { project: direction, onExit: () => setPage('directions') })
  if (project) return h('div', null,
    h('div', { className: 'card', style: { display: 'flex', justifyContent: 'space-between' } },
      h('div', null, h('b', null, `项目: ${project.name}`)),
      h('div', null, h('button', { onClick: () => { setProject(null); setPage('projects') } }, '返回项目列表'))
    ),
    h(Directions, { project })
  )
  return h(Projects, { onSelectProject: p => { setProject(p); setPage('directions') } })
}

createRoot(document.getElementById('root')).render(h(App))
