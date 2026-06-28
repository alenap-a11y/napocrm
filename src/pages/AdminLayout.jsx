import { useState } from 'react'
import { supabase } from '../lib/supabase'
import AdminDashboard from './AdminDashboard'
import SupabaseStats from './SupabaseStats'
import AdminFaq from './AdminFaq'
import AdminAide from './AdminAide'
import AdminNews from './AdminNews'
import AdminLanding from './AdminLanding'
import AdminOnboarding from './AdminOnboarding'
import AdminRoadmap from './AdminRoadmap'
import AdminNapoPlus from './AdminNapoPlus'
import AdminMarketplace from './AdminMarketplace'
import AdminUsers from './AdminUsers'
import AdminUserDetail from './AdminUserDetail'

export default function AdminLayout({ user }) {
  const [page, setPage] = useState('dashboard')
  const [decoOpen, setDecoOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  async function signOut() {
    await supabase.auth.signOut()
    window.location.hash = '#'
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',  icon: 'ti-shield-check', group: null },
    { id: 'supabase',  label: 'Supabase',   icon: 'ti-database',     group: null },
    { id: 'napoplus',  label: 'Napo+',      icon: 'ti-sparkles',     group: null },
    { id: 'marketplace', label: 'Marketplace', icon: 'ti-store',        group: null },
    { id: 'users',       label: 'Utilisateurs', icon: 'ti-users',      group: null },
  ]

  const supportItems = [
    { id: 'admin-faq',  label: 'FAQ',   icon: 'ti-help-circle' },
    { id: 'admin-aide', label: 'Aide',  icon: 'ti-book' },
    { id: 'admin-landing', label: 'Landing page', icon: 'ti-home' },
    { id: 'admin-onboarding', label: 'Popup onboarding', icon: 'ti-message-circle' },
    { id: 'admin-roadmap', label: 'Roadmap', icon: 'ti-map' },
    { id: 'admin-news', label: 'News',  icon: 'ti-speakerphone' },
  ]

  function NavItem({ item }) {
    const active = page === item.id
    return (
      <div onClick={() => setPage(item.id)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 1rem', cursor: 'pointer',
          background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
          borderLeft: active ? '2px solid #B8961E' : '2px solid transparent' }}>
        <i className={`ti ${item.icon}`} style={{ fontSize: '15px', color: active ? '#B8961E' : 'rgba(255,255,255,0.5)' }} aria-hidden="true" />
        <span style={{ fontSize: '12px', fontWeight: active ? 500 : 400, color: active ? '#fff' : 'rgba(255,255,255,0.5)' }}>
          {item.label}
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: '180px', flexShrink: 0, borderRight: '0.5px solid rgba(255,255,255,0.08)',
        background: '#111827', display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '1.25rem 1rem', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>Naposolo</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Admin</div>
        </div>

        <div style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
          {navItems.map(item => <NavItem key={item.id} item={item} />)}

          {/* Section Support Napo */}
          <div style={{ padding: '0.75rem 1rem 0.25rem', marginTop: '0.5rem', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Support Napo
            </div>
          </div>
          {supportItems.map(item => <NavItem key={item.id} item={item} />)}
        </div>

        <div style={{ padding: '1rem', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#B8961E',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 500, color: '#fff', flexShrink: 0 }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email?.split('@')[0]}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Admin</div>
            </div>
          </div>
          <button onClick={() => setDecoOpen(true)}
            style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '0.5px solid rgba(255,255,255,0.15)',
              background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '11px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <i className="ti ti-logout" style={{ fontSize: '13px' }} aria-hidden="true" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--color-background-tertiary)' }}>
        {page === 'dashboard'   && <AdminDashboard />}
        {page === 'supabase'    && <SupabaseStats />}
        {page === 'admin-landing' && <AdminLanding />}
        {page === 'admin-onboarding' && <AdminOnboarding />}
        {page === 'admin-roadmap' && <AdminRoadmap />}
        {page === 'admin-faq'   && <AdminFaq />}
        {page === 'admin-aide'  && <AdminAide />}
        {page === 'admin-news'  && <AdminNews />}
        {page === 'napoplus'    && <AdminNapoPlus />}
        {page === 'marketplace' && <AdminMarketplace />}
        {page === 'users' && !selectedUser && <AdminUsers onSelectUser={u => setSelectedUser(u)} />}
        {page === 'users' && selectedUser && <AdminUserDetail user={selectedUser} onBack={() => setSelectedUser(null)} />}
      </div>

      {decoOpen && (
        <div onClick={() => setDecoOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'var(--color-background-primary)', borderRadius: '12px', padding: '1.5rem', width: '280px',
              border: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px' }}>Se déconnecter ?</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>{user?.email}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setDecoOpen(false)}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)',
                  background: 'transparent', cursor: 'pointer', fontSize: '13px' }}>
                Annuler
              </button>
              <button onClick={signOut}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                  background: '#E24B4A', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                Déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
