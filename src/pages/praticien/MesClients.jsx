import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClients } from '../../hooks/useClients'
import { supabase } from '../../lib/supabase'

function clientName(c) { return `${c.prenom || ''} ${c.nom || ''}`.trim() }

function calculerAge(dateNaissance) {
  if (!dateNaissance) return null
  const n = new Date(dateNaissance)
  const t = new Date()
  let age = t.getFullYear() - n.getFullYear()
  if (t.getMonth() < n.getMonth() || (t.getMonth() === n.getMonth() && t.getDate() < n.getDate())) age--
  return age
}

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

const EMPTY_CLIENT = {
  prenom: '', nom: '', nom_naissance: '', email: '', tel: '', date_naissance: '',
  specialite: 'Sophrologue',
  adresse_numero: '', adresse_rue: '', adresse_complement: '', code_postal: '', ville: '',
  situation_familiale: 'celibataire', environnement: 'non_toxique', situation_professionnelle: 'actif', nombre_enfants: 0,
  statut: 'actif', notes: '',
}

export default function MesClients() {
  const { clients, loading, addClient, refresh } = useClients()
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('Tous')
  const [periode, setPeriode] = useState('mois')
  const [seances, setSeances] = useState([])
  const [loadingSeances, setLoadingSeances] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newClient, setNewClient] = useState(EMPTY_CLIENT)
  const [formMsg, setFormMsg] = useState('')
  const navigate = useNavigate()
  const f = k => e => setNewClient(n => ({ ...n, [k]: e.target.value }))

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

  async function retirerFavori(e, c) {
    e.stopPropagation()
    await supabase.from('clients').update({ favori: false }).eq('id', c.id)
    refresh()
  }

  async function handleAddClient(e) {
    e.preventDefault()
    if (!newClient.prenom.trim() || !newClient.nom.trim()) { setFormMsg('Prénom et nom requis.'); return }
    await addClient(newClient)
    setNewClient(EMPTY_CLIENT)
    setFormMsg('✓ Client ajouté.')
    setTimeout(() => { setFormMsg(''); setShowAdd(false) }, 1200)
  }

  return (
    <div style={{ padding: '1.6rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>Mes clients</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>Retrouvez rapidement les personnes que vous accompagnez.</div>
        </div>
        <button type="button" onClick={() => setShowAdd(v => !v)}
          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#F2B01E', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Nouveau client
        </button>
      </div>

      {showAdd && (
        <div style={{ margin: '14px 0' }}>
          {formMsg && (
            <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: formMsg.startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: formMsg.startsWith('✓') ? '#3B6D11' : '#993556', fontSize: 13 }}>
              {formMsg}
            </div>
          )}
          <form onSubmit={handleAddClient} style={{ background: 'var(--color-background-secondary)', borderRadius: 14, border: '0.5px solid var(--color-border-tertiary)', padding: 28, maxWidth: 640 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 22 }}>Informations du client</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <Field label="Prénom"><input value={newClient.prenom} onChange={f('prenom')} placeholder="Sophie" style={inp} /></Field>
              <Field label="Nom"><input value={newClient.nom} onChange={f('nom')} placeholder="Legrand" style={inp} /></Field>
              <Field label="Nom de naissance" style={{ gridColumn: '1/-1' }}><input value={newClient.nom_naissance} onChange={f('nom_naissance')} placeholder="Dupont" style={inp} /></Field>
              <Field label="Email"><input type="email" value={newClient.email} onChange={f('email')} placeholder="email@exemple.com" style={inp} /></Field>
              <Field label="Téléphone"><input type="tel" value={newClient.tel} onChange={f('tel')} placeholder="06 00 00 00 00" style={inp} /></Field>
              <Field label="Date de naissance"><input type="date" value={newClient.date_naissance} onChange={f('date_naissance')} style={inp} /></Field>
              <Field label="Situation familiale">
                <select value={newClient.situation_familiale} onChange={f('situation_familiale')} style={inp}>
                  <option value="celibataire">Célibataire</option>
                  <option value="marie">Marié(e)</option>
                  <option value="divorce">Divorcé(e)</option>
                  <option value="separe">Séparé(e)</option>
                  <option value="veuf">Veuf</option>
                  <option value="veuve">Veuve</option>
                </select>
              </Field>
              <Field label="N°"><input value={newClient.adresse_numero} onChange={f('adresse_numero')} placeholder="12" style={inp} /></Field>
              <Field label="Rue"><input value={newClient.adresse_rue} onChange={f('adresse_rue')} placeholder="Rue des Lilas" style={inp} /></Field>
              <Field label="Complément d'adresse"><input value={newClient.adresse_complement} onChange={f('adresse_complement')} placeholder="Bâtiment B, étage 2…" style={inp} /></Field>
              <Field label="Code postal"><input value={newClient.code_postal} onChange={f('code_postal')} placeholder="75000" style={inp} /></Field>
              <Field label="Ville"><input value={newClient.ville} onChange={f('ville')} placeholder="Paris" style={inp} /></Field>
              <Field label="Situation professionnelle">
                <select value={newClient.situation_professionnelle} onChange={f('situation_professionnelle')} style={inp}>
                  <option value="actif">Actif</option>
                  <option value="chomage">Chômage</option>
                  <option value="retraite">Retraite</option>
                  <option value="invalide_malade">Invalide / malade</option>
                </select>
              </Field>
              <Field label="Environnement">
                <select value={newClient.environnement} onChange={f('environnement')} style={inp}>
                  <option value="non_toxique">Non toxique</option>
                  <option value="toxique">Toxique</option>
                </select>
              </Field>
              <Field label="Nombre d'enfants"><input type="number" min={0} value={newClient.nombre_enfants} onChange={f('nombre_enfants')} style={inp} /></Field>
              <Field label="Spécialité">
                <select value={newClient.specialite} onChange={f('specialite')} style={inp}>
                  <option>Aromathérapeute</option>
                  <option>Astrologue</option>
                  <option>Cartomancienne</option>
                  <option>Coach bien-être</option>
                  <option>Coach yoga</option>
                  <option>Energéticien</option>
                  <option>Fleurs de Bach</option>
                  <option>Hypnothérapeute</option>
                  <option>Magnétiseur</option>
                  <option>Médium</option>
                  <option>Naturopathe</option>
                  <option>Ostéopathe</option>
                  <option>Praticien massage</option>
                  <option>Psychologue</option>
                  <option>Réflexologue</option>
                  <option>Reiki</option>
                  <option>Sophrologue</option>
                  <option>Autre</option>
                </select>
              </Field>
              <Field label="Statut">
                <select value={newClient.statut} onChange={f('statut')} style={inp}>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="archivé">Archivé</option>
                </select>
              </Field>
            </div>
            <Field label="Notes">
              <textarea value={newClient.notes} onChange={f('notes')} placeholder="Motif de consultation, antécédents…" rows={3} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
            </Field>
            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setNewClient(EMPTY_CLIENT); setFormMsg('') }}
                style={{ padding: '9px 18px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 13 }}>
                Réinitialiser
              </button>
              <button type="submit" style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Enregistrer
              </button>
            </div>
          </form>
        </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
            {favoris.map(c => {
              const age = calculerAge(c.date_naissance)
              return (
                <div key={c.id} onClick={() => navigate(`/praticien/clients/${c.id}`)}
                  style={{ position: 'relative', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '16px 10px 12px', cursor: 'pointer', textAlign: 'center' }}>
                  <button type="button" onClick={e => retirerFavori(e, c)} title="Retirer des favoris"
                    style={{ position: 'absolute', top: 6, left: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#F2B01E" stroke="#F2B01E" strokeWidth="1" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  </button>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-background-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: 'var(--color-accent)', margin: '0 auto 8px' }}>
                    {(c.prenom?.[0] || '') + (c.nom?.[0] || '')}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{clientName(c) || '(sans nom)'}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{age != null ? `${age} ans` : '—'}</div>
                </div>
              )
            })}
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
            const dateCreation = c.created_at || c.date_creation
            const estNouveau = dateCreation && (now - new Date(dateCreation)) / 86400000 <= 30
            return (
              <div key={c.id} onClick={() => navigate(`/praticien/clients/${c.id}`)}
                style={{
                  position: 'relative',
                  background: 'var(--color-background-secondary)',
                  border: estNouveau ? '1px solid #F2B01E' : '0.5px solid var(--color-border-tertiary)',
                  borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                  boxShadow: estNouveau ? '0 0 0 3px rgba(242, 176, 30, 0.18)' : 'none',
                }}>
                {estNouveau && (
                  <span style={{ position: 'absolute', top: -9, right: 12, background: '#F2B01E', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: '.03em' }}>
                    ✨ NOUVEAU
                  </span>
                )}
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

function Field({ label, children, style }) {
  return (
    <div style={style}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}
