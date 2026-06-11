import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Navbar({ accent = '#B8961E', onMenuToggle, menuOpen = false }) {
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
    <nav className="navbar">
      {/* Burger — visible mobile/tablette uniquement */}
      {onMenuToggle && (
        <button
          className="navbar-burger"
          onClick={onMenuToggle}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
        >
          <i className={`ti ${menuOpen ? 'ti-x' : 'ti-menu-2'}`} aria-hidden="true" />
        </button>
      )}

      {/* Contenu horizontal — masqué sur mobile si menu fermé */}
      <div className="navbar-content">
        <span className="navbar-greeting">
          Bonjour, {prenom}
        </span>
        <div
          className="tb-av"
          style={{ background: '#1B2A4A', color: accent }}
          title={prenom}
        >
          {initiale}
        </div>
      </div>
    </nav>
  )
}
