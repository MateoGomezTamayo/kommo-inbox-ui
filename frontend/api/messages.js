import { setCORS } from './_cors.js'
import { hasTokens } from './_tokens.js'
import { getLeadNotes, sendTalkMessage } from './_kommo.js'

export default async function handler(req, res) {
  setCORS(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!await hasTokens()) return res.status(401).json({ error: 'not_authorized' })

  // chatId = entity_id (lead_id) del talk, pasado por el frontend
  const { chatId, page = 1, limit = 50 } = req.query
  if (!chatId) return res.status(400).json({ error: 'chatId requerido' })

  if (req.method === 'GET') {
    try {
      // Los mensajes en Kommo se guardan como notas en el lead
      // note_type_id: 102 = mensaje entrante, 103 = mensaje saliente, 4 = nota general
      const data = await getLeadNotes(chatId, { page: +page, limit: +limit })
      const notes = data?._embedded?.notes ?? []
      // Filtrar solo mensajes (tipos 102 y 103 son mensajes de chat)
      const messages = notes
        .filter(n => [102, 103, 4, 12, 13].includes(n.note_type))
        .map(normalizeNote)
      return res.json({ messages, page: +page, has_more: notes.length === +limit })
    } catch (err) {
      console.error('[Messages GET]', err.response?.data || err.message)
      return res.json({ messages: [], page: +page, has_more: false })
    }
  }

  if (req.method === 'POST') {
    const { text, chat_uuid } = req.body ?? {}
    if (!text?.trim()) return res.status(400).json({ error: 'text requerido' })
    try {
      // chat_uuid = el UUID del chat (talk.chat_id)
      await sendTalkMessage(chat_uuid || chatId, text.trim())
      return res.json({ ok: true })
    } catch (err) {
      console.error('[Messages POST]', err.response?.data || err.message)
      return res.status(500).json({ error: 'Error al enviar mensaje' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}

function normalizeNote(note) {
  // note_type: 102 = entrante (del cliente), 103 = saliente (del equipo)
  const isIncoming = note.note_type === 102 || note.note_type === 4
  const text = note.params?.text ?? note.params?.content ?? note.text ?? ''
  return {
    id:         String(note.id),
    chat_id:    String(note.entity_id),
    text,
    type:       'text',
    direction:  isIncoming ? 'in' : 'out',
    created_at: note.created_at,
  }
}
