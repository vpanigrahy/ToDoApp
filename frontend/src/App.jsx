import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from './api'

function App() {
  const [tasks, setTasks] = useState([])
  const [draft, setDraft] = useState('')
  const [formError, setFormError] = useState('')
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingIds, setPendingIds] = useState(() => new Set())

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
          setTasks(data)
          setServerError('')
        }
      } catch (error) {
        if (!cancelled) {
          setServerError(error.message || 'Unable to load tasks.')
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
    const text = draft.trim()

    if (!text) {
      setFormError('Add a short description before saving a task.')
      return
    }

    try {
      setIsSubmitting(true)
      const createdTask = await createTask(text)
      setTasks((current) => [createdTask, ...current])
      setDraft('')
      setFormError('')
      setServerError('')
    } catch (error) {
      setServerError(error.message || 'Unable to save the new task.')
    } finally {
      setIsSubmitting(false)
    }
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
        current.map((item) => (item.id === targetId ? updatedTask : item)),
      )
      setServerError('')
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
        <header className="app-header">
          <h1>Task Planner</h1>
          <p className="app-subtitle">
            Add a task, mark it done, keep your day on track.
          </p>
        </header>

        {serverError && (
          <div className="status-banner error" role="alert">
            {serverError}
          </div>
        )}

        <form className="task-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="task-input" className="visually-hidden">
            Task description
          </label>
          <input
            id="task-input"
            name="task"
            value={draft}
            placeholder="Add a new task..."
            onChange={(event) => setDraft(event.target.value)}
            aria-invalid={formError ? 'true' : 'false'}
            aria-describedby="task-helper"
            disabled={isSubmitting}
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Add Task'}
          </button>
        </form>
        <p
          id="task-helper"
          className={`task-helper${formError ? ' error' : ''}`}
          aria-live="polite"
        >
          {formError || 'Tip: break work down into small, actionable tasks.'}
        </p>

        <section aria-live="polite" className="task-summary">
          {isLoading ? (
            <p className="status-message subtle">Loading tasks…</p>
          ) : hasTasks ? (
            <p>
              {remainingCount} of {tasks.length}{' '}
              {tasks.length === 1 ? 'task' : 'tasks'} remaining.
            </p>
          ) : (
            <p className="empty-state">
              No tasks yet — create one to get started.
            </p>
          )}
        </section>

        <div className="task-list-wrapper">
          {isLoading ? (
            <p className="status-message">Fetching your tasks…</p>
          ) : hasTasks ? (
            <ul className="task-list">
              {tasks.map((task) => {
                const isBusy = pendingIds.has(task.id)
                return (
                  <li
                    key={task.id}
                    className={task.completed ? 'completed' : ''}
                  >
                    <label>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task)}
                        disabled={isBusy}
                      />
                      <span>{task.text}</span>
                    </label>
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => removeTask(task.id)}
                      disabled={isBusy}
                    >
                      Delete
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="status-message subtle">
              Your tasks will appear here once added.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
