import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

export function useSocket(onNewMessages) {
  // Ref para siempre llamar la versión más reciente del callback
  const handlerRef = useRef(onNewMessages)
  useEffect(() => { handlerRef.current = onNewMessages }, [onNewMessages])

  useEffect(() => {
    const BACKEND = import.meta.env.VITE_BACKEND_URL || ''
    const socket = io(BACKEND || window.location.origin, {
      transports: ['websocket', 'polling'],
    })

    socket.on('new_messages', (messages) => {
      handlerRef.current?.(messages)
    })

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Error de conexión:', err.message)
    })

    return () => socket.disconnect()
  }, []) // Solo conectar una vez
}
