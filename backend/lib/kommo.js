import axios from 'axios'
import { getAccessToken } from './tokens.js'

function baseURL() {
  return `https://${process.env.KOMMO_SUBDOMAIN}.kommo.com`
}

async function req(method, path, params = {}, body = null) {
  const token = await getAccessToken()
  const { data } = await axios({
    method,
    url: `${baseURL()}/api/v4${path}`,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    params: method === 'get' ? params : undefined,
    data:   method !== 'get' ? body   : undefined,
  })
  return data
}

// ─── Chats ─────────────────────────────────────────────────────────────────────
// GET /api/v4/chats — lista paginada de conversaciones
export const getChats = ({ page = 1, limit = 50, query } = {}) =>
  req('get', '/chats', { page, limit, ...(query && { 'filter[query]': query }) })

// GET /api/v4/chats/{id}/messages — historial de mensajes
export const getChatMessages = (chatId, { page = 1, limit = 50 } = {}) =>
  req('get', `/chats/${chatId}/messages`, { page, limit })

// POST /api/v4/chats/messages — enviar mensaje de texto
export const sendChatMessage = (chatId, text) =>
  req('post', '/chats/messages', {}, {
    chat_id: chatId,
    body: { type: 'text', text },
  })
