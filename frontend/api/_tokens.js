import { Redis } from '@upstash/redis'
import axios from 'axios'

const redis = Redis.fromEnv()
const KEY = 'kommo:tokens'

export async function hasTokens() {
  const t = await redis.get(KEY)
  return t !== null && !!t?.access_token
}

export async function saveTokens(data) {
  const tokens = {
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    Date.now() + (data.expires_in - 60) * 1000,
  }
  await redis.set(KEY, tokens)
  return tokens
}

export async function getAccessToken() {
  let tokens = await redis.get(KEY)
  if (!tokens?.access_token) throw new Error('Sin tokens. Ve a /api/auth-start para autorizar.')

  // Renovar si está próximo a expirar
  if (Date.now() >= tokens.expires_at) {
    const { KOMMO_CLIENT_ID, KOMMO_CLIENT_SECRET, KOMMO_SUBDOMAIN, KOMMO_REDIRECT_URI } = process.env
    const { data } = await axios.post(
      `https://${KOMMO_SUBDOMAIN}.kommo.com/oauth2/access_token`,
      {
        client_id:     KOMMO_CLIENT_ID,
        client_secret: KOMMO_CLIENT_SECRET,
        grant_type:    'refresh_token',
        refresh_token: tokens.refresh_token,
        redirect_uri:  KOMMO_REDIRECT_URI,
      }
    )
    tokens = await saveTokens(data)
    console.log('[Tokens] Renovados automáticamente.')
  }

  return tokens.access_token
}
