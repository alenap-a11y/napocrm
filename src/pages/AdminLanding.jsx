import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FIELDS = [
  { section: 'Header', fields: [{ key: 'header_tagline', label: 'Tagline header' }]},
  { section: 'Hero', fields: [
    { key: 'hero_badge', label: 'Badge hero' },
    { key: 'hero_title', label: 'Titre principal' },
    { key: 'hero_subtitle', label: 'Sous-titre', textarea: true },
    { key: 'hero_cta', label: 'Bouton CTA' },
    { key: 'hero_tagline', label: 'Tagline sous CTA' },
  ]},
  { section: 'Fonctionnalités (textes section)', fields: [
    { key: 'features_badge', label: 'Badge section' },
    { key: 'features_title', label: 'Titre section' },
    { key: 'features_sub', label: 'Sous-titre section', textarea: true },
  ]},
  { section: 'Footer', fields: [{ key: 'footer_city', label: 'Ville (footer)' }]},
]

const FONTS = ['inherit','Georgia, serif','system-ui, sans-serif','Montserrat, sans-serif','Playfair Display, serif','monospace']
const SIZES = ['11px','12px','13px','14px','15px','16px','17px','18px','20px','24px','28px','32px','36px','46px']
const ICONS = ['ti-users','ti-calendar-stats','ti-notebook','ti-calendar','ti-bell','ti-shield-check','ti-star','ti-heart','ti-brain','ti-leaf','ti-sparkles','ti-bolt','ti-lock','ti-chart-bar','ti-messages','ti-world']
const EMPTY_FEAT = { icon: 'ti-star', title: '', description: '', optional: false, ordre: 99 }

const inp = { width: '100%', padding: '7px 10px', borderRadius: 7, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }

function FieldCard({ fieldKey, label, textarea, data, onSaved }) {
  const row = data[fieldKey] || { value: '', color: '#111827', font_size: '16px', font_family: 'inherit' }
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(row)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => { setDraft(data[fieldKey] || { value: '', color: '#111827', font_size: '16px', font_family: 'inherit' }) }, [data, fieldKey])
  async function save() {
    setSaving(true)
    const { error } = await supabase.from('landing_content').upsert({ key: fieldKey, value: draft.value, color: draft.color, font_size: draft.font_size, font_family: draft.font_family }, { onConflict: 'key' })
    setSaving(false)
    if (error) setMsg('✗ ' + error.message)
    else { setMsg('✓ Sauvegardé'); onSaved(fieldKey, draft); setEditing(false) }
    setTimeout(() => setMsg(''), 2500)
  }
  return (
    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden', marginBottom: 10 }}>
      <div style={{ padding: '12px 16px', borderBottom: editing ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>{label}</div>
        <div style={{ color: row.color || '#111827', fontSize: row.font_size || '16px', fontFamily: row.font_family || 'inherit', lineHeight: 1.5 }}>{row.value || <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>—</span>}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <button onClick={() => { setDraft(row); setEditing(e => !e) }} style={{ padding: '4px 12px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 11, cursor: 'pointer' }}>{editing ? 'Annuler' : '✎ Éditer'}</button>
          {msg && <span style={{ fontSize: 11, color: msg.startsWith('✓') ? '#3B6D11' : '#993556' }}>{msg}</span>}
        </div>
      </div>
      {editing && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Texte</div>
            {textarea ? <textarea value={draft.value} onChange={e => setDraft(d => ({ ...d, value: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} /> : <input value={draft.value} onChange={e => setDraft(d => ({ ...d, value: e.target.value }))} style={inp} />}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Couleur</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="color" value={draft.color || '#111827'} onChange={e => setDraft(d => ({ ...d, color: e.target.value }))} style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }} />
                <input value={draft.color || '#111827'} onChange={e => setDraft(d => ({ ...d, color: e.target.value }))} style={{ ...inp, width: 80, fontSize: 11 }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Taille</div>
              <select value={draft.font_size || '16px'} onChange={e => setDraft(d => ({ ...d, font_size: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>{SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Police</div>
              <select value={draft.font_family || 'inherit'} onChange={e => setDraft(d => ({ ...d, font_family: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>{FONTS.map(f => <option key={f} value={f}>{f.split(',')[0]}</option>)}</select>
            </div>
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Aperçu live</div>
            <div style={{ color: draft.color, fontSize: draft.font_size, fontFamily: draft.font_family, lineHeight: 1.5 }}>{draft.value || '…'}</div>
          </div>
          <button onClick={save} disabled={saving} style={{ alignSelf: 'flex-start', padding: '7px 20px', borderRadius: 7, border: 'none', background: '#D4A853', color: '#fff', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}>{saving ? 'Sauvegarde…' : '✓ Sauvegarder'}</button>
        </div>
      )}
    </div>
  )
}

function FeatCard({ feat, onSave, onDelete }) {
  const [editing, setEditing] = useState(!feat.id)
  const [draft, setDraft] = useState(feat)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  async function save() {
    if (!draft.title.trim()) { setMsg('✗ Titre requis'); setTimeout(() => setMsg(''), 2000); return }
    setSaving(true)
    let error
    if (feat.id) {
      ({ error } = await supabase.from('landing_features').update({ icon: draft.icon, title: draft.title, description: draft.description, optional: draft.optional, ordre: Number(draft.ordre) }).eq('id', feat.id))
    } else {
      ({ error } = await supabase.from('landing_features').insert({ icon: draft.icon, title: draft.title, description: draft.description, optional: draft.optional, ordre: Number(draft.ordre) }))
    }
    setSaving(false)
    if (error) { setMsg('✗ ' + error.message); setTimeout(() => setMsg(''), 2500); return }
    setMsg('✓ Sauvegardé'); setEditing(false); setTimeout(() => setMsg(''), 2500); onSave()
  }
  async function del() {
    if (!feat.id) { onDelete(feat._tmp); return }
    if (!confirm('Supprimer cette carte ?')) return
    await supabase.from('landing_features').delete().eq('id', feat.id)
    onDelete(feat.id)
  }
  return (
    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden', marginBottom: 10 }}>
      <div style={{ padding: '12px 16px', borderBottom: editing ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={'ti ' + feat.icon} style={{ fontSize: 18, color: '#0EA5E9' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {feat.title || <span style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>Nouvelle carte</span>}
              {feat.optional && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#EEEDFE', color: '#534AB7', marginLeft: 8 }}>Optionnel</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{feat.description?.slice(0, 60)}{feat.description?.length > 60 ? '…' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { setDraft(feat); setEditing(e => !e) }} style={{ padding: '4px 10px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 11, cursor: 'pointer' }}>{editing ? 'Annuler' : '✎ Éditer'}</button>
            <button onClick={del} style={{ padding: '4px 10px', borderRadius: 6, border: '0.5px solid #E24B4A', background: 'transparent', color: '#E24B4A', fontSize: 11, cursor: 'pointer' }}>Suppr.</button>
          </div>
        </div>
        {msg && <div style={{ marginTop: 8, fontSize: 11, color: msg.startsWith('✓') ? '#3B6D11' : '#993556' }}>{msg}</div>}
      </div>
      {editing && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Titre</div>
              <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Icône (Tabler)</div>
              <select value={draft.icon} onChange={e => setDraft(d => ({ ...d, icon: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>{ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}</select>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Description</div>
            <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Ordre</div>
              <input type="number" value={draft.ordre} onChange={e => setDraft(d => ({ ...d, ordre: e.target.value }))} style={inp} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 18 }}>
              <input type="checkbox" id={'opt-' + (feat.id || feat._tmp)} checked={draft.optional} onChange={e => setDraft(d => ({ ...d, optional: e.target.checked }))} style={{ accentColor: '#534AB7', width: 14, height: 14 }} />
              <label htmlFor={'opt-' + (feat.id || feat._tmp)} style={{ fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>Badge "Optionnel"</label>
            </div>
          </div>
          <button onClick={save} disabled={saving} style={{ alignSelf: 'flex-start', padding: '7px 20px', borderRadius: 7, border: 'none', background: '#D4A853', color: '#fff', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}>{saving ? 'Sauvegarde…' : '✓ Sauvegarder'}</button>
        </div>
      )}
    </div>
  )
}

export default function AdminLanding() {
  const [data, setData] = useState({})
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('textes')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [{ data: rows }, { data: feats }] = await Promise.all([
      supabase.from('landing_content').select('key, value, color, font_size, font_family'),
      supabase.from('landing_features').select('*').order('ordre'),
    ])
    if (rows) { const map = {}; rows.forEach(r => { map[r.key] = r }); setData(map) }
    if (feats) setFeatures(feats)
    setLoading(false)
  }

  function handleSaved(key, draft) { setData(d => ({ ...d, [key]: { ...d[key], ...draft } })) }
  function addFeature() { setFeatures(f => [...f, { ...EMPTY_FEAT, _tmp: Date.now() }]) }
  function removeFeature(id) { setFeatures(f => f.filter(x => (x.id || x._tmp) !== id)); loadAll() }

  if (loading) return <div style={{ padding: 40, fontSize: 13, color: 'var(--color-text-secondary)' }}>Chargement…</div>

  const tabStyle = active => ({ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: active ? '#D4A853' : 'transparent', color: active ? '#fff' : 'var(--color-text-secondary)' })

  return (
    <div style={{ padding: '28px 32px', maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>Landing page</h1>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>Éditez les textes et les cartes fonctionnalités</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--color-background-secondary)', padding: 6, borderRadius: 10, width: 'fit-content' }}>
        <button style={tabStyle(tab === 'textes')} onClick={() => setTab('textes')}>✎ Textes</button>
        <button style={tabStyle(tab === 'features')} onClick={() => setTab('features')}>⊞ Cartes features</button>
      </div>
      {tab === 'textes' && FIELDS.map(({ section, fields }) => (
        <div key={section} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12, paddingBottom: 8, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{section}</div>
          {fields.map(f => <FieldCard key={f.key} fieldKey={f.key} label={f.label} textarea={f.textarea} data={data} onSaved={handleSaved} />)}
        </div>
      ))}
      {tab === 'features' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{features.length} carte{features.length > 1 ? 's' : ''}</div>
            <button onClick={addFeature} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Nouvelle carte</button>
          </div>
          {features.map(f => <FeatCard key={f.id || f._tmp} feat={f} onSave={loadAll} onDelete={removeFeature} />)}
        </div>
      )}
    </div>
  )
}
