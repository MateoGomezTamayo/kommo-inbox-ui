const BASE = ''

function getToken() {
  return localStorage.getItem('app_token') || ''
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-App-Token': getToken(),
      ...options.headers,
    },
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
    request('/api/auth'),

  getChats: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/api/chats${qs ? `?${qs}` : ''}`)
  },

  getMessages: (chatId, params = {}) => {
    const qs = new URLSearchParams({ chatId, ...params }).toString()
    return request(`/api/messages?${qs}`)
  },

  sendMessage: (chatId, text) =>
    request(`/api/messages?chatId=${chatId}`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
}
