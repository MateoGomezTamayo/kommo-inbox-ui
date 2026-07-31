import { setCORS } from './_cors.js'
import { hasTokens } from './_tokens.js'
import { getChats } from './_kommo.js'

export default async function handler(req, res) {
  setCORS(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!await hasTokens()) return res.status(401).json({ error: 'not_authorized' })

  try {
    const { page = 1, limit = 50, q } = req.query
    const data = await getChats({ page: +page, limit: +limit, ...(q && { 'filter[query]': q }) })
    const chats = data?._embedded?.chats ?? []
    res.json({ chats: chats.map(normalizeChat), page: +page, has_more: chats.length === +limit })
  } catch (err) {
    console.error('[Chats]', err.response?.data || err.message)
    res.status(500).json({ error: 'Error al obtener conversaciones' })
  }
}

function normalizeChat(chat) {
  const contact = chat._embedded?.contacts?.[0] ?? {}
  return {
    id:              chat.id,
    contact: {
      id:     contact.id,
      name:   contact.name || 'Sin nombre',
      avatar: contact.avatar_url ?? null,
    },
    channel:         detectChannel(chat),
    last_message:    chat.last_message?.text ?? '',
    last_message_at: chat.last_message?.created_at ?? chat.updated_at,
    unread_count:    chat.unread_count ?? 0,
    updated_at:      chat.updated_at,
  }
}

// NOTA: verifica los nombres exactos de campo contra tu cuenta real de Kommo.
function detectChannel(chat) {
  const src = (chat.origin?.source ?? chat.source?.type ?? chat.channel_type ?? '').toLowerCase()
  if (src.includes('whatsapp'))                       return 'whatsapp'
  if (src.includes('instagram'))                      return 'instagram'
  if (src.includes('facebook') || src.includes('fb')) return 'facebook'
  if (src.includes('tiktok'))                         return 'tiktok'
  return 'unknown'
}
