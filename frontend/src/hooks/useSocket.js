import { useEffect, useRef } from 'react'

// Ejecuta callback cada `interval` ms mientras enabled sea true.
// Siempre llama la versión más reciente del callback (via ref).
export function usePolling(callback, interval = 5000, enabled = true) {
  const ref = useRef(callback)
  useEffect(() => { ref.current = callback }, [callback])

  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => ref.current(), interval)
    return () => clearInterval(id)
  }, [interval, enabled])
}
