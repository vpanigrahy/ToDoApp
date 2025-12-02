import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchTasks, logout } from '../api'

export default function Layout() {
  const [auth, setAuth] = useState({ username: '', isLoggedIn: false })
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      await fetchTasks()
      setAuth({ isLoggedIn: true })
    } catch {
      setAuth({ isLoggedIn: false })
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      setAuth({ isLoggedIn: false })
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation with color scheme matching login page */}
      <nav className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - App title */}
            <div className="flex-shrink-0 text-white">
              <h1 className="text-xl font-bold">📋 Task Management Tool</h1>
            </div>
            
            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <NavLink
                to="/tasks"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-bold'
                    : 'text-white hover:bg-indigo-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium'
                }
                style={({ isActive }) => ({ color: '#ffffff' })}
              >
                📋 Tasks
              </NavLink>
              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-bold'
                    : 'text-white hover:bg-indigo-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium'
                }
                style={({ isActive }) => ({ color: '#ffffff' })}
              >
                📊 Analytics
              </NavLink>
              <NavLink
                to="/completed"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-bold'
                    : 'text-white hover:bg-indigo-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium'
                }
                style={({ isActive }) => ({ color: '#ffffff' })}
              >
                ✅ Completed
              </NavLink>
              <NavLink
                to="/help"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-bold'
                    : 'text-white hover:bg-indigo-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium'
                }
                style={({ isActive }) => ({ color: '#ffffff' })}
              >
                ❓ Help
              </NavLink>
            </div>
            
            {/* Right side - Auth button and Menu Button */}
            <div className="flex items-center">
              {auth.isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="hidden md:block bg-gradient-to-br from-rose-600 to-rose-500 text-white px-4 py-2 rounded-full text-sm font-bold transition duration-200 mr-4 shadow-lg hover:shadow-xl"
                >
                  🔒 Logout
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className="hidden md:block bg-gradient-to-br from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold transition duration-200 mr-4 shadow-lg hover:shadow-xl"
                >
                  🔓 Login
                </NavLink>
              )}
              
              {/* Menu Button with text */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-3 rounded-lg text-white hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all duration-200 font-bold text-lg"
              >
                <span className="sr-only">Open main menu</span>
                {/* Menu text */}
                <span className="px-4 py-2">Menu</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu - Only visible when isMenuOpen is true */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-800 border-t border-slate-700">
              <NavLink
                to="/tasks"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-indigo-600 text-white block px-3 py-2 rounded-md text-base font-bold'
                    : 'text-white hover:bg-indigo-500 hover:text-white block px-3 py-2 rounded-md text-base font-medium'
                }
                style={({ isActive }) => ({ color: '#ffffff' })}
                onClick={() => setIsMenuOpen(false)}
              >
                📋 Tasks
              </NavLink>
              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-indigo-600 text-white block px-3 py-2 rounded-md text-base font-bold'
                    : 'text-white hover:bg-indigo-500 hover:text-white block px-3 py-2 rounded-md text-base font-medium'
                }
                style={({ isActive }) => ({ color: '#ffffff' })}
                onClick={() => setIsMenuOpen(false)}
              >
                📊 Analytics
              </NavLink>
              <NavLink
                to="/completed"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-indigo-600 text-white block px-3 py-2 rounded-md text-base font-bold'
                    : 'text-white hover:bg-indigo-500 hover:text-white block px-3 py-2 rounded-md text-base font-medium'
                }
                style={({ isActive }) => ({ color: '#ffffff' })}
                onClick={() => setIsMenuOpen(false)}
              >
                ✅ Completed
              </NavLink>
              <NavLink
                to="/help"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-indigo-600 text-white block px-3 py-2 rounded-md text-base font-bold'
                    : 'text-white hover:bg-indigo-500 hover:text-white block px-3 py-2 rounded-md text-base font-medium'
                }
                style={({ isActive }) => ({ color: '#ffffff' })}
                onClick={() => setIsMenuOpen(false)}
              >
                ❓ Help
              </NavLink>
              {auth.isLoggedIn ? (
                <button
                  onClick={() => {
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                  className="w-full text-left bg-gradient-to-br from-rose-600 to-rose-500 text-white block px-3 py-2 rounded-md text-base font-bold transition duration-200 mt-2"
                >
                  🔒 Logout
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white block px-3 py-2 rounded-md text-base font-bold transition duration-200 mt-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  🔓 Login
                </NavLink>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-64px)]">
        <Outlet context={{ auth, setAuth }} />
      </main>
    </div>
  )
}
