import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { api } from '../lib/api.js'
import { usePolling } from '../hooks/useSocket.js'

const InboxContext = createContext(null)

const init = {
  connected:             false,
  conversations:         [],
  activeChatId:          null,
  messages:              {},   // { [chatId]: Message[] }
  loadingConversations:  false,
  loadingMessages:       false,
  searchQuery:           '',
  page:                  1,
  hasMore:               true,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload }

    case 'SET_LOADING_CONVERSATIONS':
      return { ...state, loadingConversations: action.payload }

    case 'SET_CONVERSATIONS':
      return {
        ...state,
        // Solo reemplazar si hay datos — nunca borrar conversaciones existentes por un poll vacío
        conversations: action.payload.page === 1
          ? (action.payload.chats.length > 0 ? action.payload.chats : state.conversations)
          : [...state.conversations, ...action.payload.chats],
        page:    action.payload.page,
        hasMore: action.payload.has_more,
      }

    case 'SET_ACTIVE_CHAT':
      return { ...state, activeChatId: action.payload }

    case 'SET_LOADING_MESSAGES':
      return { ...state, loadingMessages: action.payload }

    case 'SET_MESSAGES':
      return {
        ...state,
        messages: { ...state.messages, [action.payload.chatId]: action.payload.messages },
      }

    case 'APPEND_MESSAGE': {
      const { chatId, message } = action.payload
      const existing = state.messages[chatId] ?? []
      if (existing.some(m => m.id === message.id)) return state
      return {
        ...state,
        messages: { ...state.messages, [chatId]: [...existing, message] },
        conversations: state.conversations.map(c =>
          c.id === chatId
            ? {
                ...c,
                last_message:    message.text,
                last_message_at: message.created_at,
                unread_count:    c.id === state.activeChatId ? 0 : (c.unread_count ?? 0) + 1,
              }
            : c
        ),
      }
    }

    case 'MARK_READ':
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.payload ? { ...c, unread_count: 0 } : c
        ),
      }

    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload, page: 1, hasMore: true }

    default:
      return state
  }
}

export function InboxProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init)

  // Verificar si ya hay tokens al montar
  useEffect(() => {
    api.getAuthStatus()
      .then(({ connected }) => dispatch({ type: 'SET_CONNECTED', payload: connected }))
      .catch(() => dispatch({ type: 'SET_CONNECTED', payload: false }))
  }, [])

  // Cargar conversaciones cuando hay conexión o cambia la búsqueda
  useEffect(() => {
    if (state.connected) loadConversations(1)
  }, [state.connected, state.searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadConversations = useCallback(async (page = 1) => {
    dispatch({ type: 'SET_LOADING_CONVERSATIONS', payload: true })
    try {
      const params = { page, limit: 50 }
      if (state.searchQuery) params.q = state.searchQuery
      const data = await api.getChats(params)
      dispatch({ type: 'SET_CONVERSATIONS', payload: { ...data, page } })
    } catch (err) {
      console.error('[Inbox] Error cargando conversaciones:', err)
    } finally {
      dispatch({ type: 'SET_LOADING_CONVERSATIONS', payload: false })
    }
  }, [state.searchQuery])

  const selectChat = useCallback(async (chatId) => {
    dispatch({ type: 'SET_ACTIVE_CHAT', payload: chatId })
    if (!chatId) return
    dispatch({ type: 'MARK_READ', payload: chatId })
    if (!state.messages[chatId]) {
      dispatch({ type: 'SET_LOADING_MESSAGES', payload: true })
      try {
        const data = await api.getMessages(chatId)
        dispatch({ type: 'SET_MESSAGES', payload: { chatId, messages: data.messages } })
      } catch (err) {
        console.error('[Inbox] Error cargando mensajes:', err)
      } finally {
        dispatch({ type: 'SET_LOADING_MESSAGES', payload: false })
      }
    }
  }, [state.messages])

  const sendMessage = useCallback(async (chatId, text) => {
    // Agregar optimistamente antes de confirmar con el servidor
    const tempId = `temp-${Date.now()}`
    dispatch({
      type: 'APPEND_MESSAGE',
      payload: {
        chatId,
        message: { id: tempId, chat_id: chatId, text, direction: 'out', created_at: Math.floor(Date.now() / 1000) },
      },
    })
    try {
      await api.sendMessage(chatId, text)
    } catch (err) {
      console.error('[Inbox] Error enviando mensaje:', err)
    }
  }, [])

  const setSearchQuery = useCallback((q) => {
    dispatch({ type: 'SET_SEARCH', payload: q })
  }, [])

  // Polling: mensajes del chat activo cada 5s
  const pollMessages = useCallback(async () => {
    if (!state.activeChatId) return
    try {
      const data = await api.getMessages(state.activeChatId)
      const existingIds = new Set((state.messages[state.activeChatId] ?? []).map(m => m.id))
      for (const msg of data.messages) {
        if (!existingIds.has(msg.id)) {
          dispatch({ type: 'APPEND_MESSAGE', payload: { chatId: state.activeChatId, message: msg } })
        }
      }
    } catch { /* silenciar errores de polling */ }
  }, [state.activeChatId, state.messages])

  usePolling(pollMessages, 5000, !!state.activeChatId && state.connected)

  // Polling: refrescar lista de conversaciones cada 30s
  const pollChats = useCallback(() => {
    if (state.connected) loadConversations(1)
  }, [state.connected, loadConversations])

  usePolling(pollChats, 30000, state.connected)

  return (
    <InboxContext.Provider value={{
      ...state,
      loadConversations,
      selectChat,
      sendMessage,
      setSearchQuery,
    }}>
      {children}
    </InboxContext.Provider>
  )
}

export function useInbox() {
  const ctx = useContext(InboxContext)
  if (!ctx) throw new Error('useInbox debe usarse dentro de InboxProvider')
  return ctx
}
