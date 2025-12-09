import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api'

export default function Login() {
  const [loginForm, setLoginForm] = useState({ username: '', password: '', mode: 'login' })
  const [serverError, setServerError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    const username = loginForm.username.trim()
    const password = loginForm.password
    
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
        await login({ username, password })
        setServerError('')
        setNotice('')
        navigate('/tasks')
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

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        background: 'linear-gradient(180deg, #0f1c2e 0%, #1a2f4a 50%, #0f1c2e 100%)'
      }}
    >
      {/* Success Notice */}
      {notice && (
        <div style={{
          width: '100%',
          maxWidth: '450px',
          marginBottom: '1.5rem',
          padding: '1rem 1.5rem',
          backgroundColor: '#ecfdf5',
          border: '1px solid #6ee7b7',
          borderRadius: '1rem',
          textAlign: 'center',
          color: '#065f46'
        }}>
          {notice}
        </div>
      )}

      {/* Error Banner */}
      {serverError && (
        <div style={{
          width: '100%',
          maxWidth: '450px',
          marginBottom: '1.5rem',
          padding: '1rem 1.5rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '1rem',
          textAlign: 'center',
          color: '#991b1b'
        }}>
          {serverError}
        </div>
      )}

      {/* Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '450px',
        backgroundColor: '#ffffff',
        borderRadius: '1.5rem',
        boxShadow: '0 0 80px rgba(59, 130, 246, 0.4), 0 20px 60px rgba(0, 0, 0, 0.5)',
        padding: '3.5rem 3rem'
      }}>
        {/* Title */}
        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: 'bold',
          color: '#111827',
          textAlign: 'center',
          marginBottom: '2.5rem',
          letterSpacing: '-0.025em'
        }}>
          Task Management Tool
        </h1>

        <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Username Input */}
          <input
            type="text"
            value={loginForm.username}
            onChange={(e) => {
              setLoginForm({ ...loginForm, username: e.target.value })
              setServerError('')
            }}
            disabled={isSubmitting}
            placeholder="Username"
            style={{
              width: '100%',
              padding: '1.125rem 1.5rem',
              fontSize: '1rem',
              color: '#111827',
              backgroundColor: '#f9fafb',
              border: '1px solid #d1d5db',
              borderRadius: '0.875rem',
              outline: 'none',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6'
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1), 0 2px 10px rgba(0, 0, 0, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db'
              e.target.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)'
            }}
          />

          {/* Password Input */}
          <input
            type="password"
            value={loginForm.password}
            onChange={(e) => {
              setLoginForm({ ...loginForm, password: e.target.value })
              setServerError('')
            }}
            disabled={isSubmitting}
            placeholder="Password"
            style={{
              width: '100%',
              padding: '1.125rem 1.5rem',
              fontSize: '1rem',
              color: '#111827',
              backgroundColor: '#f9fafb',
              border: '1px solid #d1d5db',
              borderRadius: '0.875rem',
              outline: 'none',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6'
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1), 0 2px 10px rgba(0, 0, 0, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db'
              e.target.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)'
            }}
          />

          {/* Password Requirements for Register Mode */}
          {loginForm.mode === 'register' && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '0.75rem',
              fontSize: '0.875rem'
            }}>
              <p style={{ color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>
                Password Requirements:
              </p>
              <ul style={{ color: '#1e40af', marginLeft: '1.25rem', listStyle: 'disc' }}>
                <li>Username must be at least 3 characters</li>
                <li>Password must be at least 6 characters</li>
              </ul>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '1.125rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#ffffff',
              backgroundColor: isSubmitting ? '#9ca3af' : '#10b981',
              border: 'none',
              borderRadius: '0.875rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s',
              marginTop: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.target.style.backgroundColor = '#059669'
                e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
                e.target.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.target.style.backgroundColor = '#10b981'
                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                e.target.style.transform = 'translateY(0)'
              }
            }}
          >
            {isSubmitting ? (loginForm.mode === 'login' ? 'Logging in...' : 'Creating...') : (loginForm.mode === 'login' ? 'Login' : 'Register')}
          </button>

          {/* Create User Link */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setLoginForm((f) => ({ ...f, mode: f.mode === 'login' ? 'register' : 'login', username: '', password: '' }))
                setServerError('')
                setNotice('')
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#0ea5e9',
                fontSize: '1rem',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#0284c7'
                e.target.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#0ea5e9'
                e.target.style.textDecoration = 'none'
              }}
            >
              {loginForm.mode === 'login' ? 'Create User' : 'Back to Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
