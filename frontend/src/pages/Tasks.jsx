import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTask, deleteTask, fetchTasks, updateTask, logout, getCurrentUser } from '../api'

// Parse "YYYY-MM-DD" as a local date (no timezone shift)
const parseLocalDate = (isoDate) => {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [serverError, setServerError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [username, setUsername] = useState('')
  const navigate = useNavigate()
  const menuRef = useRef(null)
  
  // Modal form state
  const [modalForm, setModalForm] = useState({
    name: '',
    dueDate: '',
    priority: 'P2',
    progress: 0,
    totalTime: 1,
    actionableText: '',
    completed: false,
  })
  
  // Filter states
  const [sortBy, setSortBy] = useState('earliest')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showCompletedTasks, setShowCompletedTasks] = useState(true)

  useEffect(() => {
    loadTasks()
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

  const loadTasks = async () => {
    setIsLoading(true)
    try {
      const data = await fetchTasks()
      setTasks(data)
      setServerError('')
    } catch (error) {
      setServerError(error.message || 'Failed to load tasks')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUser = async () => {
    try {
      const user = await getCurrentUser()
      setUsername(user.username || 'User')
    } catch (error) {
      setUsername('User')
    }
  }

  const handleAddTask = () => {
    setEditingTask(null)
    setModalForm({
      name: '',
      dueDate: '',
      priority: 'P2',
      progress: 0,
      totalTime: 1,
      actionableText: '',
      completed: false,
    })
    setShowModal(true)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setModalForm({
      name: task.name || '',
      dueDate: task.dueDate?.split('T')[0] || '',
      priority: task.priority || 'P2',
      progress: task.completionPercent || 0,
      totalTime: task.totalTime || 1,
      actionableText: Array.isArray(task.actionableItems) ? task.actionableItems.join('\n') : '',
      completed: Boolean(task.completed),
    })
    setShowModal(true)
  }

  const handleModalSubmit = async (e) => {
    e.preventDefault()
    
    if (!modalForm.name.trim()) {
      alert('Task name is required')
      return
    }
    if (!modalForm.dueDate) {
      alert('Due date is required')
      return
    }

    try {
      const actionableItems = modalForm.actionableText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)

      // Auto-complete when progress is 100%
      const isCompleted = modalForm.progress === 100

      const taskData = {
        name: modalForm.name,
        dueDate: modalForm.dueDate,
        priority: modalForm.priority,
        completionPercent: modalForm.progress,
        totalTime: modalForm.totalTime,
        actionableItems: actionableItems,
        completed: isCompleted,
      }

      if (editingTask) {
        await updateTask(editingTask.id, taskData)
      } else {
        await createTask(taskData)
      }
      
      await loadTasks()
      setShowModal(false)
    } catch (error) {
      alert(error.message || 'Failed to save task')
    }
  }

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id)
        await loadTasks()
      } catch (error) {
        alert(error.message || 'Failed to delete task')
      }
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  const toggleExpand = (taskId) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId)
  }

  const calculateRemaining = (totalTime, progress) => {
    return (totalTime * (100 - progress) / 100).toFixed(1)
  }

  const helperTextStyle = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '0.5rem',
    marginBottom: 0,
    lineHeight: 1.4,
  }

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'P1': return 'P1 - High'
      case 'P2': return 'P2 - Medium'
      case 'P3': return 'P3 - Low'
      default: return 'P2 - Medium'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'P1': return '#ef4444'
      case 'P2': return '#f59e0b'
      case 'P3': return '#10b981'
      default: return '#f59e0b'
    }
  }

  // Filter and sort tasks
  const filteredTasks = tasks
  .filter(task => {
    // Filter by completed status based on toggle
    if (!showCompletedTasks && task.completed) return false

    const taskDue = parseLocalDate(task.dueDate)

    if (dateFrom) {
      const from = parseLocalDate(dateFrom)
      if (taskDue < from) return false
    }

    if (dateTo) {
      const to = parseLocalDate(dateTo)
      if (taskDue > to) return false
    }

    if (priorityFilter && task.priority !== priorityFilter) return false
    return true
  })
  .sort((a, b) => {
    if (sortBy === 'earliest') {
      return parseLocalDate(a.dueDate) - parseLocalDate(b.dueDate)
    } else if (sortBy === 'latest') {
      return parseLocalDate(b.dueDate) - parseLocalDate(a.dueDate)
    } else if (sortBy === 'priority') {
      const priorityOrder = { P1: 1, P2: 2, P3: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    } else if (sortBy === 'spt') {
      // Shortest Processing Time - sort by remaining hours (ascending)
      // Completed tasks go to the bottom
      const aCompleted = a.completed || a.completionPercent >= 100
      const bCompleted = b.completed || b.completionPercent >= 100
      
      // If both completed or both not completed, sort by remaining hours
      if (aCompleted && bCompleted) return 0
      if (aCompleted) return 1  // a is completed, push to bottom
      if (bCompleted) return -1  // b is completed, push to bottom
      
      // Calculate remaining hours for in-progress tasks
      const aRemaining = (a.totalTime || 1) * (1 - (a.completionPercent || 0) / 100)
      const bRemaining = (b.totalTime || 1) * (1 - (b.completionPercent || 0) / 100)
      
      return aRemaining - bRemaining  // Ascending order
    }
    return 0
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem' }}>
      {/* Header with Menu */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              Welcome {username}
            </h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '1rem' }}>
              Manage and prioritize your tasks efficiently
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleAddTask}
              style={{
                backgroundColor: '#000000',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>+</span> Add Task
            </button>

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
              
              {/* Dropdown Menu */}
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

      {/* Filters */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 2rem',
        backgroundColor: 'white',
        padding: '1.5rem 2rem',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          gap: '3rem',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}>
          {/* Sort By */}
          <div style={{ flex: '1 1 0', minWidth: '280px', maxWidth: '360px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                backgroundColor: '#f9fafb'
              }}
            >
              <option value="earliest">Earliest Due Date</option>
              <option value="latest">Latest Due Date</option>
              <option value="priority">Priority</option>
              <option value="spt">Shortest Processing Time</option>
            </select>
          </div>

          {/* Due Date Range */}
          <div style={{ flex: '1 1 0', minWidth: '280px', maxWidth: '380px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
              Due Date Range
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="dd-mm-yyyy"
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                marginBottom: '0.5rem',
                backgroundColor: '#f9fafb'
              }}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="dd-mm-yyyy"
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                backgroundColor: '#f9fafb'
              }}
            />
          </div>

          {/* Priority Filter */}
          <div style={{ flex: '1 1 0', minWidth: '260px', maxWidth: '340px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
              Priority Level
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                backgroundColor: '#f9fafb'
              }}
            >
              <option value="">All Priorities</option>
              <option value="P1">P1 - High</option>
              <option value="P2">P2 - Medium</option>
              <option value="P3">P3 - Low</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              setSortBy('earliest')
              setDateFrom('')
              setDateTo('')
              setPriorityFilter('')
            }}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {serverError && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto 1rem',
          padding: '1rem',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '0.5rem'
        }}>
          {serverError}
        </div>
      )}

      {/* Toggle Completed Tasks */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', color: '#6b7280' }}>
          <div
            onClick={() => setShowCompletedTasks(!showCompletedTasks)}
            style={{
              position: 'relative',
              width: '44px',
              height: '24px',
              backgroundColor: showCompletedTasks ? '#10b981' : '#d1d5db',
              borderRadius: '12px',
              transition: 'background-color 0.2s ease',
              cursor: 'pointer'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '2px',
              left: showCompletedTasks ? '22px' : '2px',
              width: '20px',
              height: '20px',
              backgroundColor: 'white',
              borderRadius: '50%',
              transition: 'left 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
          </div>
          <span style={{ fontWeight: '500', color: '#111827' }}>
            {showCompletedTasks ? 'Hide Completed Tasks' : 'Show Completed Tasks'}
          </span>
        </label>
      </div>

      {/* Tasks Table */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            No tasks found. Click "Add Task" to create one.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#111827' }}>Task Name</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#111827' }}>Due Date</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#111827' }}>Priority</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#111827' }}>Progress</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#111827' }}>Total Time (hrs)</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#111827' }}>Remaining (hrs)</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#111827' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, index) => (
                <>
                  <tr 
                    key={task.id} 
                    style={{ 
                      borderBottom: expandedTaskId === task.id ? 'none' : '1px solid #e5e7eb',
                      backgroundColor: task.completed ? '#f0fdf4' : 'white',
                      opacity: task.completed ? 0.7 : 1
                    }}
                  >
                    <td style={{ padding: '1rem', color: '#111827' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {task.actionableItems && task.actionableItems.length > 0 && (
                          <button
                            onClick={() => toggleExpand(task.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0',
                              color: '#6b7280',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              style={{
                                transform: expandedTaskId === task.id ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                              }}
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </button>
                        )}
                        {task.name}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#111827' }}>
                      {(() => {
                        const due = parseLocalDate(task.dueDate)
                        return due
                         ? due.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                         : ''
                         })()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        backgroundColor: `${getPriorityColor(task.priority)}20`,
                        color: getPriorityColor(task.priority)
                      }}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', maxWidth: '120px' }}>
                          <div style={{
                            width: `${task.completionPercent || 0}%`,
                            height: '100%',
                            backgroundColor: '#000000',
                            borderRadius: '4px'
                          }} />
                        </div>
                        <span style={{ fontWeight: '600', color: '#111827', minWidth: '45px' }}>
                          {task.completionPercent || 0}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#111827' }}>{task.totalTime || 1}</td>
                    <td style={{ padding: '1rem', color: '#111827' }}>
                      {calculateRemaining(task.totalTime || 1, task.completionPercent || 0)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                        <button
                          onClick={() => handleEditTask(task)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            color: '#6b7280'
                          }}
                          title="Edit"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            color: '#6b7280'
                          }}
                          title="Delete"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Actionable Items Row */}
                  {expandedTaskId === task.id && task.actionableItems && task.actionableItems.length > 0 && (
                    <tr key={`${task.id}-expanded`} style={{ borderBottom: index < filteredTasks.length - 1 ? '1px solid #e5e7eb' : 'none', backgroundColor: '#f9fafb' }}>
                      <td colSpan="7" style={{ padding: '1rem' }}>
                        <div style={{ paddingLeft: '2rem' }}>
                          <p style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            Actionable Items:
                          </p>
                          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280' }}>
                            {task.actionableItems.map((item, idx) => (
                              <li key={idx} style={{ marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }} onClick={() => setShowModal(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {editingTask ? 'Edit Task' : 'Add New Task'}
                </h2>
                <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                  Fill in the details for your {editingTask ? 'task' : 'new task'}.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Task Name */}
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
                      Task Name
                    </label>
                    <input
                      type="text"
                      value={modalForm.name}
                      onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                      placeholder="Enter task name"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={modalForm.dueDate}
                      onChange={(e) => setModalForm({ ...modalForm, dueDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Progress */}
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
                      Progress: {modalForm.progress}%
                      {modalForm.progress === 100 && (
                        <span style={{ marginLeft: '0.5rem', color: '#10b981', fontSize: '0.875rem' }}>
                          ✓ Completed
                        </span>
                      )}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={modalForm.progress}
                      onChange={(e) => {
                        const newProgress = parseInt(e.target.value)
                        setModalForm({ 
                          ...modalForm, 
                          progress: newProgress,
                          completed: newProgress === 100
                        })
                      }}
                      style={{ width: '100%', accentColor: '#000000' }}
                    />
                  </div>

                  {/* Total Time */}
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
                      Total Time (hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={modalForm.totalTime}
                      onChange={(e) => setModalForm({ ...modalForm, totalTime: parseInt(e.target.value) || 1 })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Priority Level */}
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
                      Priority Level
                    </label>
                    <select
                      value={modalForm.priority}
                      onChange={(e) => setModalForm({ ...modalForm, priority: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="P1">P1 - High</option>
                      <option value="P2">P2 - Medium</option>
                      <option value="P3">P3 - Low</option>
                    </select>
                  </div>

                  {/* Actionable Items */}
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
                      Actionable Items
                    </label>
                    <textarea
                      value={modalForm.actionableText}
                      onChange={(e) => setModalForm({ ...modalForm, actionableText: e.target.value })}
                      placeholder="One item per line"
                      style={{
                        width: '100%',
                        height: 'calc(100% - 2.5rem)',
                        minHeight: '200px',
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '0.5rem',
                    backgroundColor: '#000000',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {editingTask ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
