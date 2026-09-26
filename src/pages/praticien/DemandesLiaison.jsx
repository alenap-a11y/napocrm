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
  const [openChatId, setOpenChatId] = useState(null)
  const [messagesByLiaison, setMessagesByLiaison] = useState({})
  const [msgLoading, setMsgLoading] = useState(false)
  const [msgText, setMsgText] = useState('')
  const [msgSending, setMsgSending] = useState(false)

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

  async function chargerMessages(liaisonId) {
    setMsgLoading(true)
    const { data } = await supabase
      .from('messages_liaison')
      .select('*')
      .eq('liaison_id', liaisonId)
      .order('created_at', { ascending: true })
    setMessagesByLiaison(prev => ({ ...prev, [liaisonId]: data || [] }))
    setMsgLoading(false)
    const aLire = (data || []).filter(m => m.expediteur_type === 'client' && !m.lu_at).map(m => m.id)
    if (aLire.length > 0) {
      await supabase.from('messages_liaison').update({ lu_at: new Date().toISOString() }).in('id', aLire)
    }
  }

  function toggleChat(liaisonId) {
    if (openChatId === liaisonId) { setOpenChatId(null); return }
    setOpenChatId(liaisonId)
    setMsgText('')
    chargerMessages(liaisonId)
  }

  async function envoyerMessage(liaisonId) {
    if (!msgText.trim() || msgSending) return
    setMsgSending(true)
    const { error } = await supabase.from('messages_liaison').insert({
      liaison_id: liaisonId, expediteur_type: 'praticien', contenu: msgText.trim(),
    })
    setMsgSending(false)
    if (!error) {
      setMsgText('')
      chargerMessages(liaisonId)
    }
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
        const chatOuvert = openChatId === row.id
        const messages = messagesByLiaison[row.id] || []
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
                  <>
                    <button onClick={() => toggleChat(row.id)}
                      style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, border: '0.5px solid #2C5F66', background: chatOuvert ? '#2C5F66' : 'transparent', color: chatOuvert ? '#fff' : '#2C5F66', fontWeight: 600, cursor: 'pointer' }}>
                      Messagerie
                    </button>
                    <button onClick={() => bloquer(row)} disabled={busyId === row.id}
                      style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, border: '0.5px solid #993556', background: 'transparent', color: '#993556', fontWeight: 600, cursor: 'pointer' }}>
                      Bloquer
                    </button>
                  </>
                )}
                {row.statut === 'bloque' && (
                  <button onClick={() => debloquer(row)} disabled={busyId === row.id}
                    style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', fontWeight: 600, cursor: 'pointer' }}>
                    Réactiver
                  </button>
                )}
              </div>
            </div>

            {chatOuvert && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '0.5px solid var(--color-border-secondary)' }}>
                <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                  {msgLoading && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Chargement…</p>}
                  {!msgLoading && messages.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Aucun message pour l'instant.</p>}
                  {messages.map(m => (
                    <div key={m.id} style={{
                      alignSelf: m.expediteur_type === 'praticien' ? 'flex-end' : 'flex-start',
                      background: m.expediteur_type === 'praticien' ? '#2C5F66' : '#F1EFE8',
                      color: m.expediteur_type === 'praticien' ? '#fff' : '#222',
                      borderRadius: 10, padding: '8px 12px', fontSize: 13, maxWidth: '80%',
                    }}>
                      {m.contenu}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') envoyerMessage(row.id) }}
                    placeholder="Votre message…"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '0.5px solid var(--color-border-secondary)', fontSize: 13 }}
                  />
                  <button onClick={() => envoyerMessage(row.id)} disabled={msgSending || !msgText.trim()}
                    style={{ fontSize: 12, padding: '8px 16px', borderRadius: 20, border: 'none', background: '#2C5F66', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: msgSending ? 0.6 : 1 }}>
                    Envoyer
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
