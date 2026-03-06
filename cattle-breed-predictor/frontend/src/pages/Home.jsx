import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { predictBreed } from '../api/axiosClient'
import UploadZone from '../components/UploadZone'
import PredictionResult from '../components/PredictionResult'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorToast from '../components/ErrorToast'
import EmptyState from '../components/EmptyState'

function Home() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [error, setError] = useState(null)

  const predictMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await predictBreed(formData)
      return response.data
    },
    onSuccess: (data) => {
      setPrediction(data)
      setError(null)
      // Scroll to results
      setTimeout(() => {
        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    },
    onError: (err) => {
      setError(err.message || 'Failed to analyze image')
      setPrediction(null)
    },
  })

  const handleFileSelect = async (file) => {
    if (file) {
      setSelectedFile(file)
      // Trigger prediction with the file
      await predictMutation.mutateAsync(file)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPrediction(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-forest via-forest to-bark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-cream mb-4">
            Cattle Breed AI Predictor
          </h1>
          <p className="text-lg text-cream/70 max-w-2xl mx-auto">
            Upload a cattle image to instantly identify the breed, view detailed characteristics, and get AI-powered insights.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Upload or Results */}
          {!prediction ? (
            <section className="max-w-2xl mx-auto">
              <UploadZone
                onFileSelect={handleFileSelect}
                isLoading={predictMutation.isPending}
              />
              
              {predictMutation.isPending && (
                <div className="mt-8">
                  <p className="text-cream/60 text-center mb-4">Analysing image...</p>
                  <div className="w-12 h-12 rounded-full border-4 border-amber/20 border-t-amber animate-spin mx-auto" />
                </div>
              )}
            </section>
          ) : predictMutation.isPending ? (
            <section className="max-w-6xl">
              <LoadingSkeleton />
            </section>
          ) : (
            <section className="space-y-8">
              <PredictionResult data={prediction} />
              
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="btn btn-secondary"
                >
                  New Analysis
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Error Toast */}
        {error && (
          <ErrorToast
            message={error}
            onClose={() => setError(null)}
          />
        )}
      </div>
    </div>
  )
}

export default Home
