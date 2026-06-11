import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Configurar from './pages/Configurar'
import Preview from './pages/Preview'
import Precios from './pages/Precios'
import ThemeToggle from './components/ThemeToggle'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #dcfce7', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

return (
    <BrowserRouter>
      <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 99999 }}>
        <ThemeToggle />
      </div>
      <Routes>
        <Route path="/" element={<Landing session={session} />} />
        <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/precios" element={<Precios />} />
        <Route path="/dashboard" element={
          <ProtectedRoute session={session}>
            <Dashboard session={session} />
          </ProtectedRoute>
        } />
        <Route path="/configurar" element={
          <ProtectedRoute session={session}>
            <Configurar session={session} />
          </ProtectedRoute>
        } />
        <Route path="/preview" element={
          <ProtectedRoute session={session}>
            <Preview session={session} />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

