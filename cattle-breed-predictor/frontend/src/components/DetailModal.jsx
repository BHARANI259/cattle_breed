import React from 'react'
import { X, Eye, Trash2, AlertTriangle } from 'lucide-react'
import BreedInfoCard from './BreedInfoCard'
import { useBreedInfo } from '../hooks/useBreedInfo'

function DetailModal({ prediction, onClose, onDelete }) {
  const breedInfoMutation = useBreedInfo()
  const [showBreedInfo, setShowBreedInfo] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState(null)

  // Debug mutation state
  React.useEffect(() => {
    if (breedInfoMutation.data) {
      console.log('✅ Breed info mutation succeeded:', breedInfoMutation.data)
      setErrorMessage(null)
      setShowBreedInfo(true)
    }
    if (breedInfoMutation.error) {
      console.error('❌ Breed info mutation error:', breedInfoMutation.error)
      const errorMsg = extractErrorMessage(breedInfoMutation.error)
      setErrorMessage(errorMsg)
      setShowBreedInfo(false)
    }
  }, [breedInfoMutation.data, breedInfoMutation.error])

  if (!prediction) return null

  // Extract detailed error message from various error sources
  const extractErrorMessage = (error) => {
    if (!error) return 'Unknown error occurred'
    
    // HTTPException detail with nested structure
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail
      if (typeof detail === 'object') {
        return detail.reason || detail.message || JSON.stringify(detail)
      }
      return detail
    }
    
    // Standard error message
    if (error.message) {
      return error.message
    }
    
    return 'Failed to fetch breed information'
  }

  const handleFetchBreedInfo = async () => {
    try {
      console.log('🔄 Fetching breed info for:', prediction.predicted_breed)
      const result = await breedInfoMutation.mutateAsync({
        breed_name: prediction.predicted_breed,
        confidence: prediction.confidence_score,
      })
      console.log('✅ Mutation result:', result)
    } catch (error) {
      console.error('❌ Failed to fetch breed info:', error)
      const msg = extractErrorMessage(error)
      setErrorMessage(msg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-forest max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-lg border border-amber/20 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="sticky top-0 right-0 p-4 hover:bg-amber/10 transition-colors float-right z-10"
        >
          <X size={24} className="text-cream" />
        </button>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-cream mb-2">
              {prediction.predicted_breed}
            </h2>
            <p className="text-cream/60">
              Detected on {new Date(prediction.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Image */}
          <div>
            <img
              src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${prediction.annotated_image_url}`}
              alt="Annotated"
              loading="lazy"
              className="w-full rounded-lg"
            />
          </div>

          {/* Confidence & Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-cream/60 text-sm uppercase mb-2">Confidence</p>
              <p className="text-2xl font-bold text-amber">
                {(prediction.confidence_score * 100).toFixed(1)}%
              </p>
            </div>
            <div className="card text-center">
              <p className="text-cream/60 text-sm uppercase mb-2">Total Detections</p>
              <p className="text-2xl font-bold text-cream">
                {prediction.bounding_boxes?.length || 0}
              </p>
            </div>
            <div className="card text-center">
              <p className="text-cream/60 text-sm uppercase mb-2">Image</p>
              <p className="text-sm text-cream truncate">{prediction.image_filename}</p>
            </div>
          </div>

          {/* Breed Info from Database */}
          {prediction.breed_info ? (
            <BreedInfoCard
              breedInfo={prediction.breed_info}
              isLoading={false}
              onRefresh={() => {}}
            />
          ) : null}

          {/* Loading State */}
          {breedInfoMutation.isPending && (
            <div className="card border border-amber/50 bg-amber/10">
              <div className="flex items-center gap-3">
                <div className="animate-spin">
                  <div className="w-5 h-5 border-2 border-amber border-t-transparent rounded-full" />
                </div>
                <span className="text-amber">Loading breed information...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {errorMessage && (
            <div className="card border border-red-700/50 bg-red-900/20 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-300 mb-1">Failed to Load Breed Information</h3>
                  <p className="text-red-200 text-sm">{errorMessage}</p>
                  {errorMessage.toLowerCase().includes('timeout') && (
                    <p className="text-red-200 text-xs mt-2">💡 The LLM is taking longer than usual. Please try again in a moment.</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleFetchBreedInfo}
                disabled={breedInfoMutation.isPending}
                className="btn btn-secondary mt-3 text-sm w-full"
              >
                {breedInfoMutation.isPending ? 'Retrying...' : 'Try Again'}
              </button>
            </div>
          )}

          {/* Fetch Button */}
          {!prediction.breed_info && !errorMessage && !breedInfoMutation.isPending && (
            <button
              onClick={handleFetchBreedInfo}
              disabled={breedInfoMutation.isPending}
              className="btn btn-primary w-full"
            >
              Fetch Breed Information
            </button>
          )}

          {/* Mutated Breed Info (from new fetch) */}
          {breedInfoMutation.data && !prediction.breed_info && (
            <BreedInfoCard
              breedInfo={breedInfoMutation.data}
              isLoading={breedInfoMutation.isPending}
              onRefresh={() => {}}
            />
          )}

          {/* Delete Button */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  `Delete this prediction of ${prediction.predicted_breed}?`
                )
              ) {
                onDelete(prediction.id)
                onClose()
              }
            }}
            className="btn w-full flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
            }}
          >
            <Trash2 size={18} />
            Delete Prediction
          </button>
        </div>
      </div>
    </div>
  )
}

export default DetailModal

