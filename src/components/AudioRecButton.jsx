import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const BUCKET = 'oracle-audio'
const MIMES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']

// Pourquoi : Chrome enregistre en webm, Safari/iOS en mp4. On détecte le format
// supporté au lieu de le supposer, sinon ça casse en silence sur iPhone.
function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null
  return MIMES.find(m => MediaRecorder.isTypeSupported(m)) || ''
}

function fmt(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const btn = {
  display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 6,
  border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)',
  color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap'
}

// path = chemin Storage actuel (ou null) ; folder = "seanceId/tirageId" ;
// onChange(nouveauPath|null) : le parent stocke le chemin, ce composant ne touche pas à la base.
export default function AudioRecButton({ path, folder, onChange, maxSeconds = 180 }) {
  const [status, setStatus] = useState('idle')
  const [elapsed, setElapsed] = useState(0)
  const [signed, setSigned] = useState(null)
  // Pourquoi : dérivé du path courant, une URL signée périmée ne s'affiche jamais
  const url = signed && signed.path === path ? signed.url : null
  const [error, setError] = useState('')
  const recRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const chunksRef = useRef([])
  const aliveRef = useRef(true)
  const onChangeRef = useRef(onChange)
  const pathRef = useRef(path)
  // Pourquoi : envoyer() s'exécute après une longue capture ; sans ces refs il utiliserait un
  // onChange/path périmés et écraserait les saisies faites pendant l'enregistrement.
  useEffect(() => { onChangeRef.current = onChange; pathRef.current = path })

  // Pourquoi : si on quitte la page en pleine capture, on coupe le micro et on jette l'audio.
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      clearInterval(timerRef.current)
      if (recRef.current && recRef.current.state === 'recording') {
        recRef.current.onstop = null
        recRef.current.stop()
      }
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // Pourquoi : bucket privé, donc lecture uniquement via URL signée (1 h).
  useEffect(() => {
    let annule = false
    if (!path) return
    supabase.storage.from(BUCKET).createSignedUrl(path, 3600).then(({ data, error: e }) => {
      if (annule) return
      if (e || !data) setError('Audio introuvable')
      else setSigned({ path, url: data.signedUrl })
    })
    return () => { annule = true }
  }, [path])

  function arreter() {
    clearInterval(timerRef.current)
    if (recRef.current && recRef.current.state === 'recording') recRef.current.stop()
  }

  async function envoyer(mimeFull) {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (!aliveRef.current) return
    const mime = mimeFull.split(';')[0]
    const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm'
    const blob = new Blob(chunksRef.current, { type: mime })
    if (blob.size === 0) { setStatus('idle'); setError('Enregistrement vide'); return }
    setStatus('uploading')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStatus('idle'); setError('Session expirée'); return }
    const nouveau = `${user.id}/${folder}/${Date.now()}.${ext}`
    const { error: e } = await supabase.storage.from(BUCKET).upload(nouveau, blob, { contentType: mime })
    if (e) { setStatus('idle'); setError("Échec de l'envoi : " + e.message); return }
    const ancien = pathRef.current
    onChangeRef.current(nouveau)
    setStatus('idle')
    if (ancien) await supabase.storage.from(BUCKET).remove([ancien])
  }

  async function demarrer() {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Enregistrement non supporté par ce navigateur')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = pickMime()
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = () => envoyer(rec.mimeType || mime || 'audio/webm')
      recRef.current = rec
      rec.start()
      setElapsed(0)
      setStatus('recording')
      const t0 = Date.now()
      timerRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - t0) / 1000)
        setElapsed(s)
        if (s >= maxSeconds) arreter()
      }, 500)
    } catch (e) {
      streamRef.current?.getTracks().forEach(t => t.stop())
      setStatus('idle')
      setError(e.name === 'NotAllowedError' ? 'Micro refusé : autorise-le dans le navigateur' : 'Micro indisponible')
    }
  }

  async function supprimer() {
    if (!path) return
    const { error: e } = await supabase.storage.from(BUCKET).remove([path])
    if (e) { setError('Suppression impossible : ' + e.message); return }
    onChange(null)
  }

  return (
    <>
      {status === 'idle' && (
        <button type="button" onClick={demarrer} style={btn} aria-label={path ? 'Réenregistrer' : 'Enregistrer'}>
          <i className="ti ti-microphone" style={{ fontSize: 14 }} />{path ? 'Refaire' : 'REC'}
        </button>
      )}
      {status === 'recording' && (
        <button type="button" onClick={arreter} style={{ ...btn, color: '#c0392b', borderColor: '#c0392b' }} aria-label="Arrêter">
          <i className="ti ti-player-stop" style={{ fontSize: 14 }} />{fmt(elapsed)} / {fmt(maxSeconds)}
        </button>
      )}
      {status === 'uploading' && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Envoi…</span>}
      {path && status === 'idle' && (
        <button type="button" onClick={supprimer} style={btn} aria-label="Supprimer l'audio">
          <i className="ti ti-trash" style={{ fontSize: 14 }} />
        </button>
      )}
      {url && status === 'idle' && (
        <audio controls src={url} style={{ height: 32, flexBasis: '100%' }} />
      )}
      {error && <span style={{ fontSize: 11, color: '#c0392b', flexBasis: '100%' }}>{error}</span>}
    </>
  )
}
