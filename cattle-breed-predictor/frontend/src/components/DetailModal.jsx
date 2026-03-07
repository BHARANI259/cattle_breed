import React from 'react'
import { X, Eye, Trash2 } from 'lucide-react'
import BreedInfoCard from './BreedInfoCard'
import { useBreedInfo } from '../hooks/useBreedInfo'

function DetailModal({ prediction, onClose, onDelete }) {
  const breedInfoMutation = useBreedInfo()
  const [showBreedInfo, setShowBreedInfo] = React.useState(false)

  // Debug mutation state
  React.useEffect(() => {
    if (breedInfoMutation.data) {
      console.log('✅ Breed info mutation succeeded:', breedInfoMutation.data)
    }
    if (breedInfoMutation.error) {
      console.error('❌ Breed info mutation error:', breedInfoMutation.error)
    }
  }, [breedInfoMutation.data, breedInfoMutation.error])

  if (!prediction) return null

  const handleFetchBreedInfo = async () => {
    try {
      console.log('🔄 Fetching breed info for:', prediction.predicted_breed)
      const result = await breedInfoMutation.mutateAsync({
        breed_name: prediction.predicted_breed,
        confidence: prediction.confidence_score,
      })
      console.log('✅ Mutation result:', result)
      console.log('✅ Result type:', typeof result)
      console.log('✅ Result keys:', result ? Object.keys(result) : 'null')
      setShowBreedInfo(true)
    } catch (error) {
      console.error('❌ Failed to fetch breed info:', error)
      console.error('❌ Error response:', error.response?.data)
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

          {/* Breed Info */}
          {prediction.breed_info ? (
            <BreedInfoCard
              breedInfo={prediction.breed_info}
              isLoading={false}
              onRefresh={() => {}}
            />
          ) : breedInfoMutation.error ? (
            <div className="card border border-red-700/50 bg-red-900/20">
              <p className="text-red-300">Error: {breedInfoMutation.error.message}</p>
              <button
                onClick={handleFetchBreedInfo}
                className="btn btn-secondary mt-3 text-sm"
              >
                Try Again
              </button>
            </div>
          ) : (
            <button
              onClick={handleFetchBreedInfo}
              disabled={breedInfoMutation.isPending}
              className="btn btn-primary w-full"
            >
              {breedInfoMutation.isPending
                ? 'Loading Breed Information...'
                : 'Fetch Breed Information'}
            </button>
          )}

          {/* Mutated Breed Info */}
          {breedInfoMutation.data && (
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
