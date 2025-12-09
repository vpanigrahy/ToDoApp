import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout, getCurrentUser } from '../api'

export default function Help() {
  const [openSections, setOpenSections] = useState({
    priority: false,
    edd: false,
    spt: false,
    wspt: false,
    completion: false,
    overdue: false,
  })
  const [showMenu, setShowMenu] = useState(false)
  const [username, setUsername] = useState('')
  const navigate = useNavigate()
  const menuRef = useRef(null)

  useEffect(() => {
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

  const loadUser = async () => {
    try {
      const user = await getCurrentUser()
      setUsername(user.username || 'User')
    } catch (error) {
      setUsername('User')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem' }}>
      {/* Header with Menu */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              Help & About
            </h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '1rem' }}>
              Learn how to use the Task Management Tool effectively
            </p>
          </div>
          
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

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* What the App Does */}
        <section style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
            📝 What is Task Management Tool?
          </h2>
          <p style={{ color: '#4b5563', marginBottom: '1rem', lineHeight: '1.6' }}>
            This is a task prioritization tool designed to help you manage your tasks effectively. 
            It's especially useful for university students juggling multiple assignments, projects, and deadlines.
          </p>
          <p style={{ color: '#4b5563', margin: 0, lineHeight: '1.6' }}>
            The tool helps you organize tasks based on urgency, importance, and completion status, 
            making it easier to focus on what matters most.
          </p>
        </section>

        {/* Collapsible FAQ Sections */}
        <section style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
            ❓ Frequently Asked Questions
          </h2>
          
          {/* What does priority mean? */}
          <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <button
              onClick={() => toggleSection('priority')}
              style={{
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#111827',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                padding: '0.5rem 0'
              }}
            >
              <span>▸ What does priority mean?</span>
              <span style={{ color: '#6b7280', fontSize: '1.25rem' }}>{openSections.priority ? '−' : '+'}</span>
            </button>
            {openSections.priority && (
              <div style={{ marginTop: '0.75rem', color: '#4b5563', fontSize: '0.875rem', paddingLeft: '1rem', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#3b82f6' }}>P1 - High</strong> = tasks you must do first, usually urgent.</p>
                <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#eab308' }}>P2 - Medium</strong> = important but not critical.</p>
                <p style={{ margin: 0 }}><strong style={{ color: '#10b981' }}>P3 - Low</strong> = nice-to-do, low urgency.</p>
              </div>
            )}
          </div>

          {/* What is EDD? */}
          <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <button
              onClick={() => toggleSection('edd')}
              style={{
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#111827',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                padding: '0.5rem 0'
              }}
            >
              <span>▸ What is EDD (Earliest Due Date)?</span>
              <span style={{ color: '#6b7280', fontSize: '1.25rem' }}>{openSections.edd ? '−' : '+'}</span>
            </button>
            {openSections.edd && (
              <div style={{ marginTop: '0.75rem', color: '#4b5563', fontSize: '0.875rem', paddingLeft: '1rem', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '0.5rem' }}>Tasks are sorted primarily by due date (earliest first).</p>
                <p style={{ margin: 0 }}>This helps you tackle time-sensitive tasks before they become overdue.</p>
              </div>
            )}
          </div>

          {/* What is SPT? */}
          <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <button
              onClick={() => toggleSection('spt')}
              style={{
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#111827',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                padding: '0.5rem 0'
              }}
            >
              <span>▸ What is SPT (Shortest Processing Time)?</span>
              <span style={{ color: '#6b7280', fontSize: '1.25rem' }}>{openSections.spt ? '−' : '+'}</span>
            </button>
            {openSections.spt && (
              <div style={{ marginTop: '0.75rem', color: '#4b5563', fontSize: '0.875rem', paddingLeft: '1rem', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '0.5rem' }}>Focus on tasks that can be completed quickly.</p>
                <p style={{ margin: 0 }}>This strategy helps build momentum by finishing smaller tasks first, giving you a sense of accomplishment.</p>
              </div>
            )}
          </div>

          {/* What is WSPT? */}
          <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <button
              onClick={() => toggleSection('wspt')}
              style={{
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#111827',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                padding: '0.5rem 0'
              }}
            >
              <span>▸ What is WSPT (Weighted Shortest Processing Time)?</span>
              <span style={{ color: '#6b7280', fontSize: '1.25rem' }}>{openSections.wspt ? '−' : '+'}</span>
            </button>
            {openSections.wspt && (
              <div style={{ marginTop: '0.75rem', color: '#4b5563', fontSize: '0.875rem', paddingLeft: '1rem', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '0.5rem' }}>Maximize value by considering both importance and estimated time.</p>
                <p style={{ marginBottom: '0.5rem' }}>
                  Formula: <code style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', color: '#92400e' }}>importance ÷ estimated time</code>
                </p>
                <p style={{ margin: 0 }}>This helps you work on high-value tasks efficiently.</p>
              </div>
            )}
          </div>

          {/* What does completion % mean? */}
          <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <button
              onClick={() => toggleSection('completion')}
              style={{
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#111827',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                padding: '0.5rem 0'
              }}
            >
              <span>▸ What does completion % mean?</span>
              <span style={{ color: '#6b7280', fontSize: '1.25rem' }}>{openSections.completion ? '−' : '+'}</span>
            </button>
            {openSections.completion && (
              <div style={{ marginTop: '0.75rem', color: '#4b5563', fontSize: '0.875rem', paddingLeft: '1rem', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '0.5rem' }}>0% means not started, 50% half done, 100% completed.</p>
                <p style={{ margin: 0 }}>Use the slider to update task progress as you work on it. When you reach 100%, the task is automatically marked as completed.</p>
              </div>
            )}
          </div>

          {/* What does overdue mean? */}
          <div style={{ paddingBottom: '0.75rem' }}>
            <button
              onClick={() => toggleSection('overdue')}
              style={{
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#111827',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                padding: '0.5rem 0'
              }}
            >
              <span>▸ What does overdue mean?</span>
              <span style={{ color: '#6b7280', fontSize: '1.25rem' }}>{openSections.overdue ? '−' : '+'}</span>
            </button>
            {openSections.overdue && (
              <div style={{ marginTop: '0.75rem', color: '#4b5563', fontSize: '0.875rem', paddingLeft: '1rem', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '0.5rem' }}>If today is after the due date and the task is not completed, the task is overdue.</p>
                <p style={{ margin: 0 }}>Overdue tasks are highlighted with a ⚠️ warning and red background.</p>
              </div>
            )}
          </div>
        </section>

        {/* Technologies Used */}
        <section style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
            🛠️ Technologies Used
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#3b82f6', marginBottom: '0.5rem' }}>Frontend</h3>
              <ul style={{ color: '#4b5563', fontSize: '0.875rem', lineHeight: '1.8', paddingLeft: '1.25rem', margin: 0 }}>
                <li>React 19</li>
                <li>Vite</li>
                <li>Tailwind CSS</li>
                <li>Recharts (for visualizations)</li>
                <li>React Router</li>
              </ul>
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#10b981', marginBottom: '0.5rem' }}>Backend</h3>
              <ul style={{ color: '#4b5563', fontSize: '0.875rem', lineHeight: '1.8', paddingLeft: '1.25rem', margin: 0 }}>
                <li>Flask (Python)</li>
                <li>PostgreSQL Database</li>
                <li>RESTful API</li>
                <li>Session-based Auth</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section style={{
          backgroundColor: '#dbeafe',
          border: '1px solid #93c5fd',
          borderRadius: '0.75rem',
          padding: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.75rem' }}>
            💡 Pro Tips
          </h2>
          <ul style={{ color: '#1e40af', fontSize: '0.875rem', lineHeight: '1.8', paddingLeft: '1.25rem', margin: 0 }}>
            <li>Add actionable items to break down complex tasks into smaller steps</li>
            <li>Use the completion percentage slider to track progress on ongoing tasks</li>
            <li>Check your Analytics dashboard regularly to maintain a good on-time completion rate</li>
            <li>Review your Completed Tasks history to identify patterns and improve time management</li>
            <li>Set realistic due dates to avoid unnecessary stress</li>
            <li>Use the toggle button to show/hide completed tasks based on your preference</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
