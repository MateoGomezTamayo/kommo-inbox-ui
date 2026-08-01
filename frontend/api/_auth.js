import { createHmac, timingSafeEqual } from 'crypto'

// Genera el token esperado a partir del APP_PASSWORD y APP_SECRET.
// El token es un HMAC-SHA256: la contraseña nunca viaja en texto plano.
export function getExpectedToken() {
  const password = process.env.APP_PASSWORD
  if (!password) return null // Sin contraseña configurada = acceso abierto
  const secret = process.env.APP_SECRET || process.env.KOMMO_CLIENT_SECRET
  return createHmac('sha256', secret).update(password).digest('hex')
}

// Valida el header X-App-Token usando comparación en tiempo constante
// (evita ataques de timing que pueden filtrar el token via diferencias de tiempo).
export function validateAppToken(req) {
  const expected = getExpectedToken()
  if (!expected) return true  // APP_PASSWORD no configurado = acceso abierto
  const token = req.headers['x-app-token']
  if (!token || token.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}
