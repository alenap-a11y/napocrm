import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClients } from '../../hooks/useClients'
import { supabase } from '../../lib/supabase'

function clientName(c) { return `${c.prenom || ''} ${c.nom || ''}`.trim() }

const inp = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }
const statCard = { background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '14px 16px', minWidth: 140 }
const statLabel = { fontSize: 11, color: 'var(--color-text-secondary)' }
const statValue = { fontSize: 22, fontWeight: 600, marginTop: 2 }

const PERIODES = [
  { id: 'today', label: "Aujourd'hui", jours: 0 },
  { id: '7j', label: '7 jours', jours: 7 },
  { id: 'mois', label: 'Ce mois', jours: 30 },
  { id: '3mois', label: '3 mois', jours: 90 },
  { id: 'annee', label: 'Cette année', jours: 365 },
]

const FILTRES = ['Tous', 'Actifs', 'Nouveaux', 'Sans activité récente', 'Avec prochaine séance']

export default function MesClients() {
  const { clients, loading, addClient } = useClients()
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('Tous')
  const [periode, setPeriode] = useState('mois')
  const [seances, setSeances] = useState([])
  const [loadingSeances, setLoadingSeances] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newClient, setNewClient] = useState({ prenom: '', nom: '', email: '', tel: '' })
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('seances').select('client_id, date_seance, duree_minutes, statut')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (!error) setSeances(data || [])
          setLoadingSeances(false)
        })
    })
  }, [])

  const now = new Date()
  const periodeObj = PERIODES.find(p => p.id === periode)
  const seuilPeriode = new Date(now.getTime() - periodeObj.jours * 86400000)

  // Par client : dernière séance passée + prochaine séance planifiée (toutes périodes confondues)
  const infoParClient = useMemo(() => {
    const m = {}
    for (const s of seances) {
      if (!s.date_seance || !s.client_id) continue
      const d = new Date(s.date_seance)
      if (!m[s.client_id]) m[s.client_id] = { count: 0, derniere: null, prochaine: null }
      m[s.client_id].count++
      if (d < now && (!m[s.client_id].derniere || d > m[s.client_id].derniere)) m[s.client_id].derniere = d
      if (d >= now && s.statut === 'planifié' && (!m[s.client_id].prochaine || d < m[s.client_id].prochaine)) m[s.client_id].prochaine = d
    }
    return m
  }, [seances])

  const seancesPeriode = seances.filter(s => s.date_seance && new Date(s.date_seance) >= seuilPeriode)
  const tempsTotal = seancesPeriode.reduce((sum, s) => sum + (s.duree_minutes || 0), 0)
  const nouveauxPeriode = clients.filter(c => {
    const d = c.created_at || c.date_creation
    return d && new Date(d) >= seuilPeriode
  }).length
  const actifsPeriode = new Set(seancesPeriode.map(s => s.client_id).filter(Boolean)).size

  const clientsFiltres = clients.filter(c => {
    const q = search.toLowerCase()
    const matchQ = !q || clientName(c).toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.tel || '').toLowerCase().includes(q)
    if (!matchQ) return false
    const info = infoParClient[c.id]
    if (filtre === 'Actifs') return info?.derniere && info.derniere >= seuilPeriode
    if (filtre === 'Nouveaux') { const d = c.created_at || c.date_creation; return d && new Date(d) >= seuilPeriode }
    if (filtre === 'Sans activité récente') return !info?.derniere || info.derniere < seuilPeriode
    if (filtre === 'Avec prochaine séance') return !!info?.prochaine
    return true
  })

  const favoris = clients.filter(c => c.favori)

  async function handleAddClient(e) {
    e.preventDefault()
    if (!newClient.prenom && !newClient.nom) return
    await addClient(newClient)
    setNewClient({ prenom: '', nom: '', email: '', tel: '' })
    setShowAdd(false)
  }

  return (
    <div style={{ padding: '1.6rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>Mes clients</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>Retrouvez rapidement les personnes que vous accompagnez.</div>
        </div>
        <button type="button" onClick={() => setShowAdd(v => !v)}
          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Nouveau client
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddClient} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', background: 'var(--color-background-secondary)', borderRadius: 10, padding: 14, margin: '14px 0' }}>
          <input value={newClient.prenom} onChange={e => setNewClient(n => ({ ...n, prenom: e.target.value }))} placeholder="Prénom" style={{ ...inp, flex: 1, minWidth: 120 }} />
          <input value={newClient.nom} onChange={e => setNewClient(n => ({ ...n, nom: e.target.value }))} placeholder="Nom" style={{ ...inp, flex: 1, minWidth: 120 }} />
          <input value={newClient.email} onChange={e => setNewClient(n => ({ ...n, email: e.target.value }))} placeholder="Email" style={{ ...inp, flex: 1, minWidth: 160 }} />
          <input value={newClient.tel} onChange={e => setNewClient(n => ({ ...n, tel: e.target.value }))} placeholder="Téléphone" style={{ ...inp, flex: 1, minWidth: 140 }} />
          <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Ajouter</button>
        </form>
      )}

      <div style={{ display: 'flex', gap: 8, margin: '18px 0 10px', flexWrap: 'wrap' }}>
        {PERIODES.map(p => (
          <button key={p.id} type="button" onClick={() => setPeriode(p.id)}
            style={{ padding: '5px 12px', borderRadius: 20, border: '0.5px solid var(--color-border-secondary)', background: periode === p.id ? 'var(--color-accent)' : 'transparent', color: periode === p.id ? '#fff' : 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer' }}>
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={statCard}><div style={statLabel}>Clients</div><div style={statValue}>{clients.length}</div></div>
        <div style={statCard}><div style={statLabel}>Clients actifs</div><div style={statValue}>{loadingSeances ? '…' : actifsPeriode}</div></div>
        <div style={statCard}><div style={statLabel}>Nouveaux clients</div><div style={statValue}>{nouveauxPeriode}</div></div>
        <div style={statCard}><div style={statLabel}>Séances</div><div style={statValue}>{loadingSeances ? '…' : seancesPeriode.length}</div></div>
        <div style={statCard}><div style={statLabel}>Temps d'accompagnement</div><div style={statValue}>{loadingSeances ? '…' : `${Math.floor(tempsTotal / 60)}h${String(tempsTotal % 60).padStart(2, '0')}`}</div></div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 18 }}>
        Calculées sur la table de séances générique uniquement (Oracle, Énergie, Bach et modules métiers pas encore inclus).
      </div>

      {favoris.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Favoris</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {favoris.map(c => (
              <div key={c.id} onClick={() => navigate(`/praticien/clients/${c.id}`)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-background-secondary)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-star-filled" style={{ fontSize: 13, color: '#B8961E' }} aria-hidden="true" />
                  {clientName(c)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔎 Rechercher un client (nom, email, tél.)"
          style={{ ...inp, flex: 2, minWidth: 220 }} />
        <select value={filtre} onChange={e => setFiltre(e.target.value)} style={{ ...inp, flex: 1, minWidth: 160 }}>
          {FILTRES.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>Chargement…</div>
      ) : clients.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>Vous n'avez encore aucun client.</div>
      ) : clientsFiltres.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>Aucun client ne correspond à cette recherche.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {clientsFiltres.map(c => {
            const info = infoParClient[c.id]
            return (
              <div key={c.id} onClick={() => navigate(`/praticien/clients/${c.id}`)}
                style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{clientName(c) || '(sans nom)'}</div>
                {c.specialite && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{c.specialite}</div>}
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                  {info?.derniere ? `Dernière séance : ${info.derniere.toISOString().slice(0,10)}` : 'Aucune séance enregistrée'}
                </div>
                {info?.prochaine && <div style={{ fontSize: 12, color: 'var(--color-accent)' }}>Prochaine : {info.prochaine.toISOString().slice(0,10)}</div>}
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>{info?.count || 0} séance(s)</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
