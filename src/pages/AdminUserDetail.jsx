import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminUserDetail({ user, onBack }) {
  const [stats, setStats] = useState({ clients: 0, seances: 0, notes: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      const [c, s, n] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('seances').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      setStats({ clients: c.count || 0, seances: s.count || 0, notes: n.count || 0 })
      setLoading(false)
    }
    fetchStats()
  }, [user.id])

  const statCards = [
    { label: 'Clients', value: stats.clients, icon: 'ti-users', color: '#4BBFCE' },
    { label: 'Séances', value: stats.seances, icon: 'ti-calendar', color: '#7C9A7E' },
    { label: 'Notes', value: stats.notes, icon: 'ti-notes', color: '#B8961E' },
  ]

  return (
    <div style={{ padding: '2rem', maxWidth: '640px' }}>
      <button onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent',
          border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-secondary)',
          marginBottom: '1.5rem', padding: 0 }}>
        <i className="ti ti-arrow-left" /> Retour
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '2rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#4BBFCE',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 700, color: '#fff' }}>
          {(user.prenom || '?')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>{user.prenom || '—'}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Slug : {user.slug || '—'} · {user.is_admin ? '⭐ Admin' : 'Utilisateur'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '2rem' }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: 'var(--color-background-primary)', borderRadius: '10px',
            border: '0.5px solid var(--color-border-tertiary)', padding: '1rem', textAlign: 'center' }}>
            <i className={`ti ${s.icon}`} style={{ fontSize: '20px', color: s.color, display: 'block', marginBottom: '6px' }} />
            <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>
              {loading ? '…' : s.value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--color-background-primary)', borderRadius: '10px',
        border: '0.5px solid var(--color-border-tertiary)', padding: '1.25rem' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Infos profil</div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span>Agenda public : {user.agenda_public ? '✅ Oui' : '❌ Non'}</span>
          <span>Bienvenu le : {user.welcomed_at ? new Date(user.welcomed_at).toLocaleDateString('fr-FR') : '—'}</span>
        </div>
      </div>
    </div>
  )
}
