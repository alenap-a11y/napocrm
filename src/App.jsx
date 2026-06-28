import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AppShell from './AppShell'
import LoginPage from './pages/LoginPage'
import SetPassword from './pages/SetPassword'
import ResetPassword from './pages/ResetPassword'
import AdminLayout from './pages/AdminLayout'
import { supabase } from './lib/supabase'
import AgendaPublic from './pages/AgendaPublic'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const { data } = await supabase.from('profiles').select('role').eq('id', u.id).single()
        setIsAdmin(data?.role === 'admin')
      }
      setAdminLoading(false)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
      if (event === 'SIGNED_IN') {
        const params = new URLSearchParams(window.location.hash.replace('#', '?'))
        if (params.get('type') === 'invite') {
          window.location.replace('/set-password')
          return
        }
      }
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (location.pathname.startsWith('/rdv/')) {
    const slug = location.pathname.split('/rdv/')[1]
    return <AgendaPublic slug={slug} />
  }
  if (loading) return null
  if (isRecovery) return <ResetPassword onDone={() => { setIsRecovery(false); window.location.replace('/board') }} />
  if (location.pathname === '/set-password') return <SetPassword />
  if (!user) return <LoginPage />
  if (location.pathname.startsWith('/napo-cockpit-7X')) {
    if (adminLoading) return null
    if (!isAdmin) return <div style={{padding:'2rem',color:'red'}}>Accès refusé.</div>
    return <AdminLayout user={user} onSignOut={signOut} />
  }
  return <AppShell user={user} onSignOut={signOut} />
}
