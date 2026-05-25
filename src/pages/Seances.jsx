import { useNavigate } from 'react-router-dom'

export default function Seances() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Séances</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Gérez vos séances et consultations</p>
        </div>
        <button
          onClick={() => navigate('/seances/nouvelle')}
          style={{
            padding: '8px 16px', borderRadius: 4, border: 'none',
            background: '#1a2744', color: '#c9a84c', fontSize: 13,
            fontWeight: 700, cursor: 'pointer',
          }}
        >
          + Nouvelle séance
        </button>
      </div>

      <div style={{
        background: '#f9fafb', borderRadius: 4,
        border: '0.5px solid #e5e7eb',
        padding: '48px 24px', textAlign: 'center',
      }}>
        <i className="ti ti-calendar-off" style={{ fontSize: 36, color: '#d1d5db', display: 'block', marginBottom: 12 }} aria-hidden="true" />
        <div style={{ fontSize: 14, fontWeight: 500, color: '#6b7280' }}>Aucune séance pour l'instant</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Cliquez sur "+ Nouvelle séance" pour commencer</div>
      </div>
    </div>
  )
}
