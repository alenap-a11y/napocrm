import { useState, useRef, useEffect, useLayoutEffect, useMemo, Suspense, Component } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html, useGLTF } from '@react-three/drei'
import { supabase } from '../lib/supabase'
import SlotPicker from '../components/SlotPicker'
import * as THREE from 'three'

// Supprime le warning THREE.Clock deprecated (r3f interne, pas corrigeable autrement)
const _warn = console.warn.bind(console)
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return
  _warn(...args)
}

/* ─── Calibration ───────────────────────────────────────── */
// Passe à true pour enregistrer les coordonnées exactes de chaque clic.
// Remet à false une fois les ancres copiées depuis la console.
const CALIBRATION_MODE = false
const _calibPts = []   // accumulateur de session (module-level, survit aux re-renders)

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

// Directions unitaires par vue — la distance est calculée dynamiquement
// au chargement du modèle via "fit camera to bounding sphere"
const CAM_DIR = {
  front: [0, 0,  1],
  back:  [0, 0, -1],
  left:  [-1, 0, 0],
}
const CAM_FOV = 20 // doit correspondre au fov du Canvas

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

// ─── Ancres anatomiques ──────────────────────────────────────────────────────
// Coordonnées normalisées [0-1] dans la bounding box du corps scalé :
//   up  : 0 = pieds, 1 = tête  (axe "haut" détecté dynamiquement)
//   lat : 0 = droite patient, 1 = gauche patient
//   dep : 0 = dos, 1 = face avant
// Si gauche/droite est inversé sur ton modèle, échange lat 0.xx <-> (1 - 0.xx)
const ANCHORS = [
  // Tête
  { name: 'Sommet du crâne',         up: 0.97, lat: 0.50, dep: 0.52 },
  { name: 'Front',                    up: 0.93, lat: 0.50, dep: 0.65 },
  { name: 'Œil droit',               up: 0.91, lat: 0.37, dep: 0.64 },
  { name: 'Œil gauche',              up: 0.91, lat: 0.63, dep: 0.64 },
  { name: 'Nez',                      up: 0.89, lat: 0.50, dep: 0.70 },
  { name: 'Joue droite',              up: 0.88, lat: 0.33, dep: 0.63 },
  { name: 'Joue gauche',             up: 0.88, lat: 0.67, dep: 0.63 },
  { name: 'Bouche',                   up: 0.87, lat: 0.50, dep: 0.68 },
  { name: 'Mâchoire droite',          up: 0.85, lat: 0.35, dep: 0.62 },
  { name: 'Mâchoire gauche',         up: 0.85, lat: 0.65, dep: 0.62 },
  { name: 'Oreille droite',           up: 0.90, lat: 0.23, dep: 0.50 },
  { name: 'Oreille gauche',          up: 0.90, lat: 0.77, dep: 0.50 },
  { name: 'Nuque',                    up: 0.91, lat: 0.50, dep: 0.34 },
  // Cou
  { name: 'Cou',                      up: 0.82, lat: 0.50, dep: 0.55 },
  // Épaules
  { name: 'Épaule droite',            up: 0.76, lat: 0.20, dep: 0.52 },
  { name: 'Épaule gauche',           up: 0.76, lat: 0.80, dep: 0.52 },
  { name: 'Clavicule droite',         up: 0.78, lat: 0.34, dep: 0.60 },
  { name: 'Clavicule gauche',        up: 0.78, lat: 0.66, dep: 0.60 },
  // Torse avant
  { name: 'Poitrine',                 up: 0.70, lat: 0.50, dep: 0.64 },
  { name: 'Côtes droites',            up: 0.62, lat: 0.29, dep: 0.62 },
  { name: 'Côtes gauches',           up: 0.62, lat: 0.71, dep: 0.62 },
  { name: 'Abdomen',                  up: 0.54, lat: 0.50, dep: 0.63 },
  { name: 'Pubis',                    up: 0.37, lat: 0.50, dep: 0.64 },
  // Torse arrière
  { name: 'Dos haut',                 up: 0.71, lat: 0.50, dep: 0.34 },
  { name: 'Omoplate droite',          up: 0.72, lat: 0.29, dep: 0.34 },
  { name: 'Omoplate gauche',         up: 0.72, lat: 0.71, dep: 0.34 },
  { name: 'Dos milieu',               up: 0.58, lat: 0.50, dep: 0.34 },
  { name: 'Bas du dos',               up: 0.46, lat: 0.50, dep: 0.33 },
  // Bras droit
  { name: 'Bras droit',              up: 0.67, lat: 0.10, dep: 0.52 },
  { name: 'Coude droit',             up: 0.55, lat: 0.08, dep: 0.52 },
  { name: 'Avant-bras droit',        up: 0.46, lat: 0.09, dep: 0.52 },
  { name: 'Poignet droit',           up: 0.37, lat: 0.09, dep: 0.52 },
  { name: 'Main droite',             up: 0.28, lat: 0.09, dep: 0.52 },
  // Bras gauche
  { name: 'Bras gauche',             up: 0.67, lat: 0.90, dep: 0.52 },
  { name: 'Coude gauche',            up: 0.55, lat: 0.92, dep: 0.52 },
  { name: 'Avant-bras gauche',       up: 0.46, lat: 0.91, dep: 0.52 },
  { name: 'Poignet gauche',          up: 0.37, lat: 0.91, dep: 0.52 },
  { name: 'Main gauche',             up: 0.28, lat: 0.91, dep: 0.52 },
  // Bassin
  { name: 'Hanche droite',           up: 0.41, lat: 0.26, dep: 0.54 },
  { name: 'Hanche gauche',           up: 0.41, lat: 0.74, dep: 0.54 },
  { name: 'Fessier droit',           up: 0.40, lat: 0.32, dep: 0.33 },
  { name: 'Fessier gauche',          up: 0.40, lat: 0.68, dep: 0.33 },
  // Jambe droite
  { name: 'Cuisse droite',           up: 0.28, lat: 0.35, dep: 0.52 },
  { name: 'Genou droit',             up: 0.16, lat: 0.35, dep: 0.56 },
  { name: 'Creux du genou droit',    up: 0.16, lat: 0.35, dep: 0.42 },
  { name: 'Tibia droit',             up: 0.09, lat: 0.35, dep: 0.58 },
  { name: 'Mollet droit',            up: 0.09, lat: 0.35, dep: 0.41 },
  { name: 'Cheville droite',         up: 0.03, lat: 0.35, dep: 0.52 },
  { name: 'Pied droit',              up: 0.01, lat: 0.35, dep: 0.64 },
  { name: 'Talon droit',             up: 0.01, lat: 0.35, dep: 0.36 },
  // Jambe gauche
  { name: 'Cuisse gauche',           up: 0.28, lat: 0.65, dep: 0.52 },
  { name: 'Genou gauche',            up: 0.16, lat: 0.65, dep: 0.56 },
  { name: 'Creux du genou gauche',   up: 0.16, lat: 0.65, dep: 0.42 },
  { name: 'Tibia gauche',            up: 0.09, lat: 0.65, dep: 0.58 },
  { name: 'Mollet gauche',           up: 0.09, lat: 0.65, dep: 0.41 },
  { name: 'Cheville gauche',         up: 0.03, lat: 0.65, dep: 0.52 },
  { name: 'Pied gauche',             up: 0.01, lat: 0.65, dep: 0.64 },
  { name: 'Talon gauche',            up: 0.01, lat: 0.65, dep: 0.36 },
]

// Détecte l'axe "haut" du modèle : la dimension la plus longue après scale.
// En cas d'égalité X≈Y (T-pose), préfère Y (convention Three.js/GLTF).
function detectUpAxis(size) {
  if (size.z > size.y * 1.15 && size.z > size.x * 1.15) return 'z'  // Z-up (Blender)
  if (size.x > size.y * 1.15 && size.x > size.z * 1.15) return 'x'  // X-up (rare)
  return 'y'                                                           // Y-up (standard)
}

// Trouve l'ancre la plus proche du point cliqué dans l'espace normalisé [0-1]³.
// Poids : up × 2.5 >> lat × 1.5 >> dep × 0.6 (la hauteur est le signal le plus fort)
function getNearestAnchor(pos, bbox) {
  if (!bbox) return 'Zone inconnue'

  const nx = (pos[0] - bbox.min.x) / bbox.size.x  // 0=world-left, 1=world-right
  const ny = (pos[1] - bbox.min.y) / bbox.size.y
  const nz = (pos[2] - bbox.min.z) / bbox.size.z

  let up, lat, dep
  switch (bbox.upAxis) {
    case 'z': up = nz; lat = nx; dep = ny; break
    case 'x': up = nx; lat = nz; dep = ny; break
    default:  up = ny; lat = nx; dep = nz; break  // y-up
  }

  // ── Diagnostic (étape 1) ────────────────────────────────
  console.log('[Zone] pos brut:', pos.map(v => +v.toFixed(4)))
  console.log('[Zone] bbox min:', [+bbox.min.x.toFixed(4), +bbox.min.y.toFixed(4), +bbox.min.z.toFixed(4)])
  console.log('[Zone] bbox size:', [+bbox.size.x.toFixed(4), +bbox.size.y.toFixed(4), +bbox.size.z.toFixed(4)])
  console.log('[Zone] upAxis:', bbox.upAxis, '| up:', +up.toFixed(3), 'lat:', +lat.toFixed(3), 'dep:', +dep.toFixed(3))

  let best = ANCHORS[0].name, bestDist = Infinity
  for (const a of ANCHORS) {
    const d = Math.sqrt(
      (up  - a.up)  ** 2 * 6.25 +   // 2.5²
      (lat - a.lat) ** 2 * 2.25 +   // 1.5²
      (dep - a.dep) ** 2 * 0.36,    // 0.6²
    )
    if (d < bestDist) { bestDist = d; best = a.name }
  }

  console.log('[Zone] →', best, '(dist:', +bestDist.toFixed(3), ')')
  return best
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

/* ─── Annotation flèche (outil Point) ───────────────────── */

function ArrowAnnotation({ id, position, labelPos, color, zone, tool, onRemove }) {
  const lineGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setFromPoints([new THREE.Vector3(...position), new THREE.Vector3(...labelPos)])
    return g
  }, [position, labelPos])

  const handleEraseClick = e => {
    if (tool === 'effacer') { e.stopPropagation(); onRemove(id) }
  }

  return (
    <group onClick={handleEraseClick}>
      {/* Point de contact sur le corps */}
      <mesh position={position}>
        <sphereGeometry args={[0.004, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Trait de liaison */}
      <line geometry={lineGeom}>
        <lineBasicMaterial color={color} linewidth={1} />
      </line>
      {/* Label HTML (toujours lisible, rendu par-dessus le canvas) */}
      <Html position={labelPos} center style={{ pointerEvents: 'none' }}>
        <div style={{
          background: color,
          color: '#fff',
          fontSize: 9,
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: 3,
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
          fontFamily: 'inherit',
          userSelect: 'none',
          letterSpacing: '.02em',
        }}>
          {zone}
        </div>
      </Html>
    </group>
  )
}

/* ─── 3D : mesh GLTF + points d'annotation ─────────────── */

function BodyMesh({ annots, onAdd, onRemove, tool, color, dotSize, modelHeightRef, onFitDist, onBbox }) {
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

      // Log hiérarchie de meshes — utile pour vérifier les noms anatomiques du GLTF
      const meshNames = []
      scene.traverse(obj => { if (obj.isMesh) meshNames.push(obj.name || '(sans nom)') })
      console.log('[BodyMesh] Meshes dans la hiérarchie GLTF:', meshNames)

      // Bounding box du modèle après scale (coordonnées world réelles)
      const scaledBox = new THREE.Box3().setFromObject(scene)
      const scaledSize = new THREE.Vector3()
      scaledBox.getSize(scaledSize)
      const upAxis = detectUpAxis(scaledSize)

      console.log('[BodyMesh] Bounding box scalée:', {
        x: +scaledSize.x.toFixed(4),
        y: +scaledSize.y.toFixed(4),
        z: +scaledSize.z.toFixed(4),
        upAxis,
      })

      onBbox?.({
        min:    scaledBox.min.clone(),
        max:    scaledBox.max.clone(),
        size:   scaledSize.clone(),
        upAxis,
      })

      const sphere = new THREE.Sphere()
      scaledBox.getBoundingSphere(sphere)
      console.log('[BodyMesh] Rayon sphère englobante:', +sphere.radius.toFixed(4))

      const fovRad = CAM_FOV * Math.PI / 180
      const fitDist = (sphere.radius / Math.sin(fovRad / 2)) * 1.5
      console.log('[BodyMesh] Distance caméra calculée (marge 50%):', +fitDist.toFixed(3))

      onFitDist?.(fitDist)
    }
  }, [scene])

  function handleClick(e) {
    e.stopPropagation()
    if (tool === 'effacer') return

    const nw = e.face?.normal.clone().transformDirection(e.object.matrixWorld)
    const p = e.point

    if (CALIBRATION_MODE) {
      const name = window.prompt('Nom de la zone ?', '')
      if (!name) return
      _calibPts.push({ name, x: +p.x.toFixed(5), y: +p.y.toFixed(5), z: +p.z.toFixed(5) })
      console.log('// ── Ancres calibrées (' + _calibPts.length + ' pts) ──')
      console.log(JSON.stringify(_calibPts, null, 2))
      return
    }

    if (tool === 'point') {
      // Point de contact légèrement en surface
      const pos = nw
        ? [p.x + nw.x * 0.006, p.y + nw.y * 0.006, p.z + nw.z * 0.006]
        : [p.x, p.y, p.z]

      // Label poussé latéralement vers le bord du corps + légèrement en avant
      const lateralDir = Math.sign(p.x) || 1
      const labelPos = [
        lateralDir * Math.max(Math.abs(p.x) + 0.07, 0.09),
        p.y,
        p.z + 0.04,
      ]

      onAdd({
        id: Date.now(), type: 'arrow',
        position: pos, labelPos,
        color,
        label: PALETTE.find(pl => pl.color === color)?.label ?? '',
      })
    } else {
      // Zone : sphère existante
      const pos = nw
        ? [p.x + nw.x * 0.012, p.y + nw.y * 0.012, p.z + nw.z * 0.012]
        : [p.x, p.y, p.z]
      onAdd({
        id: Date.now(), type: 'zone',
        position: pos, color,
        radius: dotSize * 2.2,
        label: PALETTE.find(pl => pl.color === color)?.label ?? '',
      })
    }
  }

  return (
    <>
      <primitive object={scene} onClick={handleClick} />
      {annots.map(a => a.type === 'arrow'
        ? <ArrowAnnotation
            key={a.id}
            id={a.id} position={a.position} labelPos={a.labelPos}
            color={a.color} zone={a.zone}
            tool={tool} onRemove={onRemove}
          />
        : <mesh
            key={a.id}
            position={a.position}
            onClick={e => { if (tool === 'effacer') { e.stopPropagation(); onRemove(a.id) } }}
          >
            <sphereGeometry args={[a.radius, 20, 20]} />
            <meshStandardMaterial color={a.color} transparent opacity={0.82} />
          </mesh>
      )}
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
  const fitDistRef     = useRef(null)
  const bboxRef        = useRef(null)
  const [orbitBounds,  setOrbitBounds]  = useState({ min: 0.5, max: 20 })

  /* Client */
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
  const [type,  setType]  = useState('Sophrologie')

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

  function handleBbox(bbox) {
    bboxRef.current = bbox
  }

  function handleFitDist(dist) {
    fitDistRef.current = dist
    const [dx, dy, dz] = CAM_DIR['front']
    if (cameraRef.current) {
      cameraRef.current.position.set(dx * dist, dy * dist, dz * dist)
    }
    if (orbitRef.current) orbitRef.current.update()
    setOrbitBounds({ min: dist * 0.3, max: dist * 5 })
  }

  function changeView(v) {
    setActiveView(v)
    const dist = fitDistRef.current
    if (orbitRef.current && dist) {
      const [dx, dy, dz] = CAM_DIR[v]
      orbitRef.current.object.position.set(dx * dist, dy * dist, dz * dist)
      orbitRef.current.target.set(0, 0, 0)
      orbitRef.current.update()
    }
  }

  function addAnnot(a) {
    const zone       = getNearestAnchor(a.position, bboxRef.current)
    const colorLabel = COLOR_LABELS[a.color] ?? a.label
    setAnnots(prev => [...prev, { ...a, zone }])
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

  async function handleSave() {
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
                  {['Sophrologie','Naturopathie','Coaching','Énergie','Fleurs de Bach','Massage','3D Humain','Autre'].map(t => (
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
              camera={{ position: [0, 0, 3], fov: CAM_FOV }}
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
                minDistance={orbitBounds.min}
                maxDistance={orbitBounds.max}
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
                    onFitDist={handleFitDist}
                    onBbox={handleBbox}
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
                const dist = fitDistRef.current
                if (cameraRef.current && dist) {
                  const [dx, dy, dz] = CAM_DIR[activeView]
                  cameraRef.current.position.set(dx * dist, dy * dist, dz * dist)
                  orbitRef.current?.update()
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
