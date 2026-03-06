import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, ArrowUpDown } from 'lucide-react'
import { fetchHistory, fetchPrediction, deletePrediction } from '../api/axiosClient'
import { useDebounce } from '../hooks/useDebounce'
import HistoryTable from '../components/HistoryTable'
import DetailModal from '../components/DetailModal'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'

function History() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [searchBreed, setSearchBreed] = useState('')
  const [sort, setSort] = useState('newest')
  const [selectedId, setSelectedId] = useState(null)
  const [selectedPrediction, setSelectedPrediction] = useState(null)

  const debouncedBreed = useDebounce(searchBreed, 400)

  // Fetch history
  const historyQuery = useQuery({
    queryKey: ['history', page, limit, debouncedBreed, sort],
    queryFn: () =>
      fetchHistory({
        page,
        limit,
        breed: debouncedBreed || undefined,
        sort,
      }).then(res => res.data),
    keepPreviousData: true,
  })

  // Fetch single prediction
  const predictionQuery = useQuery({
    queryKey: ['prediction', selectedId],
    queryFn: () => fetchPrediction(selectedId).then(res => res.data),
    enabled: !!selectedId,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deletePrediction,
    onMutate: async (id) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ['history'] })
      
      // Optimistic update
      const previousData = queryClient.getQueryData(['history', page, limit, debouncedBreed, sort])
      if (previousData) {
        queryClient.setQueryData(['history', page, limit, debouncedBreed, sort], {
          ...previousData,
          items: previousData.items.filter(item => item.id !== id),
          total: previousData.total - 1,
        })
      }
      return { previousData }
    },
    onError: (err, id, context) => {
      // Rollback
      queryClient.setQueryData(
        ['history', page, limit, debouncedBreed, sort],
        context.previousData
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] })
    },
  })

  const handleViewPrediction = async (id) => {
    setSelectedId(id)
  }

  React.useEffect(() => {
    if (predictionQuery.data) {
      setSelectedPrediction(predictionQuery.data)
    }
  }, [predictionQuery.data])

  const handleDelete = (id) => {
    deleteMutation.mutate(id)
  }

  const data = historyQuery.data || { items: [], total: 0, page: 1, limit: 10, total_pages: 1 }

  return (
    <div className="min-h-screen bg-gradient-to-b from-forest via-forest to-bark fade-in-up">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-cream mb-2">
            Prediction History
          </h1>
          <p className="text-cream/70">
            View and manage all your cattle breed predictions
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="card mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cream/40" />
              <input
                type="text"
                placeholder="Search by breed name..."
                value={searchBreed}
                onChange={(e) => {
                  setSearchBreed(e.target.value)
                  setPage(1) // Reset to page 1
                }}
                className="input pl-10"
              />
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}
              className="btn btn-secondary flex items-center gap-2"
            >
              <ArrowUpDown size={18} />
              {sort === 'newest' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-amber/10">
            <p className="text-cream/70">
              Total predictions: <span className="text-amber font-bold">{data.total}</span>
            </p>
            {debouncedBreed && (
              <p className="text-cream/70">
                Filtered by: <span className="text-amber font-bold">{debouncedBreed}</span>
              </p>
            )}
          </div>
        </div>

        {/* Table */}
        {data.items.length === 0 && !historyQuery.isLoading ? (
          <div className="card">
            <EmptyState
              title="No Predictions Found"
              message={
                debouncedBreed
                  ? `No predictions found for "${debouncedBreed}"`
                  : 'Start by uploading an image on the Home page'
              }
            />
          </div>
        ) : (
          <>
            <div className="card">
              <HistoryTable
                predictions={data.items}
                isLoading={historyQuery.isLoading}
                onView={handleViewPrediction}
                onDelete={handleDelete}
              />
            </div>

            {/* Pagination */}
            {data.total_pages > 1 && (
              <Pagination
                page={data.page}
                totalPages={data.total_pages}
                total={data.total}
                limit={data.limit}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal
        prediction={selectedPrediction}
        onClose={() => {
          setSelectedId(null)
          setSelectedPrediction(null)
        }}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default History
