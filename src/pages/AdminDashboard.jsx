import { useAdminStats } from '../hooks/useAdminStats'
import { useState } from 'react'

export default function AdminDashboard() {
  const { stats, isAdmin, loading } = useAdminStats()
  const [selected, setSelected] = useState(null)

  if (loading) return (
    <div style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>
      Chargement...
    </div>
  )

  if (!isAdmin) return (
    <div style={{ padding: '2rem', color: 'var(--color-text-danger)' }}>
      Accès refusé.
    </div>
  )

  const selectedUser = stats?.find(u => u.id === selected)

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
        <span style={{ fontSize: '20px' }}>🛡️</span>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Admin Naposolo</h1>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
            {stats?.length} utilisateur{stats?.length > 1 ? 's' : ''} alpha
          </p>
        </div>
      </div>

      {/* Liste users */}
      <div style={{ display: 'grid', gap: '10px', marginBottom: '2rem' }}>
        {stats?.map(u => (
          <div
            key={u.id}
            onClick={() => setSelected(selected === u.id ? null : u.id)}
            style={{
              background: selected === u.id
                ? 'var(--color-background-info)'
                : 'var(--color-background-secondary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              cursor: 'pointer',
              display: 'grid',
              gridTemplateColumns: '40px 1fr repeat(4, auto)',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#EEEDFE', color: '#3C3489',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 500
            }}>
              {(u.prenom ?? '?')[0].toUpperCase()}
            </div>

            {/* Nom */}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{u.prenom}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {u.lastSeen
                  ? `Vu ${new Date(u.lastSeen).toLocaleDateString('fr-FR')}`
                  : 'Jamais connecté'}
              </div>
            </div>

            {/* Stats rapides */}
            {[
              { val: u.totalSessions, lbl: 'sessions' },
              { val: u.avgDuration + 'mn', lbl: 'durée moy.' },
              { val: u.totalEvents, lbl: 'actions' },
              { val: u.eventsByType['seance_created'] ?? 0, lbl: 'séances' },
            ].map(({ val, lbl }) => (
              <div key={lbl} style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>{val}</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{lbl}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Détail user sélectionné */}
      {selectedUser && (
        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '1rem' }}>
            Détail — {selectedUser.prenom}
          </h2>

          {/* Pages visitées */}
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pages visitées
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.25rem' }}>
            {Object.entries(selectedUser.pageViews).length === 0
              ? <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Aucune</span>
              : Object.entries(selectedUser.pageViews)
                  .sort((a, b) => b[1] - a[1])
                  .map(([page, count]) => (
                    <span key={page} style={{
                      fontSize: '12px', padding: '4px 10px',
                      background: 'var(--color-background-secondary)',
                      borderRadius: '20px',
                      border: '0.5px solid var(--color-border-tertiary)'
                    }}>
                      {page} · {count}x
                    </span>
                  ))
            }
          </div>

          {/* Actions par type */}
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Actions
          </p>
          <div style={{ display: 'grid', gap: '6px' }}>
            {Object.entries(selectedUser.eventsByType).length === 0
              ? <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Aucune action</span>
              : Object.entries(selectedUser.eventsByType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', fontSize: '13px',
                      padding: '6px 0',
                      borderBottom: '0.5px solid var(--color-border-tertiary)'
                    }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{type}</span>
                      <span style={{ fontWeight: 500 }}>{count}x</span>
                    </div>
                  ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
