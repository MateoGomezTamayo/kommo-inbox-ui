import { setCORS } from './_cors.js'
import { hasTokens } from './_tokens.js'
import { validateAppToken } from './_auth.js'
import { getTalks } from './_kommo.js'

export default async function handler(req, res) {
  setCORS(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!validateAppToken(req)) return res.status(401).json({ error: 'unauthorized' })
  if (!await hasTokens()) return res.status(401).json({ error: 'not_authorized' })

  try {
    const { page = 1, limit = 50, q } = req.query
    // Kommo: /api/v4/talks = conversaciones del inbox unificado (WhatsApp, IG, FB, TikTok)
    const data = await getTalks({ page: +page, limit: +limit, ...(q && { query: q }) })
    const talks = data?._embedded?.talks ?? []
    // Ordenar por más reciente primero
    const sorted = talks.slice().sort((a, b) => (b.updated_at ?? 0) - (a.updated_at ?? 0))
    res.json({ chats: sorted.map(normalizeTalk), page: +page, has_more: talks.length === +limit })
  } catch (err) {
    console.error('[Chats/Talks]', err.response?.data || err.message)
    res.status(500).json({ error: 'Error al obtener conversaciones' })
  }
}

function normalizeTalk(talk) {
  const contact = talk._embedded?.contacts?.[0] ?? {}
  return {
    id:              String(talk.talk_id),  // talk_id (integer) = ID para mensajes
    chat_id:         talk.chat_id,           // UUID
    contact: {
      id:     contact.id,
      name:   contact.name || `Contacto ${contact.id ?? ''}`,
      avatar: contact.avatar_url ?? null,
    },
    channel:         detectChannel(talk),
    last_message:    talk.last_message?.body?.text ?? talk.last_message?.text ?? '',
    last_message_at: talk.last_message?.created_at ?? talk.updated_at,
    unread_count:    talk.is_read === false ? 1 : 0,
    entity_id:       talk.entity_id,
    updated_at:      talk.updated_at,
  }
}

function detectChannel(talk) {
  const src = (talk.origin ?? '').toLowerCase()
  // Kommo source values: 'waba' = WhatsApp Business API
  if (src === 'waba' || src.includes('whatsapp'))          return 'whatsapp'
  if (src === 'instagram' || src.includes('instagram'))    return 'instagram'
  if (src === 'facebook' || src.includes('fb'))            return 'facebook'
  if (src === 'tiktok')                                    return 'tiktok'
  return 'unknown'
}
