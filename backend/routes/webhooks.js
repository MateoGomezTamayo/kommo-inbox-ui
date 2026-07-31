import { Router } from 'express'

const router = Router()

// Kommo envía eventos aquí como application/x-www-form-urlencoded
// Configurar esta URL en: Ajustes → WEB HOOKS → + Agregar Webhooks
router.post('/kommo', (req, res) => {
  const payload = req.body

  const newMessages = extractIncomingMessages(payload)

  if (newMessages.length > 0 && req.io) {
    // Emitir a todos los clientes del frontend conectados por socket
    req.io.emit('new_messages', newMessages)
    console.log(`[Webhook] ${newMessages.length} mensaje(s) nuevo(s) emitidos`)
  }

  // Siempre responder 200 para que Kommo no reintente
  res.sendStatus(200)
})

// ─── Parsear el payload del webhook ────────────────────────────────────────────
// Kommo envía los eventos como arrays anidados en la forma:
//   message[add][0][id], message[add][0][chat_id], etc.
// Express urlencoded los parsea como: { message: { add: [{ id, chat_id, ... }] } }
// Si la forma difiere, loguea payload y ajusta aquí.
function extractIncomingMessages(payload) {
  const messages = []
  const events = payload?.message?.add

  if (Array.isArray(events)) {
    for (const msg of events) {
      // Solo procesar mensajes entrantes (del cliente, no enviados por nosotros)
      if (msg.type === 'outgoing') continue
      messages.push({
        id:         msg.id,
        chat_id:    msg.chat_id,
        text:       msg.text ?? '',
        direction:  'in',
        created_at: msg.created_at ?? Math.floor(Date.now() / 1000),
      })
    }
  }

  return messages
}

export default router
