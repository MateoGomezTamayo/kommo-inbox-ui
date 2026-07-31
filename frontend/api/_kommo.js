import axios from 'axios'
import { getAccessToken } from './_tokens.js'

const base = () => `https://${process.env.KOMMO_SUBDOMAIN}.kommo.com`

async function req(method, path, params = {}, body = null) {
  const token = await getAccessToken()
  const { data } = await axios({
    method,
    url: `${base()}/api/v4${path}`,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    params: method === 'get' ? params : undefined,
    data:   method !== 'get' ? body   : undefined,
  })
  return data
}

// Talks = conversaciones del inbox de Kommo (WhatsApp, IG, FB, TikTok)
export const getTalks = (p = {}) =>
  req('get', '/talks', { with: 'contact', ...p })

export const getTalkMessages = (talkId, p = {}) =>
  req('get', `/talks/${talkId}/messages`, p)

export const sendTalkMessage = (talkId, text) =>
  req('post', `/talks/${talkId}/messages`, {}, { body: { type: 'text', text } })

// Leads — fallback para data adicional
export const getLeads        = (p = {}) => req('get', '/leads', p)
export const getChats        = (p = {}) => req('get', '/chats', p)
export const getChatMessages = (id, p = {}) => req('get', `/chats/${id}/messages`, p)
export const sendChatMessage = (id, text) =>
  req('post', '/chats/messages', {}, { chat_id: id, body: { type: 'text', text } })
