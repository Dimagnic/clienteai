import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Configurar from './pages/Configurar'
import Preview from './pages/Preview'
import Precios from './pages/Precios'
import Legal from './pages/Legal'
import Chat from './pages/Chat'
import AsesorDashboard from './pages/AsesorDashboard'
import AdminLogin from './pages/AdminLogin'
import ActivarAsesor from './pages/ActivarAsesor'
import ActivarCliente from './pages/ActivarCliente'
import ResetPassword from './pages/ResetPassword'
import EnConstruccion from './pages/EnConstruccion'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined)

  // MODO MANTENIMIENTO: se activa con la variable de entorno
  // VITE_MAINTENANCE_MODE=true en Vercel. Para ver el sitio real mientras
  // está activo, visita una vez: clienteai.site/?preview=TU_CLAVE
  // (la clave se define en VITE_PREVIEW_KEY). Se recuerda en este navegador.
  const mantenimiento = import.meta.env.VITE_MAINTENANCE_MODE === 'true'
  const previewKey = import.meta.env.VITE_PREVIEW_KEY || ''

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const intento = params.get('preview')
    if (intento && previewKey && intento === previewKey) {
      localStorage.setItem('cai_preview_ok', '1')
    }
  }, [])

  useEffect(() => {
    if (!localStorage.getItem('theme')) {
      document.documentElement.setAttribute('data-theme', 'light')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.setAttribute('data-theme', localStorage.getItem('theme'))
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const tieneBypass = localStorage.getItem('cai_preview_ok') === '1'
  if (mantenimiento && !tieneBypass) {
    return <EnConstruccion />
  }

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
      <Routes>
        <Route path="/" element={<Landing session={session} />} />
        <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
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
        <Route path="/chat/:token" element={<Chat />} />
        <Route path="/asesor" element={
          <ProtectedRoute session={session}>
            <AsesorDashboard session={session} />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={session ? <Navigate to="/dashboard" replace /> : <AdminLogin />} />
        <Route path="/activar-asesor" element={<ActivarAsesor />} />
        <Route path="/activar-cliente" element={<ActivarCliente />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/legal" element={<Legal />} />
<Route path="/precios" element={<Precios session={session} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}