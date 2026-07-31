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

    // Obtener el primer talk y probar notas del lead
    const r = await axios.get(`${base}/api/v4/talks?limit=1&with=contacts`, h)
    const talk = r.data?._embedded?.talks?.[0] ?? null
    const entityId = talk?.entity_id

    let notes_test = null
    if (entityId) {
      try {
        const nr = await axios.get(`${base}/api/v4/leads/${entityId}/notes?limit=5`, h)
        const notes = nr.data?._embedded?.notes ?? []
        notes_test = { status: 200, total: nr.data?._total_items, count: notes.length, types: notes.map(n => n.note_type), first_note: notes[0] ?? null }
      } catch (e) {
        notes_test = { status: e.response?.status, error: e.response?.data }
      }
    }
    result.kommo_test = { entity_id: entityId, notes_test }
  } catch (err) {
    result.error = {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    }
  }

  res.json(result)
}
