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

    // Probar con el endpoint de chats (el que usa la app)
    const { data } = await axios.get(
      `https://${process.env.KOMMO_SUBDOMAIN}.kommo.com/api/v4/chats?limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    result.kommo_test = { ok: true, chats_count: data?._embedded?.chats?.length ?? 0, raw_keys: Object.keys(data || {}) }
  } catch (err) {
    result.error = {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    }
  }

  res.json(result)
}
