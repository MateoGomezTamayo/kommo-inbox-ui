import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

const __dirname = dirname(fileURLToPath(import.meta.url))

// En Railway se usa un volumen montado en /data para persistencia entre reinicios.
// En local se guarda en la raíz del proyecto.
const DATA_DIR   = process.env.RAILWAY_ENVIRONMENT ? '/data' : join(__dirname, '../..')
const TOKENS_FILE = join(DATA_DIR, '.tokens.json')

let store = null

// Prioridad: 1) Variables de entorno (Railway las puede tener pre-cargadas)
//            2) Archivo .tokens.json (local o volumen Railway)
;(function load() {
  const { KOMMO_ACCESS_TOKEN, KOMMO_REFRESH_TOKEN, KOMMO_EXPIRES_AT } = process.env
  if (KOMMO_ACCESS_TOKEN && KOMMO_REFRESH_TOKEN) {
    store = {
      access_token:  KOMMO_ACCESS_TOKEN,
      refresh_token: KOMMO_REFRESH_TOKEN,
      expires_at:    Number(KOMMO_EXPIRES_AT) || 0,
    }
    console.log('[Tokens] Cargados desde variables de entorno.')
    return
  }
  if (existsSync(TOKENS_FILE)) {
    try {
      store = JSON.parse(readFileSync(TOKENS_FILE, 'utf-8'))
      console.log('[Tokens] Cargados desde archivo.')
    } catch { store = null }
  }
})()

export function hasTokens() {
  return store !== null && !!store.access_token
}

export function saveTokens(data) {
  store = {
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    Date.now() + (data.expires_in - 60) * 1000,
    account_id:    data.account_id ?? store?.account_id,
  }
  try {
    mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(TOKENS_FILE, JSON.stringify(store, null, 2))
  } catch (e) {
    // En Railway sin volumen montado el write puede fallar — no es crítico,
    // los tokens están en memoria y se renuevan automáticamente.
    console.warn('[Tokens] No se pudo persistir a disco:', e.message)
  }
  console.log('[Tokens] Guardados. Expiran en', Math.round(data.expires_in / 3600), 'horas.')
}

export async function getAccessToken() {
  if (!store?.access_token) {
    throw new Error('Sin tokens. Ve a /auth/start para autorizar la integración.')
  }
  if (Date.now() >= store.expires_at) {
    await refresh()
  }
  return store.access_token
}

async function refresh() {
  const { KOMMO_CLIENT_ID, KOMMO_CLIENT_SECRET, KOMMO_SUBDOMAIN, KOMMO_REDIRECT_URI } = process.env
  console.log('[Tokens] Renovando access_token...')
  const { data } = await axios.post(
    `https://${KOMMO_SUBDOMAIN}.kommo.com/oauth2/access_token`,
    {
      client_id:     KOMMO_CLIENT_ID,
      client_secret: KOMMO_CLIENT_SECRET,
      grant_type:    'refresh_token',
      refresh_token: store.refresh_token,
      redirect_uri:  KOMMO_REDIRECT_URI,
    }
  )
  saveTokens(data)
}
