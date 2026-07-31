import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { getChats, getChatMessages, sendChatMessage } from '../lib/kommo.js'

const router = Router()
router.use(requireAuth)

// GET /api/chats?page=1&limit=50&q=texto
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, q } = req.query
    const data = await getChats({ page: +page, limit: +limit, query: q })
    const chats = data?._embedded?.chats ?? []
    res.json({
      chats:    chats.map(normalizeChat),
      page:     +page,
      has_more: chats.length === +limit,
    })
  } catch (err) {
    console.error('[Chats] Error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Error al obtener conversaciones' })
  }
})

// GET /api/chats/:id/messages
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 50 } = req.query
    const data = await getChatMessages(id, { page: +page, limit: +limit })
    const messages = data?._embedded?.messages ?? []
    res.json({
      messages: messages.map(normalizeMessage),
      page:     +page,
      has_more: messages.length === +limit,
    })
  } catch (err) {
    console.error('[Chats] Error mensajes:', err.response?.data || err.message)
    res.status(500).json({ error: 'Error al obtener mensajes' })
  }
})

// POST /api/chats/:id/messages  { text: "..." }
router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ error: 'text es requerido' })
    const data = await sendChatMessage(id, text.trim())
    res.json({ ok: true, message: data })
  } catch (err) {
    console.error('[Chats] Error enviando:', err.response?.data || err.message)
    res.status(500).json({ error: 'Error al enviar mensaje' })
  }
})

// ─── Normalizadores ─────────────────────────────────────────────────────────────
// Adaptan la forma de la API de Kommo a lo que espera el frontend.
// Si los nombres de campo difieren en tu cuenta, ajusta aquí.

function normalizeChat(chat) {
  const contact = chat._embedded?.contacts?.[0] ?? {}
  return {
    id:              chat.id,
    contact: {
      id:     contact.id,
      name:   contact.name || 'Sin nombre',
      avatar: contact.avatar_url ?? null,
      phone:  contact.phone ?? null,
    },
    channel:         detectChannel(chat),
    last_message:    chat.last_message?.text ?? '',
    last_message_at: chat.last_message?.created_at ?? chat.updated_at,
    unread_count:    chat.unread_count ?? 0,
    created_at:      chat.created_at,
    updated_at:      chat.updated_at,
  }
}

function normalizeMessage(msg) {
  return {
    id:         msg.id,
    chat_id:    msg.chat_id,
    text:       msg.body?.text ?? msg.text ?? '',
    type:       msg.type ?? 'text',
    // 'out' = enviado por nosotros · 'in' = recibido del cliente
    direction:  msg.direction ?? (msg.author?.id ? 'out' : 'in'),
    created_at: msg.created_at,
    author:     msg.author ?? null,
  }
}

// Detecta el canal de origen del chat.
// NOTA: Verifica con una respuesta real de tu cuenta los nombres exactos de campo.
function detectChannel(chat) {
  const src = (
    chat.origin?.source ??
    chat.source?.type ??
    chat.channel_type ??
    ''
  ).toLowerCase()

  if (src.includes('whatsapp'))           return 'whatsapp'
  if (src.includes('instagram'))          return 'instagram'
  if (src.includes('facebook') || src.includes('fb')) return 'facebook'
  if (src.includes('tiktok'))             return 'tiktok'
  return 'unknown'
}

export default router
