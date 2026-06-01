import { useState, useRef, useEffect, Suspense, Component } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html, useGLTF } from '@react-three/drei'
import { supabase } from '../lib/supabase'
import * as THREE from 'three'

// Supprime le warning THREE.Clock deprecated (r3f interne, pas corrigeable autrement)
const _warn = console.warn.bind(console)
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return
  _warn(...args)
}

/* ─── Constants ─────────────────────────────────────────── */

const PALETTE = [
  { color: '#c0392b', label: 'Douleur'  },
  { color: '#d4711e', label: 'Tension'  },
  { color: '#c9a84c', label: 'Or'       },
  { color: '#27ae60', label: 'Bien-être'},
  { color: '#2980b9', label: 'Froid'    },
  { color: '#8e44ad', label: 'Énergie'  },
  { color: '#c0607a', label: 'Sensible' },
  { color: '#5d4037', label: 'Zone'     },
]

const PRESET_TAGS = ['Stress', 'Lombaires', 'Sommeil', 'Douleur', 'Fatigue', 'Anxiété']

const CAM_POS = {
  front: [0, 0,  50],
  back:  [0, 0, -50],
  left:  [-50, 0, 0],
}

const COLOR_LABELS = {
  '#c0392b': 'Douleur',
  '#d4711e': 'Tension',
  '#c9a84c': 'Attention',
  '#27ae60': 'Détente',
  '#2980b9': 'Froid',
  '#8e44ad': 'Énergie',
  '#c0607a': 'Sensible',
  '#5d4037': 'Neutre',
}

function getZone(y, totalHeight) {
  const ratio = y / totalHeight
  if (ratio > 0.75)  return 'Tête'
  if (ratio > 0.55)  return 'Cou / épaules'
  if (ratio > 0.30)  return 'Thorax / abdomen'
  if (ratio > 0.10)  return 'Hanches / bassin'
  if (ratio > -0.20) return 'Cuisses / genoux'
  if (ratio > -0.55) return 'Jambes'
  return 'Pieds / chevilles'
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/* ─── Canvas Error Boundary (class requis par React) ───── */

class CanvasEB extends Component {
  constructor(p) { super(p); this.state = { err: false } }
  static getDerivedStateFromError() { return { err: true } }
  render() { return this.state.err ? this.props.fallback : this.props.children }
}

/* ─── 3D : mesh GLTF + points d'annotation ─────────────── */

function BodyMesh({ annots, onAdd, onRemove, tool, color, dotSize, modelHeightRef }) {
  const { scene } = useGLTF('/models/corps/scene.gltf')

  useEffect(() => {
    if (scene) {
      const box = new THREE.Box3().setFromObject(scene)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 0.3 / maxDim
      scene.scale.setScalar(scale)
      scene.position.set(
        -center.x * scale,
        -center.y * scale,
        -center.z * scale,
      )
      if (modelHeightRef) modelHeightRef.current = size.y * scale
    }
  }, [scene])

  function handleClick(e) {
    e.stopPropagation()
    if (tool === 'effacer') return
    const nw = e.face?.normal.clone().transformDirection(e.object.matrixWorld)
    const p = e.point
    const pos = nw
      ? [p.x + nw.x * 0.012, p.y + nw.y * 0.012, p.z + nw.z * 0.012]
      : [p.x, p.y, p.z]
    const r = tool === 'zone' ? dotSize * 2.2 : dotSize
    onAdd({
      id: Date.now(), position: pos, color, radius: r,
      label: PALETTE.find(pl => pl.color === color)?.label ?? '',
    })
  }

  return (
    <>
      <primitive object={scene} onClick={handleClick} />
      {annots.map(a => (
        <mesh
          key={a.id}
          position={a.position}
          onClick={e => { if (tool === 'effacer') { e.stopPropagation(); onRemove(a.id) } }}
        >
          <sphereGeometry args={[a.radius, 20, 20]} />
          <meshStandardMaterial color={a.color} transparent opacity={0.82} />
        </mesh>
      ))}
    </>
  )
}

/* ─── Main ───────────────────────────────────────────────── */

export default function NouvelleSeance() {
  const navigate     = useNavigate()
  const [searchParams] = useSearchParams()
  const orbitRef       = useRef()
  const cameraRef      = useRef(null)
  const modelHeightRef = useRef(0.3)

  /* Client */
  const [prenom,        setPrenom]        = useState('')
  const [nom,           setNom]           = useState('')
  const [genre,         setGenre]         = useState('')
  const [tel,           setTel]           = useState('')
  const [email,         setEmail]         = useState('')
  const [dateNaissance, setDateNaissance] = useState('')

  /* Séance */
  const today = new Date().toISOString().slice(0, 10)
  const [date,  setDate]  = useState(searchParams.get('date') ?? today)
  const [heure, setHeure] = useState(searchParams.get('heure') ?? '09:00')
  const [duree, setDuree] = useState('60')
  const [prix,  setPrix]  = useState('')
  const [type,  setType]  = useState('Sophrologie')

  /* Historique client */
  const [history, setHistory] = useState([])
  useEffect(() => {
    if (!prenom.trim() || !nom.trim()) { setHistory([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('seances')
        .select('*')
        .ilike('prenom', prenom.trim())
        .ilike('nom', nom.trim())
        .order('date_seance', { ascending: false })
        .limit(10)
      setHistory(data || [])
    }, 500)
    return () => clearTimeout(t)
  }, [prenom, nom])

  /* 3D */
  const [activeView, setActiveView] = useState('front')
  const [annots,     setAnnots]     = useState([])
  const [tool,       setTool]       = useState('point')
  const [color,      setColor]      = useState('#c0392b')
  const [dotSize,    setDotSize]    = useState(0.025)

  /* Notes */
  const [noteText, setNoteText] = useState('')
  const [notes,    setNotes]    = useState([])

  /* Tags */
  const [tags,      setTags]      = useState([])
  const [customTag, setCustomTag] = useState('')

  /* Canvas WebGL — clé pour forcer le remount après context loss */
  const [canvasKey, setCanvasKey] = useState(0)

  /* Save */
  const [saving,     setSaving]     = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // null | 'ok' | 'err'
  const [saveError,  setSaveError]  = useState(null)

  /* ─ Handlers ─ */

  function changeView(v) {
    setActiveView(v)
    if (orbitRef.current) {
      const [x, y, z] = CAM_POS[v]
      orbitRef.current.object.position.set(x, y, z)
      orbitRef.current.target.set(0, 0, 0)
      orbitRef.current.update()
    }
  }

  function addAnnot(a) {
    setAnnots(prev => [...prev, a])
    const zone       = getZone(a.position[1], modelHeightRef.current)
    const colorLabel = COLOR_LABELS[a.color] ?? a.label
    setNotes(prev => [{
      id:      a.id,
      color:   a.color,
      label:   colorLabel,
      zone,
      text:    `${colorLabel} · ${zone}`,
      date:    new Date().toLocaleDateString('fr-FR'),
      comment: '',
      auto:    true,
    }, ...prev])
  }

  function removeAnnot(id) {
    setAnnots(prev => prev.filter(a => a.id !== id))
    setNotes(prev => prev.filter(n => !(n.auto && n.id === id)))
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

  async function handleSave() {
    setSaving(true)
    setSaveStatus(null)
    setSaveError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const GENRE_MAP = { H: 'Homme', F: 'Femme', A: 'Autre' }
      // Seuls les tags présents dans l'enum tag_observation sont valides en DB
      const validTags = tags.filter(t => PRESET_TAGS.includes(t))

      const payload = {
        user_id:            user.id,
        prenom,
        nom,
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
        notes:              notes.map(n => n.text).join('\n') || null,
        tags:               validTags.length ? validTags : null,
      }

      const { error } = await supabase.from('seances').insert(payload)

      if (error) {
        console.error('Erreur Supabase:', error)
        setSaveError(error.message)
        setSaveStatus('err')
        setSaving(false)
      } else {
        setSaveStatus('ok')
        setTimeout(() => navigate('/seances'), 1400)
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

  const usedColors = [...new Set(annots.map(a => a.color))]
  const saveBg     = saveStatus === 'ok' ? '#27ae60' : saveStatus === 'err' ? '#c0392b' : '#c9a84c'
  const saveTxt    = saveStatus === 'ok' ? '✓ Sauvegardé' : saveStatus === 'err' ? '✗ Erreur' : saving ? 'Sauvegarde…' : 'Sauvegarder'

  /* ─ Render ─ */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'inherit', overflow: 'hidden' }}>

      {/* ── Topbar ── */}
      <div style={{ height: 44, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, flexShrink: 0, borderBottom: '1px solid #e5e7eb' }}>
        <button
          onClick={() => navigate('/seances')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 3, border: '1px solid #e5e7eb', background: 'transparent', color: '#374151', fontSize: 12, cursor: 'pointer' }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 13 }} />
          Séances
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
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '60% 40%', overflow: 'hidden' }}>

            {/* ── Formulaire 60% ── */}
            <div style={{ overflowY: 'auto', padding: '14px 14px 0', borderRight: '1px solid #e5e7eb' }}>

              {/* ── Section 1 : Informations du client ── */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#1a2744', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>Informations du client</div>

              <div style={{ display: 'flex', gap: 6, ...gap }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Prénom</label>
                  <input style={inp} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prénom" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Nom</label>
                  <input style={inp} value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom" />
                </div>
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

              <div style={{ display: 'flex', gap: 6, ...gap }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Date</label>
                  <input style={inp} type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Heure</label>
                  <input style={inp} type="time" value={heure} onChange={e => setHeure(e.target.value)} />
                </div>
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
                  {['Sophrologie','Naturopathie','Coaching','Énergie','Massage','Autre'].map(t => (
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
                    const MOIS_H = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
                    const [hy, hm, hj] = (s.date_seance || '').split('-')
                    const dateLabel = s.date_seance ? `${hj} ${MOIS_H[parseInt(hm)-1]} ${hy}` : '—'
                    const isToday = s.date_seance === date
                    return (
                      <div
                        key={s.id}
                        onClick={() => navigate(`/clients?search=${encodeURIComponent(`${prenom} ${nom}`.trim())}`)}
                        style={{ position: 'relative', paddingLeft: 18, marginBottom: 12, cursor: 'pointer' }}
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
                          style={{ background: '#fff', borderRadius: 5, padding: '7px 9px', border: `1px solid ${isToday ? '#86efac' : '#e5e7eb'}`, transition: 'border-color .1s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a84c' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = isToday ? '#86efac' : '#e5e7eb' }}
                        >
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#1a2744', marginBottom: 2 }}>{dateLabel}</div>
                          <div style={{ fontSize: 10, color: '#6b7280' }}>
                            {s.type_seance} · {s.duree_minutes} min{s.prix_euros != null ? ` · ${s.prix_euros} €` : ''}
                          </div>
                          {(s.tags || []).length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 4 }}>
                              {s.tags.map(t => (
                                <span key={t} style={{ fontSize: 9, background: '#f3f4f6', color: '#374151', padding: '1px 5px', borderRadius: 8 }}>{t}</span>
                              ))}
                            </div>
                          )}
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden', minWidth: 0 }}>

          {/* Tabs vue */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
            <div style={{ padding: '9px 14px', fontSize: 12, fontWeight: 600, color: '#1a2744', borderBottom: '2px solid transparent', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-circle-dashed" style={{ fontSize: 14 }} />
              Schéma corporel
            </div>
            <div style={{ flex: 1 }} />
            {[['front','Face'],['back','Dos'],['left','Côté']].map(([v, l]) => (
              <button key={v} onClick={() => changeView(v)} style={{
                padding: '9px 16px', border: 'none', cursor: 'pointer',
                background: activeView === v ? '#fff' : '#fafafa',
                color: activeView === v ? '#1a2744' : '#9ca3af',
                fontSize: 12, fontWeight: activeView === v ? 700 : 400,
                borderBottom: `2px solid ${activeView === v ? '#c9a84c' : 'transparent'}`,
                transition: 'color .1s',
              }}>{l}</button>
            ))}
          </div>

          {/* Canvas 3D */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
            <Canvas
              key={canvasKey}
              camera={{ position: CAM_POS['front'], fov: 20 }}
              onCreated={({ gl, camera }) => {
                cameraRef.current = camera
                gl.domElement.addEventListener('webglcontextlost', e => {
                  e.preventDefault()
                  setTimeout(() => setCanvasKey(k => k + 1), 200)
                })
              }}
              gl={{ antialias: true, powerPreference: 'default' }}
              style={{ background: '#f8f8f8', width: '100%', height: '100%' }}
            >
              <ambientLight intensity={0.7} />
              <directionalLight position={[3, 5, 2]} intensity={1.1} color="#ffe8cc" />
              <directionalLight position={[-2, 3, -3]} intensity={0.4} color="#ffe0b0" />
              <OrbitControls
                ref={orbitRef}
                enableZoom={true}
                enablePan={false}
                minDistance={1}
                maxDistance={100}
                target={[0, 0, 0]}
              />
              <CanvasEB fallback={
                <Html center>
                  <div style={{ textAlign: 'center', color: '#bbb', fontSize: 11, lineHeight: 1.7, pointerEvents: 'none', userSelect: 'none' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>◻</div>
                    <div style={{ fontWeight: 600, color: '#888' }}>Modèle 3D non disponible</div>
                    <div style={{ fontSize: 10, marginTop: 4, color: '#bbb' }}>
                      Placez scene.gltf dans<br />
                      <code>public/models/corps/</code>
                    </div>
                  </div>
                </Html>
              }>
                <Suspense fallback={
                  <Html center>
                    <div style={{ color: '#bbb', fontSize: 11 }}>Chargement du modèle…</div>
                  </Html>
                }>
                  <BodyMesh
                    annots={annots} onAdd={addAnnot} onRemove={removeAnnot}
                    tool={tool} color={color} dotSize={dotSize}
                    modelHeightRef={modelHeightRef}
                  />
                </Suspense>
              </CanvasEB>
            </Canvas>

            {/* Zoom buttons */}
            <div style={{
              position: 'absolute', bottom: 50, right: 12,
              display: 'flex', flexDirection: 'column', gap: 4,
              zIndex: 10,
            }}>
              <button onClick={() => {
                if (cameraRef.current) {
                  const dir = cameraRef.current.position.clone().normalize()
                  cameraRef.current.position.sub(dir.multiplyScalar(0.4))
                }
              }} style={{ width: 34, height: 34, background: 'rgba(26,39,68,0.9)', color: '#c9a84c', border: 'none', borderRadius: 4, fontSize: 20, cursor: 'pointer', fontWeight: 'bold' }}>+</button>
              <button onClick={() => {
                if (cameraRef.current) {
                  const dir = cameraRef.current.position.clone().normalize()
                  cameraRef.current.position.add(dir.multiplyScalar(0.4))
                }
              }} style={{ width: 34, height: 34, background: 'rgba(26,39,68,0.9)', color: '#c9a84c', border: 'none', borderRadius: 4, fontSize: 20, cursor: 'pointer', fontWeight: 'bold' }}>−</button>
              <button onClick={() => {
                if (cameraRef.current) {
                  cameraRef.current.position.set(...CAM_POS[activeView])
                }
              }} style={{ width: 34, height: 34, background: 'rgba(26,39,68,0.9)', color: '#c9a84c', border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}>⟳</button>
            </div>
          </div>

          {/* Palette couleurs */}
          <div style={{ flexShrink: 0, borderTop: '1px solid #f0f0f0', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
            {PALETTE.map(p => (
              <button
                key={p.color}
                title={p.label}
                onClick={() => setColor(p.color)}
                style={{
                  width: 22, height: 22, borderRadius: '50%', background: p.color,
                  border: 'none', padding: 0, cursor: 'pointer',
                  boxShadow: color === p.color ? `0 0 0 2px #fff, 0 0 0 4px ${p.color}` : 'none',
                  transform: color === p.color ? 'scale(1.18)' : 'scale(1)',
                  transition: 'transform .1s, box-shadow .1s',
                  flexShrink: 0,
                }}
              />
            ))}
            <div style={{ flex: 1 }} />
            {annots.length > 0 && (
              <button onClick={() => { setAnnots([]); setNotes(prev => prev.filter(n => !n.auto)) }} style={{ fontSize: 10, color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
                Tout effacer
              </button>
            )}
          </div>

          {/* Outils */}
          <div style={{ flexShrink: 0, padding: '7px 14px 8px', display: 'flex', alignItems: 'center', gap: 5, borderTop: '1px solid #f8f8f8' }}>
            {[['point','Point'],['zone','Zone'],['effacer','Effacer']].map(([t, l]) => (
              <button key={t} onClick={() => setTool(t)} style={{
                padding: '4px 12px', borderRadius: 3, cursor: 'pointer',
                border: `1px solid ${tool === t ? '#1a2744' : '#e5e7eb'}`,
                background: tool === t ? '#1a2744' : '#fff',
                color: tool === t ? '#c9a84c' : '#6b7280',
                fontSize: 11, fontWeight: tool === t ? 700 : 400,
                transition: 'background .1s',
              }}>{l}</button>
            ))}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: '#9ca3af' }}>Taille</span>
            <input
              type="range" min={0.01} max={0.06} step={0.005}
              value={dotSize} onChange={e => setDotSize(parseFloat(e.target.value))}
              style={{ width: 72, accentColor: '#c9a84c', cursor: 'pointer' }}
            />
          </div>

          {/* Légende */}
          {usedColors.length > 0 && (
            <div style={{ flexShrink: 0, padding: '5px 14px 8px', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #f8f8f8' }}>
              {usedColors.map(c => {
                const p = PALETTE.find(pl => pl.color === c)
                const cnt = annots.filter(a => a.color === c).length
                return (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: '#6b7280' }}>{p?.label} ({cnt})</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

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
