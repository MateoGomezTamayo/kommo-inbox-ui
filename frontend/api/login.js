import { createHmac } from 'crypto'
import { setCORS } from './_cors.js'

export default async function handler(req, res) {
  setCORS(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { password } = req.body ?? {}
  const appPassword = process.env.APP_PASSWORD

  // Si no hay contraseña configurada, acceso libre
  if (!appPassword) {
    return res.json({ ok: true, token: 'open' })
  }

  if (!password) {
    return res.status(400).json({ error: 'Contraseña requerida' })
  }

  // Validar contraseña comparando hashes (nunca comparar en texto plano)
  const secret = process.env.APP_SECRET || process.env.KOMMO_CLIENT_ID
  const token    = createHmac('sha256', secret).update(password).digest('hex')
  const expected = createHmac('sha256', secret).update(appPassword).digest('hex')

  if (token === expected) {
    return res.json({ ok: true, token })
  }

  return res.status(401).json({ error: 'Contraseña incorrecta' })
}
