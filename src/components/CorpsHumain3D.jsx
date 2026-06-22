import { useState, useRef, useEffect, Suspense } from 'react'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { Box3, Vector3 } from 'three'

const PALETTE = [
  { color: '#E53E3E', label: 'Douleur' },
  { color: '#ED8936', label: 'Tension' },
  { color: '#ECC94B', label: 'Chaleur' },
  { color: '#48BB78', label: 'Détente' },
  { color: '#4299E1', label: 'Froid' },
  { color: '#9F7AEA', label: 'Engourdissement' },
  { color: '#ED64A6', label: 'Picotement' },
  { color: '#C17A3A', label: 'Brûlure' },
]

const CAM_POS = [0, 1, 3]

/* ─── Sphère annotée ─── */
function AnnotationSphere({ id, position, color, label, type, eraserMode, onRemove }) {
  const [hovered, setHovered] = useState(false)
  const radius = type === 'zone' ? 0.036 : 0.018

  function handleClick(e) {
    e.stopPropagation()
    if (eraserMode) onRemove?.(id)
  }

  return (
    <mesh
      position={position}
      onClick={handleClick}
      onPointerOver={e => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 0.6 : 0.2}
        roughness={0.3}
        metalness={0.1}
      />
      {hovered && label && (
        <Html distanceFactor={8} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(26,18,8,0.84)',
            color: '#fff',
            fontSize: 11,
            padding: '3px 9px',
            borderRadius: 5,
            whiteSpace: 'nowrap',
            borderLeft: `3px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}>
            {label}
          </div>
        </Html>
      )}
    </mesh>
  )
}

/* ─── Modèle GLTF + raycasting ─── */
function BodyModel({ annotations, onAddAnnotation, onRemoveAnnotation, activeTool }) {
  const gltf = useLoader(GLTFLoader, '/models/corps/scene.gltf')

  useEffect(() => {
    const scene = gltf.scene
    const box = new Box3().setFromObject(scene)
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 2 / maxDim
    scene.scale.setScalar(scale)
    scene.position.sub(center.multiplyScalar(scale))
  }, [gltf.scene])

  const eraserMode = activeTool === 'effacer'

  function handleClick(e) {
    e.stopPropagation()
    if (eraserMode) return
    const hit = e.intersections[0]
    if (!hit) return
    const { x, y, z } = hit.point
    onAddAnnotation({ x, y, z })
  }

  return (
    <group onClick={handleClick}>
      <primitive object={gltf.scene} />
      {annotations.map((a, i) => (
        <AnnotationSphere
          key={a.id ?? i}
          id={a.id}
          position={[a.x, a.y, a.z]}
          color={a.color}
          label={a.label}
          type={a.type}
          eraserMode={eraserMode}
          onRemove={onRemoveAnnotation}
        />
      ))}
    </group>
  )
}

/* ─── OrbitControls avec reset ─── */
function SceneControls({ resetRef }) {
  const { camera } = useThree()
  const controlsRef = useRef()

  useEffect(() => {
    resetRef.current = () => {
      camera.position.set(...CAM_POS)
      camera.lookAt(0, 0, 0)
      controlsRef.current?.reset()
    }
  }, [camera, resetRef])

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom={true}
      minDistance={0.5}
      maxDistance={10}
      target={[0, 0, 0]}
    />
  )
}

/*
 * ─── Composant principal ───
 *
 * Mode standalone (aucun prop) : gère son propre état + affiche palette/UI.
 * Mode contrôlé (annotations + onAddAnnotation fournis) : délègue tout au parent,
 * showUI={false} masque la palette et les overlays internes.
 */
export default function CorpsHumain3D({
  annotations: propAnnotations,
  onAddAnnotation: propOnAdd,
  onRemoveAnnotation: propOnRemove,
  selectedColor: propColor,
  activeTool = 'point',
  showUI = true,
}) {
  const controlled = propAnnotations !== undefined

  const [internalAnnotations, setInternalAnnotations] = useState([])
  const [internalColor, setInternalColor] = useState(PALETTE[0].color)
  const resetRef = useRef(null)
  const cameraRef = useRef(null)

  const zoomIn = () => {
    if (cameraRef.current)
      cameraRef.current.position.z = Math.max(3, cameraRef.current.position.z - 0.8)
  }
  const zoomOut = () => {
    if (cameraRef.current)
      cameraRef.current.position.z = Math.min(15, cameraRef.current.position.z + 0.8)
  }

  const annotations = controlled ? propAnnotations : internalAnnotations
  const selectedColor = controlled ? (propColor ?? PALETTE[0].color) : internalColor

  function handleAdd({ x, y, z }) {
    const entry = PALETTE.find(p => p.color === selectedColor)
    const annotation = {
      id: Date.now(),
      x, y, z,
      color: selectedColor,
      label: entry?.label ?? '',
      type: activeTool === 'zone' ? 'zone' : 'point',
    }
    if (controlled) {
      propOnAdd?.(annotation)
    } else {
      setInternalAnnotations(prev => [...prev, annotation])
    }
  }

  function handleRemove(id) {
    if (controlled) {
      propOnRemove?.(id)
    } else {
      setInternalAnnotations(prev => prev.filter(a => a.id !== id))
    }
  }

  const activeLabel = PALETTE.find(p => p.color === selectedColor)?.label

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: CAM_POS, fov: 45 }}
        onCreated={({ camera }) => { cameraRef.current = camera }}
        id="canvas-3d-corps"
        style={{ background: '#f5ede0' }}
      >
        <color attach="background" args={['#f5ede0']} />
        <ambientLight intensity={0.6} />
        <directionalLight color="#ffe8cc" position={[5, 10, 5]} intensity={1.2} />
        <directionalLight color="#ffe8cc" position={[-4, 5, -3]} intensity={0.4} />
        <SceneControls resetRef={resetRef} />
        <Suspense fallback={
          <Html center>
            <div style={{ color: '#c17a3a', fontSize: 13, fontWeight: 500 }}>Chargement du modèle…</div>
          </Html>
        }>
          <BodyModel
            annotations={annotations}
            onAddAnnotation={handleAdd}
            onRemoveAnnotation={handleRemove}
            activeTool={activeTool}
          />
        </Suspense>
      </Canvas>

      {/* UI standalone uniquement */}
      {showUI && (
        <>
          <div style={{
            position: 'absolute', bottom: 16, left: 16,
            display: 'flex', gap: 6, alignItems: 'center',
            background: 'rgba(245,237,224,0.92)', backdropFilter: 'blur(6px)',
            padding: '7px 10px', borderRadius: 30,
            border: '0.5px solid rgba(193,122,58,0.3)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
          }}>
            {PALETTE.map(p => (
              <button key={p.color} title={p.label} onClick={() => setInternalColor(p.color)} style={{
                width: 22, height: 22, borderRadius: '50%', background: p.color, cursor: 'pointer',
                border: selectedColor === p.color ? '2.5px solid #c17a3a' : '2px solid rgba(255,255,255,0.7)',
                transform: selectedColor === p.color ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform .15s, border .15s', flexShrink: 0,
              }} />
            ))}
          </div>

          <div style={{
            position: 'absolute', bottom: 54, left: 16,
            fontSize: 11, color: '#c17a3a', fontWeight: 500,
            background: 'rgba(245,237,224,0.92)',
            padding: '3px 9px', borderRadius: 20,
            border: '0.5px solid rgba(193,122,58,0.25)',
          }}>
            {activeLabel}
          </div>


          {annotations.length > 0 && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              fontSize: 11, color: '#c17a3a',
              background: 'rgba(245,237,224,0.92)',
              padding: '3px 9px', borderRadius: 20,
              border: '0.5px solid rgba(193,122,58,0.25)',
            }}>
              {annotations.length} annotation{annotations.length > 1 ? 's' : ''}
            </div>
          )}
        </>
      )}

      {/* Zoom buttons — toujours visibles */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {[
          { label: '+', action: zoomIn, title: 'Zoom avant' },
          { label: '−', action: zoomOut, title: 'Zoom arrière' },
          { label: '⟳', action: () => resetRef.current?.(), title: 'Réinitialiser la caméra' },
        ].map(({ label, action, title }) => (
          <button key={label} onClick={action} title={title} style={{
            width: 32, height: 32,
            background: 'rgba(26,39,68,0.8)',
            border: 'none', borderRadius: 4, cursor: 'pointer',
            color: '#c9a84c', fontSize: 18, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
