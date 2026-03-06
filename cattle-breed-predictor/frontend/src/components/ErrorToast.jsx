import React, { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

function ErrorToast({ message, onClose }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 4000)

    return () => clearTimeout(timer)
  }, [onClose])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 fade-in-up">
      <div className="bg-red-900 border border-red-700 rounded-lg px-4 py-3 flex items-start gap-3 max-w-sm">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-100 text-sm">{message}</p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-red-400 hover:text-red-300 flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default ErrorToast
