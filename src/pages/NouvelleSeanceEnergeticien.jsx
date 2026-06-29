import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const CHAKRAS_META = [
  { id: 1, nom: 'Muladhara',    sous_nom: 'Racine',        couleur: '#C0392B' },
  { id: 2, nom: 'Svadhisthana', sous_nom: 'Sacré',         couleur: '#E67E22' },
  { id: 3, nom: 'Manipura',     sous_nom: 'Plexus',        couleur: '#F39C12' },
  { id: 4, nom: 'Anahata',      sous_nom: 'Cœur',          couleur: '#27AE60' },
  { id: 5, nom: 'Vishuddha',    sous_nom: 'Gorge',         couleur: '#1A8FAA' },
  { id: 6, nom: 'Ajna',         sous_nom: 'Troisième Œil', couleur: '#4A6FA5' },
  { id: 7, nom: 'Sahasrara',    sous_nom: 'Couronne',      couleur: '#9B59B6' },
]

const SYMBOLES_REIKI = ['Cho-Ku-Rei', 'Sei-He-Ki', 'Hon-Sha-Ze-Sho-Nen', 'Dai-Ko-Myo', 'Zoom']
const TECHNIQUES = ['contact direct', 'distance (10 cm)', 'distance mentale']
const SIGNAUX_OPT = ['résistance', 'ouverture émotionnelle', 'larmes', 'chaleur perçue', 'tressaillement', 'relâchement', 'autre']
const PRESCRIPTIONS_OPT = ['journal émotionnel', 'marche pieds nus', 'bain huiles essentielles', 'affirmations', 'yoga / stretching', 'pierre ancrage', 'autre']

function initChakras() {
  return CHAKRAS_META.map(c => ({
    chakra_id: c.id,
    niveauAvant: 50,
    niveauApres: 50,
    etat: 'ouverture',
    focus: false,
  }))
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function NouvelleSeanceEnergeticien() {
  const navigate = useNavigate()

  const [clients, setClients]               = useState([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [date, setDate]                     = useState(todayIso())
  const [duree, setDuree]                   = useState('75')
  const [tarif, setTarif]                   = useState('')
  const [typeSeance, setTypeSeance]         = useState('Reiki')

  const [chakraState, setChakraState]       = useState(initChakras())

  const [symboles, setSymboles]             = useState([])
  const [technique, setTechnique]           = useState('contact direct')
  const [dureePosition, setDureePosition]   = useState('3')

  const [signaux, setSignaux]               = useState([])
  const [notesSignaux, setNotesSignaux]     = useState('')

  const [prescriptions, setPrescriptions]   = useState([])
  const [detailPrescriptions, setDetailPrescriptions] = useState('')

  const [notesPraticien, setNotesPraticien] = useState('')
  const [scoreBienEtre, setScoreBienEtre]   = useState(0)

  const [saving, setSaving]                 = useState(false)
  const [error, setError]                   = useState(null)
  const [saveOk, setSaveOk]                 = useState(false)

  /* ── Chargement des clients ── */
  useEffect(() => {
    supabase.from('clients').select('id, prenom, nom').order('nom')
      .then(({ data }) => setClients(data || []))
  }, [])

  /* ── Pré-remplissage niveaux Avant quand client change ── */
  useEffect(() => {
    if (!selectedClientId) { setChakraState(initChakras()); return }
    supabase
      .from('chakra_evaluations')
      .select('chakra_id, niveau, etat, session_num')
      .eq('client_id', selectedClientId)
      .order('session_num', { ascending: false })
      .then(({ data }) => {
        if (!data || data.length === 0) return
        const lastNum = data[0].session_num
        const lastSession = data.filter(e => e.session_num === lastNum)
        const nMap = {}, eMap = {}
        lastSession.forEach(e => { nMap[e.chakra_id] = e.niveau; eMap[e.chakra_id] = e.etat })
        setChakraState(prev => prev.map(c => ({
          ...c,
          niveauAvant: nMap[c.chakra_id] ?? 50,
          niveauApres: nMap[c.chakra_id] ?? 50,
          etat: eMap[c.chakra_id] ?? 'ouverture',
        })))
      })
  }, [selectedClientId])

  function updateChakra(chakraId, field, value) {
    setChakraState(prev => prev.map(c => c.chakra_id === chakraId ? { ...c, [field]: value } : c))
  }

  function toggleArr(setter, val) {
    setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])
  }

  function buildNotes() {
    const parts = []
    if (symboles.length) parts.push(`Symboles : ${symboles.join(', ')}`)
    parts.push(`Technique : ${technique}`)
    if (dureePosition) parts.push(`Durée/position : ${dureePosition} min`)
    if (signaux.length) parts.push(`Signaux : ${signaux.join(', ')}`)
    if (notesSignaux) parts.push(`Notes signaux : ${notesSignaux}`)
    if (prescriptions.length) parts.push(`Prescriptions : ${prescriptions.join(', ')}`)
    if (detailPrescriptions) parts.push(detailPrescriptions)
    if (scoreBienEtre) parts.push(`Score bien-être : ${scoreBienEtre}/5`)
    if (notesPraticien) parts.push(`\nNotes praticien :\n${notesPraticien}`)
    return parts.join('\n')
  }

  async function handleSave() {
    if (!selectedClientId) { setError('Veuillez sélectionner un client.'); return }
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      /* 1 — Insérer la séance */
      const { data: seanceData, error: seanceErr } = await supabase
        .from('seances')
        .insert({
          user_id: user.id,
          client_id: selectedClientId,
          date_seance: date,
          duree_minutes: parseInt(duree) || 75,
          prix_euros: tarif ? parseFloat(tarif) : null,
          type_seance: typeSeance,
          notes: buildNotes() || null,
          date_creation: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (seanceErr) throw seanceErr

      /* 2 — Prochain numéro de session */
      const { data: lastEvals } = await supabase
        .from('chakra_evaluations')
        .select('session_num')
        .eq('client_id', selectedClientId)
        .order('session_num', { ascending: false })
        .limit(1)
      const nextNum = (lastEvals?.[0]?.session_num ?? 0) + 1

      /* 3 — Insérer les évaluations chakra */
      const { error: chakraErr } = await supabase
        .from('chakra_evaluations')
        .insert(chakraState.map(c => ({
          client_id: selectedClientId,
          session_id: seanceData.id,
          session_num: nextNum,
          chakra_id: c.chakra_id,
          niveau: c.niveauApres,
          etat: c.etat,
        })))
      if (chakraErr) throw chakraErr

      /* 4 — suivi_plans si chakras focus définis et aucun plan existant */
      const chakrasCibles = chakraState.filter(c => c.focus).map(c => c.chakra_id)
      if (chakrasCibles.length > 0) {
        const { data: existing } = await supabase
          .from('suivi_plans')
          .select('id')
          .eq('client_id', selectedClientId)
          .limit(1)
        if (!existing || existing.length === 0) {
          await supabase.from('suivi_plans').insert({
            client_id: selectedClientId,
            chakras_cibles: chakrasCibles,
            created_at: new Date().toISOString(),
          })
        }
      }

      setSaveOk(true)
      setTimeout(() => navigate('/chakras'), 1400)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Erreur lors de la sauvegarde.')
      setSaving(false)
    }
  }

  /* ── Render ── */
  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={S.header}>
        <button onClick={() => navigate(-1)} style={S.btnRetour}>
          <i className="ti ti-arrow-left" style={{ fontSize: 15 }} />
        </button>
        <div>
          <h1 style={S.headerTitre}>Nouvelle séance énergétique</h1>
          <p style={S.headerSous}>Évaluation chakras + protocole soin</p>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={S.body}>

        {/* Erreur */}
        {error && (
          <div style={S.alertError}>
            <i className="ti ti-alert-circle" style={{ fontSize: 16 }} />
            {error}
          </div>
        )}

        {/* Succès */}
        {saveOk && (
          <div style={S.alertOk}>
            <i className="ti ti-check" style={{ fontSize: 16 }} />
            Séance enregistrée — redirection…
          </div>
        )}

        {/* ── Section 1 : Infos de base ── */}
        <div style={S.card}>
          <p style={S.cardTitre}>Informations de base</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>Client *</label>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                style={S.input}
              >
                <option value="">— Sélectionner un client —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.prenom} {c.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={S.label}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={S.input} />
            </div>

            <div>
              <label style={S.label}>Type de soin</label>
              <select value={typeSeance} onChange={e => setTypeSeance(e.target.value)} style={S.input}>
                <option>Reiki</option>
                <option>Énergétique</option>
                <option>Soins chakras</option>
                <option>Autre</option>
              </select>
            </div>

            <div>
              <label style={S.label}>Durée (min)</label>
              <input
                type="number" min="15" max="180" step="15"
                value={duree} onChange={e => setDuree(e.target.value)}
                style={S.input}
              />
            </div>

            <div>
              <label style={S.label}>Tarif (€)</label>
              <input
                type="number" min="0" step="5"
                placeholder="ex. 70"
                value={tarif} onChange={e => setTarif(e.target.value)}
                style={S.input}
              />
            </div>

          </div>
        </div>

        {/* ── Section 2 : Chakras ── */}
        <div style={S.card}>
          <p style={S.cardTitre}>Évaluation chakras</p>
          <p style={{ fontSize: 12, color: '#a07848', marginTop: -10, marginBottom: 18 }}>
            Niveau Avant = dernière session connue (lecture seule). Ajustez le niveau Après pour cette séance.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {CHAKRAS_META.map(meta => {
              const c = chakraState.find(x => x.chakra_id === meta.id)
              if (!c) return null
              return (
                <div key={meta.id} style={S.chakraBlock}>
                  {/* En-tête chakra */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: meta.couleur, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: meta.couleur }}>{meta.nom}</span>
                      <span style={{ fontSize: 11, color: '#a07848' }}>{meta.sous_nom}</span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#a07848', cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={c.focus}
                        onChange={e => updateChakra(meta.id, 'focus', e.target.checked)}
                        style={{ accentColor: meta.couleur, width: 14, height: 14 }}
                      />
                      Chakra focus
                    </label>
                  </div>

                  {/* Slider Avant */}
                  <div style={S.sliderRow}>
                    <span style={S.sliderLabel}>AVANT</span>
                    <input
                      type="range" min="0" max="100"
                      value={c.niveauAvant}
                      disabled
                      style={{ flex: 1, opacity: 0.45, cursor: 'not-allowed', accentColor: '#bbb' }}
                    />
                    <span style={S.sliderVal}>{c.niveauAvant}%</span>
                  </div>

                  {/* Slider Après */}
                  <div style={S.sliderRow}>
                    <span style={{ ...S.sliderLabel, color: meta.couleur, fontWeight: 700 }}>APRÈS</span>
                    <input
                      type="range" min="0" max="100"
                      value={c.niveauApres}
                      onChange={e => updateChakra(meta.id, 'niveauApres', Number(e.target.value))}
                      style={{ flex: 1, accentColor: meta.couleur, cursor: 'pointer' }}
                    />
                    <span style={{ ...S.sliderVal, color: meta.couleur, fontWeight: 700 }}>{c.niveauApres}%</span>
                  </div>

                  {/* État */}
                  <select
                    value={c.etat}
                    onChange={e => updateChakra(meta.id, 'etat', e.target.value)}
                    style={{ ...S.input, marginTop: 8, fontSize: 12, padding: '5px 10px' }}
                  >
                    <option value="bloqué">Bloqué</option>
                    <option value="ouverture">En ouverture</option>
                    <option value="ouvert">Ouvert</option>
                  </select>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Section 3 : Protocole Reiki ── */}
        <div style={S.card}>
          <p style={S.cardTitre}>Protocole Reiki</p>

          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Symboles utilisés</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 6 }}>
              {SYMBOLES_REIKI.map(sym => (
                <label key={sym} style={S.checkLabel}>
                  <input
                    type="checkbox"
                    checked={symboles.includes(sym)}
                    onChange={() => toggleArr(setSymboles, sym)}
                    style={{ accentColor: '#c17a3a' }}
                  />
                  {sym}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '14px 20px' }}>
            <div>
              <label style={S.label}>Technique</label>
              <select value={technique} onChange={e => setTechnique(e.target.value)} style={S.input}>
                {TECHNIQUES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Durée/position (min)</label>
              <input
                type="number" min="1" max="15"
                value={dureePosition} onChange={e => setDureePosition(e.target.value)}
                style={S.input}
              />
            </div>
          </div>
        </div>

        {/* ── Section 4 : Signaux observés ── */}
        <div style={S.card}>
          <p style={S.cardTitre}>Signaux observés</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginBottom: 14 }}>
            {SIGNAUX_OPT.map(s => (
              <label key={s} style={S.checkLabel}>
                <input
                  type="checkbox"
                  checked={signaux.includes(s)}
                  onChange={() => toggleArr(setSignaux, s)}
                  style={{ accentColor: '#c17a3a' }}
                />
                {s}
              </label>
            ))}
          </div>
          <label style={S.label}>Précisions</label>
          <textarea
            value={notesSignaux}
            onChange={e => setNotesSignaux(e.target.value)}
            placeholder="Décrivez les signaux observés…"
            rows={3}
            style={S.textarea}
          />
        </div>

        {/* ── Section 5 : Prescriptions inter-séances ── */}
        <div style={S.card}>
          <p style={S.cardTitre}>Prescriptions inter-séances</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginBottom: 14 }}>
            {PRESCRIPTIONS_OPT.map(p => (
              <label key={p} style={S.checkLabel}>
                <input
                  type="checkbox"
                  checked={prescriptions.includes(p)}
                  onChange={() => toggleArr(setPrescriptions, p)}
                  style={{ accentColor: '#c17a3a' }}
                />
                {p}
              </label>
            ))}
          </div>
          <label style={S.label}>Détail / conseils personnalisés</label>
          <textarea
            value={detailPrescriptions}
            onChange={e => setDetailPrescriptions(e.target.value)}
            placeholder="Conseils personnalisés pour le client…"
            rows={3}
            style={S.textarea}
          />
        </div>

        {/* ── Section 6 : Notes praticien ── */}
        <div style={S.card}>
          <p style={S.cardTitre}>Notes praticien</p>
          <textarea
            value={notesPraticien}
            onChange={e => setNotesPraticien(e.target.value)}
            placeholder="Observations, ressenti, évolution perçue…"
            rows={5}
            style={S.textarea}
          />
        </div>

        {/* ── Section 7 : Score bien-être ── */}
        <div style={S.card}>
          <p style={S.cardTitre}>Score de bien-être client</p>
          <p style={{ fontSize: 12, color: '#a07848', marginTop: -10, marginBottom: 14 }}>
            Ressenti global du client à la fin de la séance
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setScoreBienEtre(n === scoreBienEtre ? 0 : n)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 32, lineHeight: 1, padding: '0 2px',
                  color: n <= scoreBienEtre ? '#c17a3a' : '#e0d0c0',
                  transition: 'color .15s',
                }}
              >
                ★
              </button>
            ))}
            {scoreBienEtre > 0 && (
              <span style={{ alignSelf: 'center', fontSize: 13, color: '#a07848', marginLeft: 8 }}>
                {scoreBienEtre}/5
              </span>
            )}
          </div>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingBottom: 40 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={S.btnSecondary}
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              ...S.btnPrimary,
              opacity: saving || saveOk ? 0.7 : 1,
              cursor: saving || saveOk ? 'not-allowed' : 'pointer',
            }}
            disabled={saving || saveOk}
          >
            {saving
              ? <><i className="ti ti-loader-2" style={{ fontSize: 15, marginRight: 6 }} />Enregistrement…</>
              : saveOk
                ? <><i className="ti ti-check" style={{ fontSize: 15, marginRight: 6 }} />Enregistré</>
                : <><i className="ti ti-device-floppy" style={{ fontSize: 15, marginRight: 6 }} />Enregistrer la séance</>
            }
          </button>
        </div>

      </div>
    </div>
  )
}

/* ── Styles ── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#f5f0ea',
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    background: '#2C1A0E',
    padding: '18px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  headerTitre: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-.01em',
  },
  headerSous: {
    margin: '2px 0 0',
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
  },
  btnRetour: {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: '#fff',
    borderRadius: 8,
    padding: '7px 10px',
    cursor: 'pointer',
    fontSize: 15,
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  body: {
    maxWidth: 700,
    margin: '0 auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '22px 24px',
    border: '0.5px solid rgba(193,122,58,0.18)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  cardTitre: {
    margin: '0 0 16px',
    fontSize: 11,
    fontWeight: 700,
    color: '#c17a3a',
    textTransform: 'uppercase',
    letterSpacing: '.07em',
  },
  label: {
    fontSize: 10,
    color: '#a07848',
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    fontWeight: 600,
    marginBottom: 4,
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 7,
    border: '0.5px solid rgba(193,122,58,0.28)',
    background: '#fdfaf6',
    fontSize: 13,
    color: '#1a1208',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  textarea: {
    width: '100%',
    padding: '9px 11px',
    borderRadius: 7,
    border: '0.5px solid rgba(193,122,58,0.28)',
    background: '#fdfaf6',
    fontSize: 13,
    color: '#1a1208',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
    lineHeight: 1.5,
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#2d1e0e',
    cursor: 'pointer',
    userSelect: 'none',
  },
  chakraBlock: {
    padding: '14px 16px',
    borderRadius: 9,
    border: '0.5px solid rgba(193,122,58,0.14)',
    background: '#fdfaf6',
  },
  sliderRow: {
    display: 'grid',
    gridTemplateColumns: '46px 1fr 44px',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  sliderLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: '#a07848',
    letterSpacing: '.06em',
    textTransform: 'uppercase',
  },
  sliderVal: {
    fontSize: 12,
    color: '#a07848',
    textAlign: 'right',
  },
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#fbeaf0',
    color: '#993556',
    border: '0.5px solid rgba(153,53,86,0.3)',
    borderRadius: 9,
    padding: '11px 16px',
    fontSize: 13,
    fontWeight: 500,
  },
  alertOk: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#eaf3de',
    color: '#3b6d11',
    border: '0.5px solid rgba(59,109,17,0.3)',
    borderRadius: 9,
    padding: '11px 16px',
    fontSize: 13,
    fontWeight: 500,
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    padding: '11px 22px',
    borderRadius: 8,
    border: 'none',
    color: '#fff',
    background: '#c17a3a',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    gap: 4,
  },
  btnSecondary: {
    padding: '11px 20px',
    borderRadius: 8,
    border: '1px solid rgba(193,122,58,0.35)',
    background: '#fff',
    color: '#c17a3a',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
}
