import { MessageSquare } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-center px-8">
      <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mb-5">
        <MessageSquare className="w-9 h-9 text-green-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Kommo Inbox</h2>
      <p className="text-gray-400 text-sm max-w-xs">
        Selecciona una conversación para ver el chat
      </p>
    </div>
  )
}
