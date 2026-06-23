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

const inp = {
  width: '100%', padding: '7px 10px', borderRadius: 7,
  border: '0.5px solid var(--color-border-secondary)',
  background: 'var(--color-background-primary)',
  color: 'var(--color-text-primary)', fontSize: 12,
  boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none',
}

export default function AdminLanding() {
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('landing_content').select('key, value')
      if (data) {
        const map = {}
        data.forEach(r => { map[r.key] = r.value })
        setContent(map)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function save() {
    setSaving(true); setMsg('')
    try {
      const rows = Object.entries(content).map(([key, value]) => ({ key, value }))
      const { error } = await supabase.from('landing_content').upsert(rows, { onConflict: 'key' })
      if (error) throw error
      setMsg('✓ Landing mise à jour')
    } catch (e) {
      setMsg('✗ Erreur : ' + e.message)
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  if (loading) return (
    <div style={{ padding: 40, color: 'var(--color-text-secondary)', fontSize: 13 }}>Chargement…</div>
  )

  return (
    <div style={{ padding: '28px 32px', maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>Landing page</h1>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>Modifiez les textes affichés sur naposolo.com</div>
        </div>
        <button onClick={save} disabled={saving}
          style={{ padding: '9px 22px', borderRadius: 8, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', background: '#D4A853', color: '#fff', fontSize: 13, fontWeight: 600, opacity: saving ? .7 : 1 }}>
          {saving ? 'Sauvegarde…' : '✓ Sauvegarder'}
        </button>
      </div>

      {msg && (
        <div style={{ marginBottom: 20, padding: '8px 14px', borderRadius: 8, fontSize: 13,
          background: msg.startsWith('✓') ? '#EAF3DE' : '#FBEAF0',
          color: msg.startsWith('✓') ? '#3B6D11' : '#993556' }}>
          {msg}
        </div>
      )}

      {FIELDS.map(({ section, fields }) => (
        <div key={section} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14, paddingBottom: 8, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            {section}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {fields.map(({ key, label, textarea }) => (
              <div key={key}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 5 }}>{label}</div>
                {textarea ? (
                  <textarea value={content[key] || ''} onChange={e => setContent(c => ({ ...c, [key]: e.target.value }))}
                    rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
                ) : (
                  <input value={content[key] || ''} onChange={e => setContent(c => ({ ...c, [key]: e.target.value }))}
                    style={inp} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ paddingTop: 16, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
        <button onClick={save} disabled={saving}
          style={{ padding: '10px 28px', borderRadius: 8, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', background: '#D4A853', color: '#fff', fontSize: 13, fontWeight: 600, opacity: saving ? .7 : 1 }}>
          {saving ? 'Sauvegarde…' : '✓ Sauvegarder tout'}
        </button>
      </div>
    </div>
  )
}
