import React from 'react'
import { AlertCircle, RotateCcw, Check, X } from 'lucide-react'
import LoadingSkeleton from './LoadingSkeleton'

function BreedInfoCard({ breedInfo, isLoading, onRefresh }) {
  // Always show when data is available (no expansion logic needed)
  
  if (isLoading) {
    return (
      <div className="card mt-8 fade-in-up">
        <div className="h-10 bg-amber/10 rounded w-1/3 animate-pulse mb-4" />
        <LoadingSkeleton />
      </div>
    )
  }

  if (!breedInfo || breedInfo.error) {
    return (
      <div className="card mt-8 fade-in-up border border-red-700/50 bg-red-900/20">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-300">Failed to Load Breed Information</h3>
            <p className="text-red-200 text-sm mt-1">
              {breedInfo?.error || 'Unable to fetch data from LLM'}
            </p>
            <button
              onClick={onRefresh}
              className="btn btn-secondary mt-3 text-sm"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card mt-8 fade-in-up space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-cream">{breedInfo.breed_name}</h2>
        <button
          onClick={onRefresh}
          className="btn btn-secondary btn-sm"
          title="Refresh breed information"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Overview */}
      <section className="space-y-3">
        <h3 className="font-bold text-amber">Overview</h3>
        <div className="space-y-2">
          <p className="text-cream/80">
            <span className="text-amber font-semibold">Origin:</span> {breedInfo.origin}
          </p>
          <p className="text-cream/80">{breedInfo.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {breedInfo.purpose?.map(p => (
            <span key={p} className="badge badge-amber">{p}</span>
          ))}
        </div>
      </section>

      {/* Physical Stats */}
      <section className="space-y-3">
        <h3 className="font-bold text-amber">Physical Characteristics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {breedInfo.characteristics?.avg_weight_kg && (
            <>
              <div className="bg-amber/10 rounded-lg p-3">
                <p className="text-cream/60 text-xs uppercase">Weight (Male)</p>
                <p className="text-cream font-bold">
                  {breedInfo.characteristics.avg_weight_kg.male} kg
                </p>
              </div>
              <div className="bg-amber/10 rounded-lg p-3">
                <p className="text-cream/60 text-xs uppercase">Weight (Female)</p>
                <p className="text-cream font-bold">
                  {breedInfo.characteristics.avg_weight_kg.female} kg
                </p>
              </div>
            </>
          )}
          {breedInfo.characteristics?.lifespan_years && (
            <div className="bg-amber/10 rounded-lg p-3">
              <p className="text-cream/60 text-xs uppercase">Lifespan</p>
              <p className="text-cream font-bold">
                {breedInfo.characteristics.lifespan_years} years
              </p>
            </div>
          )}
        </div>

        {breedInfo.characteristics?.coat_color && (
          <div>
            <p className="text-cream/60 text-xs uppercase mb-2">Coat Colors</p>
            <div className="flex flex-wrap gap-2">
              {breedInfo.characteristics.coat_color.map(color => (
                <span key={color} className="badge badge-sage">{color}</span>
              ))}
            </div>
          </div>
        )}

        {breedInfo.characteristics?.body_type && (
          <p className="text-cream/80">
            <span className="text-amber font-semibold">Body Type:</span> {breedInfo.characteristics.body_type}
          </p>
        )}
      </section>

      {/* Temperament & Climate */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {breedInfo.temperament && (
          <div className="bg-amber/10 rounded-lg p-4">
            <h4 className="font-bold text-amber mb-2">Temperament</h4>
            <p className="text-cream/80">{breedInfo.temperament}</p>
          </div>
        )}
        {breedInfo.suitable_climate && (
          <div className="bg-sage/10 rounded-lg p-4">
            <h4 className="font-bold text-sage mb-2">Suitable Climate</h4>
            <div className="flex flex-wrap gap-2">
              {breedInfo.suitable_climate.map(climate => (
                <span key={climate} className="badge badge-sage text-xs">
                  {climate}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Milk Production */}
      {breedInfo.milk_production_liters_per_day && (
        <section className="bg-bark/50 rounded-lg p-4 border border-amber/20">
          <h3 className="font-bold text-amber mb-3">Milk Production</h3>
          <div>
            <p className="text-cream/60 text-sm">Daily Yield</p>
            <p className="text-cream font-bold">
              {breedInfo.milk_production_liters_per_day} L/day
            </p>
          </div>
        </section>
      )}

      {/* Pros & Cons */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {breedInfo.pros && (
          <div className="space-y-2">
            <h4 className="font-bold text-sage flex items-center gap-2">
              <Check className="w-4 h-4" />
              Strengths
            </h4>
            <ul className="space-y-1">
              {breedInfo.pros.map((pro, i) => (
                <li key={i} className="text-cream/80 text-sm flex gap-2">
                  <Check className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" />
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {breedInfo.cons && (
          <div className="space-y-2">
            <h4 className="font-bold text-red-400 flex items-center gap-2">
              <X className="w-4 h-4" />
              Considerations
            </h4>
            <ul className="space-y-1">
              {breedInfo.cons.map((con, i) => (
                <li key={i} className="text-cream/80 text-sm flex gap-2">
                  <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Fun Fact */}
      {breedInfo.fun_fact && (
        <section className="bg-sage/10 rounded-lg p-4 border border-sage/30 italic">
          <p className="text-cream/90">💡 {breedInfo.fun_fact}</p>
        </section>
      )}
    </div>
  )
}

export default BreedInfoCard
