import { setCORS } from './_cors.js'
import { hasTokens } from './_tokens.js'
import { getTalkMessages, sendTalkMessage } from './_kommo.js'

export default async function handler(req, res) {
  setCORS(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!await hasTokens()) return res.status(401).json({ error: 'not_authorized' })

  // chatId = talk_id (integer) del talk
  const { chatId, page = 1, limit = 50 } = req.query
  if (!chatId) return res.status(400).json({ error: 'chatId requerido' })

  if (req.method === 'GET') {
    try {
      // GET /api/v4/talks/{talk_id}/messages (requiere scope: External chat history)
      const data = await getTalkMessages(chatId, { page: +page, limit: +limit })
      const messages = data?._embedded?.messages ?? []
      return res.json({ messages: messages.map(normalizeMessage), page: +page, has_more: messages.length === +limit })
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail ?? err.message
      console.error(`[Messages GET] ${status}: ${detail}`)
      // Si es 403/scope, devolver info útil en vez de error genérico
      if (status === 403) return res.json({ messages: [], page: +page, has_more: false, _note: 'scope_required: External chat history' })
      return res.json({ messages: [], page: +page, has_more: false })
    }
  }

  if (req.method === 'POST') {
    const { text } = req.body ?? {}
    if (!text?.trim()) return res.status(400).json({ error: 'text requerido' })
    try {
      await sendTalkMessage(chatId, text.trim())
      return res.json({ ok: true })
    } catch (err) {
      console.error('[Messages POST]', err.response?.data || err.message)
      return res.status(500).json({ error: 'Error al enviar mensaje' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}

function normalizeMessage(msg) {
  return {
    id:         String(msg.id),
    chat_id:    String(msg.chat_id),
    text:       msg.text ?? '',
    type:       msg.message_type ?? 'text',
    // Kommo usa: type: 'incoming' (del cliente) | 'outgoing' (del equipo)
    direction:  msg.type === 'incoming' ? 'in' : 'out',
    created_at: msg.created_at,
    author:     msg.author ?? null,
  }
}
