import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from '../api'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [draft, setDraft] = useState({ name: '', dueDate: '', priority: 'P2', actionableText: '' })
  const [formError, setFormError] = useState('')
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingIds, setPendingIds] = useState(() => new Set())
  const confettiRootRef = useRef(null)

  const sortByDueDate = (list) =>
    [...list].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

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

  useEffect(() => {
    let cancelled = false

    const loadTasks = async () => {
      setIsLoading(true)
      try {
        const data = await fetchTasks()
        if (!cancelled) {
          setTasks(sortByDueDate(data))
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
      (task) => !task.completed && new Date(task.dueDate) < today
    )
  }, [tasks])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const name = draft.name.trim()
    const dueDate = draft.dueDate.trim()
    const priority = draft.priority
    const actionableItems = draft.actionableText
      .split('\\n')
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
    const today = new Date();
today.setHours(0, 0, 0, 0);

// Parse YYYY-MM-DD as a LOCAL date (not UTC)
const [year, month, day] = dueDate.split("-").map(Number);
const selectedDate = new Date(year, month - 1, day); // local midnight

if (selectedDate < today) {
  setFormError(
    "Due date cannot be in the past. Please select today's date or a future date."
  );
  return;
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
    <div className="p-8 max-w-7xl mx-auto">
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
                    • {task.name} (Due: {new Date(task.dueDate).toLocaleDateString()})
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
          <label className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm font-medium">Hide completed tasks</span>
          </label>
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
      <div>
        {isLoading ? (
          <p className="text-center py-12 text-gray-400">Fetching your tasks…</p>
        ) : hasTasks ? (
          <div className="space-y-3">
            {tasks
              .filter((task) => {
                // Hide completed tasks if toggle is on
                if (hideCompleted && task.completed) return false
                
                const d = new Date(task.dueDate)
                const fromOk = !filters.from || d >= new Date(filters.from)
                const toOk = !filters.to || d <= new Date(filters.to)
                const prOk = !filters.priority || task.priority === filters.priority
                return fromOk && toOk && prOk
              })
              .map((task) => {
              const isBusy = pendingIds.has(task.id)
              const isOverdue = !task.completed && new Date(task.dueDate) < new Date()
              return (
                <div key={task.id} className={`border rounded-lg p-4 ${task.completed ? 'bg-green-50 border-green-200' : isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'} shadow-sm`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === 'P1' ? 'bg-red-100 text-red-800' :
                          task.priority === 'P2' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {task.priority}
                        </span>
                        <span className={`text-sm ${
                          isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'
                        }`}>
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                          {isOverdue && ' ⚠️ OVERDUE'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{task.name}</h3>
                      {Array.isArray(task.actionableItems) && task.actionableItems.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {task.actionableItems.map((it, idx) => (
                            <li key={idx} className="text-sm text-gray-600">• {it}</li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-3">
                        <label className="text-sm text-gray-500">
                          Completion: <strong className="text-gray-900">{task.completionPercent ?? 0}%</strong>
                        </label>
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
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task)}
                        disabled={isBusy}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-600">Completed</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      disabled={isBusy}
                      className="ml-auto bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center py-12 text-gray-400">Start creating your tasks!</p>
        )}
      </div>
      <div ref={confettiRootRef} className="confetti-root" aria-hidden="true" />
    </div>
  )
}
