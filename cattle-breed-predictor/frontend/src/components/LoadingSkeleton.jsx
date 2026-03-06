import React from 'react'

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 fade-in-up">
      {/* Left: Image skeleton */}
      <div className="card animate-pulse">
        <div className="w-full aspect-square bg-amber/10 rounded-lg" />
      </div>

      {/* Right: Info skeleton */}
      <div className="space-y-6">
        {/* Heading */}
        <div className="h-10 bg-amber/10 rounded-lg w-3/4 animate-pulse" />
        
        {/* Badge */}
        <div className="h-8 bg-amber/10 rounded-full w-1/3 animate-pulse" />
        
        {/* Ring placeholder */}
        <div className="w-40 h-40 bg-amber/10 rounded-full animate-pulse mx-auto" />
        
        {/* Bar chart skeleton */}
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-2">
              <div className="h-6 bg-amber/10 rounded flex-1 animate-pulse" />
              <div className="h-6 bg-amber/10 rounded w-12 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Button skeleton */}
        <div className="h-10 bg-amber/10 rounded-lg w-1/2 animate-pulse" />
      </div>
    </div>
  )
}

export default LoadingSkeleton
