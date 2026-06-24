import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AppShell from './AppShell'
import LoginPage from './pages/LoginPage'
import ResetPassword from './pages/ResetPassword'
import AdminLayout from './pages/AdminLayout'
import { supabase } from './lib/supabase'
import AgendaPublic from './pages/AgendaPublic'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
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
  if (isRecovery) return <ResetPassword onDone={() => setIsRecovery(false)} />
  if (!user) return <LoginPage />
  if (location.pathname.startsWith('/admin')) return <AdminLayout user={user} onSignOut={signOut} />
  return <AppShell user={user} onSignOut={signOut} />
}
