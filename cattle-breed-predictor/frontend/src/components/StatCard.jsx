import React, { useEffect, useState } from 'react'

function StatCard({ title, value, subtitle, icon: Icon, animateNumber = false }) {
  const [displayValue, setDisplayValue] = useState(animateNumber ? 0 : value)

  useEffect(() => {
    if (animateNumber && typeof value === 'number') {
      let current = 0
      const target = value
      const increment = target / 30
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          setDisplayValue(target)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(current))
        }
      }, 16)
      return () => clearInterval(timer)
    } else {
      setDisplayValue(value)
    }
  }, [value, animateNumber])

  return (
    <div className="card border-t-4 border-t-amber">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-cream/70 text-sm uppercase font-semibold">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-amber" />}
      </div>

      <div className="space-y-2">
        <p className="text-3xl md:text-4xl font-bold text-cream">
          {typeof displayValue === 'number' && displayValue % 1 !== 0
            ? displayValue.toFixed(2)
            : displayValue}
        </p>
        {subtitle && <p className="text-cream/50 text-sm">{subtitle}</p>}
      </div>
    </div>
  )
}

export default StatCard
