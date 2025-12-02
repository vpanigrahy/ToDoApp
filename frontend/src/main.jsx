import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import './App.css'
import Layout from './components/Layout'
import Login from './pages/Login'
import Tasks from './pages/Tasks'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Help from './pages/Help'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="analytics" element={<Dashboard />} />
          <Route path="completed" element={<History />} />
          <Route path="help" element={<Help />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
