import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useClients } from '../hooks/useClients'
import { insertNotif } from '../lib/notif'
import { useSeancesSync } from '../hooks/useSeancesSync'


const SPECIALITES = ['Toutes', 'Sophrologie', 'Coaching', 'Naturopathie', 'Fleurs de Bach', 'Énergie', 'Massage', 'Autre']
const STATUTS     = ['Tous', 'actif', 'inactif', 'archivé']

const STATUT_STYLE = {
  actif:    { bg: '#E1F5EE', color: '#0F6E56', label: 'Actif' },
  inactif:  { bg: '#FAEEDA', color: '#854F0B', label: 'Inactif' },
  archivé:  { bg: '#F5F5F5', color: '#6B7280', label: 'Archivé' },
}

const SPEC_COLOR = {
  'Aromathérapeute':  { bg: '#FEF3E2', color: '#A05A00' },
  'Astrologue':       { bg: '#EEEDFE', color: '#534AB7' },
  'Cartomancienne':   { bg: '#F0EBF8', color: '#7F3FBF' },
  'Coach bien-être':  { bg: '#E6F1FB', color: '#185FA5' },
  'Coach yoga':       { bg: '#E1F5EE', color: '#0F6E56' },
  'Energéticien':     { bg: '#FBEAF0', color: '#993556' },
  'Fleurs de Bach':   { bg: '#F0EBF8', color: '#7F3FBF' },
  'Hypnothérapeute':  { bg: '#E6F1FB', color: '#185FA5' },
  'Magnétiseur':      { bg: '#FAEEDA', color: '#854F0B' },
  'Médium':           { bg: '#F0EBF8', color: '#7F3FBF' },
  'Naturopathe':      { bg: '#E1F5EE', color: '#0F6E56' },
  'Ostéopathe':       { bg: '#E6F1FB', color: '#185FA5' },
  'Praticien massage':{ bg: '#FAEEDA', color: '#854F0B' },
  'Psychologue':      { bg: '#EEEDFE', color: '#534AB7' },
  'Réflexologue':     { bg: '#E1F5EE', color: '#0F6E56' },
  'Reiki':            { bg: '#FBEAF0', color: '#993556' },
  'Sophrologue':      { bg: '#E6F1FB', color: '#185FA5' },
  'Autre':            { bg: '#F5F5F5', color: '#6B7280' },
}

const MOIS_COURT = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']

function toCSV(rows) {
  const header = 'Prénom,Nom,Email,Téléphone,Naissance,Spécialité,Ville,Statut,Notes'
  const lines  = rows.map(r =>
    `${r.prenom},${r.nom},"${r.email}","${r.tel}","${r.date_naissance}","${r.specialite}","${r.ville}","${r.statut}","${(r.notes||'').replace(/"/g,"'").replace(/\n/g,' ')}"`
  )
  return [header, ...lines].join('\n')
}

function downloadCSV(content, filename) {
  const blob = new Blob(['' + content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function parseCSV(text) {
  const lines = text.trim().split('\n').slice(1)
  return lines.map((line, i) => {
    const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g) || []
    const c    = cols.map(x => x.replace(/^"|"$/g, '').trim())
    return {
      id: Date.now() + i,
      prenom:     c[0] || '',
      nom:        c[1] || '',
      email:      c[2] || '',
      tel:        c[3] || '',
      date_naissance: c[4] || '',
      specialite: c[5] || 'Autre',
      ville:      c[6] || '',
      statut:     c[7] || 'actif',
      notes:      c[8] || '',
    }
  }).filter(r => r.prenom || r.nom)
}

function age(naissance) {
  if (!naissance) return '—'
  return Math.floor((Date.now() - new Date(naissance)) / 31557600000) + ' ans'
}

function clientName(c) { return `${c.prenom} ${c.nom}`.trim() }

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, j] = d.slice(0, 10).split('-')
  return `${parseInt(j)} ${MOIS_COURT[parseInt(m)-1]} ${y}`
}

export default function Clients() {
  const importRef = useRef()
  const [modalSeance, setModalSeance] = useState(null)
  const [modalTab, setModalTab] = useState('infos')

  const location = useLocation()
  const navigate = useNavigate()

  const { clients, loading, addClient, updateClient, deleteClient, refresh: refreshClients } = useClients()
  const { seances: toutesSeances, addSeance, updateSeance, deleteSeance, getSeancesByClient, userId } = useSeancesSync()
  const [napoNavState] = useState(() => {
    const stored = JSON.parse(sessionStorage.getItem('napo_nav_state') || 'null')
    if (stored) sessionStorage.removeItem('napo_nav_state')
    return stored
  })
  const [napoOpenClientId] = useState(() => {
    const id = sessionStorage.getItem('napo_open_client')
    if (id) sessionStorage.removeItem('napo_open_client')
    return id || null
  })

  const [activeTab,      setActiveTab]      = useState('liste')
  const [search,         setSearch]         = useState('')
  const [filterSpec,     setFilterSpec]     = useState('Toutes')
  const [filterStatut,   setFilterStatut]   = useState('Tous')
  const [detail,         setDetail]         = useState(null)
  const [detailTab,      setDetailTab]      = useState('infos')
  const clientSeances = detail ? getSeancesByClient(detail.id) : []
  const [loadingSeances, setLoadingSeances] = useState(false)
  const [showNewSeance,  setShowNewSeance]  = useState(false)
  const [newSeanceForm,  setNewSeanceForm]  = useState({
    type_seance: 'Sophrologie',
    date_seance: new Date().toISOString().slice(0, 10),
    heure_seance: '10:00',
    duree_minutes: '60',
    prix_euros: '',
    notes: '',
  })
  const [savingSeance,   setSavingSeance]   = useState(false)
  const [seanceMsg,      setSeanceMsg]      = useState('')
  const [editingSeanceId, setEditingSeanceId] = useState(null)
  const [editSeanceForm,  setEditSeanceForm]  = useState(null)
  const [editingDetail,  setEditingDetail]  = useState(false)
  const [editForm,       setEditForm]       = useState(null)
  const [bachFiches,     setBachFiches]     = useState([])
  const [energieSeances, setEnergieSeances] = useState([])
  const [loadingEnergie, setLoadingEnergie] = useState(false)
  const [oracleSeances, setOracleSeances] = useState([])
  const [loadingOracle, setLoadingOracle] = useState(false)
  const [loadingBach,    setLoadingBach]    = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [saveMsg,        setSaveMsg]        = useState('')
  const [importMsg,      setImportMsg]      = useState('')

  const EMPTY = { prenom: '', nom: '', email: '', tel: '', date_naissance: '', specialite: 'Sophrologue', ville: '', statut: 'actif', notes: '' }
  const [form,    setForm]    = useState(EMPTY)
  const [formMsg, setFormMsg] = useState('')
  const f  = (k) => e => setForm(prev => ({ ...prev, [k]: e.target.value }))
  const ef = (k) => e => setEditForm(prev => ({ ...prev, [k]: e.target.value }))

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const matchQ  = !q || clientName(c).toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.ville||'').toLowerCase().includes(q)
    const matchS  = filterSpec   === 'Toutes' || c.specialite === filterSpec
    const matchSt = filterStatut === 'Tous'   || c.statut     === filterStatut
    return matchQ && matchS && matchSt
  })

  const actifs       = clients.filter(c => c.statut === 'actif').length
  const totalSeances = clients.reduce((s, c) => s + (c.nb_seances || 0), 0)

  useEffect(() => {
    if (!napoOpenClientId || clients.length === 0) return
    const target = clients.find(c => c.id === napoOpenClientId)
    if (target) openDetail(target)
  }, [napoOpenClientId, clients])

  useEffect(() => {
    const state = napoNavState || location.state
    if (!state?.searchClient) return
    setSearch(state.searchClient)
    if (state.openSeance && clients.length > 0) {
      const found = clients.find(c =>
        `${c.prenom} ${c.nom}`.toLowerCase() === state.searchClient.toLowerCase()
      )
      if (found) {
        openDetail(found)
        setTimeout(() => setDetailTab('seances'), 100)
      }
    }
  }, [napoNavState, location.state, clients])

  useEffect(() => {
    if (detailTab === 'energie' && detail) {
      setLoadingEnergie(true)
      supabase.from('energie_seances').select('id, numero_seance, date_seance, heure_seance, outil, note_globale')
        .eq('client_id', detail.id).order('date_seance', { ascending: false })
        .then(({ data }) => { setEnergieSeances(data || []); setLoadingEnergie(false) })
      return
    }
    if (detailTab === 'oracle' && detail) {
      setLoadingOracle(true)
      supabase.from('napo_oracle_seances').select('id, numero_seance, date_seance, heure_seance, deck_utilise, note_globale')
        .eq('client_id', detail.id).order('date_seance', { ascending: false })
        .then(({ data }) => { setOracleSeances(data || []); setLoadingOracle(false) })
      return
    }
    if (detailTab !== 'bach' || !detail) { setBachFiches([]); return }
    setLoadingBach(true)
    supabase.from('fiches_bach')
      .select('id, created_at, selection, client_info, persos')
      .eq('client_id', detail.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setBachFiches(data || []); setLoadingBach(false) })
  }, [detailTab, detail?.id])

  async function handleAddSeanceFromFiche() {
    if (!detail) return
    setSavingSeance(true)
    setSeanceMsg('')
    try {
      const { error } = await addSeance({
        prenom: detail.prenom,
        nom: detail.nom,
        email: detail.email || null,
        client_id: detail.id,
        type_seance: newSeanceForm.type_seance,
        date_seance: newSeanceForm.date_seance,
        heure_seance: newSeanceForm.heure_seance,
        duree_minutes: parseInt(newSeanceForm.duree_minutes) || 60,
        prix_euros: parseFloat(newSeanceForm.prix_euros) || null,
        notes: newSeanceForm.notes || null,
      })
      if (error) throw error
      setSeanceMsg('✓ Séance ajoutée')
      setShowNewSeance(false)
      setNewSeanceForm({ type_seance: 'Sophrologie', date_seance: new Date().toISOString().slice(0, 10), heure_seance: '10:00', duree_minutes: '60', prix_euros: '', notes: '' })
      setTimeout(() => setSeanceMsg(''), 3000)
    } catch (e) {
      setSeanceMsg('✗ Erreur : ' + e.message)
    }
    setSavingSeance(false)
  }

  function openEditSeance(s) {
    setEditSeanceForm({
      type_seance: s.type_seance || 'Sophrologie',
      date_seance: s.date_seance || '',
      heure_seance: s.heure_seance || '',
      duree_minutes: s.duree_minutes || '60',
      prix_euros: s.prix_euros || '',
      notes: s.notes || '',
    })
    setEditingSeanceId(s.id)
  }

  async function saveEditSeance() {
    await updateSeance(editingSeanceId, {
      type_seance: editSeanceForm.type_seance,
      date_seance: editSeanceForm.date_seance,
      heure_seance: editSeanceForm.heure_seance,
      duree_minutes: parseInt(editSeanceForm.duree_minutes) || 60,
      prix_euros: parseFloat(editSeanceForm.prix_euros) || 0,
      notes: editSeanceForm.notes || null,
    })
    setEditingSeanceId(null)
    setEditSeanceForm(null)
  }

  function openDetail(c) {
    setDetail(c)
    setDetailTab('infos')
    setEditingDetail(false)
    setShowNewSeance(false)
    setSeanceMsg('')
  }

  function handleSave() {
    setSaveMsg('✓ Les données sont synchronisées automatiquement.')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  function handleImport(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const imported = parseCSV(ev.target.result)
      if (!imported.length) { setImportMsg('Fichier invalide.'); return }
      const { data: { user } } = await supabase.auth.getUser()
      const rows = imported.map(({ id, ...r }) => ({ ...r, user_id: user?.id || null }))
      const { error } = await supabase.from('clients').insert(rows)
      if (error) { setImportMsg(`✗ Erreur : ${error.message}`); return }
      await refreshClients()
      setImportMsg(`✓ ${imported.length} client(s) importé(s).`)
      setTimeout(() => setImportMsg(''), 3000)
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  function openEdit(c) {
    setEditForm({ prenom: c.prenom||'', nom: c.nom||'', email: c.email||'', tel: c.tel||'', date_naissance: c.date_naissance||'', ville: c.ville||'', specialite: c.specialite||'Sophrologie', statut: c.statut||'actif', notes: c.notes||'' })
    setEditingDetail(true)
  }

  async function saveEditDetail() {
    await updateClient(detail.id, { ...editForm })
    setDetail(prev => ({ ...prev, ...editForm }))
    setEditingDetail(false)
    const seancesClient = getSeancesByClient(detail.id)
    for (const s of seancesClient) {
      await updateSeance(s.id, {
        prenom: editForm.prenom,
        nom: editForm.nom,
        email: editForm.email || null,
      })
    }
  }

  async function handleAddClient() {
    if (!form.prenom.trim() || !form.nom.trim()) { setFormMsg('Prénom et nom requis.'); return }
    await addClient(form)
    insertNotif({ msg: `Nouveau client — ${form.prenom} ${form.nom}`, icon: 'ti-user-plus', iconColor: '#185FA5', bg: '#E6F1FB' })
    setForm(EMPTY)
    setFormMsg('✓ Client ajouté.')
    setTimeout(() => { setFormMsg(''); setActiveTab('liste') }, 1200)
  }

  const TABS = [
    { id: 'liste',   label: 'Liste clients',   icon: 'ti-users' },
    { id: 'nouveau', label: 'Nouveau client',  icon: 'ti-user-plus' },
    { id: 'export',  label: 'Import / Export', icon: 'ti-arrows-transfer-down' },
  ]

  return (
    <div style={{ padding: '1.6rem 2rem', fontFamily: 'inherit' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="ti ti-users" style={{ fontSize: 24, color: 'var(--color-accent)' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>Clients</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{clients.length} clients enregistrés</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
          <Btn icon="ti-upload"        label="Importer"   onClick={() => importRef.current.click()} secondary />
          <Btn icon="ti-download"      label="Exporter"   onClick={() => downloadCSV(toCSV(clients), 'clients-napocrm.csv')} secondary />
          <Btn icon="ti-user-plus"     label="Nouveau"    onClick={() => setActiveTab('nouveau')} />
        </div>
      </div>

      {(importMsg || saveMsg) && (
        <div style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 8, background: (importMsg||saveMsg).startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: (importMsg||saveMsg).startsWith('✓') ? '#3B6D11' : '#993556', fontSize: 13 }}>
          {importMsg || saveMsg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        <StatCard icon="ti-users"          iconBg="#E6F1FB" iconColor="#185FA5" label="Total clients"       value={clients.length} />
        <StatCard icon="ti-user-check"     iconBg="#E1F5EE" iconColor="#0F6E56" label="Clients actifs"      value={actifs} />
        <StatCard icon="ti-calendar-stats" iconBg="#EEEDFE" iconColor="#534AB7" label="Total séances"       value={totalSeances} />
        <StatCard icon="ti-chart-line"     iconBg="#FAEEDA" iconColor="#854F0B" label="Moy. séances/client" value={clients.length ? (totalSeances/clients.length).toFixed(1) : '0'} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--color-border-tertiary)', marginBottom: 16 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400, color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-secondary)', borderBottom: activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent', marginBottom: -1 }}>
            <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} />{tab.label}
          </button>
        ))}
      </div>

      {/* ══ LISTE ══ */}
      {activeTab === 'liste' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher nom, email, ville…"
                style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <Sel value={filterSpec}   onChange={setFilterSpec}   options={SPECIALITES.map(s => [s, s])} />
            <Sel value={filterStatut} onChange={setFilterStatut} options={STATUTS.map(s => [s, s === 'Tous' ? 'Tous statuts' : STATUT_STYLE[s]?.label || s])} />
          </div>

          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, overflow: 'hidden', border: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 140px 120px 70px 90px 80px 36px', padding: '8px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              {['Client','Email','Spécialité','Âge','Création','Statut',''].map((h,i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</div>
              ))}
            </div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>Chargement…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>Aucun client trouvé</div>
            ) : filtered.map((c, idx) => {
              const spec = SPEC_COLOR[c.specialite] || SPEC_COLOR['Autre']
              const stat = STATUT_STYLE[c.statut]   || STATUT_STYLE['inactif']
              return (
                <div key={c.id} onClick={() => openDetail(c)}
                  style={{ display: 'grid', gridTemplateColumns: '1.2fr 140px 120px 70px 90px 80px 36px', padding: '11px 16px', alignItems: 'center', cursor: 'pointer', borderBottom: idx < filtered.length-1 ? '0.5px solid var(--color-border-tertiary)' : 'none', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-primary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: spec.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: spec.color }}>{c.prenom[0]}{c.nom[0]}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{clientName(c)}</div>
                      {c.ville && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{c.ville}</div>}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                  <div><span style={{ fontSize: 11, fontWeight: 600, background: spec.bg, color: spec.color, padding: '2px 8px', borderRadius: 20 }}>{c.specialite}</span></div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{age(c.date_naissance)}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{fmtDate(c.date_creation)}</div>
                  <div><span style={{ fontSize: 11, fontWeight: 600, background: stat.bg, color: stat.color, padding: '2px 8px', borderRadius: 20 }}>{stat.label}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={ev => { ev.stopPropagation(); downloadCSV(toCSV([c]), `client-${c.nom}.csv`) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4 }}>
                      <i className="ti ti-download" style={{ fontSize: 14 }} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {filtered.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {filtered.length} client(s) affiché(s)
            </div>
          )}
        </>
      )}

      {/* ══ NOUVEAU ══ */}
      {activeTab === 'nouveau' && (
        <div style={{ maxWidth: 600 }}>
          {formMsg && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: formMsg.startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: formMsg.startsWith('✓') ? '#3B6D11' : '#993556', fontSize: 13 }}>{formMsg}</div>}
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 14, border: '0.5px solid var(--color-border-tertiary)', padding: '28px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 22 }}>Informations du client</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <Field label="Prénom"><input value={form.prenom} onChange={f('prenom')} placeholder="Sophie" style={inp} /></Field>
              <Field label="Nom"><input value={form.nom} onChange={f('nom')} placeholder="Legrand" style={inp} /></Field>
              <Field label="Email"><input type="email" value={form.email} onChange={f('email')} placeholder="email@exemple.com" style={inp} /></Field>
              <Field label="Téléphone"><input type="tel" value={form.tel} onChange={f('tel')} placeholder="06 00 00 00 00" style={inp} /></Field>
              <Field label="Date de naissance"><input type="date" value={form.date_naissance} onChange={f('date_naissance')} style={inp} /></Field>
              <Field label="Ville"><input value={form.ville} onChange={f('ville')} placeholder="Paris" style={inp} /></Field>
              <Field label="Spécialité">
                <select value={form.specialite} onChange={f('specialite')} style={inp}>
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
                  {SPECIALITES.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Statut">
                <select value={form.statut} onChange={f('statut')} style={inp}>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="archivé">Archivé</option>
                </select>
              </Field>
            </div>
            <Field label="Notes">
              <textarea value={form.notes} onChange={f('notes')} placeholder="Motif de consultation, antécédents…" rows={3} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
            </Field>
            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
              <button onClick={() => { setForm(EMPTY); setFormMsg('') }} style={{ padding: '9px 18px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 13 }}>Réinitialiser</button>
              <button onClick={handleAddClient} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <i className="ti ti-user-plus" style={{ marginRight: 6 }} />Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EXPORT ══ */}
      {activeTab === 'export' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 800 }}>
          <div style={{ padding: '22px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-download" style={{ fontSize: 20, color: '#0F6E56' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Exporter les clients</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Format CSV compatible Excel</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => downloadCSV(toCSV(clients), 'clients-napocrm.csv')} style={xBtn('#0F6E56','#E1F5EE')}>
                <i className="ti ti-table-export" style={{ fontSize: 15 }} /> Exporter tout ({clients.length})
              </button>
              <button onClick={() => downloadCSV(toCSV(clients.filter(c => c.statut==='actif')), 'clients-actifs.csv')} style={xBtn('#185FA5','#E6F1FB')}>
                <i className="ti ti-user-check" style={{ fontSize: 15 }} /> Exporter actifs ({actifs})
              </button>
            </div>
          </div>
          <div style={{ padding: '22px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-upload" style={{ fontSize: 20, color: '#534AB7' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Importer des clients</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Fichier CSV</div>
              </div>
            </div>
            <button onClick={() => importRef.current.click()} style={xBtn('#534AB7','#EEEDFE')}>
              <i className="ti ti-file-upload" style={{ fontSize: 15 }} /> Choisir un fichier CSV
            </button>
          </div>
        </div>
      )}

      {/* ══ MODAL DÉTAIL CLIENT ══ */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && !editingDetail && setDetail(null)}>
          <div style={{ background: 'var(--color-background-primary)', borderRadius: 16, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

            {/* Avatar + nom */}
            {(() => {
              const src = editingDetail ? editForm : detail
              const sp  = SPEC_COLOR[src.specialite] || SPEC_COLOR['Autre']
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: sp.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: sp.color }}>{(src.prenom||'?')[0]}{(src.nom||'?')[0]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    {editingDetail ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input value={editForm.prenom} onChange={ef('prenom')} placeholder="Prénom" style={{ ...mInp, flex: 1, fontSize: 15, fontWeight: 600 }} />
                        <input value={editForm.nom}    onChange={ef('nom')}    placeholder="Nom"    style={{ ...mInp, flex: 1, fontSize: 15, fontWeight: 600 }} />
                      </div>
                    ) : (
                      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-text-primary)' }}>{clientName(detail)}</div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      {editingDetail ? (
                        <>
                          <select value={editForm.specialite} onChange={ef('specialite')} style={{ ...mInp, fontSize: 11, padding: '2px 8px', width: 'auto' }}>
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
                            {SPECIALITES.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <select value={editForm.statut} onChange={ef('statut')} style={{ ...mInp, fontSize: 11, padding: '2px 8px', width: 'auto' }}>
                            <option value="actif">Actif</option>
                            <option value="inactif">Inactif</option>
                            <option value="archivé">Archivé</option>
                          </select>
                        </>
                      ) : (
                        <>
                          {(() => { const sp2 = SPEC_COLOR[detail.specialite]||SPEC_COLOR['Autre']; return <span style={{ fontSize: 11, fontWeight: 600, background: sp2.bg, color: sp2.color, padding: '2px 8px', borderRadius: 20 }}>{detail.specialite}</span> })()}
                          {(() => { const st = STATUT_STYLE[detail.statut]||STATUT_STYLE['inactif']; return <span style={{ fontSize: 11, fontWeight: 600, background: st.bg, color: st.color, padding: '2px 8px', borderRadius: 20 }}>{st.label}</span> })()}
                        </>
                      )}
                    </div>
                  </div>
                  <button onClick={() => { setDetail(null); setEditingDetail(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-secondary)' }}>×</button>
                </div>
              )
            })()}

            {/* Onglets (masqués en mode édition) */}
            {!editingDetail && (
              <div style={{ display: 'flex', borderBottom: '0.5px solid var(--color-border-tertiary)', marginBottom: 18, overflowX: 'auto' }}>
                {[['infos','Infos','ti-user'],['seances','Séances','ti-calendar-stats'],['notes','Notes','ti-notes'],['bach','🌿 Bach','ti-leaf'],['energie','⚡ Énergie','ti-sparkles'],['oracle','🔮 Oracle','ti-cards']].map(([id, label, icon]) => (
                  <button key={id} onClick={() => setDetailTab(id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: detailTab===id ? 600 : 400, color: detailTab===id ? 'var(--color-accent)' : 'var(--color-text-secondary)', borderBottom: detailTab===id ? '2px solid var(--color-accent)' : '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <i className={`ti ${icon}`} style={{ fontSize: 13 }} />{label}
                    {id==='seances' && clientSeances.length > 0 && (
                      <span style={{ fontSize: 10, background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', padding: '1px 6px', borderRadius: 20, marginLeft: 4 }}>{clientSeances.length}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ── Onglet INFOS ── */}
            {(detailTab === 'infos' || editingDetail) && (
              editingDetail ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <MField label="Email">      <input type="email" value={editForm.email}          onChange={ef('email')}          style={mInp} /></MField>
                  <MField label="Téléphone">  <input type="tel"   value={editForm.tel}            onChange={ef('tel')}            style={mInp} /></MField>
                  <MField label="Naissance">  <input type="date"  value={editForm.date_naissance} onChange={ef('date_naissance')} style={mInp} /></MField>
                  <MField label="Ville">      <input              value={editForm.ville}          onChange={ef('ville')}          style={mInp} /></MField>
                  <MField label="Notes" style={{ gridColumn: '1/-1' }}>
                    <textarea value={editForm.notes} onChange={ef('notes')} rows={3} style={{ ...mInp, resize: 'vertical', fontFamily: 'inherit' }} />
                  </MField>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    {[
                      ['ti-mail',           'Email',       detail.email || '—'],
                      ['ti-phone',          'Téléphone',   detail.tel || '—'],
                      ['ti-map-pin',        'Ville',       detail.ville || '—'],
                      ['ti-cake',           'Âge',         age(detail.date_naissance)],
                      ['ti-calendar-stats', 'Séances',     loadingSeances ? '…' : `${clientSeances.length} séance(s)`],
                      ['ti-coin',           'CA total',    loadingSeances ? '…' : `${clientSeances.reduce((a,s)=>a+(parseFloat(s.prix_euros)||0),0).toFixed(0)} €`],
                    ].map(([icon, label, val]) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', background: 'var(--color-background-secondary)', borderRadius: 8 }}>
                        <i className={`ti ${icon}`} style={{ fontSize: 14, color: 'var(--color-accent)', marginTop: 1 }} />
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
                          <div style={{ fontSize: 13, color: 'var(--color-text-primary)', marginTop: 2 }}>{val}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {detail.notes && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Notes</div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7, background: 'var(--color-background-secondary)', padding: '12px 14px', borderRadius: 8 }}>{detail.notes}</div>
                    </div>
                  )}
                </>
              )
            )}

            {/* ── Onglet SÉANCES ── */}
            {detailTab === 'seances' && !editingDetail && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {clientSeances.length} séance(s)
                  </span>
                  <button
                    onClick={() => setShowNewSeance(p => !p)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: showNewSeance ? '#FBEAF0' : 'var(--color-accent)', color: showNewSeance ? '#993556' : '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    <i className={`ti ${showNewSeance ? 'ti-x' : 'ti-plus'}`} style={{ fontSize: 13 }} />
                    {showNewSeance ? 'Annuler' : 'Nouvelle séance'}
                  </button>

                </div>

                {seanceMsg && (
                  <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: seanceMsg.startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: seanceMsg.startsWith('✓') ? '#3B6D11' : '#993556', fontSize: 12 }}>
                    {seanceMsg}
                  </div>
                )}

                {showNewSeance && (
                  <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: 16, marginBottom: 16, border: '0.5px solid var(--color-border-secondary)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 12 }}>
                      Nouvelle séance — {detail.prenom} {detail.nom}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <MField label="Type">
                        <select value={newSeanceForm.type_seance} onChange={e => setNewSeanceForm(p => ({ ...p, type_seance: e.target.value }))} style={mInp}>
                          {['Sophrologie','Coaching','Naturopathie','Énergie','Massage','Fleurs de Bach','3D Humain','Autre'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </MField>
                      <MField label="Date">
                        <input type="date" value={newSeanceForm.date_seance} onChange={e => setNewSeanceForm(p => ({ ...p, date_seance: e.target.value }))} style={mInp} />
                      </MField>
                      <MField label="Heure">
                        <input type="time" value={newSeanceForm.heure_seance} onChange={e => setNewSeanceForm(p => ({ ...p, heure_seance: e.target.value }))} style={mInp} />
                      </MField>
                      <MField label="Durée (min)">
                        <input type="number" value={newSeanceForm.duree_minutes} min={15} step={15} onChange={e => setNewSeanceForm(p => ({ ...p, duree_minutes: e.target.value }))} style={mInp} />
                      </MField>
                      <MField label="Prix (€)" style={{ gridColumn: '1/-1' }}>
                        <input type="number" value={newSeanceForm.prix_euros} min={0} step={0.01} placeholder="60" onChange={e => setNewSeanceForm(p => ({ ...p, prix_euros: e.target.value }))} style={mInp} />
                      </MField>
                    </div>
                    <MField label="Notes">
                      <textarea value={newSeanceForm.notes} rows={2} placeholder="Observations…" onChange={e => setNewSeanceForm(p => ({ ...p, notes: e.target.value }))} style={{ ...mInp, resize: 'vertical', fontFamily: 'inherit' }} />
                    </MField>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                      <button onClick={handleAddSeanceFromFiche} disabled={savingSeance} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: savingSeance ? 'not-allowed' : 'pointer', opacity: savingSeance ? 0.7 : 1 }}>
                        {savingSeance ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                )}

                {loadingSeances ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                    <i className="ti ti-loader-2" style={{ fontSize: 22, display: 'block', marginBottom: 8 }} />Chargement…
                  </div>
                ) : clientSeances.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                    <i className="ti ti-calendar-off" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
                    Aucune séance enregistrée
                  </div>
                ) : (
                  <>
                    {clientSeances.map((s, idx) => {
                      const tc = { 'Sophrologie':{'bg':'#E6F1FB','color':'#185FA5'},'Coaching':{'bg':'#EEEDFE','color':'#534AB7'},'Naturopathie':{'bg':'#E1F5EE','color':'#0F6E56'},'Énergie':{'bg':'#FBEAF0','color':'#993556'},'Massage':{'bg':'#FAEEDA','color':'#854F0B'},'Fleurs de Bach':{'bg':'#F0EBF8','color':'#7F3FBF'},'Autre':{'bg':'#F5F5F5','color':'#6B7280'} }[s.type_seance] || {'bg':'#F5F5F5','color':'#6B7280'}
                      return (
  <div key={s.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: idx < clientSeances.length-1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
    <div style={{ width: 8, height: 8, borderRadius: '50%', background: tc.color, flexShrink: 0, marginTop: 5 }} />
    <div style={{ flex: 1 }}>
      {editingSeanceId === s.id ? (
        <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: 14, border: '0.5px solid var(--color-border-secondary)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <MField label="Type">
              <select value={editSeanceForm.type_seance} onChange={e => setEditSeanceForm(p => ({ ...p, type_seance: e.target.value }))} style={mInp}>
                {['Sophrologie','Coaching','Naturopathie','Énergie','Massage','Fleurs de Bach','3D Humain','Autre'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </MField>
            <MField label="Date">
              <input type="date" value={editSeanceForm.date_seance} onChange={e => setEditSeanceForm(p => ({ ...p, date_seance: e.target.value }))} style={mInp} />
            </MField>
            <MField label="Heure">
              <input type="time" value={editSeanceForm.heure_seance} onChange={e => setEditSeanceForm(p => ({ ...p, heure_seance: e.target.value }))} style={mInp} />
            </MField>
            <MField label="Durée (min)">
              <input type="number" value={editSeanceForm.duree_minutes} min={15} step={15} onChange={e => setEditSeanceForm(p => ({ ...p, duree_minutes: e.target.value }))} style={mInp} />
            </MField>
            <MField label="Prix (€)" style={{ gridColumn: '1/-1' }}>
              <input type="number" value={editSeanceForm.prix_euros} min={0} step={0.01} onChange={e => setEditSeanceForm(p => ({ ...p, prix_euros: e.target.value }))} style={mInp} />
            </MField>
          </div>
          <MField label="Notes de cette séance">
            <textarea value={editSeanceForm.notes} rows={2} onChange={e => setEditSeanceForm(p => ({ ...p, notes: e.target.value }))} style={{ ...mInp, resize: 'vertical', fontFamily: 'inherit' }} />
          </MField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button onClick={() => { setEditingSeanceId(null); setEditSeanceForm(null) }} style={{ padding: '7px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 12 }}>Annuler</button>
            <button onClick={saveEditSeance} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              <i className="ti ti-check" style={{ marginRight: 5 }} />Sauvegarder
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {fmtDate(s.date_seance)}
            </span>
            {s.heure_seance && (
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 6 }}>
                à {s.heure_seance}
              </span>
            )}
            <span style={{ fontSize: 10, fontWeight: 600, background: tc.bg, color: tc.color, padding: '1px 7px', borderRadius: 20, marginLeft: 'auto' }}>{s.type_seance}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {s.duree_minutes && <span><i className="ti ti-clock" style={{ fontSize: 11, marginRight: 3 }} />{s.duree_minutes} min</span>}
            {s.prix_euros    && <span><i className="ti ti-coin"  style={{ fontSize: 11, marginRight: 3 }} />{parseFloat(s.prix_euros).toFixed(0)} €</span>}
          </div>
          {s.notes && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.5, background: 'var(--color-background-secondary)', padding: '6px 10px', borderRadius: 6 }}>{s.notes}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button onClick={() => setModalSeance(s)} style={{ background: 'none', border: '0.5px solid var(--color-border-secondary)', borderRadius: 6, cursor: 'pointer', color: 'var(--color-accent)', fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-eye" style={{ fontSize: 11 }} />Voir
            </button>
            <button onClick={() => openEditSeance(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-pencil" style={{ fontSize: 11 }} />Modifier
            </button>
          </div>
        </>
      )}
    </div>
  </div>
                      )
                    })}
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--color-background-secondary)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{clientSeances.length} séance(s)</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{clientSeances.reduce((a,s)=>a+(parseFloat(s.prix_euros)||0),0).toFixed(0)} € total</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Onglet NOTES ── */}
            {detailTab === 'notes' && !editingDetail && (
              <div>
                {detail.notes ? (
                  <div style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.7, background: 'var(--color-background-secondary)', padding: '14px 16px', borderRadius: 8 }}>{detail.notes}</div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                    <i className="ti ti-notes-off" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
                    Aucune note pour ce client
                  </div>
                )}
              </div>
            )}

            {/* ── Onglet BACH ── */}
            {detailTab === 'bach' && !editingDetail && (
              <div>
                <button
                  onClick={() => { setDetail(null); window.location.href = `/fleurs-de-bach/${detail.id}` }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '11px 18px', marginBottom: 16, borderRadius: 10, border: 'none', background: '#3D5A3E', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  🌿 Nouvelle séance Bach
                </button>

                {loadingBach && (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                    <i className="ti ti-loader-2" style={{ fontSize: 22, display: 'block', marginBottom: 8 }} />Chargement…
                  </div>
                )}

                {!loadingBach && bachFiches.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                    <i className="ti ti-leaf-off" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
                    Aucune séance Bach enregistrée
                    <div style={{ marginTop: 14 }}>
                      <button onClick={() => { setDetail(null); window.location.href = `/fleurs-de-bach/${detail.id}` }}
                        style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#3D5A3E', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Démarrer la première séance
                      </button>
                    </div>
                  </div>
                )}

                {!loadingBach && bachFiches.map((fiche, idx) => {
                  const nbFleurs   = Object.keys(fiche.selection || {}).length
                  const ci         = fiche.client_info || {}
                  const objectif   = ci.notes || fiche.persos || ''
                  const typeSeance = ci.type_seance || ''
                  const dateStr    = new Date(fiche.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                  return (
                    <div key={fiche.id} style={{ paddingTop: 12, paddingBottom: 12, borderBottom: idx < bachFiches.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3D5A3E', flexShrink: 0, marginTop: 5 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{dateStr}</span>
                            {ci.heure && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>à {ci.heure}</span>}
                            <span style={{ fontSize: 11, fontWeight: 600, background: '#EAF0EA', color: '#3D5A3E', padding: '1px 8px', borderRadius: 20 }}>
                              {nbFleurs} fleur{nbFleurs !== 1 ? 's' : ''}
                            </span>
                            {typeSeance && (
                              <span style={{ fontSize: 10, fontWeight: 600, background: '#F0EBF8', color: '#7F3FBF', padding: '1px 7px', borderRadius: 20 }}>{typeSeance}</span>
                            )}
                          </div>
                          {objectif && (
                            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, fontStyle: 'italic', marginBottom: 6 }}>
                              {objectif.length > 100 ? objectif.slice(0, 100) + '…' : objectif}
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setDetail(null); window.location.href = `/fleurs-de-bach/${detail.id}` }}
                              style={{ background: 'none', border: '0.5px solid #3D5A3E', borderRadius: 6, cursor: 'pointer', color: '#3D5A3E', fontSize: 11, padding: '3px 8px' }}>
                              🌿 Recharger
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Onglet CHAKRAS ── */}


            {/* Onglet ORACLE */}
            {detailTab === 'oracle' && !editingDetail && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--color-text-primary)' }}>
                    {oracleSeances.length} séance(s) oracle
                  </span>
                  <button onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser()
                    const { data: s } = await supabase.from('napo_oracle_seances').insert({
                      user_id: user.id, client_id: detail.id,
                      date_seance: new Date().toISOString().slice(0,10),
                      heure_seance: new Date().toTimeString().slice(0,5),
                      numero_seance: oracleSeances.length + 1
                    }).select().single()
                    if (s) window.location.href = `/napo-oracle/${s.id}`
                  }} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    <i className="ti ti-plus" style={{ fontSize:13 }} />Nouvelle séance oracle
                  </button>
                </div>

                {loadingOracle ? (
                  <div style={{ textAlign:'center', padding:'30px', color:'var(--color-text-secondary)', fontSize:13 }}>
                    <i className="ti ti-loader-2" style={{ fontSize:22, display:'block', marginBottom:8 }} />Chargement…
                  </div>
                ) : oracleSeances.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'30px', color:'var(--color-text-secondary)', fontSize:13 }}>
                    <i className="ti ti-cards" style={{ fontSize:28, display:'block', marginBottom:8 }} />
                    Aucune séance oracle enregistrée
                    <div style={{ marginTop:14 }}>
                      <button onClick={async () => {
                        const { data: { user } } = await supabase.auth.getUser()
                        const { data: s } = await supabase.from('napo_oracle_seances').insert({
                          user_id: user.id, client_id: detail.id,
                          date_seance: new Date().toISOString().slice(0,10),
                          heure_seance: new Date().toTimeString().slice(0,5),
                          numero_seance: 1
                        }).select().single()
                        if (s) window.location.href = `/napo-oracle/${s.id}`
                      }} style={{ padding:'8px 18px', borderRadius:8, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        Démarrer la première séance
                      </button>
                    </div>
                  </div>
                ) : oracleSeances.map((s, idx) => {
                  const d = s.date_seance ? s.date_seance.slice(0,10).split('-') : null
                  const dateStr = d ? `${parseInt(d[2])} ${['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'][parseInt(d[1])-1]} ${d[0]}` : '—'
                  return (
                    <div key={s.id} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 0', borderBottom:idx < oracleSeances.length-1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:'#993556', flexShrink:0, marginTop:5 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>{dateStr}</span>
                          {s.heure_seance && <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>à {s.heure_seance.slice(0,5)}</span>}
                          <span style={{ fontSize:10, fontWeight:600, background:'#FBEAF0', color:'#993556', padding:'1px 7px', borderRadius:20, marginLeft:'auto' }}>Séance #{s.numero_seance}</span>
                        </div>
                        {s.deck_utilise && <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:4 }}><i className="ti ti-cards" style={{ fontSize:11, marginRight:4 }} />{s.deck_utilise}</div>}
                        {s.note_globale && <div style={{ fontSize:12, color:'var(--color-text-secondary)', lineHeight:1.5, background:'var(--color-background-secondary)', padding:'6px 10px', borderRadius:6, marginBottom:6 }}>{s.note_globale.length > 80 ? s.note_globale.slice(0,80)+'…' : s.note_globale}</div>}
                        <div style={{ display:'flex', justifyContent:'flex-end', gap:6 }}>
                          <button onClick={async () => {
                            if (!window.confirm('Supprimer cette séance oracle ?')) return
                            await supabase.from('napo_oracle_seances').delete().eq('id', s.id)
                            setOracleSeances(prev => prev.filter(x => x.id !== s.id))
                          }} style={{ background:'none', border:'0.5px solid #FBEAF0', borderRadius:6, cursor:'pointer', color:'#993556', fontSize:11, padding:'3px 8px', display:'flex', alignItems:'center', gap:4 }}>
                            <i className="ti ti-trash" style={{ fontSize:11 }} />Supprimer
                          </button>
                          <button onClick={() => window.location.href=`/napo-oracle/${s.id}`}
                            style={{ background:'none', border:'0.5px solid var(--color-border-secondary)', borderRadius:6, cursor:'pointer', color:'var(--color-accent)', fontSize:11, padding:'3px 8px', display:'flex', alignItems:'center', gap:4 }}>
                            <i className="ti ti-eye" style={{ fontSize:11 }} />Voir
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Onglet ENERGIE */}
            {detailTab === 'energie' && !editingDetail && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--color-text-primary)' }}>
                    {energieSeances.length} séance(s) énergie
                  </span>
                  <button onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser()
                    const { data: s } = await supabase.from('energie_seances').insert({
                      user_id: user.id, client_id: detail.id,
                      date_seance: new Date().toISOString().slice(0,10),
                      heure_seance: new Date().toTimeString().slice(0,5),
                      numero_seance: energieSeances.length + 1
                    }).select().single()
                    if (s) window.location.href = `/energie/${s.id}`
                  }} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    <i className="ti ti-plus" style={{ fontSize:13 }} />Nouvelle séance énergie
                  </button>
                </div>

                {loadingEnergie ? (
                  <div style={{ textAlign:'center', padding:'30px', color:'var(--color-text-secondary)', fontSize:13 }}>
                    <i className="ti ti-loader-2" style={{ fontSize:22, display:'block', marginBottom:8 }} />Chargement…
                  </div>
                ) : energieSeances.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'30px', color:'var(--color-text-secondary)', fontSize:13 }}>
                    <i className="ti ti-sparkles" style={{ fontSize:28, display:'block', marginBottom:8 }} />
                    Aucune séance énergie enregistrée
                    <div style={{ marginTop:14 }}>
                      <button onClick={async () => {
                        const { data: { user } } = await supabase.auth.getUser()
                        const { data: s } = await supabase.from('energie_seances').insert({
                          user_id: user.id, client_id: detail.id,
                          date_seance: new Date().toISOString().slice(0,10),
                          heure_seance: new Date().toTimeString().slice(0,5),
                          numero_seance: 1
                        }).select().single()
                        if (s) window.location.href = `/energie/${s.id}`
                      }} style={{ padding:'8px 18px', borderRadius:8, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        Démarrer la première séance
                      </button>
                    </div>
                  </div>
                ) : energieSeances.map((s, idx) => {
                  const d = s.date_seance ? s.date_seance.slice(0,10).split('-') : null
                  const dateStr = d ? `${parseInt(d[2])} ${['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'][parseInt(d[1])-1]} ${d[0]}` : '—'
                  return (
                    <div key={s.id} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 0', borderBottom:idx < energieSeances.length-1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:'#993556', flexShrink:0, marginTop:5 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>{dateStr}</span>
                          {s.heure_seance && <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>à {s.heure_seance.slice(0,5)}</span>}
                          <span style={{ fontSize:10, fontWeight:600, background:'#FBEAF0', color:'#993556', padding:'1px 7px', borderRadius:20, marginLeft:'auto' }}>Séance #{s.numero_seance}</span>
                        </div>
                        {s.outil && <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:4 }}><i className="ti ti-tool" style={{ fontSize:11, marginRight:4 }} />{s.outil}</div>}
                        {s.note_globale && <div style={{ fontSize:12, color:'var(--color-text-secondary)', lineHeight:1.5, background:'var(--color-background-secondary)', padding:'6px 10px', borderRadius:6, marginBottom:6 }}>{s.note_globale.length > 80 ? s.note_globale.slice(0,80)+'…' : s.note_globale}</div>}
                        <div style={{ display:'flex', justifyContent:'flex-end', gap:6 }}>
                          <button onClick={async () => {
                            if (!window.confirm('Supprimer cette séance énergie ?')) return
                            await supabase.from('energie_chakras_mesures').delete().eq('seance_id', s.id)
                            await supabase.from('energie_seances').delete().eq('id', s.id)
                            setEnergieSeances(prev => prev.filter(x => x.id !== s.id))
                          }} style={{ background:'none', border:'0.5px solid #FBEAF0', borderRadius:6, cursor:'pointer', color:'#993556', fontSize:11, padding:'3px 8px', display:'flex', alignItems:'center', gap:4 }}>
                            <i className="ti ti-trash" style={{ fontSize:11 }} />Supprimer
                          </button>
                          <button onClick={() => window.location.href=`/energie/${s.id}`}
                            style={{ background:'none', border:'0.5px solid var(--color-border-secondary)', borderRadius:6, cursor:'pointer', color:'var(--color-accent)', fontSize:11, padding:'3px 8px', display:'flex', alignItems:'center', gap:4 }}>
                            <i className="ti ti-eye" style={{ fontSize:11 }} />Voir
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
              {editingDetail ? (
                <>
                  <button onClick={() => setEditingDetail(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 13 }}>Annuler</button>
                  <button onClick={saveEditDetail} style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <i className="ti ti-check" style={{ marginRight: 5 }} />Sauvegarder
                  </button>
                </>
              ) : (
                <>
                  <button onClick={async () => {
                    const seancesClient = getSeancesByClient(detail.id)
                    for (const s of seancesClient) { await deleteSeance(s.id) }
                    await deleteClient(detail.id)
                    setDetail(null)
                  }} style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid #FBEAF0', background: 'transparent', color: '#993556', cursor: 'pointer', fontSize: 13 }}>
                    <i className="ti ti-trash" style={{ marginRight: 5 }} />Supprimer
                  </button>
                  <button onClick={() => openEdit(detail)} style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 13 }}>
                    <i className="ti ti-pencil" style={{ marginRight: 5 }} />Modifier
                  </button>
                  <button onClick={() => setDetail(null)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Fermer</button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
      {modalSeance && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setModalSeance(null)}>
          <div style={{ background: 'var(--color-background-primary)', borderRadius: 14, padding: 24, maxWidth: 480, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Fiche séance</span>
              <button onClick={() => setModalSeance(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Date',  modalSeance.date_seance ? new Date(modalSeance.date_seance.slice(0,10) + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
                ['Heure', modalSeance.heure_seance ? modalSeance.heure_seance.slice(0,5) : '—'],
                ['Type',  modalSeance.type_seance || '—'],
                ['Durée', modalSeance.duree_minutes ? modalSeance.duree_minutes + ' min' : '—'],
                ['Prix',  modalSeance.prix_euros != null ? parseFloat(modalSeance.prix_euros).toFixed(0) + ' €' : '—'],
                ['Tags',  modalSeance.tags || '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-background-secondary)', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-primary)', fontWeight: 600 }}>{val}</span>
                </div>
              ))}
              <div style={{ padding: '10px 12px', background: 'var(--color-background-secondary)', borderRadius: 8, gridColumn: '1/-1' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>Notes de séance</div>
                {modalSeance.notes
                  ? <div style={{ fontSize: 12, color: 'var(--color-text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{modalSeance.notes}</div>
                  : <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Aucune note pour cette séance</div>
                }
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalSeance(null)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Utilitaires ─────────────────────────────────────────── */

function Btn({ icon, label, onClick, secondary }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, border: secondary ? '0.5px solid var(--color-border-secondary)' : 'none', background: secondary ? 'transparent' : 'var(--color-accent)', color: secondary ? 'var(--color-text-primary)' : '#fff' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 15 }} />{label}
    </button>
  )
}

function StatCard({ icon, iconBg, iconColor, label, value }) {
  return (
    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 20, color: iconColor }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  )
}

function Sel({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, cursor: 'pointer' }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}

function MField({ label, children, style }) {
  return (
    <div style={style}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}

function xBtn(color, bg) {
  return { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', borderRadius: 8, border: `0.5px solid ${color}44`, background: bg, color, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
}

const inp  = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }
const mInp = { width: '100%', padding: '6px 10px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }
