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
      navigate('/login')
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
      {/* Main Content */}
      <main className="min-h-screen">
        <Outlet context={{ auth, setAuth }} />
      </main>
    </div>
  )
}
