import { useEffect, useState } from 'react'
import { fetchCompletedTasks } from '../api'

export default function History() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, onTime, late

  useEffect(() => {
    loadCompletedTasks()
  }, [])

  const loadCompletedTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchCompletedTasks(365) // Last year
      setTasks(data)
    } catch (err) {
      setError(err.message || 'Failed to load completed tasks')
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'onTime') return task.onTime
    if (filter === 'late') return !task.onTime
    return true
  })

  const onTimeCount = tasks.filter(t => t.onTime).length
  const lateCount = tasks.filter(t => !t.onTime).length

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Completed Tasks History</h1>
        <p className="text-gray-500">Loading completed tasks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Completed Tasks History</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Completed Tasks History</h1>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-500">Total Completed</div>
          <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-green-700">✅ On Time</div>
          <div className="text-2xl font-bold text-green-800">{onTimeCount}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-red-700">❌ Late</div>
          <div className="text-2xl font-bold text-red-800">{lateCount}</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('onTime')}
          className={`px-4 py-2 rounded text-sm ${filter === 'onTime' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          On Time ({onTimeCount})
        </button>
        <button
          onClick={() => setFilter('late')}
          className={`px-4 py-2 rounded text-sm ${filter === 'late' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Late ({lateCount})
        </button>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No completed tasks found</p>
          <p className="text-sm mt-2">Complete some tasks to see them here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`border rounded-lg p-4 shadow-sm ${
                task.onTime
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{task.onTime ? '✅' : '❌'}</span>
                    <h3 className="text-lg font-semibold text-gray-900">
                     {task.name}{' '}
                       <span
                         className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                         task.priority === 'P1'
                          ? 'bg-red-100 text-red-800'
                          : task.priority === 'P2'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                        }`}
                       >
                         {task.priority}
                        </span>
                       </h3>
                      </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Due Date: </span>
                      <span className="text-gray-900">
                        {new Date(new Date(task.dueDate).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Completed: </span>
                      <span className="text-gray-900">
                        {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status: </span>
                      <span className={task.onTime ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
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

      {/* Information Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ About Completion Status</h3>
        <p className="text-sm text-blue-700">
          Tasks are marked as <strong className="text-green-700">On Time</strong> if they were completed on or before the due date.
          Tasks completed after the due date are marked as <strong className="text-red-700">Late</strong>.
        </p>
      </div>
    </div>
  )
}
