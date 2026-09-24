import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BodySchema3D, { COLOR_LABELS } from '../components/BodySchema3D'

const MOIS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']

function fmtDate(d) {
  if (!d) return ''
  const [y, m, j] = d.slice(0, 10).split('-')
  return `${parseInt(j)} ${MOIS[parseInt(m) - 1]} ${y}`
}

export default function Napo3DSeance() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [seance, setSeance]         = useState(null)
  const [client, setClient]         = useState(null)
  const [historique, setHistorique] = useState([])
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('seances').select('*').eq('id', id).single()
      if (!s) { navigate('/napo-3d'); return }
      setSeance(s)

      if (s.client_id) {
        const { data: c } = await supabase.from('clients').select('prenom, nom, email, tel').eq('id', s.client_id).single()
        setClient(c)
        const { data: hist } = await supabase.from('seances')
          .select('id, date_seance, heure_seance')
          .eq('client_id', s.client_id)
          .eq('type_seance', '3D Humain')
          .order('date_seance', { ascending: false })
        setHistorique(hist || [])
      } else {
        setClient({ prenom: s.prenom, nom: s.nom })
        setHistorique([{ id: s.id, date_seance: s.date_seance, heure_seance: s.heure_seance }])
      }
      setLoading(false)
    }
    load()
  }, [id])

  function updateField(field, value) {
    setSeance(prev => ({ ...prev, [field]: value }))
  }

  function handleAnnotAdd(a) {
    setSeance(prev => ({ ...prev, schema_annotations: [...(Array.isArray(prev.schema_annotations) ? prev.schema_annotations : []), a] }))
  }

  function handleAnnotRemove(annotId) {
    setSeance(prev => ({ ...prev, schema_annotations: (Array.isArray(prev.schema_annotations) ? prev.schema_annotations : []).filter(a => a.id !== annotId) }))
  }

  function handleAnnotClearAll() {
    setSeance(prev => ({ ...prev, schema_annotations: [] }))
  }

  async function handleSave() {
    setSaving(true)
    const annots      = Array.isArray(seance.schema_annotations) ? seance.schema_annotations : []
    const zonesCorps  = [...new Set(annots.filter(a => a.zone).map(a => a.zone))]
    await supabase.from('seances').update({
      date_seance:        seance.date_seance,
      heure_seance:       seance.heure_seance,
      duree_minutes:      parseInt(seance.duree_minutes) || 60,
      prix_euros:         parseFloat(seance.prix_euros) || null,
      notes:              seance.notes,
      notes_libres:       seance.notes_libres || null,
      schema_annotations: annots.length ? annots : null,
      zones_corps:        zonesCorps.length ? zonesCorps : null,
    }).eq('id', id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--color-text-secondary)', fontSize: 13 }}>Chargement…</div>

  const inp = { padding: '5px 8px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 12, boxSizing: 'border-box', fontFamily: 'inherit' }

  const annotations = Array.isArray(seance.schema_annotations) ? seance.schema_annotations : []
  const tags        = Array.isArray(seance.tags) ? seance.tags : []

  return (
    <div style={{ padding: '1.6rem 2rem', fontFamily: 'inherit', maxWidth: 1400 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.2rem' }}>
        <button onClick={() => navigate('/napo-3d')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 15 }} />Retour
        </button>
        <span style={{ color: 'var(--color-border-secondary)' }}>/</span>
        <i className="ti ti-3d-cube-sphere" style={{ fontSize: 18, color: 'var(--color-accent)' }} />
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {client?.prenom} {client?.nom} — Séance 3D
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: 11, color: '#16A34A', background: '#F0FDF4', border: '0.5px solid #A7F3D0', padding: '3px 10px', borderRadius: 6 }}>Sauvegardé ✓</span>}
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            <i className="ti ti-device-floppy" style={{ fontSize: 14 }} />{saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* ── Colonne gauche : informations de séance ── */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', width: 50 }}>Date</span>
                <input type="date" value={seance.date_seance || ''} onChange={e => updateField('date_seance', e.target.value)} style={{ ...inp, fontSize: 12, flex: 1 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', width: 50 }}>Heure</span>
                <input type="time" value={seance.heure_seance?.slice(0, 5) || ''} onChange={e => updateField('heure_seance', e.target.value)} style={{ ...inp, fontSize: 12, flex: 1 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', width: 50 }}>Durée</span>
                <select value={seance.duree_minutes || '60'} onChange={e => updateField('duree_minutes', e.target.value)} style={{ ...inp, flex: 1 }}>
                  {[30, 45, 60, 75, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', width: 50 }}>Prix</span>
                <input type="number" value={seance.prix_euros || ''} onChange={e => updateField('prix_euros', e.target.value)} placeholder="60" min="0" step="5" style={{ ...inp, flex: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>€</span>
              </div>
            </div>

            {historique.length > 1 && (
              <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', paddingTop: 12 }}>
                <div style={{ fontSize: 9, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Historique séances 3D — {client?.prenom} {client?.nom}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {historique.map((h, idx) => (
                    <span key={h.id} onClick={() => navigate(`/napo-3d/seance/${h.id}`)}
                      style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', background: h.id === id ? '#1e293b' : 'var(--color-background-primary)', color: h.id === id ? '#fff' : 'var(--color-text-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
                      #{historique.length - idx} {h.date_seance ? fmtDate(h.date_seance) : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', paddingTop: 12, marginTop: 12 }}>
              <div style={{ fontSize: 9, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>Notes libres</div>
              <textarea value={seance.notes_libres || ''} onChange={e => updateField('notes_libres', e.target.value)}
                rows={5} placeholder="Remarques personnelles…"
                style={{ ...inp, width: '100%', resize: 'none', lineHeight: 1.6 }} />
            </div>
          </div>
        </div>

        {/* ── Colonne principale : schéma corporel + observations ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10 }}>
              <i className="ti ti-map-pin" style={{ fontSize: 13, marginRight: 5, color: 'var(--color-accent)' }} />
              Schéma corporel
            </div>
            <div style={{ height: 720, borderRadius: 10, overflow: 'hidden', border: '0.5px solid var(--color-border-tertiary)' }}>
              <BodySchema3D
                annots={annotations}
                onAdd={handleAnnotAdd}
                onRemove={handleAnnotRemove}
                onClearAll={handleAnnotClearAll}
              />
            </div>
          </div>

          {tags.length > 0 && (
            <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>Observations clés</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tags.map(t => (
                  <span key={t} style={{ fontSize: 11, fontWeight: 600, background: '#EEEDFE', color: '#534AB7', padding: '3px 10px', borderRadius: 20 }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Colonne droite : notes de séance ── */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', height: 720 }}>
            <div style={{ fontSize: 9, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>Notes de séance</div>
            <textarea value={seance.notes || ''} onChange={e => updateField('notes', e.target.value)}
              placeholder="Observations, ressenti général…"
              style={{ ...inp, width: '100%', flex: 1, resize: 'none', lineHeight: 1.6 }} />

            {annotations.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid var(--color-border-tertiary)', maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 9, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Annotations schéma</div>
                {annotations.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.color || '#999', flexShrink: 0, marginTop: 3 }} />
                    <span style={{ fontSize: 11, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
                      {a.label || COLOR_LABELS[a.color] || ''}{a.zone ? ` · ${a.zone}` : ''}{a.detail ? ` · ${a.detail}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          <i className="ti ti-device-floppy" style={{ fontSize: 15 }} />{saving ? 'Sauvegarde…' : 'Sauvegarder la séance'}
        </button>
      </div>

    </div>
  )
}
