import { useState } from 'react'

export default function Clients() {
  const [search, setSearch] = useState('')

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Clients</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Gérez votre liste de clients</p>
        </div>
        <button
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: '#534AB7', color: '#fff', fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Nouveau client
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <i className="ti ti-search" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#9ca3af', pointerEvents: 'none' }} aria-hidden="true" />
        <input
          type="text"
          placeholder="Rechercher un client…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px 8px 34px',
            borderRadius: 8, border: '0.5px solid #e5e7eb',
            background: '#fff', fontSize: 13, color: '#111827',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{
        background: '#f9fafb', borderRadius: 10,
        border: '0.5px solid #e5e7eb',
        padding: '48px 24px', textAlign: 'center',
      }}>
        <i className="ti ti-users-off" style={{ fontSize: 36, color: '#d1d5db', display: 'block', marginBottom: 12 }} aria-hidden="true" />
        <div style={{ fontSize: 14, fontWeight: 500, color: '#6b7280' }}>Aucun client pour l'instant</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Cliquez sur "+ Nouveau client" pour commencer</div>
      </div>
    </div>
  )
}
