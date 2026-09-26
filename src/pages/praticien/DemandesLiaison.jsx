import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'

const STATUT_LABEL = { en_attente: 'En attente', accepte: 'Acceptée', bloque: 'Bloquée' }

export default function DemandesLiaison() {
  const [rows, setRows] = useState([])
  const [portails, setPortails] = useState({})
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [manualPick, setManualPick] = useState({})

  async function charger() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const [{ data: liaisons }, { data: cs }] = await Promise.all([
      supabase.from('liaisons_praticien_client').select('*').eq('praticien_id', user.id).order('demande_at', { ascending: false }),
      supabase.from('clients').select('id, prenom, nom, email').eq('user_id', user.id).order('nom'),
    ])
    setClients(cs || [])
    setRows(liaisons || [])
    const portailIds = [...new Set((liaisons || []).map(l => l.client_portail_id))]
    if (portailIds.length > 0) {
      const { data: ps } = await supabase.from('clients_portail').select('id, nom, prenom, email').in('id', portailIds)
      const map = {}
      ;(ps || []).forEach(p => { map[p.id] = p })
      setPortails(map)
    } else {
      setPortails({})
    }
    setLoading(false)
  }

  useEffect(() => { charger() }, [])

  async function accepter(row) {
    const clientId = row.client_id || manualPick[row.id]
    if (!clientId) return
    setBusyId(row.id)
    await supabase.from('liaisons_praticien_client')
      .update({ statut: 'accepte', client_id: clientId, reponse_at: new Date().toISOString() })
      .eq('id', row.id)
    setBusyId(null)
    charger()
  }

  async function bloquer(row) {
    setBusyId(row.id)
    await supabase.from('liaisons_praticien_client')
      .update({ statut: 'bloque', reponse_at: new Date().toISOString() })
      .eq('id', row.id)
    setBusyId(null)
    charger()
  }

  async function debloquer(row) {
    setBusyId(row.id)
    await supabase.from('liaisons_praticien_client')
      .update({ statut: 'en_attente', reponse_at: new Date().toISOString() })
      .eq('id', row.id)
    setBusyId(null)
    charger()
  }

  const clientsById = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients])

  if (loading) return <div style={{ padding: 32 }}>Chargement…</div>

  return (
    <div style={{ padding: '24px 28px', maxWidth: 720 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Demandes de liaison</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
        Demandes envoyées par des clients depuis leur espace personnel, pour se lier à votre fiche praticien.
      </p>

      {rows.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Aucune demande pour le moment.</p>
      )}

      {rows.map(row => {
        const portail = portails[row.client_portail_id]
        const clientMatch = row.client_id ? clientsById[row.client_id] : null
        return (
          <div key={row.id} style={{ border: '0.5px solid var(--color-border-secondary)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{portail?.prenom} {portail?.nom}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{portail?.email}</div>
                <div style={{ fontSize: 11, marginTop: 4, color: row.statut === 'accepte' ? '#4A7A3E' : row.statut === 'bloque' ? '#993556' : 'var(--color-text-secondary)' }}>
                  {STATUT_LABEL[row.statut] || row.statut}
                  {row.match_auto && row.statut === 'en_attente' && ' — identité confirmée automatiquement (email correspondant)'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {row.statut === 'en_attente' && (
                  <>
                    {row.client_id ? (
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        → {clientMatch ? `${clientMatch.prenom} ${clientMatch.nom}` : 'fiche client'}
                      </span>
                    ) : (
                      <select
                        value={manualPick[row.id] || ''}
                        onChange={e => setManualPick(prev => ({ ...prev, [row.id]: e.target.value }))}
                        style={{ fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)' }}
                      >
                        <option value="">Associer à…</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.prenom} {c.nom}{c.email ? ` (${c.email})` : ''}</option>
                        ))}
                      </select>
                    )}
                    <button onClick={() => accepter(row)} disabled={busyId === row.id || (!row.client_id && !manualPick[row.id])}
                      style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, border: 'none', background: '#4A7A3E', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: (!row.client_id && !manualPick[row.id]) ? 0.5 : 1 }}>
                      Accepter
                    </button>
                    <button onClick={() => bloquer(row)} disabled={busyId === row.id}
                      style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, border: '0.5px solid #993556', background: 'transparent', color: '#993556', fontWeight: 600, cursor: 'pointer' }}>
                      Bloquer
                    </button>
                  </>
                )}
                {row.statut === 'accepte' && (
                  <button onClick={() => bloquer(row)} disabled={busyId === row.id}
                    style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, border: '0.5px solid #993556', background: 'transparent', color: '#993556', fontWeight: 600, cursor: 'pointer' }}>
                    Bloquer
                  </button>
                )}
                {row.statut === 'bloque' && (
                  <button onClick={() => debloquer(row)} disabled={busyId === row.id}
                    style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', fontWeight: 600, cursor: 'pointer' }}>
                    Réactiver
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
