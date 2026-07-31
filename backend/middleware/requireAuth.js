import { hasTokens } from '../lib/tokens.js'

export function requireAuth(req, res, next) {
  if (!hasTokens()) {
    return res.status(401).json({
      error: 'not_authorized',
      message: 'App no conectada a Kommo. Ve a /auth/start para autorizar.',
      auth_url: '/auth/start',
    })
  }
  next()
}
