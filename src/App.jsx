import { useState, useEffect } from 'react'
import AppShell from './AppShell'
import LoginPage from './pages/LoginPage'
import ResetPassword from './pages/ResetPassword'
import { supabase } from './lib/supabase'
import { useActivityTracker } from './hooks/useActivityTracker'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)

  useActivityTracker()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true)
      }
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) return null

  if (isRecovery) return <ResetPassword onDone={() => { setIsRecovery(false) }} />

  if (!user) return <LoginPage />

  return <AppShell user={user} onSignOut={signOut} />
}
