import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  createTask,
  deleteTask,
  fetchTasks,
  fetchUser,
  updateTask,
  login,
  register,
  logout,
} from './api'

function App() {
  const [tasks, setTasks] = useState([])
  const [auth, setAuth] = useState({ id: null, username: '', isLoggedIn: false })
  const [loginForm, setLoginForm] = useState({ username: '', password: '', mode: 'login' })
  const [draft, setDraft] = useState({ name: '', dueDate: '', priority: 'P2', actionableText: '' })
  const [formError, setFormError] = useState('')
  const [serverError, setServerError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingIds, setPendingIds] = useState(() => new Set())
  const [currentPage, setCurrentPage] = useState('tasks') // Track current page
  const confettiRootRef = useRef(null)

  const sortByDueDate = (list) =>
    [...list].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

  const [filters, setFilters] = useState({ from: '', to: '', priority: '' })

  const markPending = (id) => {
    setPendingIds((current) => {
      const next = new Set(current)
      next.add(id)
      return next
    })
  }

  const releasePending = (id) => {
    setPendingIds((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }

  useEffect(() => {
    let cancelled = false

    // On hard refresh, get userId from path and populate username if possible
    const path = typeof window !== 'undefined' ? window.location.pathname : ''
    const match = path.match(/^\/user\/(\d+)/)
    if (match && !auth.username) {
      const userId = parseInt(match[1], 10)
      if (!Number.isNaN(userId)) {
        fetchUser(userId)
          .then((u) => {
            if (!cancelled) setAuth((a) => ({ ...a, id: u.id, username: u.username }))
          })
          .catch(() => {
            // Ignore errors
          })
      }
    }

    const loadTasks = async () => {
      setIsLoading(true)
      try {
        const data = await fetchTasks()
        if (!cancelled) {
          setTasks(sortByDueDate(data))
          setAuth((a) => ({ ...a, isLoggedIn: true }))
          setServerError('')
        }
      } catch (_) {
        if (!cancelled) {
          // 401 means not logged in
          setAuth({ username: '', isLoggedIn: false })
          // No need to check specific error status since we're using _ for unused variable
          try { 
            window.history.replaceState(null, '', '/') 
          } catch (_) {
            console.log('Unable to update history state')
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadTasks()

    return () => {
      cancelled = true
    }
  }, [])

  const remainingCount = useMemo(
    () => tasks.filter((task) => !task.completed).length,
    [tasks],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    const name = draft.name.trim()
    const dueDate = draft.dueDate.trim()
    const priority = draft.priority
    const actionableItems = draft.actionableText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    // Enhanced frontend validation
    if (!name) {
      setFormError('Task name is required and cannot be empty.')
      return
    }
    
    if (!dueDate) {
      setFormError('Due date is required.')
      return
    }
    
    // Validate due date is not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(dueDate)
    if (selectedDate < today) {
      setFormError('Due date cannot be in the past. Please select a future date.')
      return
    }
    
    if (!priority || !['P1', 'P2', 'P3'].includes(priority)) {
      setFormError('Please select a valid priority level (P1, P2, or P3).')
      return
    }
    
    if (actionableItems.length === 0) {
      setFormError('Actionable items cannot be empty. Please add at least one item.')
      return
    }

    try {
      setIsSubmitting(true)
      const createdTask = await createTask({ name, dueDate, priority, actionableItems, completionPercent: 0 })
      setTasks((current) => sortByDueDate([...current, createdTask]))
      setDraft({ name: '', dueDate: '', priority: 'P2', actionableText: '' })
      setFormError('')
      setServerError('')
    } catch (error) {
      setServerError(error.message || 'Unable to save the new task.')
      if (error && error.status === 401) {
        setAuth({ id: null, username: '', isLoggedIn: false })
        try { window.history.replaceState(null, '', '/') } catch {}
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const checkAuth = async () => {
    try {
      await fetchTasks()
      setAuth({ isLoggedIn: true })
    } catch (error) {
      setAuth({ isLoggedIn: false })
    }
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    const username = loginForm.username.trim()
    const password = loginForm.password
    
    // Enhanced validation
    if (!username) {
      setServerError('Username is required.')
      return
    }
    if (!password) {
      setServerError('Password is required.')
      return
    }
    
    if (loginForm.mode === 'register') {
      if (username.length < 3) {
        setServerError('Username must be at least 3 characters long.')
        return
      }
      if (password.length < 6) {
        setServerError('Password must be at least 6 characters long.')
        return
      }
    }
    
    try {
      setIsSubmitting(true)
      if (loginForm.mode === 'login') {
        const user = await login({ username, password })
        setAuth({ id: user.id, username: user.username, isLoggedIn: true })
        try { 
          window.history.replaceState(null, '', `/user/${user.id}`) 
        } catch (_) {
          console.log('Unable to update history state')
        }
        setServerError('')
        setNotice('')
        const data = await fetchTasks()
        setTasks(sortByDueDate(data))
      } else {
        await register({ username, password })
        setServerError('')
        setNotice('Account created successfully! Please log in.')
        setLoginForm((f) => ({ ...f, mode: 'login', username: '', password: '' }))
      }
    } catch (error) {
      setServerError(error.message || 'Authentication failed.')
      setNotice('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      setAuth({ id: null, username: '', isLoggedIn: false })
      setTasks([])
      try { 
        window.history.replaceState(null, '', `/`) 
      } catch (_) {
        console.log('Unable to update history state')
      }
    }
  }

  const triggerConfetti = () => {
    const root = confettiRootRef.current
    if (!root) return
    const burst = document.createElement('div')
    burst.className = 'confetti-burst'
    for (let i = 0; i < 24; i++) {
      const piece = document.createElement('span')
      piece.className = 'confetti-piece'
      piece.style.setProperty('--i', String(i))
      burst.appendChild(piece)
    }
    root.appendChild(burst)
    setTimeout(() => { burst.remove() }, 1500)
  }

  const toggleTask = async (task) => {
    const targetId = task.id
    const nextCompleted = !task.completed
    markPending(targetId)

    try {
      const updatedTask = await updateTask(targetId, {
        completed: nextCompleted,
      })
      setTasks((current) =>
        sortByDueDate(
          current.map((item) => (item.id === targetId ? updatedTask : item)),
        ),
      )
      setServerError('')
      if (nextCompleted) {
        triggerConfetti()
      }
    } catch (error) {
      setServerError(error.message || 'Unable to update the task.')
      if (error.status === 401) {
        setAuth({ id: null, username: '', isLoggedIn: false })
        try { 
          window.history.replaceState(null, '', '/') 
        } catch (_) {
          console.log('Unable to update history state')
        }
      }
    } finally {
      releasePending(targetId)
    }
  }

  const removeTask = async (id) => {
    markPending(id)
    try {
      await deleteTask(id)
      setTasks((current) => current.filter((task) => task.id !== id))
      setServerError('')
    } catch (error) {
      setServerError(error.message || 'Unable to delete the task.')
      if (error.status === 401) {
        setAuth({ id: null, username: '', isLoggedIn: false })
        try { 
          window.history.replaceState(null, '', '/') 
        } catch (_) {
          console.log('Unable to update history state')
        }
      }
    } finally {
      releasePending(id)
    }
  }

  const hasTasks = tasks.length > 0

  // Render different pages based on currentPage state
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'analytics':
        return (
          <div className="page-content">
            <h2>Analytics Page</h2>
            <p>Analytics features would be displayed here.</p>
            {/* You would import and render the Dashboard component here */}
          </div>
        )
      case 'completed':
        return (
          <div className="page-content">
            <h2>History Page</h2>
            <p>Completed tasks history would be displayed here.</p>
            {/* You would import and render the History component here */}
          </div>
        )
      case 'help':
        return (
          <div className="page-content">
            <h2>Help Page</h2>
            <p>Help documentation would be displayed here.</p>
            {/* You would import and render the Help component here */}
          </div>
        )
      case 'tasks':
      default:
        return (
          <>
            <div className="greeting">
              <h2>Hi, {auth.username}</h2>
            </div>

            <form className="task-form" onSubmit={handleSubmit} noValidate>
              {formError && (
                <div className="status-banner error" role="alert" style={{marginBottom: '1rem'}}>
                  {formError}
                </div>
              )}
              <div className="form-left">
                <div className="form-row">
                  <label htmlFor="task-name">Task name</label>
                  <input
                    id="task-name"
                    name="name"
                    value={draft.name}
                    placeholder="Write task name..."
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    aria-invalid={formError ? 'true' : 'false'}
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="due-date">Due date</label>
                  <input
                    id="due-date"
                    type="date"
                    name="dueDate"
                    value={draft.dueDate}
                    onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="priority">Priority level</label>
                  <select
                    id="priority"
                    name="priority"
                    value={draft.priority}
                    onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
                  >
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                    <option value="P3">P3</option>
                  </select>
                </div>
                <div className="form-row">
                  <label htmlFor="actionable-items">Actionable Items</label>
                  <textarea
                    id="actionable-items"
                    name="actionableItems"
                    placeholder="One item per line"
                    value={draft.actionableText}
                    onChange={(e) => setDraft({ ...draft, actionableText: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : 'Add Task'}
                  </button>
                </div>
              </div>
            </form>
          </>
        )
    }
  }

  return (
    <div className="app-page">
      <div className="app-shell">
        {/* VERY OBVIOUS DEBUG MESSAGE - THIS SHOULD BE IMPOSSIBLE TO MISS */}
        <div style={{ 
          backgroundColor: 'red', 
          color: 'white', 
          padding: '2rem', 
          borderRadius: '0.5rem', 
          marginBottom: '1rem',
          border: '5px solid yellow',
          textAlign: 'center',
          fontSize: '2rem',
          fontWeight: 'bold'
        }}>
          <p>DEBUG INFO:</p>
          <p>isLoggedIn: {auth.isLoggedIn ? 'TRUE' : 'FALSE'}</p>
          <p>currentPage: {currentPage}</p>
          <p>username: {auth.username || 'NOT SET'}</p>
        </div>

        {/* VERY OBVIOUS NAVIGATION - THIS SHOULD BE IMPOSSIBLE TO MISS */}
        {auth.isLoggedIn && (
          <div style={{ 
            backgroundColor: 'blue', 
            color: 'white', 
            padding: '2rem', 
            borderRadius: '0.5rem', 
            marginBottom: '1rem',
            border: '5px solid green',
            textAlign: 'center'
          }}>
            <h1>NAVIGATION MENU</h1>
            <div style={{ 
              display: 'flex', 
              gap: '1rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: '1rem'
            }}>
              <button 
                onClick={() => setCurrentPage('tasks')}
                style={{
                  backgroundColor: 'orange',
                  color: 'black',
                  border: '3px solid black',
                  borderRadius: '0.5rem',
                  padding: '1rem 2rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1.5rem'
                }}
              >
                TASKS
              </button>
              <button 
                onClick={() => setCurrentPage('analytics')}
                style={{
                  backgroundColor: 'orange',
                  color: 'black',
                  border: '3px solid black',
                  borderRadius: '0.5rem',
                  padding: '1rem 2rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1.5rem'
                }}
              >
                ANALYTICS
              </button>
              <button 
                onClick={() => setCurrentPage('completed')}
                style={{
                  backgroundColor: 'orange',
                  color: 'black',
                  border: '3px solid black',
                  borderRadius: '0.5rem',
                  padding: '1rem 2rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1.5rem'
                }}
              >
                HISTORY
              </button>
              <button 
                onClick={() => setCurrentPage('help')}
                style={{
                  backgroundColor: 'orange',
                  color: 'black',
                  border: '3px solid black',
                  borderRadius: '0.5rem',
                  padding: '1rem 2rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1.5rem'
                }}
              >
                HELP
              </button>
              <button 
                onClick={handleLogout}
                style={{
                  backgroundColor: 'red',
                  color: 'white',
                  border: '3px solid black',
                  borderRadius: '0.5rem',
                  padding: '1rem 2rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1.5rem'
                }}
              >
                LOGOUT
              </button>
            </div>
          </div>
        )}

        {!auth.isLoggedIn && (
          <header className="app-header">
            <h1>Task Management Tool</h1>
            <p className="app-subtitle">
              Prioritize and manage your tasks effectively.
            </p>
          </header>
        )}

        {serverError && (
          <div className="status-banner error" role="alert">
            {serverError}
          </div>
        )}
        {!serverError && notice && (
          <div className="status-banner" role="status">{notice}</div>
        )}

        {!auth.isLoggedIn ? (
          <form className="auth-form" onSubmit={handleAuthSubmit} noValidate autoComplete="off">
            <div className="auth-row">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                autoComplete="off"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="auth-row">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="new-password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="auth-actions">
              <button type="submit" className="primary-btn" disabled={isSubmitting}>
                {loginForm.mode === 'login' ? (isSubmitting ? 'Logging in…' : 'Login') : (isSubmitting ? 'Registering…' : 'Register')}
              </button>
              <button
                type="button"
                className="link"
                onClick={() => setLoginForm((f) => ({ ...f, mode: f.mode === 'login' ? 'register' : 'login' }))}
              >
                {loginForm.mode === 'login' ? 'Create account' : 'Have an account? Login'}
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Very Visible Navigation Menu */}
            <div style={{ 
              backgroundColor: '#1e293b', 
              padding: '1.5rem', 
              borderRadius: '0.75rem', 
              marginBottom: '1.5rem',
              border: '2px solid #4f46e5',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #334155'
              }}>
                <h1 style={{ 
                  margin: 0, 
                  color: '#ffffff',
                  fontSize: '1.8rem',
                  fontWeight: 'bold'
                }}>
                  📋 Task Management Tool
                </h1>
                <button 
                  onClick={handleLogout}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  🔒 Logout
                </button>
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '1rem',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <button 
                  onClick={() => setCurrentPage('tasks')}
                  style={{
                    backgroundColor: currentPage === 'tasks' ? '#4f46e5' : '#334155',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  📋 Tasks
                </button>
                <button 
                  onClick={() => setCurrentPage('analytics')}
                  style={{
                    backgroundColor: currentPage === 'analytics' ? '#4f46e5' : '#334155',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  📊 Analytics
                </button>
                <button 
                  onClick={() => setCurrentPage('completed')}
                  style={{
                    backgroundColor: currentPage === 'completed' ? '#4f46e5' : '#334155',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  ✅ History
                </button>
                <button 
                  onClick={() => setCurrentPage('help')}
                  style={{
                    backgroundColor: currentPage === 'help' ? '#4f46e5' : '#334155',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  ❓ Help
                </button>
              </div>
            </div>

            {/* Page Content */}
            {renderCurrentPage()}
          </>
        )}
        {/* helper removed as requested */}

        <section aria-live="polite" className="task-summary">
          {isLoading ? (
            <p className="status-message subtle">Loading tasks…</p>
          ) : hasTasks ? (
            <p>
              {remainingCount} of {tasks.length}{' '}
              {tasks.length === 1 ? 'task' : 'tasks'} remaining.
            </p>
          ) : null}
        </section>

        {auth.isLoggedIn && currentPage === 'tasks' && (
          <div className="filters">
            <div className="filter-row">
              <label htmlFor="from-date">From</label>
              <input
                id="from-date"
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              />
            </div>
            <div className="filter-row">
              <label htmlFor="to-date">To</label>
              <input
                id="to-date"
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              />
            </div>
            <div className="filter-row">
              <label htmlFor="priority-filter">Priority</label>
              <select
                id="priority-filter"
                value={filters.priority}
                onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
              >
                <option value="">All</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
              </select>
            </div>
            <div className="filter-actions">
              <button type="button" className="secondary-btn" onClick={() => setFilters({ from: '', to: '', priority: '' })}>Clear</button>
            </div>
          </div>
        )}

        {auth.isLoggedIn && currentPage === 'tasks' && (
          <div className="task-list-wrapper">
            {isLoading ? (
              <p className="status-message">Fetching your tasks…</p>
            ) : hasTasks ? (
              <ul className="task-cards">
                {tasks
                  .filter((task) => {
                    const d = new Date(task.dueDate)
                    const fromOk = !filters.from || d >= new Date(filters.from)
                    const toOk = !filters.to || d <= new Date(filters.to)
                    const prOk = !filters.priority || task.priority === filters.priority
                    return fromOk && toOk && prOk
                  })
                  .map((task) => {
                  const isBusy = pendingIds.has(task.id)
                  return (
                    <li key={task.id} className={`task-card ${task.completed ? 'completed' : 'inprogress'}`}>
                      <div className="task-card-header">
                        <span className={`priority ${task.priority}`}>{task.priority}</span>
                        <span className="due-date"><strong>Due</strong> {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="task-card-body">
                        <h3 className="task-name">{task.name}</h3>
                        {Array.isArray(task.actionableItems) && task.actionableItems.length > 0 && (
                          <ul className="actionable-list">
                            {task.actionableItems.map((it, idx) => (
                              <li key={idx}>{it}</li>
                            ))}
                          </ul>
                        )}
                          <div className="percent-row">
                            <label>Completion: <strong>{task.completionPercent ?? 0}%</strong></label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={task.completionPercent ?? 0}
                              onChange={async (e) => {
                                const cp = parseInt(e.target.value, 10)
                                markPending(task.id)
                                try {
                                  const updated = await updateTask(task.id, { completionPercent: cp })
                                  setTasks((current) => sortByDueDate(current.map((t) => (t.id === task.id ? updated : t))))
                                } catch (error) {
                                  setServerError(error.message || 'Unable to update task.')
                                } finally {
                                  releasePending(task.id)
                                }
                              }}
                              disabled={isBusy}
                            />
                          </div>
                      </div>
                      <div className="task-card-actions">
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(task)}
                            disabled={isBusy}
                          />
                          <span>Completed</span>
                        </label>
                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => removeTask(task.id)}
                          disabled={isBusy}
                        >
                          Delete
                        </button>
                      </div>
                        <details className="edit-panel">
                          <summary>Edit</summary>
                          <div className="edit-grid">
                            <div className="form-row">
                              <label>Due date</label>
                              <input
                                type="date"
                                defaultValue={task.dueDate.slice(0,10)}
                                onBlur={async (e) => {
                                  const dueDate = e.target.value
                                  if (!dueDate) return
                                  markPending(task.id)
                                  try {
                                    const updated = await updateTask(task.id, { dueDate })
                                    setTasks((current) => sortByDueDate(current.map((t) => (t.id === task.id ? updated : t))))
                                  } finally { releasePending(task.id) }
                                }}
                                disabled={isBusy}
                              />
                            </div>
                            <div className="form-row">
                              <label>Priority level</label>
                              <select
                                defaultValue={task.priority}
                                onChange={async (e) => {
                                  const priority = e.target.value
                                  markPending(task.id)
                                  try {
                                    const updated = await updateTask(task.id, { priority })
                                    setTasks((current) => sortByDueDate(current.map((t) => (t.id === task.id ? updated : t))))
                                  } finally { releasePending(task.id) }
                                }}
                                disabled={isBusy}
                              >
                                <option value="P1">P1</option>
                                <option value="P2">P2</option>
                                <option value="P3">P3</option>
                              </select>
                            </div>
                            <div className="form-row">
                              <label>Actionable Items</label>
                              <textarea
                                defaultValue={(task.actionableItems || []).join('\n')}
                                rows={3}
                                onBlur={async (e) => {
                                  const actionableItems = e.target.value.split('\n').map(s=>s.trim()).filter(Boolean)
                                  markPending(task.id)
                                  try {
                                    const updated = await updateTask(task.id, { actionableItems })
                                    setTasks((current) => current.map((t) => (t.id === task.id ? updated : t)))
                                  } finally { releasePending(task.id) }
                                }}
                                disabled={isBusy}
                              />
                            </div>
                          </div>
                        </details>
                    </li>
                  )
                })}
              </ul>
            ) : auth.isLoggedIn ? (
              <p className="status-message subtle">Start creating your tasks</p>
            ) : null}
          </div>
        )}
      </div>
      <div ref={confettiRootRef} className="confetti-root" aria-hidden="true" />
    </div>
  )
}

export default App
