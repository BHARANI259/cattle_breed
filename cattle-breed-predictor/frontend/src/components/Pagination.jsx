import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function Pagination({ page, totalPages, total, limit, onPageChange }) {
  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-4 bg-bark/30 rounded-lg border border-amber/10">
      <p className="text-cream/70 text-sm">
        Page <span className="font-bold text-cream">{page}</span> of{' '}
        <span className="font-bold text-amber">{totalPages}</span> ·{' '}
        <span className="font-bold text-amber">{total}</span> total results
      </p>

      <div className="flex items-center gap-2">
        {/* Previous */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed p-2"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Page numbers */}
        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let pageNum
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (page <= 3) {
              pageNum = i + 1
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = page - 2 + i
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 rounded text-sm font-medium transition-all ${
                  pageNum === page
                    ? 'bg-amber text-forest'
                    : 'bg-bark/50 text-cream hover:bg-amber/20'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed p-2"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

export default Pagination
