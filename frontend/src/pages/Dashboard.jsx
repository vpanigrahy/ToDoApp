import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAnalyticsSummary, fetchAnalyticsCFD, fetchAnalyticsStreak, logout, getCurrentUser } from '../api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [cfdData, setCfdData] = useState([])
  const [streak, setStreak] = useState(null)
  const [timeWindow, setTimeWindow] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [username, setUsername] = useState('')
  const navigate = useNavigate()
  const menuRef = useRef(null)

  useEffect(() => {
    loadData()
    loadUser()
  }, [timeWindow])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const loadUser = async () => {
    try {
      const user = await getCurrentUser()
      setUsername(user.username || 'User')
    } catch (error) {
      setUsername('User')
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryData, cfdDataResponse, streakData] = await Promise.all([
        fetchAnalyticsSummary(timeWindow),
        fetchAnalyticsCFD(timeWindow),
        fetchAnalyticsStreak().catch(() => ({ on_time_streak_days: 0 }))
      ])

      // Normalize dates to local Date objects
      const normalizedCFD = cfdDataResponse.map((item) => {
        const [year, month, day] = item.date.split('-').map(Number)
        const localDate = new Date(year, month - 1, day)
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

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  const getMotivationalMessage = (rate) => {
    if (rate >= 0.8) return "🎉 Great consistency! Keep up the excellent work!"
    if (rate >= 0.5) return "💪 Good progress! Try finishing a bit earlier."
    return "📅 Focus on finishing tasks on time this week!"
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem' }}>
      {/* Header with Menu */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              Analytics Dashboard
            </h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '1rem' }}>
              Track your productivity and task completion metrics
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Time Window Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setTimeWindow(7)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: timeWindow === 7 ? '#3b82f6' : '#e5e7eb',
                  color: timeWindow === 7 ? 'white' : '#374151'
                }}
              >
                Last 7 days
              </button>
              <button
                onClick={() => setTimeWindow(30)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: timeWindow === 30 ? '#3b82f6' : '#e5e7eb',
                  color: timeWindow === 30 ? 'white' : '#374151'
                }}
              >
                Last 30 days
              </button>
            </div>

            {/* Menu Button */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                <span style={{ fontWeight: '600' }}>Menu</span>
              </button>
              
              {showMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  minWidth: '200px',
                  zIndex: 50
                }}>
                  <button
                    onClick={() => { navigate('/tasks'); setShowMenu(false); }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#111827',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    📋 Tasks
                  </button>
                  <button
                    onClick={() => { navigate('/analytics'); setShowMenu(false); }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#111827',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    📊 Analytics
                  </button>
                  <button
                    onClick={() => { navigate('/completed'); setShowMenu(false); }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#111827',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    ✅ Completed
                  </button>
                  <button
                    onClick={() => { navigate('/help'); setShowMenu(false); }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#111827',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    ❓ Help
                  </button>
                  <button
                    onClick={() => { handleLogout(); setShowMenu(false); }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#dc2626',
                      fontWeight: '500'
                    }}
                  >
                    🔒 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto 1rem',
          padding: '1rem',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '0.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '3rem',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          Loading analytics...
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto 2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Card 1: On-time Completion Rate */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#3b82f6', marginBottom: '0.5rem' }}>
                On-Time Completion
              </h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
                {Math.round(summary.on_time_rate * 100)}%
              </div>
              <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '0.75rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    background: 'linear-gradient(to right, #3b82f6, #10b981)',
                    height: '0.75rem',
                    borderRadius: '9999px',
                    transition: 'width 0.5s ease',
                    width: `${summary.on_time_rate * 100}%`
                  }}
                ></div>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {summary.completed_on_time} of {summary.total_completed} tasks completed on time
              </p>
              <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem' }}>
                {getMotivationalMessage(summary.on_time_rate)}
              </p>
              
              {streak && streak.on_time_streak_days > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
                    <span style={{ fontSize: '1.5rem' }}>🔥</span>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: '600' }}>On-Time Streak</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                        {streak.on_time_streak_days} {streak.on_time_streak_days === 1 ? 'day' : 'days'} in a row!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Tasks Completed This Week */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#10b981', marginBottom: '0.5rem' }}>
                Tasks Completed This Week
              </h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
                {summary.tasks_completed_this_week}
              </div>
              <p style={{ fontSize: '0.875rem', color: '#10b981' }}>
                {summary.tasks_completed_this_week > 0 
                  ? "Great momentum! 🚀" 
                  : "Start completing tasks this week"}
              </p>
            </div>

            {/* Card 3: Average Completion Time */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#a855f7', marginBottom: '0.5rem' }}>
                Average Completion Time
              </h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
                {(() => {
                  const hasMinutes = summary && summary.avg_completion_minutes != null
                  const totalMinutes = hasMinutes
                    ? Number(summary.avg_completion_minutes)
                    : Number(summary?.avg_completion_days ?? 0) * 24 * 60

                  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
                    return (
                      <span style={{ fontSize: '1.25rem' }}>
                        0 <span style={{ fontSize: '1rem', color: '#6b7280', marginLeft: '0.25rem' }}>days</span>{' '}
                        0 <span style={{ fontSize: '1rem', color: '#6b7280', marginLeft: '0.25rem' }}>hours</span>{' '}
                        0 <span style={{ fontSize: '1rem', color: '#6b7280', marginLeft: '0.25rem' }}>minutes</span>
                      </span>
                    )
                  }

                  const minutesPerDay = 24 * 60
                  let days = Math.floor(totalMinutes / minutesPerDay)
                  let remaining = totalMinutes - days * minutesPerDay
                  let hours = Math.floor(remaining / 60)
                  let minutes = Math.round(remaining - hours * 60)

                  if (minutes === 60) {
                    minutes = 0
                    hours += 1
                  }
                  if (hours === 24) {
                    hours = 0
                    days += 1
                  }

                  return (
                    <span style={{ fontSize: '1.25rem' }}>
                      {days} <span style={{ fontSize: '1rem', color: '#6b7280', marginLeft: '0.25rem' }}>days</span>{' '}
                      {hours} <span style={{ fontSize: '1rem', color: '#6b7280', marginLeft: '0.25rem' }}>hours</span>{' '}
                      {minutes} <span style={{ fontSize: '1rem', color: '#6b7280', marginLeft: '0.25rem' }}>minutes</span>
                    </span>
                  )
                })()}
              </div>
              <p style={{ fontSize: '0.875rem', color: '#a855f7' }}>
                Average time from creation to completion
              </p>
            </div>
          </div>

          {/* Cumulative Flow Diagram */}
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto 2rem',
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
              Cumulative Flow Diagram (CFD)
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tick={{ fill: '#6b7280' }}
                  tickFormatter={(value) => value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    color: '#111827'
                  }}
                  labelFormatter={(value) => value.toLocaleDateString()}
                />
                <Legend 
                  wrapperStyle={{ color: '#111827' }}
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

            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '1rem', height: '1rem', backgroundColor: '#10b981', borderRadius: '0.25rem' }}></div>
                <span style={{ color: '#374151' }}>
                  <strong style={{ color: '#111827' }}>Done:</strong> Completed tasks
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '1rem', height: '1rem', backgroundColor: '#3b82f6', borderRadius: '0.25rem' }}></div>
                <span style={{ color: '#374151' }}>
                  <strong style={{ color: '#111827' }}>In-Progress:</strong> Tasks being worked on (1-99%)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '1rem', height: '1rem', backgroundColor: '#f59e0b', borderRadius: '0.25rem' }}></div>
                <span style={{ color: '#374151' }}>
                  <strong style={{ color: '#111827' }}>Backlog:</strong> Not started yet (0%)
                </span>
              </div>
            </div>
          </div>

          {/* Achievement Badge */}
          {summary.on_time_rate >= 0.8 && summary.total_completed >= 3 && (
            <div style={{
              maxWidth: '1400px',
              margin: '0 auto',
              background: 'linear-gradient(to right, #fef3c7, #fed7aa)',
              border: '1px solid #fbbf24',
              borderRadius: '0.75rem',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <span style={{ fontSize: '2.5rem' }}>🏆</span>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#92400e' }}>High Performer!</h3>
                <p style={{ fontSize: '0.875rem', color: '#b45309' }}>
                  You're maintaining an excellent on-time completion rate. Keep it up!
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
