import { useState, useEffect } from 'react'
import AppShell from './AppShell'
import LoginPage from './components/LoginPage'
import { supabase } from './lib/supabase'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) return null

  if (!user) return <LoginPage />

  return <AppShell user={user} onSignOut={signOut} />
}
