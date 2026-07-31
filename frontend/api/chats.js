import { setCORS } from './_cors.js'
import { hasTokens } from './_tokens.js'
import { getTalks } from './_kommo.js'

export default async function handler(req, res) {
  setCORS(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!await hasTokens()) return res.status(401).json({ error: 'not_authorized' })

  try {
    const { page = 1, limit = 50, q } = req.query
    // Kommo: /api/v4/talks = conversaciones del inbox unificado (WhatsApp, IG, FB, TikTok)
    const data = await getTalks({ page: +page, limit: +limit, ...(q && { query: q }) })
    const talks = data?._embedded?.talks ?? []
    res.json({ chats: talks.map(normalizeTalk), page: +page, has_more: talks.length === +limit })
  } catch (err) {
    console.error('[Chats/Talks]', err.response?.data || err.message)
    res.status(500).json({ error: 'Error al obtener conversaciones' })
  }
}

function normalizeTalk(talk) {
  const contact = talk._embedded?.contact ?? talk.contact ?? {}
  return {
    id:              String(talk.id),
    contact: {
      id:     contact.id,
      name:   contact.name || 'Sin nombre',
      avatar: contact.avatar_url ?? null,
    },
    channel:         detectChannel(talk),
    last_message:    talk.last_message?.body?.text ?? talk.last_message?.text ?? '',
    last_message_at: talk.last_message?.created_at ?? talk.updated_at,
    unread_count:    talk.unread_count ?? 0,
    entity_id:       talk.entity_id,   // lead_id
    updated_at:      talk.updated_at,
  }
}

function detectChannel(talk) {
  const src = (talk.origin?.source ?? talk.source?.type ?? '').toLowerCase()
  if (src.includes('whatsapp'))                       return 'whatsapp'
  if (src.includes('instagram'))                      return 'instagram'
  if (src.includes('facebook') || src.includes('fb')) return 'facebook'
  if (src.includes('tiktok'))                         return 'tiktok'
  return 'unknown'
}
