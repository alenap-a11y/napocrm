import { useState } from 'react'
import CorpsHumain3D from './CorpsHumain3D'
import { supabase } from '../lib/supabase'

/* ─── Constantes ─── */
const PALETTE = [
  { color: '#E53E3E', label: 'Douleur' },
  { color: '#ED8936', label: 'Tension' },
  { color: '#48BB78', label: 'Détente' },
  { color: '#ECC94B', label: 'Attention' },
  { color: '#4299E1', label: 'Froid' },
  { color: '#9F7AEA', label: 'Énergie' },
  { color: '#ED64A6', label: 'Sensible' },
  { color: '#A0AEC0', label: 'Neutre' },
]

const DUREES = ['15 min', '30 min', '45 min', '1h', '1h15', '1h30', '2h']
const GENRES = ['Femme', 'Homme', 'Autre']

/* ─── Styles partagés ─── */
const S = {
  card: {
    background: '#fff',
    borderRadius: 10,
    border: '0.5px solid rgba(193,122,58,0.18)',
    padding: '12px 14px',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 600, color: '#c17a3a', marginBottom: 10,
  },
  label: {
    fontSize: 10, color: '#a07848',
    textTransform: 'uppercase', letterSpacing: '.06em',
    marginBottom: 3, display: 'block',
  },
  input: {
    width: '100%', padding: '6px 9px',
    borderRadius: 7, border: '0.5px solid rgba(193,122,58,0.28)',
    background: '#fdfaf6', fontSize: 12, color: '#1a1208',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  },
  field: { marginBottom: 8 },
}

/* ─── Composant principal ─── */
export default function FicheSeance({ userId }) {
  /* Client */
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [genre, setGenre] = useState('Femme')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')

  /* Séance */
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [duree, setDuree] = useState('1h')
  const [prix, setPrix] = useState('')

  /* Corps 3D — état contrôlé */
  const [annotations, setAnnotations] = useState([])
  const [selectedColor, setSelectedColor] = useState(PALETTE[0].color)
  const [activeTool, setActiveTool] = useState('point')

  /* Tags */
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')

  /* Notes */
  const [noteInput, setNoteInput] = useState('')
  const [notes, setNotes] = useState([])

  /* UI */
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'ok' | 'error' | null

  /* ── Handlers annotations ── */
  function addAnnotation(point) {
    const entry = PALETTE.find(p => p.color === selectedColor)
    setAnnotations(prev => [...prev, {
      id: Date.now(),
      x: point.x, y: point.y, z: point.z,
      color: selectedColor,
      label: entry?.label ?? '',
      type: activeTool === 'zone' ? 'zone' : 'point',
    }])
  }

  function removeAnnotation(id) {
    setAnnotations(prev => prev.filter(a => a.id !== id))
  }

  /* ── Handlers tags ── */
  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  /* ── Handlers notes ── */
  function addNote() {
    const t = noteInput.trim()
    if (!t) return
    setNotes(prev => [
      ...prev,
      { text: t, date: new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) },
    ])
    setNoteInput('')
  }

  /* ── Sauvegarde Supabase ── */
  async function saveSeance() {
    setSaving(true)
    setSaveStatus(null)

    /* 1. Upsert client */
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .upsert(
        { user_id: userId, nom, prenom, genre, telephone, email },
        { onConflict: 'user_id,email', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (clientErr) {
      console.error('clients:', clientErr)
      setSaveStatus('error')
      setSaving(false)
      return
    }

    /* 2. Insert séance */
    const { error: seanceErr } = await supabase
      .from('seances')
      .insert({
        user_id: userId,
        client_id: client.id,
        date,
        duree,
        prix: prix ? parseFloat(prix) : null,
        notes_json: notes,
        annotations_json: annotations,
        tags_json: tags,
      })

    setSaving(false)
    setSaveStatus(seanceErr ? 'error' : 'ok')
    if (!seanceErr) setTimeout(() => setSaveStatus(null), 3000)
  }

  /* ── Render ── */
  return (
    <div style={{
      display: 'flex', height: '100%',
      background: '#f5ede0',
      gap: 10, padding: 12,
      overflow: 'hidden', boxSizing: 'border-box',
    }}>

      {/* ══════════ COLONNE GAUCHE ══════════ */}
      <div style={{ width: 200, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Identité client */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Identité client</div>

          {[
            { lbl: 'Nom', val: nom, set: setNom },
            { lbl: 'Prénom', val: prenom, set: setPrenom },
          ].map(f => (
            <div key={f.lbl} style={S.field}>
              <span style={S.label}>{f.lbl}</span>
              <input style={S.input} value={f.val} onChange={e => f.set(e.target.value)} />
            </div>
          ))}

          <div style={S.field}>
            <span style={S.label}>Genre</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {GENRES.map(g => (
                <button key={g} onClick={() => setGenre(g)} style={{
                  flex: 1, padding: '4px 2px', borderRadius: 6, fontSize: 10,
                  border: genre === g ? '1.5px solid #c17a3a' : '0.5px solid rgba(193,122,58,0.28)',
                  background: genre === g ? '#faeeda' : '#fdfaf6',
                  color: genre === g ? '#c17a3a' : '#8a7060',
                  cursor: 'pointer', fontWeight: genre === g ? 600 : 400,
                }}>{g}</button>
              ))}
            </div>
          </div>

          {[
            { lbl: 'Téléphone', val: telephone, set: setTelephone, type: 'tel' },
            { lbl: 'Email', val: email, set: setEmail, type: 'email' },
          ].map(f => (
            <div key={f.lbl} style={{ ...S.field, marginBottom: f.lbl === 'Email' ? 0 : 8 }}>
              <span style={S.label}>{f.lbl}</span>
              <input style={S.input} type={f.type} value={f.val} onChange={e => f.set(e.target.value)} />
            </div>
          ))}
        </div>

        {/* Détails séance */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Détails séance</div>

          <div style={S.field}>
            <span style={S.label}>Date</span>
            <input style={S.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div style={S.field}>
            <span style={S.label}>Durée</span>
            <select style={S.input} value={duree} onChange={e => setDuree(e.target.value)}>
              {DUREES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={{ ...S.field, marginBottom: 0 }}>
            <span style={S.label}>Prix (€)</span>
            <input style={S.input} type="number" min="0" placeholder="0" value={prix} onChange={e => setPrix(e.target.value)} />
          </div>
        </div>
      </div>

      {/* ══════════ COLONNE CENTRE ══════════ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Corps 3D */}
        <div style={{ flex: 1, minHeight: 0, borderRadius: 12, overflow: 'hidden', border: '0.5px solid rgba(193,122,58,0.18)' }}>
          <CorpsHumain3D
            annotations={annotations}
            onAddAnnotation={addAnnotation}
            onRemoveAnnotation={removeAnnotation}
            selectedColor={selectedColor}
            activeTool={activeTool}
            showUI={false}
          />
        </div>

        {/* Palette + Outils + Tags */}
        <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Palette */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ ...S.label, marginBottom: 0, flexShrink: 0 }}>Couleur</span>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
              {PALETTE.map(p => (
                <button
                  key={p.color}
                  title={p.label}
                  onClick={() => setSelectedColor(p.color)}
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: p.color, cursor: 'pointer', flexShrink: 0,
                    border: selectedColor === p.color ? '2.5px solid #c17a3a' : '2px solid rgba(255,255,255,0.8)',
                    transform: selectedColor === p.color ? 'scale(1.18)' : 'scale(1)',
                    transition: 'all .12s',
                  }}
                />
              ))}
              <span style={{ fontSize: 11, color: '#c17a3a', fontWeight: 500, marginLeft: 2 }}>
                {PALETTE.find(p => p.color === selectedColor)?.label}
              </span>
            </div>
          </div>

          {/* Outils */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ ...S.label, marginBottom: 0, flexShrink: 0 }}>Outil</span>
            <div style={{ display: 'flex', gap: 5 }}>
              {[
                { id: 'point',   icon: 'ti-circle-dot', label: 'Point' },
                { id: 'zone',    icon: 'ti-circle',     label: 'Zone' },
                { id: 'effacer', icon: 'ti-eraser',     label: 'Effacer' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTool(t.id)}
                  style={{
                    padding: '5px 11px', borderRadius: 7, fontSize: 12,
                    border: activeTool === t.id ? '1.5px solid #c17a3a' : '0.5px solid rgba(193,122,58,0.28)',
                    background: activeTool === t.id ? '#faeeda' : '#fdfaf6',
                    color: activeTool === t.id ? '#c17a3a' : '#8a7060',
                    cursor: 'pointer', fontWeight: activeTool === t.id ? 600 : 400,
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <i className={`ti ${t.icon}`} style={{ fontSize: 13 }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            {tags.length > 0 && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 7 }}>
                {tags.map(t => (
                  <span key={t} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: '#faeeda', color: '#c17a3a', fontSize: 11,
                    padding: '3px 9px', borderRadius: 20,
                    border: '0.5px solid rgba(193,122,58,0.28)',
                  }}>
                    {t}
                    <button onClick={() => setTags(prev => prev.filter(x => x !== t))} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#c17a3a', fontSize: 13, padding: 0, lineHeight: 1,
                    }}>×</button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                style={{ ...S.input, flex: 1 }}
                placeholder="Tag observation… (Entrée pour ajouter)"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
              />
              <button onClick={addTag} style={{
                padding: '6px 11px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                border: '0.5px solid rgba(193,122,58,0.28)', background: '#fdfaf6',
                color: '#c17a3a', cursor: 'pointer',
              }}>+</button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ COLONNE DROITE ══════════ */}
      <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Notes */}
        <div style={{ ...S.card, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={S.sectionTitle}>Notes</div>

          <textarea
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && e.ctrlKey && addNote()}
            placeholder="Observations, ressentis…"
            rows={5}
            style={{
              ...S.input, resize: 'none', lineHeight: 1.5, marginBottom: 8,
            }}
          />

          <button onClick={addNote} style={{
            width: '100%', padding: '7px', borderRadius: 7, fontSize: 12,
            border: '0.5px solid rgba(193,122,58,0.28)',
            background: '#fdfaf6', color: '#c17a3a',
            cursor: 'pointer', fontWeight: 500, marginBottom: 10,
          }}>
            + Ajouter note
          </button>

          {/* Historique */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {notes.length === 0 ? (
              <div style={{ fontSize: 11, color: '#b8a090', textAlign: 'center', marginTop: 6 }}>
                Aucune note
              </div>
            ) : notes.map((n, i) => (
              <div key={i} style={{
                background: '#fdfaf6', borderRadius: 8, padding: '7px 9px',
                border: '0.5px solid rgba(193,122,58,0.18)',
              }}>
                <div style={{ fontSize: 9, color: '#a07848', marginBottom: 3 }}>{n.date}</div>
                <div style={{ fontSize: 12, color: '#1a1208', lineHeight: 1.5 }}>{n.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bouton Sauvegarder */}
        <button
          onClick={saveSeance}
          disabled={saving}
          style={{
            width: '100%', padding: '11px', borderRadius: 10,
            border: 'none',
            background: saveStatus === 'ok' ? '#48BB78' : saveStatus === 'error' ? '#E53E3E' : '#c17a3a',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.75 : 1,
            transition: 'background .3s',
            flexShrink: 0,
          }}
        >
          {saving
            ? 'Sauvegarde…'
            : saveStatus === 'ok'
            ? '✓ Sauvegardé'
            : saveStatus === 'error'
            ? '✗ Erreur'
            : 'Sauvegarder séance'}
        </button>
      </div>
    </div>
  )
}
