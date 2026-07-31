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
  }

  result.has_tokens = await hasTokens()

  try {
    const token = await getAccessToken()
    result.token = token ? `${token.substring(0, 12)}...` : null

    // Probar llamada real a Kommo API
    const { data } = await axios.get(
      `https://${process.env.KOMMO_SUBDOMAIN}.kommo.com/api/v4/account`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    result.kommo_test = { ok: true, account_id: data.id, name: data.name, subdomain: data.subdomain }
  } catch (err) {
    result.error = {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    }
  }

  res.json(result)
}
