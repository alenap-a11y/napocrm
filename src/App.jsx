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

  if (location.pathname.startsWith('/rdv/')) {
    const slug = location.pathname.split('/rdv/')[1]
    return <AgendaPublic slug={slug} />
  }
  if (location.pathname === '/politique-confidentialite') {
    return <PolitiqueConfidentialite />
  }
  if (loading) return null
  if (isRecovery) return <ResetPassword onDone={() => setIsRecovery(false)} />
  if (location.pathname === '/set-password') return <SetPassword />
  if (!user) return <LoginPage />
  
  // Route pour la gestion d'agenda (protégée)
  if (location.pathname === '/mon-agenda') return <AgendaSettings />

  if (location.pathname.startsWith('/napo-cockpit-7X')) {
    if (adminLoading) return null
    if (!isAdmin) return <div style={{padding:'2rem',color:'red'}}>Accès refusé.</div>
    return <AdminLayout user={user} onSignOut={signOut} />
  }
  return <AppShell key={user?.id ?? 'guest'} user={user} onSignOut={signOut} />
}