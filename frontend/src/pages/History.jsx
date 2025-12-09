import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCompletedTasks, logout, getCurrentUser } from '../api'

export default function History() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [showMenu, setShowMenu] = useState(false)
  const [username, setUsername] = useState('')
  const navigate = useNavigate()
  const menuRef = useRef(null)

  useEffect(() => {
    loadCompletedTasks()
    loadUser()
  }, [])

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

  const loadCompletedTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchCompletedTasks(365)
      setTasks(data)
    } catch (err) {
      setError(err.message || 'Failed to load completed tasks')
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

  const filteredTasks = tasks.filter(task => {
    if (filter === 'onTime') return task.onTime
    if (filter === 'late') return !task.onTime
    return true
  })

  const onTimeCount = tasks.filter(t => t.onTime).length
  const lateCount = tasks.filter(t => !t.onTime).length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem' }}>
      {/* Header with Menu */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              Completed Tasks History
            </h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '1rem' }}>
              Review your task completion record and performance
            </p>
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
          Loading completed tasks...
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto 1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Completed</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{tasks.length}</div>
            </div>
            <div style={{
              backgroundColor: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#166534', marginBottom: '0.5rem' }}>✅ On Time</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#15803d' }}>{onTimeCount}</div>
            </div>
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.5rem' }}>❌ Late</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{lateCount}</div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto 1.5rem',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: filter === 'all' ? '#3b82f6' : '#e5e7eb',
                color: filter === 'all' ? 'white' : '#374151'
              }}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('onTime')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: filter === 'onTime' ? '#10b981' : '#e5e7eb',
                color: filter === 'onTime' ? 'white' : '#374151'
              }}
            >
              On Time ({onTimeCount})
            </button>
            <button
              onClick={() => setFilter('late')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: filter === 'late' ? '#ef4444' : '#e5e7eb',
                color: filter === 'late' ? 'white' : '#374151'
              }}
            >
              Late ({lateCount})
            </button>
          </div>

          {/* Tasks List */}
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {filteredTasks.length === 0 ? (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '3rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No completed tasks found</p>
                <p style={{ fontSize: '0.875rem' }}>Complete some tasks to see them here!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: task.onTime ? '#dcfce7' : '#fee2e2',
                      border: task.onTime ? '1px solid #86efac' : '1px solid #fca5a5',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>{task.onTime ? '✅' : '❌'}</span>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                            {task.name}
                            <span style={{
                              marginLeft: '0.5rem',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              backgroundColor: task.priority === 'P1' ? '#fee2e2' : task.priority === 'P2' ? '#fef3c7' : '#dbeafe',
                              color: task.priority === 'P1' ? '#991b1b' : task.priority === 'P2' ? '#92400e' : '#1e40af'
                            }}>
                              {task.priority}
                            </span>
                          </h3>
                        </div>
                        
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '0.5rem',
                          fontSize: '0.875rem'
                        }}>
                          <div>
                            <span style={{ color: '#6b7280' }}>Due Date: </span>
                            <span style={{ color: '#111827', fontWeight: '500' }}>
                              {new Date(new Date(task.dueDate).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#6b7280' }}>Completed: </span>
                            <span style={{ color: '#111827', fontWeight: '500' }}>
                              {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#6b7280' }}>Status: </span>
                            <span style={{
                              color: task.onTime ? '#15803d' : '#dc2626',
                              fontWeight: '600'
                            }}>
                              {task.onTime ? 'On Time' : 'Late'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Information Box */}
          <div style={{
            maxWidth: '1400px',
            margin: '2rem auto 0',
            backgroundColor: '#dbeafe',
            border: '1px solid #93c5fd',
            borderRadius: '0.75rem',
            padding: '1rem'
          }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>
              ℹ️ About Completion Status
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: 0 }}>
              Tasks are marked as <strong style={{ color: '#15803d' }}>On Time</strong> if they were completed on or before the due date.
              Tasks completed after the due date are marked as <strong style={{ color: '#dc2626' }}>Late</strong>.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
