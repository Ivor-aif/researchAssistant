import React, { useState } from 'https://esm.sh/react@18'
import { login, register } from '../apiClient.js'
const h = React.createElement

export default function Login({ onAuthed }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      if (mode === 'register') await register(username, password)
      await login(username, password)
      onAuthed()
    } catch (e) {
      setError('认证失败')
    }
  }

  return h('div', { className: 'card', style: { maxWidth: 380 } },
    h('div', { className: 'row' },
      h('button', { onClick: () => setMode('login'), style: { background: mode === 'login' ? '#111827' : '#374151' } }, '登录'),
      h('button', { onClick: () => setMode('register'), style: { background: mode === 'register' ? '#111827' : '#374151' } }, '注册')
    ),
    h('form', { onSubmit: submit, style: { marginTop: 12 } },
      h('label', null, '用户名'),
      h('input', { value: username, onChange: e => setUsername(e.target.value), required: true, minLength: 3 }),
      h('label', { style: { marginTop: 8 } }, '密码'),
      h('input', { type: 'password', value: password, onChange: e => setPassword(e.target.value), required: true, minLength: 6 }),
      error ? h('div', { className: 'muted', style: { marginTop: 8 } }, error) : null,
      h('button', { type: 'submit', style: { marginTop: 12 } }, '提交')
    )
  )
}
