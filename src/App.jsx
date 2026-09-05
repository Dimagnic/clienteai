import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { supabase } from './lib/supabase'
import Landing from './pages/Landing'
import EnConstruccion from './pages/EnConstruccion'

// Code-splitting: estas páginas se descargan solo cuando el visitante
// navega a ellas, en vez de venir todas juntas con la landing pública
// (que es lo que ve la gran mayoría de visitantes la primera vez).
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Configurar = lazy(() => import('./pages/Configurar'))
const Preview = lazy(() => import('./pages/Preview'))
const Precios = lazy(() => import('./pages/Precios'))
const Legal = lazy(() => import('./pages/Legal'))
const Chat = lazy(() => import('./pages/Chat'))
const AsesorDashboard = lazy(() => import('./pages/AsesorDashboard'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const ActivarAsesor = lazy(() => import('./pages/ActivarAsesor'))
const ActivarCliente = lazy(() => import('./pages/ActivarCliente'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

function CargandoPagina() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #dcfce7', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)

  // MODO MANTENIMIENTO: se activa con la variable de entorno
  // VITE_MAINTENANCE_MODE=true en Vercel. Para ver el sitio real mientras
  // está activo, visita una vez: clienteai.site/?preview=TU_CLAVE
  // (la clave se define en VITE_PREVIEW_KEY). Se recuerda en este navegador.
  const mantenimiento = import.meta.env.VITE_MAINTENANCE_MODE === 'true'
  const previewKey = import.meta.env.VITE_PREVIEW_KEY || ''

  // Se ejecuta solo al montar (leer el ?preview= de la URL una vez).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const intento = params.get('preview')
    if (intento && previewKey && intento === previewKey) {
      localStorage.setItem('cai_preview_ok', '1')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <Suspense fallback={<CargandoPagina />}>
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
      </Suspense>
    </BrowserRouter>
  )
}
