import { LogOut } from 'lucide-react'
import { useInbox } from '../context/InboxContext.jsx'
import ConversationItem from './ConversationItem.jsx'
import SearchBar from './SearchBar.jsx'

export default function Sidebar({ onLogout }) {
  const {
    conversations,
    loadingConversations,
    activeChatId,
    selectChat,
    setSearchQuery,
    hasMore,
    loadConversations,
    page,
  } = useInbox()

  return (
    <div className="w-80 md:w-96 flex flex-col border-r border-gray-200 bg-white h-screen">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-gray-800">Mensajes</h1>
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
        <SearchBar onChange={setSearchQuery} />
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {loadingConversations && conversations.length === 0 ? (
          // Skeleton loader
          <div className="flex flex-col">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded mb-2 w-3/4" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {conversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                active={conv.id === activeChatId}
                onClick={() => selectChat(conv.id)}
              />
            ))}

            {/* Cargar más */}
            {hasMore && !loadingConversations && conversations.length > 0 && (
              <button
                className="w-full py-3 text-sm text-green-600 hover:bg-gray-50 transition-colors font-medium"
                onClick={() => loadConversations(page + 1)}
              >
                Cargar más conversaciones
              </button>
            )}

            {!loadingConversations && conversations.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-10">Sin conversaciones</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
