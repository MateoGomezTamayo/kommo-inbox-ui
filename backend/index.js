import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'

import authRouter from './routes/auth.js'
import chatsRouter from './routes/chats.js'
import webhooksRouter from './routes/webhooks.js'

const app = express()
const httpServer = createServer(app)

// ─── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})

io.on('connection', (socket) => {
  console.log('[Socket] Cliente conectado:', socket.id)
  socket.on('disconnect', () => console.log('[Socket] Cliente desconectado:', socket.id))
})

// Inyectar io en cada request para que las rutas puedan emitir eventos
app.use((req, _res, next) => { req.io = io; next() })

// ─── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
// Kommo envía webhooks como application/x-www-form-urlencoded
app.use('/webhooks', express.urlencoded({ extended: true }))

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth', authRouter)
app.use('/api/chats', chatsRouter)
app.use('/webhooks', webhooksRouter)

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }))

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`[Server] http://localhost:${PORT}`)
  console.log(`[Auth]   Primer uso → visita http://localhost:${PORT}/auth/start`)
})
