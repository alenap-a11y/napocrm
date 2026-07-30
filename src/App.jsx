import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AppShell from './AppShell'
import LoginPage from './pages/LoginPage'
import SetPassword from './pages/SetPassword'
import ResetPassword from './pages/ResetPassword'
import AdminLayout from './pages/AdminLayout'
import AgendaSettings from './pages/AgendaSettings'
import AgendaPublic from './pages/AgendaPublic'
import PolitiqueConfidentialite from './pages/PolitiqueConfidentialite'
import { supabase } from './lib/supabase'
import { Analytics } from '@vercel/analytics/react'

function clearNapoLocalPrefs() {
  const NAPO_LOCAL_KEYS_PREFIX = ['napo_', 'naposolo_'];
  Object.keys(localStorage)
    .filter(k => NAPO_LOCAL_KEYS_PREFIX.some(p => k.startsWith(p)))
    .forEach(k => localStorage.removeItem(k));
}

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
        if (params.get('type') === 'signup') {
          setUser(session?.user ?? null)
          return
        }
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

  let content = null

  if (location.pathname.startsWith('/rdv/')) {
    const slug = location.pathname.split('/rdv/')[1]
    content = <AgendaPublic slug={slug} />
  } else if (location.pathname === '/politique-confidentialite') {
    content = <PolitiqueConfidentialite />
  } else if (loading) {
    content = null
  } else if (isRecovery) {
    content = <ResetPassword onDone={() => setIsRecovery(false)} />
  } else if (location.pathname === '/set-password') {
    content = <SetPassword />
  } else if (!user) {
    content = <LoginPage />
  } else if (location.pathname === '/mon-agenda') {
    content = <AgendaSettings />
  } else if (location.pathname.startsWith('/napo-cockpit-7X')) {
    if (adminLoading) content = null
    else if (!isAdmin) content = <div style={{padding:'2rem',color:'red'}}>Accès refusé.</div>
    else content = <AdminLayout user={user} onSignOut={signOut} />
  } else {
    content = <AppShell key={user?.id ?? 'guest'} user={user} onSignOut={signOut} />
  }

  return (
    <>
      {content}
      <Analytics />
    </>
  )
}