// Endpoint de diagnóstico — eliminar en producción o proteger con un token secreto
// Visitar: https://tu-app.vercel.app/api/debug
import { setCORS } from './_cors.js'
import { getAccessToken, hasTokens } from './_tokens.js'
import axios from 'axios'

export default async function handler(req, res) {
  setCORS(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const result = { env: {}, token: null, kommo_test: null, error: null }

  // Qué variables de entorno están presentes (sin revelar valores)
  result.env = {
    KOMMO_CLIENT_ID:     !!process.env.KOMMO_CLIENT_ID,
    KOMMO_CLIENT_SECRET: !!process.env.KOMMO_CLIENT_SECRET,
    KOMMO_SUBDOMAIN:     process.env.KOMMO_SUBDOMAIN || '(no set)',
    KOMMO_REDIRECT_URI:  !!process.env.KOMMO_REDIRECT_URI,
    KOMMO_LONG_TOKEN:    !!process.env.KOMMO_LONG_TOKEN,
    KOMMO_ACCESS_TOKEN:  !!process.env.KOMMO_ACCESS_TOKEN,
    // Primeros 20 chars del LONG_TOKEN para verificar que no esté truncado
    KOMMO_LONG_TOKEN_preview: process.env.KOMMO_LONG_TOKEN
      ? `${process.env.KOMMO_LONG_TOKEN.substring(0, 20)}... (len=${process.env.KOMMO_LONG_TOKEN.length})`
      : null,
  }

  result.has_tokens = await hasTokens()

  try {
    const token = process.env.KOMMO_LONG_TOKEN || process.env.KOMMO_ACCESS_TOKEN
    result.token = token ? `${token.substring(0, 20)}...` : null
    const base = `https://${process.env.KOMMO_SUBDOMAIN}.kommo.com`
    const h = { headers: { Authorization: `Bearer ${token}` } }

    const r = await axios.get(`${base}/api/v4/talks?limit=1&with=contacts`, h)
    const talk = r.data?._embedded?.talks?.[0] ?? null
    const talkId   = talk?.talk_id
    const entityId = talk?.entity_id
    const chatId   = talk?.chat_id

    // Probar todos los posibles endpoints de mensajes
    const tests = {}
    const endpoints = [
      `/api/v4/talks/${talkId}/messages?limit=3`,
      `/api/v4/leads/${entityId}/notes?limit=3&filter[note_type][]=102&filter[note_type][]=103`,
      `/api/v4/contacts/${talk?._embedded?.contacts?.[0]?.id}/notes?limit=3`,
      `/api/v4/leads/${entityId}/notes?limit=3`,
    ]
    for (const ep of endpoints) {
      if (!ep.includes('undefined')) {
        try {
          const tr = await axios.get(`${base}${ep}`, h)
          const key = Object.keys(tr.data?._embedded ?? {})[0] ?? 'data'
          tests[ep] = { status: 200, count: tr.data?._embedded?.[key]?.length ?? 0, total: tr.data?._total_items }
        } catch (e) {
          tests[ep] = { status: e.response?.status }
        }
      }
    }
    result.kommo_test = { talk_id: talkId, entity_id: entityId, chat_id: chatId, tests }
  } catch (err) {
    result.error = {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    }
  }

  res.json(result)
}
