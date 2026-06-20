import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import SeanceTimeline from './SeanceTimeline'
import SeanceNotesPreview from './SeanceNotesPreview'

/* ─── Helpers ─── */
function getInitials(nom, prenom) {
  return ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase() || '?'
}

function computeStatut(clientId, seancesData) {
  const cs = seancesData.filter(s => s.client_id === clientId)
  if (!cs.length) return 'Nouveau'
  const latest = cs.reduce((max, s) => {
    const d = new Date(s.date_seance || s.created_at)
    return d > max ? d : max
  }, new Date(0))
  return (Date.now() - latest) / 86400000 < 90 ? 'Actif' : 'Inactif'
}

function statutStyle(st) {
  if (st === 'Actif')   return { background: '#eaf3de', color: '#3b6d11' }
  if (st === 'Inactif') return { background: '#fbeaf0', color: '#993556' }
  return { background: '#e8f0fe', color: '#185FA5' }
}

function exportCSV(clients) {
  const header = 'nom,prenom,genre,tel,email'
  const rows = clients.map(c =>
    ['nom', 'prenom', 'genre', 'tel', 'email']
      .map(k => `"${(c[k] || '').replace(/"/g, '""')}"`)
      .join(',')
  )
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `clients_${new Date().toISOString().slice(0, 10)}.csv`,
  })
  a.click()
  URL.revokeObjectURL(a.href)
}

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']))
  })
}

/* ─── Styles thème sable/brun ─── */
const S = {
  card:  { background: '#fff', borderRadius: 10, border: '0.5px solid rgba(193,122,58,0.18)', padding: '12px 14px' },
  title: { fontSize: 11, fontWeight: 600, color: '#c17a3a', marginBottom: 10 },
  lbl:   { fontSize: 10, color: '#a07848', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3, display: 'block' },
  inp:   { width: '100%', padding: '7px 10px', borderRadius: 7, border: '0.5px solid rgba(193,122,58,0.28)', background: '#fdfaf6', fontSize: 12, color: '#1a1208', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  btn:   (active) => ({ padding: '7px 13px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: active ? 'none' : '0.5px solid rgba(193,122,58,0.3)', background: active ? '#c17a3a' : '#fdfaf6', color: active ? '#fff' : '#c17a3a', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }),
}

const GENRES = ['Femme', 'Homme', 'Autre']
const COL_GRID = '32px 1fr 1fr 68px 130px 1fr 56px 72px'

/* ─── Composant principal ─── */
export default function FicheClients({ userId }) {
  const [clients, setClients]       = useState([])
  const [seancesAll, setSeancesAll] = useState([])
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)

  /* Panel détail */
  const [detail, setDetail]             = useState(null)   // null | clientObj | { isNew:true }
  const [detailSeances, setDetailSeances] = useState([])
  const [histSeances,  setHistSeances]  = useState([])
  const [histLoading,  setHistLoading]  = useState(false)
  const [confirmDel, setConfirmDel]     = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [saveOk,  setSaveOk]  = useState(false)
  const [saveErr, setSaveErr] = useState('')

  /* Champs formulaire */
  const [fNom,          setFNom]          = useState('')
  const [fPrenom,       setFPrenom]       = useState('')
  const [fGenre,        setFGenre]        = useState('Femme')
  const [fTel,          setFTel]          = useState('')
  const [fEmail,        setFEmail]        = useState('')
  const [fNotes,        setFNotes]        = useState('')
  const [fVille,        setFVille]        = useState('')
  const [fSpecialite,   setFSpecialite]   = useState('Sophrologie')
  const [fStatut,       setFStatut]       = useState('actif')
  const [fDateNaissance,setFDateNaissance]= useState('')

  const importRef = useRef(null)

  /* ── Chargement ── */
  useEffect(() => { fetchAll() }, [userId])

  async function fetchAll() {
    if (!userId) return   // ne pas lancer de requête sans user_id
    setLoading(true)
    const [resClients, resSeances] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', userId).order('nom'),
      supabase.from('seances').select('client_id,date_seance,duree_minutes,prix_euros,created_at').eq('user_id', userId).order('date_seance', { ascending: false }),
    ])
    if (resClients.error) console.log('Erreur clients:', JSON.stringify(resClients.error))
    if (resSeances.error) console.log('Erreur clients (seances):', JSON.stringify(resSeances.error))
    setClients(resClients.data || [])
    setSeancesAll(resSeances.data || [])
    setLoading(false)
  }

  /* ── Historique séances détaillé ── */
  async function fetchClientSeances(clientId) {
    setHistLoading(true)
    const { data } = await supabase
      .from('seances')
      .select('id, date_seance, type_seance, notes, zones_corps, duree_minutes, prix_euros')
      .eq('client_id', clientId)
      .order('date_seance', { ascending: false })
    setHistSeances(data || [])
    setHistLoading(false)
  }

  /* ── Ouverture panneau ── */
  function openDetail(client) {
    setDetail(client)
    setFNom(client.nom || '')
    setFPrenom(client.prenom || '')
    setFGenre(client.genre || 'Femme')
    setFTel(client.tel || client.telephone || '')
    setFEmail(client.email || '')
    setFNotes(client.notes || '')
    setFVille(client.ville || '')
    setFSpecialite(client.specialite || 'Sophrologie')
    setFStatut(client.statut || 'actif')
    setFDateNaissance(client.date_naissance || '')
    setConfirmDel(false)
    setSaveOk(false)
    setSaveErr('')
    setDetailSeances(seancesAll.filter(s => s.client_id === client.id))
    fetchClientSeances(client.id)
  }

  function openNew() {
    setDetail({ isNew: true })
    setFNom(''); setFPrenom(''); setFGenre('Femme')
    setFTel(''); setFEmail(''); setFNotes('')
    setFVille(''); setFSpecialite('Sophrologie'); setFStatut('actif'); setFDateNaissance('')
    setDetailSeances([])
    setHistSeances([])
    setConfirmDel(false)
    setSaveOk(false)
    setSaveErr('')
  }

  /* ── Sauvegarde ── */
  async function saveDetail() {
    if (!fNom.trim() && !fPrenom.trim()) return
    setSaving(true)
    setSaveErr('')

    /* Récupérer user_id depuis la session si le prop est absent */
    let uid = userId
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser()
      uid = user?.id
    }

    const now = new Date().toISOString()
    const base = {
      user_id:           uid,
      nom:               fNom.trim(),
      prenom:            fPrenom.trim(),
      genre:             fGenre             || null,
      telephone:         fTel.trim()        || null,   // colonne DB = telephone
      email:             fEmail.trim()      || null,
      notes:             fNotes.trim()      || null,
      ville:             fVille.trim()      || null,
      specialite:        fSpecialite        || null,
      statut:            fStatut            || 'actif',
      date_naissance:    fDateNaissance     || null,
      date_modification: now,
    }

    if (detail.isNew) {
      const payload = { ...base, date_creation: now }
      const { data, error } = await supabase.from('clients').insert(payload).select().single()
      if (error) {
        console.log('INSERT erreur complète:', JSON.stringify(error, null, 2))
        setSaveErr(`Erreur : ${error.message}`)
      } else if (data) {
        setClients(prev => [...prev, data].sort((a, b) => (a.nom || '').localeCompare(b.nom || '')))
        setDetail(data)
        setSaveOk(true)
        setTimeout(() => setSaveOk(false), 2500)
      }
    } else {
      const { data, error } = await supabase.from('clients').update(base).eq('id', detail.id).select().single()
      if (error) {
        console.log('Erreur clients:', JSON.stringify(error))
        setSaveErr(`Erreur : ${error.message}`)
      } else if (data) {
        setClients(prev => prev.map(c => c.id === data.id ? data : c))
        setDetail(data)
        setSaveOk(true)
        setTimeout(() => setSaveOk(false), 2500)
      }
    }
    setSaving(false)
  }

  /* ── Suppression ── */
  async function deleteClient() {
    if (!detail?.id) return
    await supabase.from('clients').delete().eq('id', detail.id)
    setClients(prev => prev.filter(c => c.id !== detail.id))
    setDetail(null)
  }

  /* ── Import CSV ── */
  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const rows = parseCSV(await file.text())
    const payload = rows.map(r => ({
      user_id:   userId,
      nom:       r.nom       || r['Nom']       || '',
      prenom:    r.prenom    || r['Prénom']     || r['Prenom']    || '',
      genre:     r.genre     || r['Genre']      || 'Autre',
      telephone: r.telephone || r.tel || r['Téléphone'] || r['Telephone'] || '',
      email:     r.email     || r['Email']      || '',
    }))
    if (payload.length) {
      const { error } = await supabase.from('clients').insert(payload)
      if (error) console.log('Erreur:', JSON.stringify(error))
      fetchAll()
    }
    e.target.value = ''
  }

  /* ── Filtre recherche ── */
  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    return !q || [c.nom, c.prenom, c.email].some(v => (v || '').toLowerCase().includes(q))
  })

  /* ── Render ── */
  return (
    <div style={{ display: 'flex', height: '100%', background: '#f5ede0', gap: 10, padding: 12, boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* ══════════ LISTE ══════════ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#a07848', pointerEvents: 'none' }} aria-hidden="true" />
            <input
              style={{ ...S.inp, paddingLeft: 32 }}
              placeholder="Rechercher nom, prénom, email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <button onClick={openNew} style={{ ...S.btn(true) }}>
            + Nouveau client
          </button>

          <button onClick={() => exportCSV(filtered)} style={{ ...S.btn(false), display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-download" style={{ fontSize: 13 }} aria-hidden="true" />
            Export CSV
          </button>

          <label style={{ ...S.btn(false), display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <i className="ti ti-upload" style={{ fontSize: 13 }} aria-hidden="true" />
            Import CSV
            <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
          </label>
        </div>

        {/* Table */}
        <div style={{ ...S.card, flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* En-tête colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: COL_GRID, gap: 8, padding: '9px 14px', borderBottom: '0.5px solid rgba(193,122,58,0.15)', background: '#fdfaf6', flexShrink: 0 }}>
            {['', 'Nom', 'Prénom', 'Genre', 'Téléphone', 'Email', 'Séances', 'Statut'].map(h => (
              <div key={h} style={{ fontSize: 10, color: '#a07848', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{h}</div>
            ))}
          </div>

          {/* Lignes */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: 28, fontSize: 12, color: '#a07848' }}>Chargement…</div>
            )}
            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 28, fontSize: 12, color: '#b8a090' }}>
                {search ? 'Aucun résultat pour cette recherche' : 'Aucun client — cliquez sur "+ Nouveau client"'}
              </div>
            )}
            {filtered.map(c => {
              const nb = seancesAll.filter(s => s.client_id === c.id).length
              const statut = computeStatut(c.id, seancesAll)
              const ss = statutStyle(statut)
              const selected = detail?.id === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => openDetail(c)}
                  style={{
                    display: 'grid', gridTemplateColumns: COL_GRID, gap: 8,
                    padding: '8px 14px', alignItems: 'center',
                    borderBottom: '0.5px solid rgba(193,122,58,0.08)',
                    background: selected ? '#faeeda' : 'transparent',
                    cursor: 'pointer', transition: 'background .1s',
                  }}
                  onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#fdf7f0' }}
                  onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1B2A4A', color: '#c17a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                    {getInitials(c.nom, c.prenom)}
                  </div>
                  <Cell bold>{c.nom}</Cell>
                  <Cell>{c.prenom}</Cell>
                  <Cell small>{c.genre}</Cell>
                  <Cell small>{c.tel}</Cell>
                  <Cell small>{c.email}</Cell>
                  <div style={{ fontSize: 12, color: '#1a1208', textAlign: 'center', fontWeight: 600 }}>{nb}</div>
                  <span style={{ ...ss, fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {statut}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Pied de tableau */}
          <div style={{ padding: '6px 14px', borderTop: '0.5px solid rgba(193,122,58,0.1)', fontSize: 10, color: '#a07848', background: '#fdfaf6', flexShrink: 0 }}>
            {filtered.length} client{filtered.length > 1 ? 's' : ''}{search ? ` trouvé${filtered.length > 1 ? 's' : ''} sur ${clients.length}` : ' au total'}
          </div>
        </div>
      </div>

      {/* ══════════ PANEL DÉTAIL ══════════ */}
      {detail && (
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1208' }}>
              {detail.isNew ? 'Nouveau client' : `${fPrenom} ${fNom}`.trim() || 'Client'}
            </div>
            <button onClick={() => { setDetail(null); setConfirmDel(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#a07848', lineHeight: 1, padding: 0 }} aria-label="Fermer">×</button>
          </div>

          {/* Formulaire */}
          <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={S.title}>Informations</div>

            {[
              { lbl: 'Nom',     val: fNom,    set: setFNom },
              { lbl: 'Prénom',  val: fPrenom, set: setFPrenom },
            ].map(f => (
              <div key={f.lbl}>
                <span style={S.lbl}>{f.lbl}</span>
                <input style={S.inp} value={f.val} onChange={e => f.set(e.target.value)} />
              </div>
            ))}

            <div>
              <span style={S.lbl}>Genre</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {GENRES.map(g => (
                  <button key={g} onClick={() => setFGenre(g)} style={{
                    flex: 1, padding: '4px 2px', borderRadius: 6, fontSize: 10,
                    border: fGenre === g ? '1.5px solid #c17a3a' : '0.5px solid rgba(193,122,58,0.28)',
                    background: fGenre === g ? '#faeeda' : '#fdfaf6',
                    color: fGenre === g ? '#c17a3a' : '#8a7060',
                    cursor: 'pointer', fontWeight: fGenre === g ? 600 : 400,
                  }}>{g}</button>
                ))}
              </div>
            </div>

            {[
              { lbl: 'Téléphone', val: fTel,   set: setFTel,   type: 'tel' },
              { lbl: 'Email',     val: fEmail,  set: setFEmail, type: 'email' },
            ].map(f => (
              <div key={f.lbl}>
                <span style={S.lbl}>{f.lbl}</span>
                <input style={S.inp} type={f.type} value={f.val} onChange={e => f.set(e.target.value)} />
              </div>
            ))}

            <div>
              <span style={S.lbl}>Date de naissance</span>
              <input style={S.inp} type="date" value={fDateNaissance} onChange={e => setFDateNaissance(e.target.value)} />
            </div>

            <div>
              <span style={S.lbl}>Ville</span>
              <input style={S.inp} value={fVille} onChange={e => setFVille(e.target.value)} placeholder="Paris" />
            </div>

            <div>
              <span style={S.lbl}>Spécialité</span>
              <select style={S.inp} value={fSpecialite} onChange={e => setFSpecialite(e.target.value)}>
                {['Sophrologie','Coaching','Fleurs de Bach','Naturopathie','Énergie','Massage','Autre'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <span style={S.lbl}>Statut</span>
              <select style={S.inp} value={fStatut} onChange={e => setFStatut(e.target.value)}>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
                <option value="en_attente">En attente</option>
              </select>
            </div>

            <div>
              <span style={S.lbl}>Notes internes</span>
              <textarea
                rows={3}
                style={{ ...S.inp, resize: 'none', lineHeight: 1.5 }}
                value={fNotes}
                onChange={e => setFNotes(e.target.value)}
                placeholder="Remarques, contraintes, anamnèse…"
              />
            </div>
          </div>

          {/* Historique des séances */}
          {!detail.isNew && (
            <div style={{ ...S.card, maxHeight: 380, overflowY: 'auto' }}>
              <div style={S.title}>
                Historique des séances{histSeances.length > 0 ? ` (${histSeances.length})` : ''}
              </div>

              {histLoading ? (
                <div style={{ fontSize: 11, color: '#a07848', padding: '6px 0' }}>Chargement…</div>
              ) : histSeances.length === 0 ? (
                <div style={{ fontSize: 11, color: '#b8a090' }}>Aucune séance enregistrée</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {histSeances.map((s, i) => {
                    const dateLabel = s.date_seance
                      ? new Date(s.date_seance + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'
                    const meta = [
                      s.duree_minutes ? `${s.duree_minutes} min` : null,
                      s.prix_euros != null ? `${s.prix_euros} €` : null,
                    ].filter(Boolean).join(' · ')
                    const notesText = typeof s.notes === 'string'
                      ? s.notes
                      : Array.isArray(s.notes) ? s.notes.map(n => n.text || n).join(' · ') : ''
                    const zones = Array.isArray(s.zones_corps) ? s.zones_corps : []

                    return (
                      <div key={i} style={{ background: '#fdfaf6', borderRadius: 8, padding: '8px 10px', border: '0.5px solid rgba(193,122,58,0.2)' }}>

                        {/* Date + type */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#1a1208' }}>{dateLabel}</span>
                          {s.type_seance && (
                            <span style={{ fontSize: 9, fontWeight: 600, background: '#faeeda', color: '#c17a3a', padding: '2px 7px', borderRadius: 10, border: '0.5px solid rgba(193,122,58,0.3)', whiteSpace: 'nowrap' }}>
                              {s.type_seance}
                            </span>
                          )}
                        </div>

                        {/* Durée · prix */}
                        {meta && (
                          <div style={{ fontSize: 10, color: '#a07848', marginBottom: zones.length || notesText ? 5 : 0 }}>
                            {meta}
                          </div>
                        )}

                        {/* Zones corps */}
                        {zones.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: notesText ? 5 : 0 }}>
                            {zones.map(z => (
                              <span key={z} style={{ fontSize: 9, background: '#e8f0fe', color: '#185FA5', padding: '1px 6px', borderRadius: 8, fontWeight: 500 }}>
                                {z}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Notes */}
                        {notesText && (
                          <div style={{ fontSize: 10, color: '#8a7060', lineHeight: 1.5, borderTop: '0.5px solid rgba(193,122,58,0.12)', paddingTop: 5 }}>
                            {notesText.length > 140 ? notesText.slice(0, 140) + '…' : notesText}
                          </div>
                        )}
                        <SeanceNotesPreview seanceId={s.id} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Timeline Bach */}
          {!detail.isNew && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: 12 }}>
                Historique des séances
              </div>
              <SeanceTimeline clientId={detail.id} />
            </div>
          )}

          {/* Bouton sauvegarder */}
          <button
            onClick={saveDetail}
            disabled={saving}
            style={{
              width: '100%', padding: '10px', borderRadius: 10,
              border: 'none',
              background: saveOk ? '#48BB78' : saveErr ? '#E53E3E' : '#c17a3a',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1, transition: 'background .25s',
            }}
          >
            {saving ? 'Sauvegarde…' : saveOk ? '✓ Client enregistré ✅' : saveErr ? '✗ Échec' : detail.isNew ? 'Créer le client' : 'Sauvegarder'}
          </button>

          {saveErr && (
            <div style={{ fontSize: 11, color: '#A32D2D', background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>
              {saveErr}
            </div>
          )}

          {/* Suppression */}
          {!detail.isNew && (
            confirmDel ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, color: '#A32D2D', textAlign: 'center', padding: '4px 0' }}>
                  Supprimer définitivement ce client ?
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setConfirmDel(false)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '0.5px solid rgba(193,122,58,0.3)', background: '#fdfaf6', color: '#8a7060', fontSize: 12, cursor: 'pointer' }}>
                    Annuler
                  </button>
                  <button onClick={deleteClient} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: '#E53E3E', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmDel(true)} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '0.5px solid #F09595', background: '#FCEBEB', color: '#A32D2D', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                Supprimer le client
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Cellule tableau ─── */
function Cell({ children, bold, small }) {
  return (
    <div style={{
      fontSize: small ? 11 : 12,
      fontWeight: bold ? 600 : 400,
      color: bold ? '#1a1208' : '#5a4030',
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>
      {children || '—'}
    </div>
  )
}
