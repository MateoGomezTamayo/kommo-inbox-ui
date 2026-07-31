import ChannelBadge from './ChannelBadge.jsx'

function formatTime(ts) {
  if (!ts) return ''
  const date = new Date(ts * 1000)
  const now  = new Date()
  const diff = Math.floor((now - date) / 86400000) // días

  if (diff === 0) return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  if (diff === 1) return 'Ayer'
  if (diff < 7)   return date.toLocaleDateString('es-CO', { weekday: 'short' })
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })
}

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
}

export default function ConversationItem({ conversation, active, onClick }) {
  const { contact, channel, last_message, last_message_at, unread_count } = conversation

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${active ? 'bg-gray-100' : ''}`}
    >
      {/* Avatar + badge de canal */}
      <div className="relative shrink-0">
        {contact.avatar ? (
          <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium text-sm select-none">
            {initials(contact.name)}
          </div>
        )}
        <ChannelBadge channel={channel} size="sm" />
      </div>

      {/* Nombre + último mensaje + hora + no leídos */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-2">
          <span className="font-medium text-sm text-gray-900 truncate">{contact.name}</span>
          <span className="text-xs text-gray-400 shrink-0">{formatTime(last_message_at)}</span>
        </div>
        <div className="flex justify-between items-center mt-0.5 gap-2">
          <span className="text-sm text-gray-500 truncate">{last_message}</span>
          {unread_count > 0 && (
            <span className="shrink-0 bg-green-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-medium">
              {unread_count > 99 ? '99+' : unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
