import axios from 'axios'

// Redis opcional — si está disponible, cachea el access_token para no hacer
// un intercambio en cada request (Upstash gratis puede conectarse después).
let redis = null
try {
  const { Redis } = await import('@upstash/redis')
  redis = Redis.fromEnv()
} catch {}

const REDIS_KEY = 'kommo:tokens'

// ─── API pública ───────────────────────────────────────────────────────────────

export async function hasTokens() {
  // 1. Token directo en env var (más simple — no expira o dura mucho)
  if (process.env.KOMMO_LONG_TOKEN || process.env.KOMMO_ACCESS_TOKEN) return true
  // 2. Tokens almacenados en Redis
  if (redis) {
    const t = await redis.get(REDIS_KEY).catch(() => null)
    return !!t?.access_token
  }
  return false
}

export async function getAccessToken() {
  // ── Opción 1: token directo de larga duración (usado como Bearer directamente) ──
  if (process.env.KOMMO_ACCESS_TOKEN) return process.env.KOMMO_ACCESS_TOKEN

  // ── Opción 2: KOMMO_LONG_TOKEN — intentar primero como access token directo,
  //    si falla intentar exchange como refresh token ─────────────────────────
  if (process.env.KOMMO_LONG_TOKEN) {
    // Verificar si ya tenemos un access_token cacheado en Redis
    if (redis) {
      const cached = await redis.get(REDIS_KEY).catch(() => null)
      if (cached?.access_token && Date.now() < cached.expires_at) {
        return cached.access_token
      }
    }
    // El token de larga duración de Kommo es un refresh token — intercambiarlo
    return _exchangeRefreshToken(process.env.KOMMO_LONG_TOKEN)
  }

  // ── Opción 3: tokens guardados en Redis (OAuth flow tradicional) ───────────
  if (redis) {
    let tokens = await redis.get(REDIS_KEY).catch(() => null)
    if (!tokens?.access_token) throw new Error('Sin tokens. Configura KOMMO_LONG_TOKEN en Vercel.')
    if (Date.now() >= tokens.expires_at) {
      tokens = await _exchangeRefreshToken(tokens.refresh_token)
    }
    return tokens.access_token
  }

  throw new Error('Sin tokens. Configura KOMMO_LONG_TOKEN en Vercel → Settings → Environment Variables.')
}

export async function saveTokens(data) {
  const tokens = {
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    Date.now() + (data.expires_in - 60) * 1000,
  }
  if (redis) await redis.set(REDIS_KEY, tokens).catch(() => {})
  return tokens
}

// ─── Interno ───────────────────────────────────────────────────────────────────

async function _exchangeRefreshToken(refreshToken) {
  const { KOMMO_CLIENT_ID, KOMMO_CLIENT_SECRET, KOMMO_SUBDOMAIN, KOMMO_REDIRECT_URI } = process.env
  const { data } = await axios.post(
    `https://${KOMMO_SUBDOMAIN}.kommo.com/oauth2/access_token`,
    {
      client_id:     KOMMO_CLIENT_ID,
      client_secret: KOMMO_CLIENT_SECRET,
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      redirect_uri:  KOMMO_REDIRECT_URI,
    }
  )
  // Cachear en Redis si está disponible para no intercambiar en cada request
  if (redis) await saveTokens(data).catch(() => {})
  return data.access_token
}

