import React from 'react'
import { Camera } from 'lucide-react'

function EmptyState({ title, message, icon: Icon = Camera }) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="w-16 h-16 rounded-full bg-amber/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-amber" />
      </div>
      <h3 className="text-xl font-bold text-cream mb-2">{title}</h3>
      <p className="text-cream/60 text-center max-w-sm">{message}</p>
    </div>
  )
}

export default EmptyState
