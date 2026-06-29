import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function StatusBadge({ lastSignIn }) {
  if (!lastSignIn) return <span style={{ fontSize: '11px', color: '#888' }}>—</span>
  const diff = Date.now() - new Date(lastSignIn).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const enLigne = minutes < 15
  const label = enLigne ? 'En ligne' : days > 0 ? `il y a ${days}j` : hours > 0 ? `il y a ${hours}h` : `il y a ${minutes}mn`
  const dateExacte = new Date(lastSignIn).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: enLigne ? '#7C9A7E' : '#E24B4A', flexShrink: 0 }} />
        <span style={{ fontSize: '11px', fontWeight: 500, color: enLigne ? '#7C9A7E' : '#E24B4A' }}>
          {enLigne ? 'En ligne' : 'Hors ligne'}
        </span>
      </div>
      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', paddingLeft: '12px' }}>
        {enLigne ? 'Connecté maintenant' : dateExacte}
      </div>
    </div>
  )
}

function isEnLigne(lastSignIn) {
  if (!lastSignIn) return false
  return (Date.now() - new Date(lastSignIn).getTime()) < 15 * 60 * 1000
}

function MetiersPanel({ users }) {
  const grouped = {}
  users.forEach(u => {
    const metier = (u.metier || '').trim() || 'Non renseigné'
    const key = metier.charAt(0).toUpperCase() + metier.slice(1).toLowerCase()
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(u)
  })
  const sorted = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '1rem' }}>
        Répartition par métier
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sorted.map(([metier, membres]) => {
          const enligne = membres.filter(u => isEnLigne(u.last_sign_in_at)).length
          const hors = membres.length - enligne
          const [open, setOpen] = useState(false)
          return (
            <div key={metier} style={{ background: 'var(--color-background-primary)', borderRadius: '10px', border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden' }}>
              <div
                onClick={() => setOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(75,191,206,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{metier}</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#4BBFCE22', color: '#4BBFCE', fontWeight: 600 }}>
                    {membres.length}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7C9A7E', display: 'inline-block' }} />
                    {enligne} en ligne
                  </span>
                  <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E24B4A', display: 'inline-block' }} />
                    {hors} hors ligne
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{open ? '▲' : '▼'}</span>
                </div>
              </div>
              {open && (
                <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                        {['Prénom / Nom', 'Email', 'Statut'].map((h, i) => (
                          <th key={i} style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {membres.map(u => (
                        <tr key={u.id} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#4BBFCE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                                {(u.prenom || u.email || '?')[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 500 }}>{u.prenom || '—'} {u.nom || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{u.email || '—'}</td>
                          <td style={{ padding: '10px 14px' }}><StatusBadge lastSignIn={u.last_sign_in_at} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AdminUsers({ onSelectUser }) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const PER_PAGE = 20

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      const { data, error } = await supabase
        .from('admin_users_view')
        .select('id, prenom, nom, slug, is_admin, agenda_public, welcomed_at, metier, email, last_sign_in_at, created_at')
        .order('last_sign_in_at', { ascending: false, nullsFirst: false })
      if (error) console.error('admin_users_view error:', error)
      setUsers(data || [])
      setLoading(false)
    }
    fetchUsers()
  }, [])

  const filtered = users.filter(u =>
    (u.prenom || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.nom || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.metier || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.slug || '').toLowerCase().includes(search.toLowerCase())
  )
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Utilisateurs</h1>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{filtered.length} utilisateur{filtered.length > 1 ? 's' : ''}</p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: '320px' }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: 'var(--color-text-secondary)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Rechercher par prénom, email, métier..."
            style={{ width: '100%', padding: '8px 8px 8px 32px', borderRadius: '8px',
              border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)',
              fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ background: 'var(--color-background-primary)', borderRadius: '10px', border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              {['#', 'Utilisateur', 'Email', 'Métier', 'Rôle', 'Statut / Dernière connexion', ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px',
                  fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Chargement...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Aucun utilisateur trouvé</td></tr>
            ) : paginated.map((u, i) => (
              <tr key={u.id}
                onClick={() => onSelectUser(u)}
                style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(75,191,206,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {page * PER_PAGE + i + 1}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#4BBFCE',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                      {(u.prenom || u.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{u.prenom || '—'} {u.nom || ''}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {u.email || '—'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px',
                    background: u.metier ? '#4BBFCE18' : '#88888812',
                    color: u.metier ? '#4BBFCE' : '#aaa' }}>
                    {u.metier || 'Non renseigné'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px',
                    background: u.is_admin ? '#B8961E22' : '#88888818',
                    color: u.is_admin ? '#B8961E' : '#888' }}>
                    {u.is_admin ? '⭐ Admin' : 'User'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <StatusBadge lastSignIn={u.last_sign_in_at} />
                </td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: '#4BBFCE' }}>
                  Voir →
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Page {page + 1} / {totalPages}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '0.5px solid var(--color-border-tertiary)',
                background: 'transparent', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: page === 0 ? 0.4 : 1 }}>← Préc</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '0.5px solid var(--color-border-tertiary)',
                background: 'transparent', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>Suiv →</button>
          </div>
        </div>
      )}

      {!loading && users.length > 0 && <MetiersPanel users={users} />}
    </div>
  )
}
