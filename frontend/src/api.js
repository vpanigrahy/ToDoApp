const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'
const API_BASE_URL = RAW_BASE_URL.replace(/\/$/, '')

async function request(path, { method = 'GET', body, headers } = {}) {
  const config = { method, headers: headers ?? {}, credentials: 'include' }

  if (body !== undefined) {
    // body can be URLSearchParams (for simple CORS) or a plain object (JSON)
    if (body instanceof URLSearchParams) {
      config.headers = { 'Content-Type': 'application/x-www-form-urlencoded', ...config.headers }
      config.body = body
    } else {
      config.headers = { 'Content-Type': 'application/json', ...config.headers }
      config.body = typeof body === 'string' ? body : JSON.stringify(body)
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config)
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && data.message) ||
      response.statusText ||
      'Request failed'
    const err = new Error(message)
    err.status = response.status
    throw err
  }

  return data
}

export function fetchTasks() {
  return request('/api/tasks')
}

export function createTask({ name, dueDate, priority, actionableItems, completionPercent }) {
  return request('/api/tasks', {
    method: 'POST',
    body: { name, dueDate, priority, actionableItems, completionPercent },
  })
}

export function updateTask(id, updates) {
  return request(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: updates,
  })
}

export function deleteTask(id) {
  return request(`/api/tasks/${id}`, { method: 'DELETE' })
}

export function register({ username, password }) {
  const form = new URLSearchParams({ username, password })
  return request('/api/register', { method: 'POST', body: form })
}

export function login({ username, password }) {
  const form = new URLSearchParams({ username, password })
  return request('/api/login', { method: 'POST', body: form })
}

export function logout() {
  return request('/api/logout', { method: 'POST' })
}

export function fetchUser(userId) {
  return request(`/api/users/${userId}`)
}

// Analytics APIs
export function fetchAnalyticsSummary(days = 30) {
  return request(`/api/analytics/summary?days=${days}`)
}

export function fetchAnalyticsCFD(days = 30) {
  return request(`/api/analytics/cfd?days=${days}`)
}

export function fetchAnalyticsStreak() {
  return request('/api/analytics/streak')
}

export function fetchCompletedTasks(days = 365) {
  return request(`/api/completed-tasks?days=${days}`)
}
