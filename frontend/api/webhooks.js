// Endpoint para recibir notificaciones de Kommo en tiempo real.
// Configura esta URL en Kommo → Ajustes → WEB HOOKS.
// El frontend usa polling cada 5s, así que este endpoint solo sirve para logs/auditoría.
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  // Para tiempo real en Vercel serverless, el cliente hace polling en /api/messages.
  res.status(200).end()
}
