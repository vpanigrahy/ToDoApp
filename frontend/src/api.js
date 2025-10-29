const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'
const API_BASE_URL = RAW_BASE_URL.replace(/\/$/, '')

async function request(path, { method = 'GET', body, headers } = {}) {
  const config = { method, headers: headers ?? {} }

  if (body !== undefined) {
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    }
    config.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config)
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && data.message) ||
      response.statusText ||
      'Request failed'
    throw new Error(message)
  }

  return data
}

export function fetchTasks() {
  return request('/api/tasks')
}

export function createTask(text) {
  return request('/api/tasks', {
    method: 'POST',
    body: { text },
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
