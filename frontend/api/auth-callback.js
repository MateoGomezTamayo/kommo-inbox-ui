import axios from 'axios'
import { saveTokens } from './_tokens.js'

// Kommo redirige aquí después de que el admin autoriza.
// Configura en Kommo: URL de redireccionamiento = https://tu-app.vercel.app/api/auth-callback
export default async function handler(req, res) {
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
    await saveTokens(data)
    res.redirect(302, '/?auth=success')
  } catch (err) {
    console.error('[Auth] Error en token exchange:', err.response?.data || err.message)
    res.status(500).send('Error al conectar con Kommo. Verifica client_id y client_secret.')
  }
}
