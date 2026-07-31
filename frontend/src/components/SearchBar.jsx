import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'

export default function SearchBar({ onChange }) {
  const [value, setValue] = useState('')

  const handleChange = useCallback((e) => {
    setValue(e.target.value)
    onChange(e.target.value)
  }, [onChange])

  const clear = useCallback(() => {
    setValue('')
    onChange('')
  }, [onChange])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Buscar conversación"
        className="w-full bg-gray-100 rounded-lg pl-9 pr-8 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-green-500 transition-colors"
      />
      {value && (
        <button
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Limpiar búsqueda"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
