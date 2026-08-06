import { useState, useRef, useEffect, useMemo, Suspense, Component } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html, useGLTF } from '@react-three/drei'
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

export const PALETTE = [
  { color: '#c0392b', label: 'Douleur'  },
  { color: '#d4711e', label: 'Tension'  },
  { color: '#c9a84c', label: 'Or'       },
  { color: '#27ae60', label: 'Bien-être'},
  { color: '#2980b9', label: 'Froid'    },
  { color: '#8e44ad', label: 'Énergie'  },
  { color: '#c0607a', label: 'Sensible' },
  { color: '#5d4037', label: 'Zone'     },
]

// Directions unitaires par vue — la distance est calculée dynamiquement
// au chargement du modèle via "fit camera to bounding sphere"
const CAM_DIR = {
  front: [0, 0,  1],
  back:  [0, 0, -1],
  left:  [-1, 0, 0],
}
const CAM_FOV = 20 // doit correspondre au fov du Canvas

export const COLOR_LABELS = {
  '#c0392b': 'Douleur',
  '#d4711e': 'Tension',
  '#c9a84c': 'Attention',
  '#27ae60': 'Détente',
  '#2980b9': 'Froid',
  '#8e44ad': 'Énergie',
  '#c0607a': 'Sensible',
  '#5d4037': 'Neutre',
  '#c62828': 'Muladhara · Racine',
  '#ef6c00': 'Svadhisthana · Sacré',
  '#fbc02d': 'Manipura · Plexus solaire',
  '#2e7d32': 'Anahata · Cœur',
  '#1565c0': 'Vishuddha · Gorge',
  '#3f51b5': 'Ajna · 3e œil',
  '#b39ddb': 'Sahasrara · Couronne',
}

// ─── Mode Énergie : chakras + qualificatifs de douleur ─────────────────────
export const CHAKRAS = [
  { label: 'Muladhara · Racine',          colorName: 'Rouge',        color: '#c62828' },
  { label: 'Svadhisthana · Sacré',        colorName: 'Orange',       color: '#ef6c00' },
  { label: 'Manipura · Plexus solaire',   colorName: 'Jaune',        color: '#fbc02d' },
  { label: 'Anahata · Cœur',              colorName: 'Vert',         color: '#2e7d32' },
  { label: 'Vishuddha · Gorge',           colorName: 'Bleu',         color: '#1565c0' },
  { label: 'Ajna · 3e œil',               colorName: 'Indigo',       color: '#3f51b5' },
  { label: 'Sahasrara · Couronne',        colorName: 'Violet clair', color: '#b39ddb' },
]

export const DOULEUR_ENERGIE_ITEMS = [
  { label: 'Tension',   color: '#d4711e' },
  { label: 'Attention', color: '#c9a84c' },
  { label: 'Détente',   color: '#27ae60' },
  { label: 'Froid',     color: '#2980b9' },
  { label: 'Sensible',  color: '#c0607a' },
  { label: 'Neutre',    color: '#5d4037' },
]

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

function BodyMesh({ annots, onAdd, onRemove, tool, color, dotSize, energyMode, modelHeightRef, onFitDist, onBbox }) {
  const { scene } = useGLTF('/models/corps/scene.gltf')
  const [pending,     setPending]     = useState(null)
  const [pendingText, setPendingText] = useState('')
  const [energyPick,  setEnergyPick]  = useState(null) // { stage:'menu'|'chakra'|'douleur', type, pos, labelPos }

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

  // Valide l'annotation en attente : le texte libre s'ajoute au label couleur/zone existant
  function confirmPending() {
    if (!pending) return
    const detail = pendingText.trim()
    onAdd({ ...pending, detail: detail || undefined })
    setPending(null)
    setPendingText('')
  }

  function cancelPending() {
    setPending(null)
    setPendingText('')
  }

  // Finalise le choix Chakra/Douleur du mode Énergie : la couleur en découle automatiquement,
  // puis on enchaîne sur la saisie libre déjà existante (état `pending`)
  function chooseEnergyColor(item) {
    if (!energyPick) return
    const base = { id: Date.now(), type: energyPick.type, position: energyPick.pos, color: item.color, label: item.label }
    setPending(energyPick.type === 'arrow'
      ? { ...base, labelPos: energyPick.labelPos }
      : { ...base, radius: dotSize * 2.2 })
    setPendingText('')
    setEnergyPick(null)
  }

  function cancelEnergyPick() {
    setEnergyPick(null)
  }

  function handleClick(e) {
    e.stopPropagation()
    if (pending || energyPick) return // une saisie/un choix est déjà en cours
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

    let type, pos, labelPos = null

    if (tool === 'point') {
      type = 'arrow'
      // Point de contact légèrement en surface
      pos = nw
        ? [p.x + nw.x * 0.006, p.y + nw.y * 0.006, p.z + nw.z * 0.006]
        : [p.x, p.y, p.z]

      // Label poussé latéralement vers le bord du corps + légèrement en avant
      const lateralDir = Math.sign(p.x) || 1
      labelPos = [
        lateralDir * Math.max(Math.abs(p.x) + 0.07, 0.09),
        p.y,
        p.z + 0.04,
      ]
    } else {
      type = 'zone'
      pos = nw
        ? [p.x + nw.x * 0.012, p.y + nw.y * 0.012, p.z + nw.z * 0.012]
        : [p.x, p.y, p.z]
    }

    if (energyMode) {
      setEnergyPick({ stage: 'menu', type, pos, labelPos })
      return
    }

    const baseLabel = PALETTE.find(pl => pl.color === color)?.label ?? ''
    setPending(type === 'arrow'
      ? { id: Date.now(), type, position: pos, labelPos, color, label: baseLabel }
      : { id: Date.now(), type, position: pos, color, radius: dotSize * 2.2, label: baseLabel })
    setPendingText('')
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

      {/* Saisie libre inline avant validation de l'annotation en attente */}
      {pending && (
        <Html position={pending.labelPos || pending.position} center style={{ pointerEvents: 'auto' }}>
          <form
            onSubmit={e => { e.preventDefault(); confirmPending() }}
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#1a2744', padding: '4px 5px', borderRadius: 6,
              boxShadow: '0 2px 10px rgba(0,0,0,0.4)', whiteSpace: 'nowrap',
            }}
          >
            <input
              autoFocus
              value={pendingText}
              onChange={e => setPendingText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') cancelPending() }}
              placeholder="Précision (optionnel)…"
              style={{
                border: 'none', outline: 'none', fontSize: 11, padding: '3px 6px',
                borderRadius: 3, width: 150, fontFamily: 'inherit',
              }}
            />
            <button type="submit" title="Valider" style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>✓</button>
            <button type="button" onClick={cancelPending} title="Annuler" style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: '0 2px' }}>✕</button>
          </form>
        </Html>
      )}

      {/* Menu Chakra / Douleur du mode Énergie */}
      {energyPick && (
        <Html position={energyPick.labelPos || energyPick.pos} center style={{ pointerEvents: 'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#1a2744', borderRadius: 8, padding: 8,
            boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', gap: 3, minWidth: 190,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              {energyPick.stage !== 'menu' && (
                <button onClick={() => setEnergyPick(prev => ({ ...prev, stage: 'menu' }))} title="Retour"
                  style={{ background: 'none', border: 'none', color: '#c9a84c', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}>←</button>
              )}
              <span style={{ flex: 1, fontSize: 10, color: '#c9a84c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                {energyPick.stage === 'menu' ? 'Énergie' : energyPick.stage === 'chakra' ? 'Chakra' : 'Douleur'}
              </span>
              <button onClick={cancelEnergyPick} title="Annuler"
                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
            </div>

            {energyPick.stage === 'menu' && (
              <>
                <button onClick={() => setEnergyPick(prev => ({ ...prev, stage: 'chakra' }))} style={{
                  textAlign: 'left', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff',
                  fontSize: 12, padding: '7px 10px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
                }}>Chakra</button>
                <button onClick={() => setEnergyPick(prev => ({ ...prev, stage: 'douleur' }))} style={{
                  textAlign: 'left', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff',
                  fontSize: 12, padding: '7px 10px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
                }}>Douleur</button>
              </>
            )}

            {energyPick.stage === 'chakra' && CHAKRAS.map(c => (
              <button key={c.color} onClick={() => chooseEnergyColor(c)} style={{
                display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left',
                background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff',
                fontSize: 11, padding: '5px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                {c.label}
              </button>
            ))}

            {energyPick.stage === 'douleur' && DOULEUR_ENERGIE_ITEMS.map(d => (
              <button key={d.color} onClick={() => chooseEnergyColor(d)} style={{
                display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left',
                background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff',
                fontSize: 11, padding: '5px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                {d.label}
              </button>
            ))}
          </div>
        </Html>
      )}
    </>
  )
}

/* ─── Schéma corporel 3D — composant réutilisable et éditable ─── */

export default function BodySchema3D({ annots, onAdd, onRemove, onClearAll, style }) {
  const orbitRef       = useRef()
  const cameraRef      = useRef(null)
  const modelHeightRef = useRef(0.3)
  const fitDistRef     = useRef(null)
  const bboxRef        = useRef(null)
  const [orbitBounds,  setOrbitBounds]  = useState({ min: 0.5, max: 20 })

  const [activeView, setActiveView] = useState('front')
  const [tool,       setTool]       = useState('point')
  const [color,      setColor]      = useState('#c0392b')
  const [dotSize,    setDotSize]    = useState(0.025)
  const [energyMode, setEnergyMode] = useState(false)

  /* Canvas WebGL — clé pour forcer le remount après context loss */
  const [canvasKey, setCanvasKey] = useState(0)

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
    const zone = getNearestAnchor(a.position, bboxRef.current)
    onAdd?.({ ...a, zone })
  }

  function removeAnnot(id) {
    onRemove?.(id)
  }

  const usedColors = [...new Set(annots.map(a => a.color))]

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden', minWidth: 0, ...style }}>

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
                tool={tool} color={color} dotSize={dotSize} energyMode={energyMode}
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
          <button onClick={() => onClearAll?.()} style={{ fontSize: 10, color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
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
        <button onClick={() => setEnergyMode(v => !v)} title="Mode Énergie : choix Chakra ou Douleur au clic" style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 12px', borderRadius: 3, cursor: 'pointer',
          border: `1px solid ${energyMode ? '#8e44ad' : '#e5e7eb'}`,
          background: energyMode ? '#8e44ad' : '#fff',
          color: energyMode ? '#fff' : '#6b7280',
          fontSize: 11, fontWeight: energyMode ? 700 : 400,
          transition: 'background .1s',
        }}>
          <i className="ti ti-bolt" style={{ fontSize: 12 }} />
          Énergie
        </button>
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
            const label = PALETTE.find(pl => pl.color === c)?.label ?? COLOR_LABELS[c] ?? ''
            const cnt = annots.filter(a => a.color === c).length
            return (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: '#6b7280' }}>{label} ({cnt})</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
