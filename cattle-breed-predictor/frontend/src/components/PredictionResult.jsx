import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchBreedInfo, deleteBreedCache } from '../api/axiosClient'
import BreedInfoCard from './BreedInfoCard'
import ErrorToast from './ErrorToast'

function ConfidenceRing({ confidence }) {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - confidence)

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        className="drop-shadow-lg"
      >
        {/* Background circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="rgba(212, 133, 42, 0.1)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#d4852a"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '80px 80px',
            transition: 'stroke-dashoffset 1s ease-out',
          }}
        />
        {/* Center text */}
        <text
          x="80"
          y="85"
          textAnchor="middle"
          dy="0.3em"
          className="text-2xl font-bold fill-amber"
        >
          {(confidence * 100).toFixed(1)}%
        </text>
      </svg>
      <p className="text-cream/70 text-center text-sm">Confidence Score</p>
    </div>
  )
}

function PredictionResult({ data, onViewBreedInfo }) {
  const [showBreedInfo, setShowBreedInfo] = useState(false)
  const [breedInfo, setBreedInfo] = useState(null)
  const [isLoadingBreedInfo, setIsLoadingBreedInfo] = useState(false)
  const [error, setError] = useState(null)

  // Prepare top 5 breeds for chart
  const topBreeds = Object.entries(data.all_class_scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, score]) => ({
      breed: name,
      confidence: parseFloat((score * 100).toFixed(1)),
    }))

  const handleViewBreedInfo = async () => {
    if (breedInfo) {
      setShowBreedInfo(!showBreedInfo)
      return
    }

    setIsLoadingBreedInfo(true)
    setError(null)

    try {
      const response = await fetchBreedInfo(
        data.predicted_breed,
        data.confidence_score
      )
      setBreedInfo(response.data.breed_info)
      setShowBreedInfo(true)
    } catch (err) {
      setError(err.message || 'Failed to fetch breed information')
      setIsLoadingBreedInfo(false)
    }
  }

  const handleRefreshBreedInfo = async () => {
    setIsLoadingBreedInfo(true)
    setError(null)

    try {
      // Clear cache for this breed
      await deleteBreedCache(data.predicted_breed)
      
      // Fetch fresh
      const response = await fetchBreedInfo(
        data.predicted_breed,
        data.confidence_score
      )
      setBreedInfo(response.data.breed_info)
    } catch (err) {
      setError(err.message || 'Failed to refresh breed information')
      setIsLoadingBreedInfo(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 fade-in-up">
        {/* Left: Annotated Image */}
        <div className="card overflow-hidden">
          <img
            src={data.annotated_image_url}
            alt="Annotated prediction"
            className="w-full rounded-lg"
          />
          <p className="text-cream/60 text-sm mt-4">
            {data.image_filename}
          </p>
        </div>

        {/* Right: Prediction Info */}
        <div className="space-y-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Breed Name */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-cream mb-3">
              {data.predicted_breed}
            </h1>
            <p className="text-cream/60">Detected cattle breed</p>
          </div>

          {/* Confidence Ring */}
          <ConfidenceRing confidence={data.confidence_score} />

          {/* Top 5 Breeds Chart */}
          <div className="card bg-bark/50 border border-amber/10">
            <h3 className="text-amber font-bold mb-4">Breed Detection Scores</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={topBreeds}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 120, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 133, 42, 0.2)" />
                <XAxis type="number" stroke="#f5f0e8" />
                <YAxis
                  dataKey="breed"
                  type="category"
                  width={110}
                  tick={{ fill: '#f5f0e8', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#3d2b1f',
                    border: '1px solid rgba(212, 133, 42, 0.5)',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: '#f5f0e8' }}
                  formatter={(value) => `${value}%`}
                />
                <Bar dataKey="confidence" fill="#d4852a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* View Breed Info Button */}
          <button
            onClick={handleViewBreedInfo}
            disabled={isLoadingBreedInfo}
            className="btn btn-primary w-full"
          >
            {isLoadingBreedInfo
              ? 'Loading breed information...'
              : showBreedInfo
              ? 'Hide Breed Information'
              : 'View Full Breed Info'}
          </button>
        </div>
      </div>

      {/* Breed Info Card */}
      <BreedInfoCard
        breedInfo={breedInfo}
        isLoading={isLoadingBreedInfo}
        onRefresh={handleRefreshBreedInfo}
      />

      {/* Error Toast */}
      {error && (
        <ErrorToast
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </>
  )
}

export default PredictionResult
