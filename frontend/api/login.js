import { createHmac, timingSafeEqual } from 'crypto'
import { setCORS } from './_cors.js'

// Contador simple en memoria para delay en intentos fallidos.
// No reemplaza rate limiting real, pero frena ataques simples de fuerza bruta.
const failedAttempts = new Map()

export default async function handler(req, res) {
  setCORS(res, req)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const ip = req.headers['x-forwarded-for']?.split(',')[0] ?? 'unknown'
  const attempts = failedAttempts.get(ip) ?? 0

  // Bloquear IP con demasiados intentos fallidos (reset cada vez que el proceso reinicia)
  if (attempts >= 10) {
    return res.status(429).json({ error: 'Demasiados intentos. Intenta más tarde.' })
  }

  const { password } = req.body ?? {}
  const appPassword = process.env.APP_PASSWORD

  if (!appPassword) {
    return res.json({ ok: true, token: 'open' })
  }

  if (!password || typeof password !== 'string' || password.length > 200) {
    return res.status(400).json({ error: 'Contraseña requerida' })
  }

  const secret   = process.env.APP_SECRET || process.env.KOMMO_CLIENT_SECRET
  const inputHash    = createHmac('sha256', secret).update(password).digest()
  const expectedHash = createHmac('sha256', secret).update(appPassword).digest()

  // Comparación en tiempo constante (timing-safe)
  const valid = inputHash.length === expectedHash.length &&
    timingSafeEqual(inputHash, expectedHash)

  if (valid) {
    failedAttempts.delete(ip)
    const token = inputHash.toString('hex')
    return res.json({ ok: true, token })
  }

  // Registrar intento fallido + delay artificial
  failedAttempts.set(ip, attempts + 1)
  await new Promise(r => setTimeout(r, 500 * (attempts + 1)))
  return res.status(401).json({ error: 'Contraseña incorrecta' })
}
