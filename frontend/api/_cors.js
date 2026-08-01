// CORS: solo se permite el origin de producción.
// Si ALLOWED_ORIGIN no está definido, cae a la misma URL de Vercel.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ||
  'https://kommo-inbox-ui-mateogomeztamayos-projects.vercel.app'

export function setCORS(res, req = null) {
  const origin = req?.headers?.origin
  // Solo incluir CORS si el origin es el permitido
  if (!origin || origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-App-Token')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  // Evitar que el navegador cachee respuestas de preflight demasiado tiempo
  res.setHeader('Access-Control-Max-Age', '86400')
}
