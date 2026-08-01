import { useInbox } from '../context/InboxContext.jsx'
import Sidebar from '../components/Sidebar.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function Inbox({ onLogout }) {
  const { connected, activeChatId } = useInbox()

  // Sin tokens — mostrar pantalla de conexión
  if (!connected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center px-6">
          <div className="text-6xl mb-5">💬</div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Kommo Inbox</h1>
          <p className="text-gray-400 mb-8 text-sm max-w-xs mx-auto">
            Conecta tu cuenta Kommo para ver y responder conversaciones de WhatsApp, Instagram, Facebook y TikTok.
          </p>
          <a
            href="/api/auth-start"
            className="inline-block bg-green-500 text-white px-8 py-3 rounded-full font-medium hover:bg-green-600 transition-colors shadow-md"
          >
            Conectar con Kommo
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar siempre visible en desktop, oculto en mobile cuando hay chat activo */}
      <div className={`${activeChatId ? 'hidden md:flex' : 'flex'} flex-col`}>
        <Sidebar onLogout={onLogout} />
      </div>

      {/* Panel de chat */}
      <div className={`${activeChatId ? 'flex' : 'hidden md:flex'} flex-1 min-w-0`}>
        {activeChatId ? <ChatPanel /> : <EmptyState />}
      </div>
    </div>
  )
}
