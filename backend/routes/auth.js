import { Router } from 'express'
import axios from 'axios'
import { saveTokens, hasTokens } from '../lib/tokens.js'

const router = Router()

// Paso 1 — El admin abre esta URL una sola vez para autorizar la integración
router.get('/start', (req, res) => {
  const { KOMMO_CLIENT_ID, KOMMO_SUBDOMAIN, KOMMO_REDIRECT_URI } = process.env
  const params = new URLSearchParams({
    client_id:    KOMMO_CLIENT_ID,
    state:        'kommo_inbox_auth',
    mode:         'post_message',
    redirect_uri: KOMMO_REDIRECT_URI,
  })
  res.redirect(`https://${KOMMO_SUBDOMAIN}.kommo.com/oauth2/authorize?${params}`)
})

// Paso 2 — Kommo redirige aquí con ?code=... tras autorizar
router.get('/callback', async (req, res) => {
  const { code } = req.query
  if (!code) return res.status(400).send('Error: no se recibió code de Kommo.')

  try {
    const { KOMMO_CLIENT_ID, KOMMO_CLIENT_SECRET, KOMMO_SUBDOMAIN, KOMMO_REDIRECT_URI } = process.env
    const { data } = await axios.post(
      `https://${KOMMO_SUBDOMAIN}.kommo.com/oauth2/access_token`,
      {
        client_id:     KOMMO_CLIENT_ID,
        client_secret: KOMMO_CLIENT_SECRET,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  KOMMO_REDIRECT_URI,
      }
    )
    saveTokens(data)
    res.redirect(`${process.env.FRONTEND_URL}?auth=success`)
  } catch (err) {
    console.error('[Auth] Fallo en intercambio de tokens:', err.response?.data || err.message)
    res.status(500).send('Error al conectar con Kommo. Verifica client_id y client_secret.')
  }
})

// Kommo llama aquí si el token es revocado (configurado en la integración)
router.post('/revoked', (req, res) => {
  console.warn('[Auth] Token revocado por Kommo')
  res.sendStatus(200)
})

// El frontend consulta esto al cargar para saber si ya hay tokens
router.get('/status', (_req, res) => {
  res.json({ connected: hasTokens() })
})

export default router
