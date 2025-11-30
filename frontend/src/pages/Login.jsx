import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { login, register } from '../api'

export default function Login() {
  const [loginForm, setLoginForm] = useState({ username: '', password: '', mode: 'login' })
  const [serverError, setServerError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useOutletContext()

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
        // Add debugging
        console.log('Attempting to login with:', { username, password });
        const user = await login({ username, password })
        console.log('Login successful:', user);
        setAuth({ id: user.id, username: user.username, isLoggedIn: true })
        setServerError('')
        setNotice('')
        navigate('/tasks')
      } else {
        // Add debugging
        console.log('Attempting to register with:', { username, password });
        await register({ username, password })
        console.log('Registration successful');
        setServerError('')
        setNotice('Account created successfully! Please log in.')
        setLoginForm((f) => ({ ...f, mode: 'login', username: '', password: '' }))
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setServerError(error.message || 'Authentication failed.')
      setNotice('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Task Management Tool</h1>
          <p className="text-slate-300">Prioritize and manage your tasks effectively</p>
        </div>

        {serverError && (
          <div className="status-banner error" role="alert" style={{ marginBottom: '1rem' }}>
            {serverError}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          {!serverError && notice && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4" role="status">
              {notice}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} noValidate autoComplete="off">
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                autoComplete="off"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                disabled={isSubmitting}
                className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your username"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="new-password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                disabled={isSubmitting}
                className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <div className="auth-actions">
              <button
                type="submit"
                className="primary-btn"
                disabled={isSubmitting}
              >
                {loginForm.mode === 'login' ? (isSubmitting ? 'Logging in…' : 'Login') : (isSubmitting ? 'Registering…' : 'Register')}
              </button>
              <button
                type="button"
                className="link"
                onClick={() => setLoginForm((f) => ({ ...f, mode: f.mode === 'login' ? 'register' : 'login' }))}
              >
                {loginForm.mode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
