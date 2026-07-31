import { setCORS } from './_cors.js'
import { hasTokens } from './_tokens.js'
import { getLeads } from './_kommo.js'

export default async function handler(req, res) {
  setCORS(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!await hasTokens()) return res.status(401).json({ error: 'not_authorized' })

  try {
    const { page = 1, limit = 50, q } = req.query
    // Kommo: los "chats" de WhatsApp/Instagram/Facebook/TikTok llegan como leads
    // con conversaciones asociadas. Usar /api/v4/leads con contactos embebidos.
    const data = await getLeads({ page: +page, limit: +limit, query: q })
    const leads = data?._embedded?.leads ?? []
    res.json({ chats: leads.map(normalizeLead), page: +page, has_more: leads.length === +limit })
  } catch (err) {
    console.error('[Chats]', err.response?.data || err.message)
    res.status(500).json({ error: 'Error al obtener conversaciones' })
  }
}

function normalizeLead(lead) {
  const contact = lead._embedded?.contacts?.[0] ?? {}
  return {
    id:              String(lead.id),
    contact: {
      id:     contact.id,
      name:   contact.name || lead.name || 'Sin nombre',
      avatar: contact.avatar_url ?? null,
    },
    channel:         detectChannel(lead),
    last_message:    lead.name || '',
    last_message_at: lead.updated_at ?? lead.created_at,
    unread_count:    0,
    updated_at:      lead.updated_at,
  }
}

function detectChannel(lead) {
  // Detectar canal por etiquetas, pipeline o nombre del lead
  const tags = (lead._embedded?.tags ?? []).map(t => t.name?.toLowerCase() ?? '')
  const name  = (lead.name ?? '').toLowerCase()
  const all   = [...tags, name].join(' ')

  if (all.includes('whatsapp') || all.includes('wpp'))   return 'whatsapp'
  if (all.includes('instagram') || all.includes('ig'))   return 'instagram'
  if (all.includes('facebook') || all.includes('fb'))    return 'facebook'
  if (all.includes('tiktok'))                            return 'tiktok'
  return 'unknown'
}
