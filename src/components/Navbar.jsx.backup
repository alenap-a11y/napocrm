import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Navbar({ accent = '#B8961E' }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const prenom = user?.user_metadata?.prenom || user?.email?.split('@')[0] || 'Utilisateur'
  const initiale = prenom.charAt(0).toUpperCase()

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
        Bonjour, {prenom}
      </span>
      <div
        className="tb-av"
        style={{ background: '#1B2A4A', color: accent }}
        title={prenom}
      >
        {initiale}
      </div>
    </nav>
  )
}
