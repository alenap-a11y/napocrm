import { useParams, useNavigate } from 'react-router-dom'
import { useClients } from '../../hooks/useClients'

function clientName(c) { return `${c.prenom || ''} ${c.nom || ''}`.trim() }

export default function FicheClientPraticien() {
  const { clientId } = useParams()
  const { clients, loading } = useClients()
  const navigate = useNavigate()
  const client = clients.find(c => c.id === clientId)

  return (
    <div style={{ padding: '1.6rem 2rem' }}>
      <button type="button" onClick={() => navigate('/praticien/clients')}
        style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 13, cursor: 'pointer', marginBottom: 12, padding: 0 }}>
        ← Mes clients
      </button>
      {loading ? (
        <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>Chargement…</div>
      ) : !client ? (
        <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>Client introuvable.</div>
      ) : (
        <>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>{clientName(client)}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>Fiche détaillée à construire.</div>
        </>
      )}
    </div>
  )
}
