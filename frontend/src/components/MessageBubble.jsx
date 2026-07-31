function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts * 1000).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message }) {
  const isSent = message.direction === 'out'

  return (
    <div className={`flex mb-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[75%] lg:max-w-[60%] px-3 py-2 rounded-2xl shadow-sm ${
          isSent
            ? 'bg-green-500 text-white rounded-tr-none'
            : 'bg-white text-gray-800 rounded-tl-none'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
        <span className={`text-xs mt-0.5 block text-right leading-none ${isSent ? 'text-green-100' : 'text-gray-400'}`}>
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  )
}
