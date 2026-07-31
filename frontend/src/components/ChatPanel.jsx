import { useState, useEffect, useRef } from 'react'
import { Send, ArrowLeft } from 'lucide-react'
import { useInbox } from '../context/InboxContext.jsx'
import MessageBubble from './MessageBubble.jsx'
import ChannelBadge from './ChannelBadge.jsx'

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
}

export default function ChatPanel() {
  const { activeChatId, conversations, messages, loadingMessages, sendMessage, selectChat } = useInbox()
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  const conversation  = conversations.find(c => c.id === activeChatId)
  const chatMessages  = messages[activeChatId] ?? []

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages.length])

  async function handleSend(e) {
    e.preventDefault()
    const msg = text.trim()
    if (!msg || !activeChatId) return
    setText('')
    await sendMessage(activeChatId, msg)
  }

  if (!conversation) return null
  const { contact, channel } = conversation

  return (
    <div className="flex flex-col flex-1 min-w-0 h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <button
          className="md:hidden text-gray-500 hover:text-gray-700 mr-1"
          onClick={() => selectChat(null)}
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative shrink-0">
          {contact.avatar ? (
            <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium text-sm">
              {initials(contact.name)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{contact.name}</p>
          <div className="mt-0.5">
            <ChannelBadge channel={channel} showLabel />
          </div>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {loadingMessages ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`h-10 rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-white w-48' : 'bg-green-200 w-36'}`} />
              </div>
            ))}
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">No hay mensajes aún</p>
          </div>
        ) : (
          chatMessages.map(msg => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-green-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="bg-green-500 text-white rounded-full p-2.5 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            aria-label="Enviar"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
