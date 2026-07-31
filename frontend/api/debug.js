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

    // Probar varios endpoints para ver cuál responde
    const tests = {}
    for (const path of ['/api/v4/leads?limit=2&with=contacts', '/api/v4/chats?limit=2', '/api/v4/talks?limit=2']) {
      try {
        const r = await axios.get(`${base}${path}`, h)
        const embedded = r.data?._embedded ?? {}
        tests[path] = { status: 200, keys: Object.keys(embedded), count: Object.values(embedded)[0]?.length ?? 0 }
      } catch (e) {
        tests[e.config?.url?.replace(base, '') ?? path] = { status: e.response?.status, error: e.response?.data?.title ?? e.message }
      }
    }
    result.kommo_test = tests
  } catch (err) {
    result.error = {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    }
  }

  res.json(result)
}
