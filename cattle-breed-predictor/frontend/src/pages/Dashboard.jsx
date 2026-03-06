import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer as AreaResponsive } from 'recharts'
import { fetchStats, fetchTimeline } from '../api/axiosClient'
import StatCard from '../components/StatCard'
import { TrendingUp, Target, Activity, Calendar } from 'lucide-react'

const BREED_COLORS = [
  '#d4852a', '#4a7c59', '#f5f0e8', '#3d2b1f', '#a67c52',
  '#8b5a3c', '#6b9573', '#d4af37', '#bf8f00', '#c0504d'
]

function Dashboard() {
  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: () => fetchStats().then(res => res.data),
  })

  const timelineQuery = useQuery({
    queryKey: ['timeline', 30],
    queryFn: () => fetchTimeline(30).then(res => res.data),
  })

  const stats = statsQuery.data || {}
  const timeline = timelineQuery.data || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-forest via-forest to-bark fade-in-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-cream mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-cream/70">
            Overview of your cattle breed prediction activity
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Predictions"
            value={stats.total_predictions || 0}
            subtitle="All time"
            icon={Target}
            animateNumber
          />
          <StatCard
            title="Top Breed"
            value={stats.top_breed || 'N/A'}
            subtitle={`${stats.breed_distribution?.[0]?.count || 0} detections`}
            icon={TrendingUp}
          />
          <StatCard
            title="Avg Confidence"
            value={`${(stats.avg_confidence || 0).toFixed(1)}%`}
            subtitle="Overall accuracy"
            icon={Activity}
          />
          <StatCard
            title="Today's Scans"
            value={stats.predictions_today || 0}
            subtitle={`${stats.predictions_this_week || 0} this week`}
            icon={Calendar}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Breed Distribution Pie Chart */}
          <div className="card">
            <h2 className="text-xl font-bold text-cream mb-4">Breed Distribution</h2>
            {stats.breed_distribution && stats.breed_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.breed_distribution}
                    nameKey="breed"
                    dataKey="count"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ breed, percentage }) => `${breed} (${percentage}%)`}
                  >
                    {stats.breed_distribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={BREED_COLORS[index % BREED_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#3d2b1f',
                      border: '1px solid rgba(212, 133, 42, 0.5)',
                      borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: '#f5f0e8' }}
                    formatter={(value) => [`${value} predictions`, 'Count']}
                  />
                  <Legend
                    wrapperStyle={{ color: '#f5f0e8' }}
                    verticalAlign="bottom"
                    height={36}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-cream/60">
                No data available
              </div>
            )}
          </div>

          {/* Timeline Area Chart */}
          <div className="card">
            <h2 className="text-xl font-bold text-cream mb-4">Predictions Over Time</h2>
            {timeline.length > 0 ? (
              <AreaResponsive width="100%" height={300} data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 133, 42, 0.2)" />
                <XAxis
                  dataKey="date"
                  stroke="#f5f0e8"
                  tick={{ fontSize: 12 }}
                  style={{ color: '#f5f0e8' }}
                />
                <YAxis stroke="#f5f0e8" tick={{ fontSize: 12 }} />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#3d2b1f',
                    border: '1px solid rgba(212, 133, 42, 0.5)',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: '#f5f0e8' }}
                  formatter={(value) => [`${value} predictions`, 'Count']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#d4852a"
                  fill="#d4852a"
                  fillOpacity={0.3}
                  isAnimationActive={true}
                />
              </AreaResponsive>
            ) : (
              <div className="h-80 flex items-center justify-center text-cream/60">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Breed Stats Table */}
        <div className="card">
          <h2 className="text-xl font-bold text-cream mb-4">Breed Breakdown</h2>
          {stats.breed_distribution && stats.breed_distribution.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber/20">
                    <th className="text-left py-3 px-4 text-cream/60 font-semibold">Breed</th>
                    <th className="text-left py-3 px-4 text-cream/60 font-semibold">Count</th>
                    <th className="text-left py-3 px-4 text-cream/60 font-semibold">Percentage</th>
                    <th className="text-left py-3 px-4 text-cream/60 font-semibold">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.breed_distribution.map((breed, idx) => (
                    <tr key={idx} className="border-b border-amber/10 hover:bg-amber/5">
                      <td className="py-3 px-4 font-medium text-cream">{breed.breed}</td>
                      <td className="py-3 px-4 text-cream/70">{breed.count}</td>
                      <td className="py-3 px-4">
                        <span className="badge badge-amber">{breed.percentage}%</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-bark/50 rounded-full h-2">
                          <div
                            className="bg-amber h-2 rounded-full"
                            style={{ width: `${breed.percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-cream/60">
              No predictions yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
