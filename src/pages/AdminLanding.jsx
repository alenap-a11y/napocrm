import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FIELDS = [
  { section: 'Header', fields: [
    { key: 'header_tagline', label: 'Tagline header' },
  ]},
  { section: 'Hero', fields: [
    { key: 'hero_badge',    label: 'Badge hero' },
    { key: 'hero_title',   label: 'Titre principal' },
    { key: 'hero_subtitle',label: 'Sous-titre', textarea: true },
    { key: 'hero_cta',     label: 'Bouton CTA' },
    { key: 'hero_tagline', label: 'Tagline sous CTA' },
  ]},
  { section: 'Fonctionnalités', fields: [
    { key: 'features_badge', label: 'Badge section' },
    { key: 'features_title', label: 'Titre section' },
    { key: 'features_sub',   label: 'Sous-titre section', textarea: true },
    { key: 'feat_1_title', label: 'Feature 1 — Titre' },
    { key: 'feat_1_desc',  label: 'Feature 1 — Description', textarea: true },
    { key: 'feat_2_title', label: 'Feature 2 — Titre' },
    { key: 'feat_2_desc',  label: 'Feature 2 — Description', textarea: true },
    { key: 'feat_3_title', label: 'Feature 3 — Titre' },
    { key: 'feat_3_desc',  label: 'Feature 3 — Description', textarea: true },
    { key: 'feat_4_title', label: 'Feature 4 — Titre' },
    { key: 'feat_4_desc',  label: 'Feature 4 — Description', textarea: true },
    { key: 'feat_5_title', label: 'Feature 5 — Titre' },
    { key: 'feat_5_desc',  label: 'Feature 5 — Description', textarea: true },
    { key: 'feat_6_title', label: 'Feature 6 — Titre' },
    { key: 'feat_6_desc',  label: 'Feature 6 — Description', textarea: true },
  ]},
  { section: 'Footer', fields: [
    { key: 'footer_city', label: 'Ville (footer)' },
  ]},
]

const FONTS = ['inherit', 'Georgia, serif', 'system-ui, sans-serif', 'Montserrat, sans-serif', 'Playfair Display, serif', 'monospace']
const SIZES = ['11px','12px','13px','14px','15px','16px','17px','18px','20px','24px','28px','32px','36px','46px']

function FieldCard({ fieldKey, label, textarea, data, onSaved }) {
  const row = data[fieldKey] || { value: '', color: '#111827', font_size: '16px', font_family: 'inherit' }
  const [editing, setEditing]     = useState(false)
  const [draft,   setDraft]       = useState(row)
  const [saving,  setSaving]      = useState(false)
  const [msg,     setMsg]         = useState('')

  useEffect(() => {
    setDraft(data[fieldKey] || { value: '', color: '#111827', font_size: '16px', font_family: 'inherit' })
  }, [data, fieldKey])

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('landing_content').upsert({
      key: fieldKey,
      value: draft.value,
      color: draft.color,
      font_size: draft.font_size,
      font_family: draft.font_family,
    }, { onConflict: 'key' })
    setSaving(false)
    if (error) { setMsg('✗ ' + error.message) }
    else { setMsg('✓ Sauvegardé'); onSaved(fieldKey, draft); setEditing(false) }
    setTimeout(() => setMsg(''), 2500)
  }

  const previewStyle = {
    color: row.color || '#111827',
    fontSize: row.font_size || '16px',
    fontFamily: row.font_family || 'inherit',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  }

  const inp = {
    width: '100%', padding: '7px 10px', borderRadius: 7,
    border: '0.5px solid var(--color-border-secondary)',
    background: 'var(--color-background-primary)',
    color: 'var(--color-text-primary)', fontSize: 12,
    boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden', marginBottom: 10 }}>
      {/* Aperçu */}
      <div style={{ padding: '12px 16px', borderBottom: editing ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>{label}</div>
        <div style={previewStyle}>{row.value || <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>—</span>}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <button onClick={() => { setDraft(row); setEditing(e => !e) }}
            style={{ padding: '4px 12px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: editing ? 'var(--color-background-primary)' : 'transparent', color: 'var(--color-text-secondary)', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
            {editing ? 'Annuler' : '✎ Éditer'}
          </button>
          {msg && <span style={{ fontSize: 11, color: msg.startsWith('✓') ? '#3B6D11' : '#993556' }}>{msg}</span>}
        </div>
      </div>

      {/* Formulaire inline */}
      {editing && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Texte */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Texte</div>
            {textarea ? (
              <textarea value={draft.value} onChange={e => setDraft(d => ({ ...d, value: e.target.value }))}
                rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
            ) : (
              <input value={draft.value} onChange={e => setDraft(d => ({ ...d, value: e.target.value }))} style={inp} />
            )}
          </div>

          {/* Couleur + Taille + Police */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Couleur</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="color" value={draft.color || '#111827'} onChange={e => setDraft(d => ({ ...d, color: e.target.value }))}
                  style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }} />
                <input value={draft.color || '#111827'} onChange={e => setDraft(d => ({ ...d, color: e.target.value }))}
                  style={{ ...inp, width: 80, fontSize: 11 }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Taille</div>
              <select value={draft.font_size || '16px'} onChange={e => setDraft(d => ({ ...d, font_size: e.target.value }))}
                style={{ ...inp, cursor: 'pointer' }}>
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Police</div>
              <select value={draft.font_family || 'inherit'} onChange={e => setDraft(d => ({ ...d, font_family: e.target.value }))}
                style={{ ...inp, cursor: 'pointer' }}>
                {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f.split(',')[0]}</option>)}
              </select>
            </div>
          </div>

          {/* Aperçu live */}
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Aperçu live</div>
            <div style={{ color: draft.color, fontSize: draft.font_size, fontFamily: draft.font_family, lineHeight: 1.5 }}>
              {draft.value || '…'}
            </div>
          </div>

          <button onClick={save} disabled={saving}
            style={{ alignSelf: 'flex-start', padding: '7px 20px', borderRadius: 7, border: 'none', background: '#D4A853', color: '#fff', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}>
            {saving ? 'Sauvegarde…' : '✓ Sauvegarder'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function AdminLanding() {
  const [data,    setData]    = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('landing_content').select('key, value, color, font_size, font_family').then(({ data: rows }) => {
      if (rows) {
        const map = {}
        rows.forEach(r => { map[r.key] = r })
        setData(map)
      }
      setLoading(false)
    })
  }, [])

  function handleSaved(key, draft) {
    setData(d => ({ ...d, [key]: { ...d[key], ...draft } }))
  }

  if (loading) return <div style={{ padding: 40, fontSize: 13, color: 'var(--color-text-secondary)' }}>Chargement…</div>

  return (
    <div style={{ padding: '28px 32px', maxWidth: 760 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>Landing page</h1>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>Cliquez sur ✎ Éditer pour modifier chaque bloc</div>
      </div>

      {FIELDS.map(({ section, fields }) => (
        <div key={section} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12, paddingBottom: 8, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            {section}
          </div>
          {fields.map(f => (
            <FieldCard key={f.key} fieldKey={f.key} label={f.label} textarea={f.textarea} data={data} onSaved={handleSaved} />
          ))}
        </div>
      ))}
    </div>
  )
}
