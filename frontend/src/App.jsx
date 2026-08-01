import { useState, useEffect } from 'react'
import { InboxProvider } from './context/InboxContext.jsx'
import Inbox from './pages/Inbox.jsx'
import Login from './pages/Login.jsx'

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('app_token'))

  // Verificar si el token sigue siendo válido al montar
  useEffect(() => {
    if (!token) return
    fetch('/api/auth', { headers: { 'X-App-Token': token } })
      .then(r => { if (!r.ok) { localStorage.removeItem('app_token'); setToken(null) } })
      .catch(() => {})
  }, [token])

  function handleLogin(newToken) {
    setToken(newToken)
  }

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <InboxProvider appToken={token}>
      <Inbox onLogout={() => { localStorage.removeItem('app_token'); setToken(null) }} />
    </InboxProvider>
  )
}
