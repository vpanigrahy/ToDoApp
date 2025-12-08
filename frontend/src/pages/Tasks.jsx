import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from '../api'

// Parse "YYYY-MM-DD" as a local date (no timezone shift)
const parseLocalDate = (isoDate) => {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [draft, setDraft] = useState({ name: '', dueDate: '', priority: 'P2', actionableText: '' })
  const [formError, setFormError] = useState('')
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingIds, setPendingIds] = useState(() => new Set())
  const confettiRootRef = useRef(null)

  const [sortMode, setSortMode] = useState('EDD')
  const sortByStrategy = (list, mode = sortMode) => {
    const copy = [...list]
    if (mode === 'SPT') {
      return copy.sort(
        (a, b) => (Array.isArray(a.actionableItems) ? a.actionableItems.length : 0) - (Array.isArray(b.actionableItems) ? b.actionableItems.length : 0)
      )
    }
    if (mode === 'WSPT') {
      const weight = (p) => (p === 'P1' ? 3 : p === 'P2' ? 2 : 1)
      const score = (t) => {
        const est = Array.isArray(t.actionableItems) ? t.actionableItems.length : 0
        return est > 0 ? weight(t.priority) / est : weight(t.priority)
      }
      return copy.sort((a, b) => score(b) - score(a))
    }
    return copy.sort((a, b) =>  parseLocalDate(a.dueDate) - parseLocalDate(b.dueDate))
  }

  const [filters, setFilters] = useState({ from: '', to: '', priority: '' })
  const [hideCompleted, setHideCompleted] = useState(false)
  const [showOverdueAlert, setShowOverdueAlert] = useState(true)

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setTasks((current) => sortByStrategy(current, sortMode))
  }, [sortMode])

  useEffect(() => {
    let cancelled = false

    const loadTasks = async () => {
      setIsLoading(true)
      try {
        const data = await fetchTasks()
        if (!cancelled) {
          setTasks(sortByStrategy(data))
          setServerError('')
        }
      } catch (error) {
        if (!cancelled) {
          setServerError(error.message || 'Failed to load tasks')
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

  const overdueTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return tasks.filter(
      (task) => {
         const due = parseLocalDate(task.dueDate)
         return !task.completed && due && due < today
      }
    )
  }, [tasks])

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
    const selectedDate = parseLocalDate(dueDate)
    if (selectedDate < today) {
         setFormError('Please select today’s date or a future date')
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
      setTasks((current) => sortByStrategy([...current, createdTask]))
      setDraft({ name: '', dueDate: '', priority: 'P2', actionableText: '' })
      setFormError('')
      setServerError('')
    } catch (error) {
      setServerError(error.message || 'Unable to save the new task.')
    } finally {
      setIsSubmitting(false)
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
        sortByStrategy(
          current.map((item) => (item.id === targetId ? updatedTask : item)),
        ),
      )
      setServerError('')
      if (nextCompleted) {
        triggerConfetti()
      }
    } catch (error) {
      setServerError(error.message || 'Unable to update the task.')
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
    } finally {
      releasePending(id)
    }
  }

  const hasTasks = tasks.length > 0

  return (
    <div className="app-page">
      <div className="app-shell">
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {serverError}
        </div>
      )}

      <form className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm" onSubmit={handleSubmit} noValidate>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Task</h2>
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            {formError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-name" className="block text-sm font-medium text-gray-700 mb-1">
              Task name
            </label>
            <input
              id="task-name"
              name="name"
              value={draft.name}
              placeholder="Write task name..."
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="due-date" className="block text-sm font-medium text-gray-700 mb-1">
              Due date
            </label>
            <input
              id="due-date"
              type="date"
              name="dueDate"
              value={draft.dueDate}
              onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
              className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority level
            </label>
            <select
              id="priority"
              name="priority"
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
              className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="P1">P1 - High</option>
              <option value="P2">P2 - Medium</option>
              <option value="P3">P3 - Low</option>
            </select>
          </div>
          <div>
            <label htmlFor="actionable-items" className="block text-sm font-medium text-gray-700 mb-1">
              Actionable Items
            </label>
            <textarea
              id="actionable-items"
              name="actionableItems"
              placeholder="One item per line"
              value={draft.actionableText}
              onChange={(e) => setDraft({ ...draft, actionableText: e.target.value })}
              rows={3}
              className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving…' : 'Add Task'}
        </button>
      </form>

      {/* Overdue Alert */}
      {showOverdueAlert && overdueTasks.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-start justify-between" role="alert">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-lg mb-1">Overdue Tasks Alert!</h3>
              <p className="text-sm">
                You have <strong>{overdueTasks.length}</strong> overdue {overdueTasks.length === 1 ? 'task' : 'tasks'}. Please review and update.
              </p>
              <ul className="mt-2 space-y-1">
                {overdueTasks.slice(0, 3).map((task) => (
                  <li key={task.id} className="text-sm">
                    • {task.name} (Due: {parseLocalDate(task.dueDate)?.toLocaleDateString()})
                  </li>
                ))}
                {overdueTasks.length > 3 && (
                  <li className="text-sm italic">...and {overdueTasks.length - 3} more</li>
                )}
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowOverdueAlert(false)}
            className="text-red-800 hover:text-red-900 text-2xl leading-none"
            aria-label="Dismiss alert"
          >
            ×
          </button>
        </div>
      )}

      <section className="mb-6 flex items-center justify-between">
        <div>
          {isLoading ? (
            <p className="text-gray-500">Loading tasks…</p>
          ) : hasTasks ? (
            <p className="text-gray-700">
              {remainingCount} of {tasks.length}{' '}
              {tasks.length === 1 ? 'task' : 'tasks'} remaining.
            </p>
          ) : null}
        </div>
        {hasTasks && (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900">
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={(e) => setHideCompleted(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-medium">Hide Completed Tasks{'\u00A0'}</span>
              <span>{'\u00A0'}</span>
            
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{'\u00A0'}Sort Tasks{'\u00A0'} </span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded px-3 py-1.5 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="EDD">Earliest Due Date</option>
                <option value="SPT">Shortest Processing Time</option>
                <option value="WSPT">Weighted SPT</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-wrap gap-4 shadow-sm">
        <div>
          <label htmlFor="from-date" className="block text-sm text-gray-400 mb-1">From</label>
          <input
            id="from-date"
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            className="bg-gray-50 border border-gray-300 rounded px-3 py-1.5 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="to-date" className="block text-sm text-gray-400 mb-1">To</label>
          <input
            id="to-date"
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            className="bg-gray-50 border border-gray-300 rounded px-3 py-1.5 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="priority-filter" className="block text-sm text-gray-400 mb-1">Priority</label>
          <select
            id="priority-filter"
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
            className="bg-gray-50 border border-gray-300 rounded px-3 py-1.5 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setFilters({ from: '', to: '', priority: '' })}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="task-list-wrapper">
        {isLoading ? (
          <p className="status-message">Fetching your tasks…</p>
        ) : hasTasks ? (
          <ul className="task-cards">
            {tasks
              .filter((task) => {
                // Hide completed tasks if toggle is on
                if (hideCompleted && task.completed) return false
                
                const d = parseLocalDate(task.dueDate)
                const fromDate = filters.from ? parseLocalDate(filters.from) : null
                const toDate = filters.to ? parseLocalDate(filters.to) : null
                const fromOk = !fromDate || d >= fromDate
                const toOk = !toDate || d <= toDate
                const prOk = !filters.priority || task.priority === filters.priority
                return fromOk && toOk && prOk
              })
              .map((task) => {
              const isBusy = pendingIds.has(task.id)
              const todayMidnight = new Date()
              todayMidnight.setHours(0, 0, 0, 0)
              const due = parseLocalDate(task.dueDate)
              const isOverdue = !task.completed && due && due < todayMidnight
              return (
                <li key={task.id} className={`task-card ${task.completed ? 'completed' : 'inprogress'}`}>
                  <div className="task-card-header">
                    <span className={`priority ${task.priority}`}>{task.priority}</span>
                    <span className="due-date">
                      <strong>Due</strong>{' '}
                      {parseLocalDate(task.dueDate)?.toLocaleDateString()}
                    </span>
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
                            setTasks((current) => sortByStrategy(current.map((t) => (t.id === task.id ? updated : t))))
                          } catch (error) {
                            setServerError(error.message || 'Unable to update task.')
                          } finally {
                            releasePending(task.id)
                          }
                        }}
                        disabled={isBusy}
                      />
                    </div>
                    <details className="edit-panel">
                      <summary>Edit</summary>
                      <div className="edit-grid">
                        <div className="form-row">
                          <label>Due date</label>
                          <input
                            type="date"
                            defaultValue={String(task.dueDate).slice(0,10)}
                            onBlur={async (e) => {
                              const dueDate = e.target.value
                              if (!dueDate) return
                              markPending(task.id)
                              try {
                                const updated = await updateTask(task.id, { dueDate })
                                setTasks((current) => sortByStrategy(current.map((t) => (t.id === task.id ? updated : t))))
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
                                setTasks((current) => sortByStrategy(current.map((t) => (t.id === task.id ? updated : t))))
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
                            defaultValue={Array.isArray(task.actionableItems) ? task.actionableItems.join('\n') : ''}
                            rows={3}
                            onBlur={async (e) => {
                              const actionableItems = e.target.value.split('\n').map(s=>s.trim()).filter(Boolean)
                              markPending(task.id)
                              try {
                                const updated = await updateTask(task.id, { actionableItems })
                                setTasks((current) => sortByStrategy(current.map((t) => (t.id === task.id ? updated : t))))
                              } finally { releasePending(task.id) }
                            }}
                            disabled={isBusy}
                          />
                        </div>
                      </div>
                    </details>
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
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="status-message subtle">Start creating your tasks</p>
        )}
      </div>
      <div ref={confettiRootRef} className="confetti-root" aria-hidden="true" />
      </div>
    </div>
  )
}
