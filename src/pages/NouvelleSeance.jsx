import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SlotPicker from '../components/SlotPicker'
import BodySchema3D, { COLOR_LABELS } from '../components/BodySchema3D'

const PRESET_TAGS = ['Stress', 'Lombaires', 'Sommeil', 'Douleur', 'Fatigue', 'Anxiété']

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/* ─── Main ───────────────────────────────────────────────── */

export default function NouvelleSeance() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  /* Client */
  const [creneauLibre,      setCreneauLibre]      = useState(false)    // créneau sans client
  const [clientSearch,      setClientSearch]      = useState('')       // champ de recherche combiné
  const [prenom,            setPrenom]            = useState('')       // payload only
  const [nom,               setNom]               = useState('')       // payload only
  const [genre,             setGenre]             = useState('')
  const [tel,               setTel]               = useState('')
  const [email,             setEmail]             = useState('')
  const [dateNaissance,     setDateNaissance]     = useState('')
  const [selectedClientId,  setSelectedClientId]  = useState(null)
  const [clientSuggestions, setClientSuggestions] = useState([])
  const [showSuggestions,   setShowSuggestions]   = useState(false)
  const clientInputRef  = useRef(null)
  const [dropdownRect,  setDropdownRect]  = useState(null)

  /* Fleurs de Bach */
  const [etatsCoches, setEtatsCoches] = useState([])
  const [fleurs,      setFleurs]      = useState([])

  /* Séance */
  const today = new Date().toISOString().slice(0, 10)
  const [date,         setDate]         = useState(searchParams.get('date') ?? today)
  const [heure,        setHeure]        = useState(searchParams.get('heure') ?? '09:00')
  const [duree,        setDuree]        = useState('60')
  const [seancesJour,  setSeancesJour]  = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [prix,  setPrix]  = useState('')
  const [type,  setType]  = useState(searchParams.get('type') || 'Sophrologie')
  const isFrom3D = searchParams.get('type') === '3D Humain'

  /* Pré-remplissage client depuis l'URL (arrivée via écran "Choisir un client") */
  useEffect(() => {
    const cid = searchParams.get('client_id')
    if (!cid) return
    ;(async () => {
      const { data: c } = await supabase
        .from('clients')
        .select('id, prenom, nom, tel, email, date_naissance, genre')
        .eq('id', cid)
        .single()
      if (!c) return
      setSelectedClientId(c.id)
      setPrenom(c.prenom || '')
      setNom(c.nom || '')
      setClientSearch(`${c.prenom || ''} ${c.nom || ''}`.trim())
      setTel(c.tel || '')
      setEmail(c.email || '')
      setDateNaissance(c.date_naissance || '')
      setGenre(c.genre || '')
    })()
  }, [])

  /* Créneaux disponibles — rechargés à chaque changement de date */
  useEffect(() => {
    if (!date) return
    let cancelled = false
    setLoadingSlots(true)
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled || !user) { setLoadingSlots(false); return }
      const { data } = await supabase
        .from('seances')
        .select('id, heure_seance, duree_minutes')
        .eq('user_id', user.id)
        .eq('date_seance', date)
      if (!cancelled) { setSeancesJour(data || []); setLoadingSlots(false) }
    })()
    return () => { cancelled = true }
  }, [date])

  /* Position fixe du dropdown (échappe overflow:auto du scroll container) */
  useLayoutEffect(() => {
    if (showSuggestions && clientInputRef.current) {
      setDropdownRect(clientInputRef.current.getBoundingClientRect())
    } else {
      setDropdownRect(null)
    }
  }, [showSuggestions, clientSuggestions.length])

  /* Autocomplete client — deux ilike parallèles (évite .or() + encodage %) */
  useEffect(() => {
    if (selectedClientId) return
    const term = clientSearch.trim()
    if (term.length < 2) { setClientSuggestions([]); setShowSuggestions(false); return }
    const t = setTimeout(async () => {
      // Colonnes de base garanties dans le schéma initial
      const BASE_SELECT = 'id, prenom, nom, tel, email, ville'
      // Colonnes ajoutées par migration 20260620130000 — incluses si disponibles
      const FULL_SELECT = `${BASE_SELECT}, date_naissance, genre`

      const [resPrenom, resNom] = await Promise.all([
        supabase.from('clients').select(FULL_SELECT).ilike('prenom', `%${term}%`).limit(5),
        supabase.from('clients').select(FULL_SELECT).ilike('nom',    `%${term}%`).limit(5),
      ])

      // Debug — à retirer une fois le bug confirmé corrigé
      console.log('résultats recherche client:', {
        term,
        byPrenom: resPrenom.data,
        byNom:    resNom.data,
        errPrenom: resPrenom.error,
        errNom:    resNom.error,
      })

      // Si colonnes manquantes → fallback sans date_naissance / genre
      const byPrenom = resPrenom.data ?? (resPrenom.error
        ? (await supabase.from('clients').select(BASE_SELECT).ilike('prenom', `%${term}%`).limit(5)).data
        : [])
      const byNom = resNom.data ?? (resNom.error
        ? (await supabase.from('clients').select(BASE_SELECT).ilike('nom', `%${term}%`).limit(5)).data
        : [])

      const seen = new Set()
      const merged = [...(byPrenom || []), ...(byNom || [])].filter(c => {
        if (seen.has(c.id)) return false
        seen.add(c.id); return true
      }).slice(0, 8)
      setClientSuggestions(merged)
      setShowSuggestions(merged.length > 0)
    }, 250)
    return () => clearTimeout(t)
  }, [clientSearch, selectedClientId])

  /* Historique client — priorité client_id, fallback prenom+nom */
  const [history, setHistory] = useState([])
  useEffect(() => {
    const t = setTimeout(async () => {
      if (selectedClientId) {
        const { data } = await supabase
          .from('seances')
          .select('*')
          .eq('client_id', selectedClientId)
          .order('date_seance', { ascending: false })
          .limit(10)
        setHistory(data || [])
      } else if (prenom.trim() || nom.trim()) {
        let q = supabase.from('seances').select('*').order('date_seance', { ascending: false }).limit(10)
        if (prenom.trim()) q = q.ilike('prenom', `%${prenom.trim()}%`)
        if (nom.trim())    q = q.ilike('nom',    `%${nom.trim()}%`)
        const { data } = await q
        setHistory(data || [])
      } else {
        setHistory([])
      }
    }, 400)
    return () => clearTimeout(t)
  }, [selectedClientId, prenom, nom])

  /* 3D */
  const [annots, setAnnots] = useState([])

  /* Notes */
  const [noteText, setNoteText] = useState('')
  const [notes,    setNotes]    = useState([])

  /* Tags */
  const [tags,      setTags]      = useState([])
  const [customTag, setCustomTag] = useState('')

  /* Save */
  const [saving,     setSaving]     = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // null | 'ok' | 'err'
  const [saveError,  setSaveError]  = useState(null)

  /* ─ Handlers ─ */

  function addAnnot(a) {
    const colorLabel = COLOR_LABELS[a.color] ?? a.label
    const detail      = (a.detail || '').trim()
    setAnnots(prev => [...prev, a])
    setNotes(prev => [{
      id:      a.id,
      color:   a.color,
      label:   colorLabel,
      zone:    a.zone,
      detail,
      text:    `${colorLabel} · ${a.zone}${detail ? ' · ' + detail : ''}`,
      date:    new Date().toLocaleDateString('fr-FR'),
      comment: '',
      auto:    true,
    }, ...prev])
  }

  function removeAnnot(id) {
    setAnnots(prev => prev.filter(a => a.id !== id))
    setNotes(prev => prev.filter(n => !(n.auto && n.id === id)))
  }

  function clearAllAnnots() {
    setAnnots([])
    setNotes(prev => prev.filter(n => !n.auto))
  }

  function removeNote(n) {
    setNotes(prev => prev.filter(note => note.id !== n.id))
    if (n.auto) setAnnots(prev => prev.filter(a => a.id !== n.id))
  }

  function updateNoteComment(id, comment) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, comment } : n))
  }

  function addNote() {
    if (!noteText.trim()) return
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    setNotes(prev => [{ id: Date.now(), text: noteText.trim(), time }, ...prev])
    setNoteText('')
  }

  function toggleTag(tag) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  function addCustomTag() {
    const t = customTag.trim()
    if (!t || tags.includes(t)) return
    setTags(prev => [...prev, t])
    setCustomTag('')
  }

  function reprogrammer(s) {
    setType(s.type_seance || 'Sophrologie')
    setDuree(String(s.duree_minutes || 60))
    setPrix(s.prix_euros != null ? String(s.prix_euros) : '')
    setDate('')
    setHeure('')
  }

  const GENRE_REVERSE = { Homme: 'H', Femme: 'F', Autre: 'A' }
  const GENRE_MAP     = { H: 'Homme', F: 'Femme', A: 'Autre' }

  function selectClient(c) {
    const fullName = `${c.prenom || ''} ${c.nom || ''}`.trim()
    setClientSearch(fullName)
    setPrenom(c.prenom || '')
    setNom(c.nom || '')
    setTel(c.tel || '')
    setEmail(c.email || '')
    setDateNaissance(c.date_naissance || '')
    setGenre(GENRE_REVERSE[c.genre] || '')
    setSelectedClientId(c.id)
    setShowSuggestions(false)
    setClientSuggestions([])
  }

  function clearClientSelection() {
    setClientSearch('')
    setPrenom('')
    setNom('')
    setTel('')
    setEmail('')
    setDateNaissance('')
    setGenre('')
    setSelectedClientId(null)
  }

  /* Trouve ou crée le client, retourne son id (non-bloquant en cas d'erreur) */
  async function resolveClientId(userId) {
    try {
      if (selectedClientId) {
        await supabase.from('clients').update({ derniere_seance: date }).eq('id', selectedClientId)
        return selectedClientId
      }
      if (!prenom.trim() && !nom.trim()) return null
      let query = supabase.from('clients').select('id').eq('user_id', userId).limit(1)
      if (email?.trim()) {
        query = query.ilike('email', email.trim())
      } else {
        query = query.ilike('prenom', prenom.trim()).ilike('nom', nom.trim())
      }
      const { data: existing } = await query
      if (existing && existing.length > 0) {
        await supabase.from('clients').update({ derniere_seance: date }).eq('id', existing[0].id)
        return existing[0].id
      }
      const { data: created } = await supabase.from('clients').insert({
        user_id:        userId,
        prenom:         prenom.trim(),
        nom:            nom.trim(),
        email:          email || null,
        tel:            tel || null,
        date_naissance: dateNaissance || null,
        genre:          GENRE_MAP[genre] || null,
      }).select('id').single()
      return created?.id || null
    } catch {
      return null
    }
  }

  async function captureSchema() {
    try {
      const canvas = document.getElementById('canvas-3d-corps')
      if (!canvas) return null
      return canvas.toDataURL('image/png')
    } catch(e) { console.warn('Capture schema:', e); return null }
  }

  async function handleSave() {
    const schemaImg = await captureSchema()
    setSaving(true)
    setSaveStatus(null)
    setSaveError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      // Si champ combiné renseigné sans client lié, split "Prénom Nom"
      let savePrenom = prenom
      let saveNom    = nom
      if (!selectedClientId && !prenom && !nom && clientSearch.trim()) {
        const parts = clientSearch.trim().split(/\s+/)
        savePrenom  = parts[0] || ''
        saveNom     = parts.slice(1).join(' ') || ''
      }

      const clientId       = await resolveClientId(user.id)
      const premiereSeance = history.length === 0
      const zonesCorps     = [...new Set(notes.filter(n => n.auto && n.zone).map(n => n.zone))]

      const payload = {
        user_id:            user.id,
        client_id:          clientId || null,
        prenom:             savePrenom,
        nom:                saveNom,
        genre:              GENRE_MAP[genre] || null,
        tel:                tel || null,
        email:              email || null,
        date_naissance:     dateNaissance || null,
        date_seance:        date,
        heure_seance:       heure,
        duree_minutes:      parseInt(duree, 10),
        prix_euros:         parseFloat(prix) || null,
        type_seance:        type,
        schema_annotations: annots.length ? annots : null,
        zones_corps:        zonesCorps.length ? zonesCorps : null,
        notes:              notes.map(n => n.text).join('\n') || null,
        tags:               tags.length ? tags : null,
        // etats_coches: colonne existante mais non utilisée ici
        fleurs_bach:        fleurs.length ? fleurs : null,
        date_creation:      new Date().toISOString(),
        statut:             creneauLibre ? 'disponible' : 'planifié',
        premiere_seance:    premiereSeance,
      }

      const { data: conflicts } = await supabase
        .from('seances')
        .select('id')
        .eq('user_id', payload.user_id)
        .eq('date_seance', payload.date_seance)
        .eq('heure_seance', payload.heure_seance)
      if (conflicts && conflicts.length > 0) {
        const confirmer = window.confirm('Un rendez-vous existe deja a ce creneau. Continuer quand meme ?')
        if (!confirmer) { setSaving(false); return }
      }
      const { error } = await supabase.from('seances').insert(payload)

      if (error) {
        console.error('Erreur Supabase:', error.message, '| code:', error.code, '| details:', error.details, '| hint:', error.hint)
        setSaveError(error.message)
        setSaveStatus('err')
        setSaving(false)
      } else {
        setSaveStatus('ok')
        console.log('EMAIL PAYLOAD:', payload.email); if (payload.email) {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            const { data: profile } = await supabase.from('profiles').select('prenom, tel, email_contact, adresse_rdv, ville_rdv, code_postal').eq('id', user.id).single()
            await fetch('https://jzwwqngbgcdeyiqrvtle.supabase.co/functions/v1/send-seance-confirmation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
              body: JSON.stringify({
                email: payload.email, prenom: payload.prenom, nom: payload.nom,
                date_seance: payload.date_seance, heure_seance: payload.heure_seance,
                duree_minutes: payload.duree_minutes, type_seance: payload.type_seance,
                praticien: profile?.prenom || 'Votre praticien',
                praticien_tel: profile?.tel || '',
                praticien_email: profile?.email_contact || profile?.email || '',
                praticien_adresse: [profile?.adresse_rdv, profile?.ville_rdv, profile?.code_postal].filter(Boolean).join(', ') || '',
              })
            })
          } catch(e) { console.warn('Email confirmation:', e) }
        }
        setTimeout(() => navigate(isFrom3D ? '/napo-3d' : '/seances'), 1400)
      }
    } catch (err) {
      console.error('Erreur:', err)
      setSaveError(err.message)
      setSaveStatus('err')
      setSaving(false)
    }
  }

  /* ─ Style helpers (navy column) ─ */
  const lbl = { fontSize: 10, color: '#6b7280', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '.06em' }
  const inp = { width: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 3, color: '#111827', fontSize: 12, padding: '6px 8px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const sel = { ...inp, cursor: 'pointer' }
  const gap = { marginBottom: 10 }

  const saveBg     = saveStatus === 'ok' ? '#27ae60' : saveStatus === 'err' ? '#c0392b' : '#c9a84c'
  const saveTxt    = saveStatus === 'ok' ? '✓ Sauvegardé' : saveStatus === 'err' ? '✗ Erreur' : saving ? 'Sauvegarde…' : 'Sauvegarder'

  /* ─ Render ─ */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'inherit', overflow: 'hidden' }}>

      {/* ── Topbar ── */}
      <div style={{ height: 44, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, flexShrink: 0, borderBottom: '1px solid #e5e7eb' }}>
        <button
          onClick={() => navigate(isFrom3D ? '/napo-3d' : '/seances')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 3, border: '1px solid #e5e7eb', background: 'transparent', color: '#374151', fontSize: 12, cursor: 'pointer' }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 13 }} />
          {isFrom3D ? 'Retour' : 'Séances'}
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#111827', letterSpacing: '.02em' }}>
          Nouvelle séance
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '6px 18px', borderRadius: 3, border: 'none', background: saveBg, color: '#1a2744', fontSize: 12, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? .7 : 1, transition: 'background .2s' }}
        >
          {saveStatus === 'ok' ? '✓ Finalisé' : saveStatus === 'err' ? '✗ Erreur' : saving ? 'Sauvegarde…' : 'Finaliser'}
        </button>
      </div>

      {/* ── 3 colonnes ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── GAUCHE : 2 colonnes (60% form / 40% historique) ── */}
        <div style={{ width: 480, flexShrink: 0, background: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #e5e7eb' }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: (prenom.trim() || nom.trim()) ? '60% 40%' : '100% 0%', overflow: 'hidden' }}>

            {/* ── Formulaire 60% ── */}
            <div style={{ overflowY: 'auto', padding: '14px 14px 0', borderRight: '1px solid #e5e7eb' }}>

              {/* ── Toggle créneau libre ── */}
              <div onClick={() => setCreneauLibre(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 12, cursor: 'pointer', background: creneauLibre ? '#E1F5EE' : '#f3f4f6', border: `1px solid ${creneauLibre ? '#0F6E56' : '#e5e7eb'}` }}>
                <div style={{ width: 36, height: 20, borderRadius: 10, background: creneauLibre ? '#0F6E56' : '#d1d5db', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
                  <div style={{ position: 'absolute', top: 2, left: creneauLibre ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: creneauLibre ? '#0F6E56' : '#374151' }}>
                    {creneauLibre ? '🟢 Créneau libre (agenda public)' : 'Séance avec client'}
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7280' }}>
                    {creneauLibre ? 'Visible sur votre page publique naposolo.com/rdv/' : 'Séance normale avec un client existant'}
                  </div>
                </div>
              </div>

              {/* ── Section 1 : Informations du client ── */}
              {!creneauLibre && <div style={{ fontSize: 10, fontWeight: 700, color: '#1a2744', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>Informations du client</div>}

              {/* ── Champ de recherche client combiné ── */}
              <div style={{ ...gap, position: 'relative' }}>
                <label style={lbl}>
                  Client
                  {selectedClientId && (
                    <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: 8 }}>
                      ✓ Client lié
                    </span>
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={clientInputRef}
                    style={{ ...inp, paddingRight: selectedClientId ? 28 : inp.padding }}
                    value={clientSearch}
                    onChange={e => {
                      setClientSearch(e.target.value)
                      setSelectedClientId(null)
                      setPrenom('')
                      setNom('')
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onFocus={() => clientSuggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Prénom Nom (ex: Marie Dupont)"
                    autoComplete="off"
                  />
                  {selectedClientId && (
                    <button
                      onMouseDown={clearClientSelection}
                      style={{
                        position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer',
                        fontSize: 14, lineHeight: 1, padding: 0,
                      }}
                      title="Délier le client"
                    >×</button>
                  )}
                </div>
                {/* Dropdown rendu via Portal pour échapper au overflow:auto parent */}
                {showSuggestions && clientSuggestions.length > 0 && dropdownRect && createPortal(
                  <div style={{
                    position: 'fixed',
                    top:   dropdownRect.bottom + 2,
                    left:  dropdownRect.left,
                    width: dropdownRect.width,
                    zIndex: 9999,
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 4,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                    overflow: 'hidden',
                  }}>
                    {clientSuggestions.map(c => (
                      <div
                        key={c.id}
                        onMouseDown={() => selectClient(c)}
                        style={{ padding: '7px 10px', cursor: 'pointer', fontSize: 12, color: '#111827', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 6 }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#e8f4fd', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="ti ti-user" style={{ fontSize: 13, color: '#1a2744' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div>
                            <span style={{ fontWeight: 600 }}>{c.prenom}</span>{' '}
                            <span>{c.nom}</span>
                            {c.ville && <span style={{ marginLeft: 6, fontSize: 10, color: '#6b7280' }}>{c.ville}</span>}
                          </div>
                          {c.email && <div style={{ fontSize: 10, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>}
                        </div>
                      </div>
                    ))}
                  </div>,
                  document.body
                )}
                {/* Prénom / Nom séparés pour nouveau client */}
                {!selectedClientId && clientSearch.trim().length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ ...lbl, color: '#9ca3af' }}>Prénom</label>
                      <input style={inp} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prénom" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ ...lbl, color: '#9ca3af' }}>Nom</label>
                      <input style={inp} value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom" />
                    </div>
                  </div>
                )}
              </div>

              <div style={gap}>
                <label style={lbl}>Date de naissance</label>
                <input style={inp} type="date" value={dateNaissance} onChange={e => setDateNaissance(e.target.value)} />
              </div>

              <div style={gap}>
                <label style={lbl}>Téléphone</label>
                <input style={inp} type="tel" value={tel} onChange={e => setTel(e.target.value)} placeholder="06 00 00 00 00" />
              </div>

              <div style={gap}>
                <label style={lbl}>Email</label>
                <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com" />
              </div>

              <div style={{ ...gap, marginBottom: 4 }}>
                <label style={lbl}>Genre</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[['H','Homme'],['F','Femme'],['A','Autre']].map(([g, l]) => (
                    <button key={g} onClick={() => setGenre(g === genre ? '' : g)} style={{
                      flex: 1, padding: '5px 0', borderRadius: 3, cursor: 'pointer',
                      border: `1px solid ${genre === g ? '#22c55e' : '#e5e7eb'}`,
                      background: genre === g ? '#22c55e' : '#fff',
                      color: genre === g ? '#fff' : '#6b7280',
                      fontSize: 10, fontWeight: genre === g ? 700 : 400,
                    }}>{l}</button>
                  ))}
                </div>
              </div>

              {/* ── Section 2 : Informations de la séance ── */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 14, marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#1a2744', letterSpacing: '.1em', textTransform: 'uppercase' }}>Informations de la séance</div>
              </div>

              <div style={gap}>
                <label style={lbl}>Date</label>
                <input style={inp} type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div style={gap}>
                <label style={lbl}>
                  Heure
                  {loadingSlots && <span style={{ marginLeft: 5, color: '#9ca3af', fontWeight: 400 }}>…</span>}
                </label>
                <SlotPicker
                  value={heure}
                  onChange={setHeure}
                  duree={duree}
                  seancesJour={seancesJour}
                  loading={loadingSlots}
                />
              </div>

              <div style={gap}>
                <label style={lbl}>Durée</label>
                <select style={sel} value={duree} onChange={e => setDuree(e.target.value)}>
                  {[['30','30 min'],['45','45 min'],['60','1 h'],['90','1 h 30'],['120','2 h']].map(([v,l]) => (
                    <option key={v} value={v} style={{ background: '#fff' }}>{l}</option>
                  ))}
                </select>
              </div>

              <div style={gap}>
                <label style={lbl}>Prix (€)</label>
                <input style={inp} type="number" value={prix} onChange={e => setPrix(e.target.value)} placeholder="60" min={0} step={5} />
              </div>

              <div style={{ ...gap, marginBottom: 16 }}>
                <label style={lbl}>Type de séance</label>
                <select style={sel} value={type} onChange={e => setType(e.target.value)}>
                  {['Sophrologie','Naturopathie','Coaching','Énergie','Fleurs de Bach','Massage','Autre'].map(t => (
                    <option key={t} value={t} style={{ background: '#fff' }}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Historique client 40% ── */}
            <div style={{ overflowY: 'auto', padding: '14px 10px', background: '#f8f9fb' }}>

              {/* En-tête */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#1a2744', letterSpacing: '.1em', textTransform: 'uppercase' }}>Historique client</div>
                {(prenom.trim() || nom.trim()) && (
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    background: history.length > 0 ? '#1a2744' : '#e5e7eb',
                    color: history.length > 0 ? '#c9a84c' : '#9ca3af',
                    padding: '1px 7px', borderRadius: 10,
                    minWidth: 18, textAlign: 'center',
                  }}>{history.length}</span>
                )}
              </div>

              {/* Badge statut client */}
              {(prenom.trim() || nom.trim()) && (
                <div style={{ marginBottom: 10 }}>
                  {history.length === 0 ? (
                    <span style={{ fontSize: 9, fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 10, border: '1px solid #fcd34d' }}>
                      1ère séance
                    </span>
                  ) : (
                    <span style={{ fontSize: 9, fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 10, border: '1px solid #7dd3fc' }}>
                      Suivi · {history.length} séance{history.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}

              {/* Contenu */}
              {!prenom.trim() && !nom.trim() ? (
                <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>
                  Renseignez le prénom et le nom du client pour afficher son historique.
                </p>
              ) : history.length === 0 ? (
                <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>
                  Aucun historique pour ce client.
                </p>
              ) : (
                <div style={{ position: 'relative' }}>
                  {history.map((s, idx) => {
                    const MOIS_H = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']
                    const datePart = (s.date_seance || '').split('T')[0]
                    const [hy, hm, hj] = datePart.split('-')
                    const dateLabel = s.date_seance ? `${+hj} ${MOIS_H[+hm-1]} ${hy}` : '—'
                    const isToday = datePart === date
                    return (
                      <div
                        key={s.id}
                        style={{ position: 'relative', paddingLeft: 18, marginBottom: 12 }}
                      >
                        {/* Ligne verticale */}
                        {idx < history.length - 1 && (
                          <div style={{ position: 'absolute', left: 5, top: 14, bottom: -12, width: 1, background: '#e5e7eb' }} />
                        )}
                        {/* Point timeline */}
                        <div style={{
                          position: 'absolute', left: 0, top: 5,
                          width: 10, height: 10, borderRadius: '50%',
                          background: isToday ? '#22c55e' : '#c9a84c',
                          border: '2px solid #f8f9fb',
                          boxShadow: '0 0 0 1px #e5e7eb',
                        }} />
                        {/* Carte séance */}
                        <div
                          style={{ background: '#fff', borderRadius: 5, padding: '7px 9px', border: `1px solid ${isToday ? '#86efac' : '#e5e7eb'}` }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a84c' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = isToday ? '#86efac' : '#e5e7eb' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#1a2744' }}>{dateLabel}</div>
                            {s.premiere_seance && (
                              <span style={{ fontSize: 8, fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 8 }}>1ère</span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                            {s.type_seance} · {s.duree_minutes} min{s.prix_euros != null ? ` · ${s.prix_euros} €` : ''}
                          </div>
                          {(s.tags || []).length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 3 }}>
                              {s.tags.map(t => (
                                <span key={t} style={{ fontSize: 9, background: '#f3f4f6', color: '#374151', padding: '1px 5px', borderRadius: 8 }}>{t}</span>
                              ))}
                            </div>
                          )}
                          {s.notes && (
                            <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 4, lineHeight: 1.4, borderTop: '1px solid #f3f4f6', paddingTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {s.notes}
                            </div>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); reprogrammer(s) }}
                            style={{ marginTop: 6, width: '100%', padding: '3px 0', fontSize: 9, fontWeight: 600, color: '#1a2744', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 3, cursor: 'pointer' }}
                          >
                            ↻ Reprogrammer
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Bouton Sauvegarder */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid #e5e7eb', flexShrink: 0 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ width: '100%', padding: '9px 0', borderRadius: 3, border: 'none', background: saveBg, color: '#1a2744', fontSize: 12, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? .7 : 1, transition: 'background .2s' }}
            >
              {saveTxt}
            </button>
          </div>
        </div>

        {/* ── CENTRE blanc ── */}
        <BodySchema3D annots={annots} onAdd={addAnnot} onRemove={removeAnnot} onClearAll={clearAllAnnots} />

        {/* ── DROITE gris clair ── */}
        <div style={{ width: 220, flexShrink: 0, background: '#f5f5f5', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid #e8e8e8' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 16px' }}>

            {/* Notes */}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1a2744', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>Notes</div>

            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') addNote() }}
              placeholder="Observations de la séance…"
              style={{
                width: '100%', height: 88, resize: 'none', boxSizing: 'border-box',
                border: '1px solid #e0e0e0', borderRadius: 3,
                padding: '7px 9px', fontSize: 12, color: '#111827',
                fontFamily: 'inherit', background: '#fff', outline: 'none', lineHeight: 1.5,
              }}
            />
            <button
              onClick={addNote}
              disabled={!noteText.trim()}
              style={{
                width: '100%', marginTop: 6, padding: '6px 0', borderRadius: 3, cursor: noteText.trim() ? 'pointer' : 'default',
                border: '1px solid rgba(0,0,0,0)',
                background: noteText.trim() ? '#1a2744' : '#ebebeb',
                color: noteText.trim() ? '#c9a84c' : '#bbb',
                fontSize: 11, fontWeight: 600, transition: 'background .1s',
              }}
            >
              + Ajouter note
            </button>

            <div style={{ marginTop: 10 }}>
              {notes.map(n => n.auto ? (
                <div key={n.id} style={{
                  background: hexToRgba(n.color, 0.08),
                  borderLeft: `3px solid ${n.color}`,
                  borderRadius: 4,
                  padding: '8px 10px',
                  marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#1a2744', flex: 1 }}>{n.text}</span>
                    <button onClick={() => removeNote(n)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 5 }}>{n.date}</div>
                  <input
                    value={n.comment}
                    onChange={e => updateNoteComment(n.id, e.target.value)}
                    placeholder="Commentaire…"
                    style={{ width: '100%', boxSizing: 'border-box', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 3, padding: '4px 6px', fontSize: 11, background: 'rgba(255,255,255,0.7)', outline: 'none', fontFamily: 'inherit', color: '#374151' }}
                  />
                </div>
              ) : (
                <div key={n.id} style={{ borderLeft: '3px solid #c9a84c', paddingLeft: 8, marginBottom: 9 }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{n.time}</div>
                  <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.5 }}>{n.text}</div>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 14, marginTop: notes.length ? 6 : 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#1a2744', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>Observations clés</div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                {PRESET_TAGS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)} style={{
                    padding: '3px 9px', borderRadius: 3, fontSize: 11, cursor: 'pointer',
                    border: `1px solid ${tags.includes(tag) ? '#c9a84c' : '#d0d0d0'}`,
                    background: tags.includes(tag) ? '#c9a84c' : '#fff',
                    color: tags.includes(tag) ? '#1a2744' : '#6b7280',
                    fontWeight: tags.includes(tag) ? 700 : 400,
                    transition: 'background .1s',
                  }}>{tag}</button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 5 }}>
                <input
                  value={customTag}
                  onChange={e => setCustomTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                  placeholder="Tag libre…"
                  style={{ flex: 1, padding: '5px 8px', borderRadius: 3, border: '1px solid #d0d0d0', background: '#fff', fontSize: 11, outline: 'none', color: '#111827', fontFamily: 'inherit' }}
                />
                <button onClick={addCustomTag} style={{ padding: '5px 9px', borderRadius: 3, border: 'none', background: '#1a2744', color: '#c9a84c', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+</button>
              </div>

              {tags.filter(t => !PRESET_TAGS.includes(t)).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                  {tags.filter(t => !PRESET_TAGS.includes(t)).map(tag => (
                    <span key={tag} style={{ padding: '3px 8px', borderRadius: 3, fontSize: 11, background: '#1a2744', color: '#c9a84c', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {tag}
                      <button onClick={() => toggleTag(tag)} style={{ background: 'none', border: 'none', color: '#c9a84c', cursor: 'pointer', padding: 0, fontSize: 13, lineHeight: 1, marginLeft: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
