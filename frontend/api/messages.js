import { setCORS } from './_cors.js'
import { hasTokens } from './_tokens.js'
import { getTalkMessages, sendTalkMessage } from './_kommo.js'

export default async function handler(req, res) {
  setCORS(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!await hasTokens()) return res.status(401).json({ error: 'not_authorized' })

  const { chatId, page = 1, limit = 50 } = req.query
  if (!chatId) return res.status(400).json({ error: 'chatId requerido' })

  if (req.method === 'GET') {
    try {
      // chatId es el UUID del chat (talk.chat_id)
      // Los mensajes se obtienen en /api/v4/chats/{chat_id}/messages
      const data = await getTalkMessages(chatId, { page: +page, limit: +limit })
      const messages = data?._embedded?.messages ?? []
      return res.json({ messages: messages.map(normalizeMessage), page: +page, has_more: messages.length === +limit })
    } catch (err) {
      console.error('[Messages GET]', err.response?.data || err.message)
      // Devolver array vacío en vez de error para no bloquear la UI
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
    chat_id:    String(msg.talk_id ?? msg.chat_id),
    text:       msg.body?.text ?? msg.text ?? '',
    type:       msg.type ?? 'text',
    direction:  msg.direction ?? (msg.author?.type === 'user' ? 'out' : 'in'),
    created_at: msg.created_at,
  }
}
