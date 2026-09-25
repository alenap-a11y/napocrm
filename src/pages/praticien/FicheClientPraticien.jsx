import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useClients } from '../../hooks/useClients'

function clientName(c) { return `${c.prenom || ''} ${c.nom || ''}`.trim() }

function fmtDate(d) {
  if (!d) return '—'
  const s = String(d).slice(0, 10).split('-')
  if (s.length !== 3) return d
  const MOIS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
  return `${parseInt(s[2])} ${MOIS[parseInt(s[1]) - 1]} ${s[0]}`
}

const EXTRA_METIERS = [
  { id: 'magnetisme', table: 'fiches_magnetisme', label: 'Magnétisme', moduleTitle: 'Napo-Magnétiseur' },
  { id: 'mediumnite', table: 'fiches_mediumnite', label: 'Médium', moduleTitle: 'Napo-Médium' },
  { id: 'radiesthesie', table: 'fiches_radiesthesie', label: 'Radiesthésie', moduleTitle: 'Napo-Radiesthésie' },
  { id: 'yoga', table: 'fiches_yoga', label: 'Yoga', moduleTitle: 'Napo-Yoga' },
  { id: 'naturopathie', table: 'fiches_naturopathie', label: 'Naturopathie', moduleTitle: 'Napo-Naturopathie' },
  { id: 'aromatherapie', table: 'fiches_aromatherapie', label: 'Aromathérapie', moduleTitle: 'Napo-Aromathérapie' },
  { id: 'sonotherapie', table: 'fiches_sonotherapie', label: 'Sonothérapie', moduleTitle: 'Napo-Sonothérapie' },
  { id: 'massage', table: 'fiches_massage', label: 'Massage', moduleTitle: 'Napo-Massage' },
  { id: 'sophrologie', table: 'fiches_sophrologie', label: 'Sophrologie', moduleTitle: 'Napo-Sophrologie' },
  { id: 'hypnotherapie', table: 'fiches_hypnotherapie', label: 'Hypnothérapie', moduleTitle: 'Napo-Hypnothérapie' },
  { id: 'chamanisme', table: 'fiches_chamanisme', label: 'Chamanisme', moduleTitle: 'Napo-Chamanisme' },
  { id: 'astrologie', table: 'fiches_astrologie', label: 'Astrologie', moduleTitle: 'Napo-Astrologie' },
]

const ONGLETS_BASE = [
  ['resume', 'Résumé'], ['infos', 'Infos'], ['seances', 'Séances'], ['questionnaires', 'Questionnaires'],
  ['suivi', 'Suivi'], ['objectifs', 'Objectifs'], ['notes', 'Notes'],
  ['documents', 'Documents'], ['analyse', 'Analyse'],
]
const ONGLETS_METIERS_FIXES = [['bach', 'Bach'], ['energie', 'Énergie'], ['oracle', 'Oracle'], ['formation', 'Formation']]
const METIER_ICONS = {
  bach: 'ti-leaf', energie: 'ti-sparkles', oracle: 'ti-cards', formation: 'ti-school',
  magnetisme: 'ti-hand-stop', mediumnite: 'ti-ghost', radiesthesie: 'ti-pendulum',
  yoga: 'ti-yoga', naturopathie: 'ti-plant-2', aromatherapie: 'ti-droplet',
  sonotherapie: 'ti-wave-sine', massage: 'ti-hand-move', sophrologie: 'ti-mood-smile',
  hypnotherapie: 'ti-spiral', chamanisme: 'ti-feather', astrologie: 'ti-moon-stars',
}
const METIER_CONFIG = {
  energie:       { table: 'energie_seances',     route: id => `/energie/${id}` },
  oracle:        { table: 'napo_oracle_seances', route: id => `/napo-oracle/${id}` },
  magnetisme:    { table: 'fiches_magnetisme',   route: id => `/magnetisme/${id}` },
  mediumnite:    { table: 'fiches_mediumnite',   route: id => `/mediumnite/${id}` },
  radiesthesie:  { table: 'fiches_radiesthesie', route: id => `/radiesthesie/${id}` },
  yoga:          { table: 'fiches_yoga',         route: id => `/napo-yoga/${id}` },
  naturopathie:  { table: 'fiches_naturopathie', route: id => `/napo-naturopathie/${id}` },
  aromatherapie: { table: 'fiches_aromatherapie',route: id => `/napo-aromatherapie/${id}` },
  sonotherapie:  { table: 'fiches_sonotherapie', route: id => `/napo-sonotherapie/${id}` },
  massage:       { table: 'fiches_massage',      route: id => `/napo-massage/${id}` },
  sophrologie:   { table: 'fiches_sophrologie',  route: id => `/napo-sophrologie/${id}` },
  hypnotherapie: { table: 'fiches_hypnotherapie',route: id => `/napo-hypnotherapie/${id}` },
  chamanisme:    { table: 'fiches_chamanisme',   route: id => `/napo-chamanisme/${id}` },
  astrologie:    { table: 'fiches_astrologie',   route: id => `/napo-astrologie/${id}` },
}

const card = { background: 'var(--color-background-secondary)', borderRadius: 10, padding: 16 }
const cardLabel = { fontSize: 12, color: 'var(--color-text-secondary)' }
const cardValue = { fontSize: 22, fontWeight: 600, marginTop: 4 }
const S_field = { display: 'flex', flexDirection: 'column', gap: 4 }
const S_label = { fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.03em' }
const infoCard = { display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--color-background-secondary)', borderRadius: 10, padding: '12px 14px' }
const infoIcon = { fontSize: 15, color: 'var(--color-accent)', marginTop: 2, flexShrink: 0 }
const infoLabel = { fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }
const infoValue = { fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500 }
const inp = { padding: '7px 10px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }

export default function FicheClientPraticien() {
  const { clientId, tab } = useParams()
  const activeTab = tab || 'resume'
  const { clients, loading } = useClients()
  const navigate = useNavigate()
  const client = clients.find(c => c.id === clientId)

  const [seances, setSeances] = useState([])
  const [noteText, setNoteText] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteMsg, setNoteMsg] = useState('')
  const [loadingSeances, setLoadingSeances] = useState(true)
  const [favori, setFavori] = useState(false)
  const [seancesTout, setSeancesTout] = useState([])
  const [modulesActifs, setModulesActifs] = useState(null)
  const [loadingTout, setLoadingTout] = useState(true)
  const [editingInfos, setEditingInfos] = useState(false)
  const [infosForm, setInfosForm] = useState({})
  const [infosSaving, setInfosSaving] = useState(false)
  const [infosMsg, setInfosMsg] = useState('')
  const [notesListe, setNotesListe] = useState([])
  const [loadingNotesListe, setLoadingNotesListe] = useState(true)
  const [nouvelleNote, setNouvelleNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editNoteTexte, setEditNoteTexte] = useState('')
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState(null)
  const [modalSeance, setModalSeance] = useState(null)
  const [editingSeanceId, setEditingSeanceId] = useState(null)
  const [editSeanceForm, setEditSeanceForm] = useState(null)
  const [seanceMsg, setSeanceMsg] = useState('')
  const [filtreType, setFiltreType] = useState('')
  const [filtrePeriode, setFiltrePeriode] = useState('tout')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [rechercheTexte, setRechercheTexte] = useState('')
  const [formationHistorique, setFormationHistorique] = useState([])
  const [loadingFormation, setLoadingFormation] = useState(true)
  const [metierHistorique, setMetierHistorique] = useState([])
  const [loadingMetierHistorique, setLoadingMetierHistorique] = useState(true)

  useEffect(() => {
    if (client) {
      setNoteText(client.notes || ''); setFavori(!!client.favori)
      setInfosForm({
        email: client.email || '', tel: client.tel || '',
        adresse_numero: client.adresse_numero || '', adresse_rue: client.adresse_rue || '',
        code_postal: client.code_postal || '', ville: client.ville || '',
        date_naissance: client.date_naissance || '', situation_familiale: client.situation_familiale || '',
        environnement: client.environnement || '', situation_professionnelle: client.situation_professionnelle || '',
        nombre_enfants: client.nombre_enfants ?? '', nom_naissance: client.nom_naissance || '',
        adresse_complement: client.adresse_complement || '',
      })
    }
  }, [client?.id])

  async function saveInfos() {
    setInfosSaving(true)
    const payload = Object.fromEntries(
      Object.entries(infosForm).map(([k, v]) => [k, v === '' ? null : v])
    )
    payload.nombre_enfants = infosForm.nombre_enfants === '' ? null : parseInt(infosForm.nombre_enfants, 10)
    const { error } = await supabase.from('clients').update(payload).eq('id', clientId)
    setInfosMsg(error ? 'Erreur : ' + error.message : '✓ Enregistré')
    setInfosSaving(false)
    if (!error) setEditingInfos(false)
    setTimeout(() => setInfosMsg(''), 2500)
  }

  async function toggleFavori() {
    const next = !favori
    setFavori(next)
    const { error } = await supabase.from('clients').update({ favori: next }).eq('id', clientId)
    if (error) setFavori(!next)
  }

  function chargerNotes() {
    if (!clientId) return
    setLoadingNotesListe(true)
    supabase.from('notes').select('id, contenu, created_at, updated_at').eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setNotesListe(data || [])
        setLoadingNotesListe(false)
      })
  }

  useEffect(() => { chargerNotes() }, [clientId])

  async function ajouterNote() {
    if (!nouvelleNote.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('notes').insert({
      user_id: user?.id, client_id: clientId, client_nom: client ? clientName(client) : null,
      titre: 'Note client', categorie: 'Séance', date_note: new Date().toISOString().slice(0,10),
      contenu: nouvelleNote.trim(),
    })
    if (!error) { setNouvelleNote(''); chargerNotes() }
  }

  async function modifierNote(id) {
    const { error } = await supabase.from('notes').update({ contenu: editNoteTexte, updated_at: new Date().toISOString() }).eq('id', id)
    if (!error) { setEditingNoteId(null); chargerNotes() }
  }

  async function supprimerNote(id) {
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (!error) { setConfirmDeleteNoteId(null); chargerNotes() }
  }

  async function saveNote() {
    setNoteSaving(true)
    const { error } = await supabase.from('clients').update({ notes: noteText }).eq('id', clientId)
    setNoteMsg(error ? 'Erreur : ' + error.message : '✓ Note enregistrée')
    setNoteSaving(false)
    setTimeout(() => setNoteMsg(''), 2500)
  }

  function chargerSeances() {
    if (!clientId) return
    setLoadingSeances(true)
    supabase.from('seances')
      .select('id, date_seance, heure_seance, duree_minutes, type_seance, prix_euros, statut, ressenti_avant, ressenti_apres, notes')
      .eq('client_id', clientId)
      .order('date_seance', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setSeances(data || [])
        setLoadingSeances(false)
      })
  }

  useEffect(() => { chargerSeances() }, [clientId])

  function openEditSeance(s) {
    setEditingSeanceId(s.id)
    setEditSeanceForm({
      type_seance: s.type_seance || 'Autre',
      date_seance: s.date_seance ? s.date_seance.slice(0, 10) : '',
      heure_seance: s.heure_seance || '',
      duree_minutes: s.duree_minutes || '',
      prix_euros: s.prix_euros || '',
      notes: s.notes || '',
    })
  }

  async function saveEditSeance() {
    const payload = {
      type_seance: editSeanceForm.type_seance,
      date_seance: editSeanceForm.date_seance || null,
      heure_seance: editSeanceForm.heure_seance || null,
      duree_minutes: editSeanceForm.duree_minutes === '' ? null : parseInt(editSeanceForm.duree_minutes, 10),
      prix_euros: editSeanceForm.prix_euros === '' ? null : parseFloat(editSeanceForm.prix_euros),
      notes: editSeanceForm.notes || null,
    }
    const { error } = await supabase.from('seances').update(payload).eq('id', editingSeanceId)
    if (error) { setSeanceMsg('Erreur : ' + error.message); setTimeout(() => setSeanceMsg(''), 3000); return }
    setEditingSeanceId(null)
    setEditSeanceForm(null)
    chargerSeances()
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('marketplace_modules').select('id, title').eq('category', 'Napo-Métiers').eq('status', 'available')
        .then(({ data: mods }) => {
          const ids = (mods || []).map(m => m.id)
          if (!ids.length) { setModulesActifs(new Set()); return }
          supabase.from('profil_modules_actifs').select('module_id').eq('user_id', user.id).in('module_id', ids)
            .then(({ data: actifs }) => {
              const idsActifs = new Set((actifs || []).map(a => a.module_id))
              const titresActifs = new Set((mods || []).filter(m => idsActifs.has(m.id)).map(m => m.title))
              setModulesActifs(titresActifs)
            })
        })
    })
  }, [])

  useEffect(() => {
    if (!clientId) return
    setLoadingTout(true)
    Promise.all([
      supabase.from('energie_seances').select('id, date_seance, heure_seance').eq('client_id', clientId),
      supabase.from('napo_oracle_seances').select('id, date_seance, heure_seance').eq('client_id', clientId),
      supabase.from('fiches_bach').select('id, created_at').eq('client_id', clientId),
      ...EXTRA_METIERS.map(m => supabase.from(m.table).select('id, date_seance, heure_seance').eq('client_id', clientId)),
    ]).then(results => {
      const [rEnergie, rOracle, rBach, ...rExtra] = results
      const norm = (rows, type) => (rows || []).map(s => ({ id: `${type}-${s.id}`, date_seance: s.date_seance, heure_seance: s.heure_seance || null, type_seance: type }))
      const tout = [
        ...seances.map(s => ({ ...s, type_seance: s.type_seance || 'Séance' })),
        ...norm(rEnergie.data, 'Énergie'),
        ...norm(rOracle.data, 'Oracle'),
        ...(rBach.data || []).map(s => ({ id: `bach-${s.id}`, date_seance: s.created_at ? s.created_at.slice(0,10) : null, heure_seance: null, type_seance: 'Bach' })),
        ...rExtra.flatMap((r, i) => norm(r.data, EXTRA_METIERS[i].label)),
      ].filter(s => s.date_seance)
      setSeancesTout(tout)
      setLoadingTout(false)
    })
  }, [clientId, seances])

  useEffect(() => {
    if (!clientId) return
    setLoadingFormation(true)
    supabase.from('formation_participants')
      .select('id, evaluation_individuelle, formation_seances(id, date_seance, heure_seance, theme, numero_seance)')
      .eq('client_id', clientId)
      .order('date_seance', { foreignTable: 'formation_seances', ascending: false })
      .then(({ data }) => {
        setFormationHistorique(data || [])
        setLoadingFormation(false)
      })
  }, [clientId])

  useEffect(() => {
    const cfg = METIER_CONFIG[activeTab]
    if (!cfg || !clientId) return
    setLoadingMetierHistorique(true)
    supabase.from(cfg.table).select('id, date_seance, heure_seance').eq('client_id', clientId)
      .order('date_seance', { ascending: false })
      .then(({ data }) => {
        setMetierHistorique(data || [])
        setLoadingMetierHistorique(false)
      })
  }, [activeTab, clientId])

  const now = new Date().toISOString().slice(0, 10)
  const passees = seances.filter(s => s.date_seance && s.date_seance.slice(0, 10) < now)
  const avenir = seances.filter(s => s.date_seance && s.date_seance.slice(0, 10) >= now && s.statut === 'planifié')
    .sort((a, b) => a.date_seance.localeCompare(b.date_seance))
  const derniereSeance = passees[0]?.date_seance
  const prochaineSeance = avenir[0]?.date_seance
  const tempsTotal = seances.reduce((sum, s) => sum + (s.duree_minutes || 0), 0)
  const dureeMoyenne = seances.length ? Math.round(tempsTotal / seances.length) : null

  let frequence = '—'
  if (passees.length >= 2) {
    const dates = passees.map(s => new Date(s.date_seance)).sort((a, b) => a - b)
    const ecarts = []
    for (let i = 1; i < dates.length; i++) ecarts.push((dates[i] - dates[i-1]) / 86400000)
    const moy = Math.round(ecarts.reduce((a, b) => a + b, 0) / ecarts.length)
    frequence = `tous les ${moy} jours`
  }

  const historique = [...seances]
    .filter(s => s.date_seance)
    .sort((a, b) => b.date_seance.localeCompare(a.date_seance))
    .slice(0, 5)

  function fmtDateHeure(d) {
    if (!d) return '—'
    const dt = new Date(d)
    return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) + ' à ' + dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  function calculerAge(dateNaissance) {
    if (!dateNaissance) return null
    const n = new Date(dateNaissance)
    const t = new Date()
    let age = t.getFullYear() - n.getFullYear()
    if (t.getMonth() < n.getMonth() || (t.getMonth() === n.getMonth() && t.getDate() < n.getDate())) age--
    return age
  }
  const SITUATION_FAMILIALE_LABEL = { marie: 'Marié(e)', divorce: 'Divorcé(e)', celibataire: 'Célibataire', veuf: 'Veuf', veuve: 'Veuve', separe: 'Séparé(e)' }
  const ENVIRONNEMENT_LABEL = { toxique: 'Toxique', non_toxique: 'Non toxique' }
  const SITUATION_PRO_LABEL = { actif: 'Actif', chomage: 'Chômage', retraite: 'Retraite', invalide_malade: 'Invalide / malade' }
  const age = calculerAge(client?.date_naissance)
  const caTotal = seances.reduce((sum, s) => sum + (parseFloat(s.prix_euros) || 0), 0)

  const parPratique = {}
  seances.forEach(s => { const t = s.type_seance || 'Non renseigné'; parPratique[t] = (parPratique[t] || 0) + 1 })

  const ressentisAvant = seances.filter(s => s.ressenti_avant != null).sort((a, b) => a.date_seance.localeCompare(b.date_seance))
  const ressentisApres = seances.filter(s => s.ressenti_apres != null).sort((a, b) => a.date_seance.localeCompare(b.date_seance))

  const typesDisponibles = [...new Set(seances.map(s => s.type_seance).filter(Boolean))].sort()
  const statutsDisponibles = [...new Set(seances.map(s => s.statut).filter(Boolean))].sort()

  function dansPeriode(dateStr) {
    if (filtrePeriode === 'tout' || !dateStr) return true
    const d = new Date(dateStr)
    const jours = { '7j': 7, '30j': 30, '3m': 90, 'annee': 365 }[filtrePeriode]
    return (new Date() - d) / 86400000 <= jours
  }

  const seancesFiltrees = seances.filter(s =>
    (!filtreType || s.type_seance === filtreType) &&
    (!filtreStatut || s.statut === filtreStatut) &&
    dansPeriode(s.date_seance) &&
    (!rechercheTexte.trim() || (s.notes || '').toLowerCase().includes(rechercheTexte.trim().toLowerCase()))
  )

  if (loading) return <div style={{ padding: '1.6rem 2rem', color: 'var(--color-text-secondary)', fontSize: 13 }}>Chargement…</div>
  if (!client) return (
    <div style={{ padding: '1.6rem 2rem' }}>
      <button type="button" onClick={() => navigate('/praticien/clients')}
        style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 13, cursor: 'pointer', padding: 0 }}>
        ← Mes clients
      </button>
      <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 12 }}>Client introuvable.</div>
    </div>
  )

  const metiersActifs = modulesActifs === null
    ? EXTRA_METIERS.map(m => [m.id, m.label])
    : EXTRA_METIERS.filter(m => modulesActifs.has(m.moduleTitle)).map(m => [m.id, m.label])
  const ongletsMetiers = [...ONGLETS_METIERS_FIXES, ...metiersActifs]

  return (
    <div style={{ padding: '1.6rem 2rem', width: '100%', boxSizing: 'border-box' }}>
      <button type="button" onClick={() => navigate('/praticien/clients')}
        style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 13, cursor: 'pointer', marginBottom: 14, padding: 0 }}>
        ← Mes clients
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-background-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: 'var(--color-accent)', flexShrink: 0 }}>
          {(client.prenom?.[0] || '') + (client.nom?.[0] || '')}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>{clientName(client)}</div>
            <button type="button" onClick={toggleFavori} title={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={favori ? '#F2B01E' : 'none'} stroke={favori ? '#F2B01E' : 'var(--color-text-secondary)'} strokeWidth="1.5" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Client depuis {fmtDate(client.created_at || client.date_creation)}
            {client.specialite && ` · ${client.specialite}`}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <button type="button" style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Nouvelle séance</button>
        <button type="button" style={{ padding: '7px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer' }}>Ajouter une note</button>
        <button type="button" style={{ padding: '7px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer' }}>Questionnaire</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: '0.5px solid var(--color-border-tertiary)', marginBottom: 20, flexWrap: 'wrap' }}>
        {ONGLETS_BASE.map(([id, label]) => (
          <button key={id} type="button"
            onClick={() => navigate(id === 'resume' ? `/praticien/clients/${clientId}` : `/praticien/clients/${clientId}/${id}`)}
            style={{
              padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
              color: activeTab === id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === id ? '2px solid var(--color-accent)' : '2px solid transparent',
              fontWeight: activeTab === id ? 600 : 400,
            }}>
            {label}
          </button>
        ))}
      </div>

      {ongletsMetiers.some(([id]) => id === activeTab) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, padding: '8px 12px', background: 'var(--color-background-secondary)', borderRadius: 8, width: 'fit-content' }}>
          <i className={`ti ${METIER_ICONS[activeTab] || 'ti-stethoscope'}`} style={{ fontSize: 16, color: 'var(--color-accent)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {ongletsMetiers.find(([id]) => id === activeTab)?.[1]}
          </span>
        </div>
      )}

      {activeTab === 'analyse' ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Évolution des données</div>
          {seances.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Pas assez de données pour afficher cette évolution.</div>
          ) : (
            <div style={{ ...card, marginBottom: 24, fontSize: 13, lineHeight: 1.9 }}>
              <div>{seances.length} séance(s) enregistrée(s)</div>
              <div>{ressentisAvant.length} ressenti(s) « avant » renseigné(s)</div>
              <div>{ressentisApres.length} ressenti(s) « après » renseigné(s)</div>
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Ressenti déclaré (avant / après)</div>
          {ressentisAvant.length === 0 && ressentisApres.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Pas assez de données pour afficher cette évolution.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              {seances.filter(s => s.ressenti_avant != null || s.ressenti_apres != null).sort((a,b) => b.date_seance.localeCompare(a.date_seance)).map(s => (
                <div key={s.id} style={{ ...card, fontSize: 13 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{fmtDate(s.date_seance)}</div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>
                    Ressenti déclaré : {s.ressenti_avant ?? '—'}/10 → {s.ressenti_apres ?? '—'}/10
                    {s.ressenti_avant != null && s.ressenti_apres != null && (
                      <span style={{ color: s.ressenti_apres >= s.ressenti_avant ? '#0F6E56' : '#B23A3A', fontWeight: 600 }}>
                        {'  '}({s.ressenti_apres - s.ressenti_avant >= 0 ? '+' : ''}{s.ressenti_apres - s.ressenti_avant})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Répartition par pratique</div>
          <div style={{ fontSize: 13, ...card }}>
            {Object.entries(parPratique).map(([k, v]) => `${k} · ${v}`).join('   ')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 12 }}>
            Évolution observée dans les données enregistrées — pas un diagnostic médical.
          </div>
        </>
      ) : activeTab === 'infos' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Infos</div>
            {!editingInfos && (
              <button type="button" onClick={() => setEditingInfos(true)}
                style={{ padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                Modifier
              </button>
            )}
          </div>

          {!editingInfos ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={card}><div style={cardLabel}>Email</div><div style={{ fontSize: 14, marginTop: 4 }}>{client.email || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Téléphone</div><div style={{ fontSize: 14, marginTop: 4 }}>{client.tel || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Adresse</div><div style={{ fontSize: 14, marginTop: 4 }}>{[client.adresse_numero, client.adresse_rue].filter(Boolean).join(' ') || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Complément</div><div style={{ fontSize: 14, marginTop: 4 }}>{client.adresse_complement || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Ville</div><div style={{ fontSize: 14, marginTop: 4 }}>{[client.code_postal, client.ville].filter(Boolean).join(' ') || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Âge</div><div style={{ fontSize: 14, marginTop: 4 }}>{age != null ? `${age} ans` : '—'}</div></div>
                <div style={card}><div style={cardLabel}>Nom de naissance</div><div style={{ fontSize: 14, marginTop: 4 }}>{client.nom_naissance || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Situation familiale</div><div style={{ fontSize: 14, marginTop: 4 }}>{SITUATION_FAMILIALE_LABEL[client.situation_familiale] || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Situation pro.</div><div style={{ fontSize: 14, marginTop: 4 }}>{SITUATION_PRO_LABEL[client.situation_professionnelle] || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Environnement</div><div style={{ fontSize: 14, marginTop: 4 }}>{ENVIRONNEMENT_LABEL[client.environnement] || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Nombre d'enfants</div><div style={{ fontSize: 14, marginTop: 4 }}>{client.nombre_enfants ?? '—'}</div></div>
                <div style={card}><div style={cardLabel}>Séances</div><div style={{ fontSize: 14, marginTop: 4 }}>{seances.length} séance(s)</div></div>
                <div style={card}><div style={cardLabel}>CA total</div><div style={{ fontSize: 14, marginTop: 4 }}>{caTotal.toFixed(2)} €</div></div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Séances et CA calculés sur la table de séances générique uniquement.</div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={S_field}><span style={S_label}>Email</span><input style={inp} value={infosForm.email} onChange={e => setInfosForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Téléphone</span><input style={inp} value={infosForm.tel} onChange={e => setInfosForm(f => ({ ...f, tel: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Numéro</span><input style={inp} value={infosForm.adresse_numero} onChange={e => setInfosForm(f => ({ ...f, adresse_numero: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Rue</span><input style={inp} value={infosForm.adresse_rue} onChange={e => setInfosForm(f => ({ ...f, adresse_rue: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Complément</span><input style={inp} value={infosForm.adresse_complement} onChange={e => setInfosForm(f => ({ ...f, adresse_complement: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Code postal</span><input style={inp} value={infosForm.code_postal} onChange={e => setInfosForm(f => ({ ...f, code_postal: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Ville</span><input style={inp} value={infosForm.ville} onChange={e => setInfosForm(f => ({ ...f, ville: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Date de naissance</span><input type="date" style={inp} value={infosForm.date_naissance} onChange={e => setInfosForm(f => ({ ...f, date_naissance: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Nom de naissance</span><input style={inp} value={infosForm.nom_naissance} onChange={e => setInfosForm(f => ({ ...f, nom_naissance: e.target.value }))} /></div>
                <div style={S_field}>
                  <span style={S_label}>Situation familiale</span>
                  <select style={inp} value={infosForm.situation_familiale} onChange={e => setInfosForm(f => ({ ...f, situation_familiale: e.target.value }))}>
                    <option value="">—</option>
                    {Object.entries(SITUATION_FAMILIALE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                <div style={S_field}>
                  <span style={S_label}>Situation pro.</span>
                  <select style={inp} value={infosForm.situation_professionnelle} onChange={e => setInfosForm(f => ({ ...f, situation_professionnelle: e.target.value }))}>
                    <option value="">—</option>
                    {Object.entries(SITUATION_PRO_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                <div style={S_field}>
                  <span style={S_label}>Environnement</span>
                  <select style={inp} value={infosForm.environnement} onChange={e => setInfosForm(f => ({ ...f, environnement: e.target.value }))}>
                    <option value="">—</option>
                    {Object.entries(ENVIRONNEMENT_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                <div style={S_field}><span style={S_label}>Nombre d'enfants</span><input type="number" min="0" style={inp} value={infosForm.nombre_enfants} onChange={e => setInfosForm(f => ({ ...f, nombre_enfants: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button type="button" onClick={saveInfos} disabled={infosSaving}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: infosSaving ? 'not-allowed' : 'pointer', opacity: infosSaving ? 0.7 : 1 }}>
                  {infosSaving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button type="button" onClick={() => setEditingInfos(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                  Annuler
                </button>
                {infosMsg && <span style={{ fontSize: 12, color: infosMsg.startsWith('✓') ? '#0F6E56' : '#B23A3A' }}>{infosMsg}</span>}
              </div>
            </>
          )}
        </>
      ) : activeTab === 'notes' ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Notes</div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <textarea value={nouvelleNote} onChange={e => setNouvelleNote(e.target.value)}
              rows={3} placeholder="Ajouter une note..."
              style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            <button type="button" onClick={ajouterNote}
              style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + Ajouter
            </button>
          </div>

          {loadingNotesListe ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Chargement…</div>
          ) : notesListe.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', padding: '16px 0' }}>Aucune note pour le moment.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notesListe.map(n => (
                <div key={n.id} style={{ ...card }}>
                  {editingNoteId === n.id ? (
                    <>
                      <textarea value={editNoteTexte} onChange={e => setEditNoteTexte(e.target.value)}
                        rows={3} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', marginBottom: 8 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => modifierNote(n.id)}
                          style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Enregistrer</button>
                        <button type="button" onClick={() => setEditingNoteId(null)}
                          style={{ padding: '5px 12px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer' }}>Annuler</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', marginBottom: 8 }}>{n.contenu}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                          Créée {fmtDateHeure(n.created_at)}{n.updated_at && n.updated_at !== n.created_at ? ` · modifiée ${fmtDateHeure(n.updated_at)}` : ''}
                        </span>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button type="button" onClick={() => { setEditingNoteId(n.id); setEditNoteTexte(n.contenu) }}
                            style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 12, cursor: 'pointer', padding: 0 }}>Modifier</button>
                          {confirmDeleteNoteId === n.id ? (
                            <>
                              <button type="button" onClick={() => supprimerNote(n.id)}
                                style={{ background: 'none', border: 'none', color: '#B23A3A', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Confirmer</button>
                              <button type="button" onClick={() => setConfirmDeleteNoteId(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer', padding: 0 }}>Annuler</button>
                            </>
                          ) : (
                            <button type="button" onClick={() => setConfirmDeleteNoteId(n.id)}
                              style={{ background: 'none', border: 'none', color: '#B23A3A', fontSize: 12, cursor: 'pointer', padding: 0 }}>Supprimer</button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 12 }}>
            Ces notes sont privées, visibles uniquement par vous.
          </div>
        </>
      ) : activeTab === 'seances' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {seancesFiltrees.length === seances.length ? `${seances.length} séance(s)` : `${seancesFiltrees.length} / ${seances.length} séance(s)`}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <select value={filtreType} onChange={e => setFiltreType(e.target.value)} style={{ ...inp, minWidth: 140 }}>
              <option value="">Tous les types</option>
              {typesDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filtrePeriode} onChange={e => setFiltrePeriode(e.target.value)} style={{ ...inp, minWidth: 130 }}>
              <option value="tout">Toute période</option>
              <option value="7j">7 derniers jours</option>
              <option value="30j">30 derniers jours</option>
              <option value="3m">3 derniers mois</option>
              <option value="annee">Cette année</option>
            </select>
            {statutsDisponibles.length > 0 && (
              <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={{ ...inp, minWidth: 130 }}>
                <option value="">Tous les statuts</option>
                {statutsDisponibles.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            )}
            <input type="text" value={rechercheTexte} onChange={e => setRechercheTexte(e.target.value)} placeholder="Recherche dans les notes…" style={{ ...inp, minWidth: 200, flex: 1 }} />
            {(filtreType || filtrePeriode !== 'tout' || filtreStatut || rechercheTexte) && (
              <button type="button" onClick={() => { setFiltreType(''); setFiltrePeriode('tout'); setFiltreStatut(''); setRechercheTexte('') }}
                style={{ padding: '7px 12px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                Réinitialiser
              </button>
            )}
          </div>

          {seanceMsg && (
            <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: seanceMsg.startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: seanceMsg.startsWith('✓') ? '#3B6D11' : '#993556', fontSize: 12 }}>
              {seanceMsg}
            </div>
          )}

          {loadingSeances ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Chargement…</div>
          ) : seancesFiltrees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)', fontSize: 13 }}>
              <i className="ti ti-calendar-off" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
              {seances.length === 0 ? 'Aucune séance enregistrée' : 'Aucune séance ne correspond aux filtres'}
            </div>
          ) : (
            <div>
              {seancesFiltrees.map((s, idx) => {
                const tc = { 'Sophrologie': { bg: '#E6F1FB', color: '#185FA5' }, 'Coaching': { bg: '#EEEDFE', color: '#534AB7' }, 'Naturopathie': { bg: '#E1F5EE', color: '#0F6E56' }, 'Énergie': { bg: '#FBEAF0', color: '#993556' }, 'Massage': { bg: '#FAEEDA', color: '#854F0B' }, 'Fleurs de Bach': { bg: '#F0EBF8', color: '#7F3FBF' }, 'Autre': { bg: '#F5F5F5', color: '#6B7280' } }[s.type_seance] || { bg: '#F5F5F5', color: '#6B7280' }
                return (
                  <div key={s.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: idx < seancesFiltrees.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: tc.color, flexShrink: 0, marginTop: 5 }} />
                    <div style={{ flex: 1 }}>
                      {editingSeanceId === s.id ? (
                        <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: 14, border: '0.5px solid var(--color-border-secondary)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <div style={S_field}>
                              <span style={S_label}>Type</span>
                              <select style={inp} value={editSeanceForm.type_seance} onChange={e => setEditSeanceForm(p => ({ ...p, type_seance: e.target.value }))}>
                                {['Sophrologie', 'Coaching', 'Naturopathie', 'Énergie', 'Massage', 'Fleurs de Bach', '3D Humain', 'Autre'].map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div style={S_field}><span style={S_label}>Date</span><input type="date" style={inp} value={editSeanceForm.date_seance} onChange={e => setEditSeanceForm(p => ({ ...p, date_seance: e.target.value }))} /></div>
                            <div style={S_field}><span style={S_label}>Heure</span><input type="time" style={inp} value={editSeanceForm.heure_seance} onChange={e => setEditSeanceForm(p => ({ ...p, heure_seance: e.target.value }))} /></div>
                            <div style={S_field}><span style={S_label}>Durée (min)</span><input type="number" min={15} step={15} style={inp} value={editSeanceForm.duree_minutes} onChange={e => setEditSeanceForm(p => ({ ...p, duree_minutes: e.target.value }))} /></div>
                            <div style={{ ...S_field, gridColumn: '1/-1' }}><span style={S_label}>Prix (€)</span><input type="number" min={0} step={0.01} style={inp} value={editSeanceForm.prix_euros} onChange={e => setEditSeanceForm(p => ({ ...p, prix_euros: e.target.value }))} /></div>
                          </div>
                          <div style={S_field}>
                            <span style={S_label}>Notes de cette séance</span>
                            <textarea rows={2} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} value={editSeanceForm.notes} onChange={e => setEditSeanceForm(p => ({ ...p, notes: e.target.value }))} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                            <button type="button" onClick={() => { setEditingSeanceId(null); setEditSeanceForm(null) }}
                              style={{ padding: '7px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 12 }}>Annuler</button>
                            <button type="button" onClick={saveEditSeance}
                              style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                              <i className="ti ti-check" style={{ marginRight: 5 }} />Sauvegarder
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{fmtDate(s.date_seance)}</span>
                            {s.heure_seance && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 6 }}>à {s.heure_seance}</span>}
                            <span style={{ fontSize: 10, fontWeight: 600, background: tc.bg, color: tc.color, padding: '1px 7px', borderRadius: 20, marginLeft: 'auto' }}>{s.type_seance || 'Séance'}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            {s.duree_minutes && <span><i className="ti ti-clock" style={{ fontSize: 11, marginRight: 3 }} />{s.duree_minutes} min</span>}
                            {s.prix_euros && <span><i className="ti ti-coin" style={{ fontSize: 11, marginRight: 3 }} />{parseFloat(s.prix_euros).toFixed(0)} €</span>}
                          </div>
                          {s.notes && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.5, background: 'var(--color-background-secondary)', padding: '6px 10px', borderRadius: 6 }}>{s.notes}</div>}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                            <button type="button" onClick={() => setModalSeance(s)}
                              style={{ background: 'none', border: '0.5px solid var(--color-border-secondary)', borderRadius: 6, cursor: 'pointer', color: 'var(--color-accent)', fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <i className="ti ti-eye" style={{ fontSize: 11 }} />Voir
                            </button>
                            <button type="button" onClick={() => openEditSeance(s)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <i className="ti ti-pencil" style={{ fontSize: 11 }} />Modifier
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {modalSeance && (
            <div onClick={() => setModalSeance(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div onClick={e => e.stopPropagation()} style={{ background: 'var(--color-background-primary)', borderRadius: 12, padding: 22, width: 340, maxWidth: '90vw' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Séance du {fmtDate(modalSeance.date_seance)}</div>
                <div style={{ fontSize: 13, lineHeight: 1.9, color: 'var(--color-text-secondary)' }}>
                  <div>Type : <strong style={{ color: 'var(--color-text-primary)' }}>{modalSeance.type_seance || '—'}</strong></div>
                  <div>Heure : <strong style={{ color: 'var(--color-text-primary)' }}>{modalSeance.heure_seance || '—'}</strong></div>
                  <div>Durée : <strong style={{ color: 'var(--color-text-primary)' }}>{modalSeance.duree_minutes ? `${modalSeance.duree_minutes} min` : '—'}</strong></div>
                  <div>Prix : <strong style={{ color: 'var(--color-text-primary)' }}>{modalSeance.prix_euros ? `${parseFloat(modalSeance.prix_euros).toFixed(2)} €` : '—'}</strong></div>
                  <div>Statut : <strong style={{ color: 'var(--color-text-primary)' }}>{modalSeance.statut || '—'}</strong></div>
                  {(modalSeance.ressenti_avant != null || modalSeance.ressenti_apres != null) && (
                    <div>Ressenti : <strong style={{ color: 'var(--color-text-primary)' }}>{modalSeance.ressenti_avant ?? '—'}/10 → {modalSeance.ressenti_apres ?? '—'}/10</strong></div>
                  )}
                  {modalSeance.notes && <div style={{ marginTop: 8, background: 'var(--color-background-secondary)', padding: '8px 10px', borderRadius: 6 }}>{modalSeance.notes}</div>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button type="button" onClick={() => setModalSeance(null)}
                    style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Fermer</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', margin: '28px 0 10px' }}>
            Séances de formation
          </div>
          {loadingFormation ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Chargement…</div>
          ) : formationHistorique.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Aucune séance de formation enregistrée.</div>
          ) : (
            <div>
              {formationHistorique.map((p, idx) => (
                <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: idx < formationHistorique.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#534AB7', flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{fmtDate(p.formation_seances?.date_seance)}</span>
                      {p.formation_seances?.heure_seance && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 6 }}>à {p.formation_seances.heure_seance}</span>}
                      <span style={{ fontSize: 10, fontWeight: 600, background: '#EEEDFE', color: '#534AB7', padding: '1px 7px', borderRadius: 20, marginLeft: 'auto' }}>Formation · #{p.formation_seances?.numero_seance}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{p.formation_seances?.theme || 'Thème non renseigné'}</div>
                    {p.evaluation_individuelle && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.5, background: 'var(--color-background-secondary)', padding: '6px 10px', borderRadius: 6 }}>{p.evaluation_individuelle}</div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                      <button type="button" onClick={() => navigate(`/formation/${p.formation_seances?.id}`)}
                        style={{ background: 'none', border: '0.5px solid var(--color-border-secondary)', borderRadius: 6, cursor: 'pointer', color: 'var(--color-accent)', fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="ti ti-eye" style={{ fontSize: 11 }} />Voir la fiche
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : activeTab === 'formation' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {formationHistorique.length} séance(s) de formation
            </span>
          </div>
          {loadingFormation ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Chargement…</div>
          ) : formationHistorique.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)', fontSize: 13 }}>
              <i className="ti ti-school" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
              Aucune séance de formation enregistrée
            </div>
          ) : (
            <div>
              {formationHistorique.map((p, idx) => (
                <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: idx < formationHistorique.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#534AB7', flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{fmtDate(p.formation_seances?.date_seance)}</span>
                      {p.formation_seances?.heure_seance && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 6 }}>à {p.formation_seances.heure_seance}</span>}
                      <span style={{ fontSize: 10, fontWeight: 600, background: '#EEEDFE', color: '#534AB7', padding: '1px 7px', borderRadius: 20, marginLeft: 'auto' }}>Séance #{p.formation_seances?.numero_seance}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{p.formation_seances?.theme || 'Thème non renseigné'}</div>
                    {p.evaluation_individuelle && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.5, background: 'var(--color-background-secondary)', padding: '6px 10px', borderRadius: 6 }}>{p.evaluation_individuelle}</div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                      <button type="button" onClick={() => navigate(`/formation/${p.formation_seances?.id}`)}
                        style={{ background: 'none', border: '0.5px solid var(--color-border-secondary)', borderRadius: 6, cursor: 'pointer', color: 'var(--color-accent)', fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="ti ti-eye" style={{ fontSize: 11 }} />Voir la fiche
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : activeTab === 'bach' ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          <i className="ti ti-leaf" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
          Le suivi Fleurs de Bach est une fiche évolutive unique par client, pas une liste de séances datées.
          <div style={{ marginTop: 14 }}>
            <button type="button" onClick={() => navigate(`/fleurs-de-bach/${clientId}`)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Ouvrir la fiche Bach
            </button>
          </div>
        </div>
      ) : METIER_CONFIG[activeTab] ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 14 }}>
            {metierHistorique.length} séance(s)
          </div>
          {loadingMetierHistorique ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Chargement…</div>
          ) : metierHistorique.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)', fontSize: 13 }}>
              <i className="ti ti-calendar-off" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
              Aucune séance enregistrée
            </div>
          ) : (
            <div>
              {metierHistorique.map((s, idx) => (
                <div key={s.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: idx < metierHistorique.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 13, color: 'var(--color-text-primary)' }}>
                    {fmtDate(s.date_seance)}{s.heure_seance ? ` à ${s.heure_seance}` : ''}
                  </div>
                  <button type="button" onClick={() => navigate(METIER_CONFIG[activeTab].route(s.id))}
                    style={{ background: 'none', border: '0.5px solid var(--color-border-secondary)', borderRadius: 6, cursor: 'pointer', color: 'var(--color-accent)', fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="ti ti-eye" style={{ fontSize: 11 }} />Voir
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : activeTab !== 'resume' ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          Bientôt disponible.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Résumé</div>
          {loadingSeances ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Chargement…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              <div style={card}><div style={cardLabel}>Nombre de séances</div><div style={cardValue}>{seances.length}</div></div>
              <div style={card}><div style={cardLabel}>Dernière séance</div><div style={cardValue}>{fmtDate(derniereSeance)}</div></div>
              <div style={card}><div style={cardLabel}>Prochaine séance</div><div style={cardValue}>{fmtDate(prochaineSeance)}</div></div>
              <div style={card}><div style={cardLabel}>Temps total d'accompagnement</div><div style={cardValue}>{seances.length ? `${Math.floor(tempsTotal / 60)}h${String(tempsTotal % 60).padStart(2, '0')}` : '—'}</div></div>
              <div style={card}><div style={cardLabel}>Questionnaires réalisés</div><div style={cardValue}>—</div></div>
              <div style={card}><div style={cardLabel}>Objectifs actifs</div><div style={cardValue}>—</div></div>
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Modules métiers</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, marginBottom: 24 }}>
            {ongletsMetiers.map(([id, label]) => (
              <div key={id} onClick={() => navigate(`/praticien/clients/${clientId}/${id}`)}
                style={{ ...card, textAlign: 'center', cursor: 'pointer', padding: '16px 10px' }}>
                <i className={`ti ${METIER_ICONS[id] || 'ti-stethoscope'}`} style={{ fontSize: 22, color: 'var(--color-accent)', display: 'block', marginBottom: 8 }} />
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>À retenir</div>
          <div style={{ ...card, marginBottom: 24, fontSize: 13, lineHeight: 1.9 }}>
            <div>Dernière séance : <strong>{fmtDate(derniereSeance)}</strong></div>
            <div>Prochaine séance : <strong>{fmtDate(prochaineSeance)}</strong></div>
            <div>Dernier questionnaire : <strong>—</strong></div>
            <div>Dernier ressenti déclaré : <strong>—</strong></div>
            <div>Suivi en cours : <strong>—</strong></div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Historique récent</div>
          {historique.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Aucune activité enregistrée.</div>
          ) : (
            <div style={{ marginBottom: 24 }}>
              {historique.map((s, idx) => (
                <div key={s.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: idx < historique.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', fontSize: 13 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{fmtDate(s.date_seance)}</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Séance{s.type_seance ? ` · ${s.type_seance}` : ''}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Statistiques</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            <div style={card}><div style={cardLabel}>Nombre de séances</div><div style={cardValue}>{seances.length}</div></div>
            <div style={card}><div style={cardLabel}>Temps total</div><div style={cardValue}>{seances.length ? `${Math.floor(tempsTotal / 60)}h${String(tempsTotal % 60).padStart(2, '0')}` : '—'}</div></div>
            <div style={card}><div style={cardLabel}>Durée moyenne</div><div style={cardValue}>{dureeMoyenne ? `${dureeMoyenne} min` : '—'}</div></div>
            <div style={card}><div style={cardLabel}>Fréquence</div><div style={cardValue}>{frequence}</div></div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 12 }}>
            Séances de la table générique uniquement (type Sophrologie, Coaching, Naturopathie, etc.). Les modules Oracle, Énergie, Bach et les 12 métiers spécialisés ont leur propre historique.
          </div>
        </>
      )}
    </div>
  )
}
