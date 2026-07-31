const BASE = import.meta.env.VITE_BACKEND_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(err.error || 'Request failed'), { status: res.status, data: err })
  }
  return res.json()
}

export const api = {
  getAuthStatus: () =>
    request('/auth/status'),

  getChats: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/api/chats${qs ? `?${qs}` : ''}`)
  },

  getMessages: (chatId, params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/api/chats/${chatId}/messages${qs ? `?${qs}` : ''}`)
  },

  sendMessage: (chatId, text) =>
    request(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
}
