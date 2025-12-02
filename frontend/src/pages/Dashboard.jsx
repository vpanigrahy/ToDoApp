import { useEffect, useState } from 'react'
import { fetchAnalyticsSummary, fetchAnalyticsCFD, fetchAnalyticsStreak } from '../api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [cfdData, setCfdData] = useState([])
  const [streak, setStreak] = useState(null)
  const [timeWindow, setTimeWindow] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [timeWindow])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryData, cfdDataResponse, streakData] = await Promise.all([
  fetchAnalyticsSummary(timeWindow),
  fetchAnalyticsCFD(timeWindow),
  fetchAnalyticsStreak().catch(() => ({ on_time_streak_days: 0 }))
])

// Normalize dates to *local* Date objects so there is no 1-day shift
const normalizedCFD = cfdDataResponse.map((item) => {
  // item.date is "YYYY-MM-DD"
  const [year, month, day] = item.date.split('-').map(Number)
  const localDate = new Date(year, month - 1, day) // local midnight
  return { ...item, date: localDate }
})

setSummary(summaryData)
setCfdData(normalizedCFD)
setStreak(streakData)
    } catch (err) {
      setError(err.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const getMotivationalMessage = (rate) => {
    if (rate >= 0.8) return "🎉 Great consistency! Keep up the excellent work!"
    if (rate >= 0.5) return "💪 Good progress! Try finishing a bit earlier."
    return "📅 Focus on finishing tasks on time this week!"
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeWindow(7)}
            className={`px-4 py-2 rounded ${timeWindow === 7 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Last 7 days
          </button>
          <button
            onClick={() => setTimeWindow(30)}
            className={`px-4 py-2 rounded ${timeWindow === 30 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Last 30 days
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: On-time Completion Rate */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-blue-600 mb-2">On-Time Completion</h3>
          <div className="text-4xl font-bold text-gray-900 mb-3">
            {Math.round(summary.on_time_rate * 100)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${summary.on_time_rate * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            {summary.completed_on_time} of {summary.total_completed} tasks completed on time
          </p>
          <p className="text-xs text-green-600 mt-2">
            {getMotivationalMessage(summary.on_time_rate)}
          </p>
          
          {/* Optional Streak Badge */}
          {streak && streak.on_time_streak_days > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-orange-600">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-xs font-semibold">On-Time Streak</p>
                  <p className="text-sm font-bold">{streak.on_time_streak_days} {streak.on_time_streak_days === 1 ? 'day' : 'days'} in a row!</p>
                </div>
              </div>
              {streak.on_time_streak_days < 5 && (
                <p className="text-xs text-orange-500 mt-1">
                  Keep going to reach a 5-day streak 🏆
                </p>
              )}
            </div>
          )}
        </div>

        {/* Card 2: Tasks Completed This Week */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-green-600 mb-2">Tasks Completed This Week</h3>
          <div className="text-4xl font-bold text-gray-900 mb-3">
            {summary.tasks_completed_this_week}
          </div>
          <p className="text-sm text-green-600">
            {summary.tasks_completed_this_week > 0 
              ? "Great momentum! 🚀" 
              : "Start completing tasks this week"}
          </p>
        </div>

        {/* Card 3: Average Completion Time */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-purple-600 mb-2">Average Completion Time</h3>
          <div className="text-4xl font-bold text-gray-900 mb-3">
            {summary.avg_completion_days} 
            <span className="text-xl text-gray-500 ml-2">days</span>
          </div>
          <p className="text-sm text-purple-600">
            Average time from creation to completion
          </p>
        </div>
      </div>

      {/* Cumulative Flow Diagram */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cumulative Flow Diagram (CFD)</h2>
        <p className="text-sm text-gray-500 mb-6">
          Track your task flow over time. The chart shows how tasks move through different stages.
        </p>
        
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={cfdData}>
            <defs>
              <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="colorBacklog" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
               dataKey="date"
               stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}  
              tickFormatter={(value) => value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              labelFormatter={(value) => value.toLocaleDateString()}
            />
            <Legend 
              wrapperStyle={{ color: '#fff' }}
              iconType="square"
            />
            <Area 
              type="monotone" 
              dataKey="done" 
              stackId="1"
              stroke="#10b981" 
              fill="url(#colorDone)"
              name="Done"
            />
            <Area 
              type="monotone" 
              dataKey="in_progress" 
              stackId="1"
              stroke="#3b82f6" 
              fill="url(#colorInProgress)"
              name="In Progress"
            />
            <Area 
              type="monotone" 
              dataKey="backlog" 
              stackId="1"
              stroke="#f59e0b" 
              fill="url(#colorBacklog)"
              name="Backlog"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-700">
              <strong className="text-gray-900">Done:</strong> Completed tasks
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-700">
              <strong className="text-gray-900">In-Progress:</strong> Tasks being worked on (1-99% complete)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-gray-700">
              <strong className="text-gray-900">Backlog:</strong> Not started yet (0% complete)
            </span>
          </div>
        </div>
      </div>

      {/* Optional: Streak Badge */}
      {summary.on_time_rate >= 0.8 && summary.total_completed >= 3 && (
        <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <span className="text-4xl">🏆</span>
          <div>
            <h3 className="text-lg font-bold text-yellow-700">High Performer!</h3>
            <p className="text-sm text-yellow-600">
              You're maintaining an excellent on-time completion rate. Keep it up!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
