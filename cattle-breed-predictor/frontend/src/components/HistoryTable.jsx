import React, { useState } from 'react'
import { Eye, Trash2 } from 'lucide-react'

function HistoryTable({ predictions, isLoading, onView, onDelete }) {
  const getConfidenceBadgeColor = (confidence) => {
    if (confidence >= 0.8) return 'badge-sage'
    if (confidence >= 0.5) return 'badge-amber'
    return 'badge-red'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="h-20 bg-amber/10 rounded-lg animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (predictions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-cream/60">No predictions found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-amber/20">
            <th className="text-left py-3 px-4 text-cream/60 font-semibold">#</th>
            <th className="text-left py-3 px-4 text-cream/60 font-semibold">Image</th>
            <th className="text-left py-3 px-4 text-cream/60 font-semibold">Breed</th>
            <th className="text-left py-3 px-4 text-cream/60 font-semibold">Confidence</th>
            <th className="text-left py-3 px-4 text-cream/60 font-semibold">Date</th>
            <th className="text-left py-3 px-4 text-cream/60 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((pred, idx) => (
            <tr
              key={pred.id}
              className="border-b border-amber/10 hover:bg-amber/5 transition-colors"
            >
              <td className="py-3 px-4 text-cream/70">{idx + 1}</td>
              <td className="py-3 px-4">
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${pred.image_url}`}
                  alt={pred.predicted_breed}
                  loading="lazy"
                  className="w-12 h-12 rounded object-cover bg-bark/50"
                  onError={(e) => {
                    e.target.src =
                      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect fill=%22%233d2b1f%22 width=%2264%22 height=%2264%22/%3E%3C/svg%3E'
                  }}
                />
              </td>
              <td className="py-3 px-4 font-medium text-cream">
                {pred.predicted_breed}
              </td>
              <td className="py-3 px-4">
                <span className={`badge ${getConfidenceBadgeColor(pred.confidence_score)}`}>
                  {(pred.confidence_score * 100).toFixed(1)}%
                </span>
              </td>
              <td className="py-3 px-4 text-cream/70">
                <div className="text-xs">
                  <div>{formatDate(pred.created_at)}</div>
                  <div className="text-cream/50">{formatTime(pred.created_at)}</div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => onView(pred.id)}
                    className="btn btn-ghost btn-sm p-2"
                    title="View details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this prediction?')) {
                        onDelete(pred.id)
                      }
                    }}
                    className="btn btn-ghost btn-sm p-2 text-red-400 hover:text-red-300"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default HistoryTable
