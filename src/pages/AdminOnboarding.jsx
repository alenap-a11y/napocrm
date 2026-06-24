import { useState, useEffect } from 'react'
import AdminOnboardingItems from './AdminOnboardingItems'
import { supabase } from '../lib/supabase'

const FIELDS = [
  { key: 'onboarding_title',    label: 'Titre popup' },
  { key: 'onboarding_subtitle', label: 'Sous-titre' },
  { key: 'onboarding_body',     label: 'Corps du message', textarea: true },
  { key: 'onboarding_cta',      label: 'Texte bouton CTA' },
]

const FONTS = ['inherit','Georgia, serif','system-ui, sans-serif','Montserrat, sans-serif','Playfair Display, serif','monospace']
const SIZES = ['11px','12px','13px','14px','15px','16px','17px','18px','20px','24px','28px','32px','36px','46px']
const inp = { width:'100%', padding:'7px 10px', borderRadius:7, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:12, boxSizing:'border-box', fontFamily:'inherit', outline:'none' }

function FieldCard({ fieldKey, label, textarea, data, onSaved }) {
  const row = data[fieldKey] || { value:'', color:'#111827', font_size:'16px', font_family:'inherit' }
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(row)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => { setDraft(data[fieldKey] || { value:'', color:'#111827', font_size:'16px', font_family:'inherit' }) }, [data, fieldKey])
  async function save() {
    setSaving(true)
    const { error } = await supabase.from('landing_content').upsert({ key: fieldKey, value: draft.value, color: draft.color, font_size: draft.font_size, font_family: draft.font_family }, { onConflict: 'key' })
    setSaving(false)
    if (error) setMsg('✗ ' + error.message)
    else { setMsg('✓ Sauvegardé'); onSaved(fieldKey, draft); setEditing(false) }
    setTimeout(() => setMsg(''), 2500)
  }
  return (
    <div style={{ background:'var(--color-background-secondary)', borderRadius:10, border:'0.5px solid var(--color-border-tertiary)', overflow:'hidden', marginBottom:10 }}>
      <div style={{ padding:'12px 16px', borderBottom: editing ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>{label}</div>
        <div style={{ color: row.color, fontSize: row.font_size, fontFamily: row.font_family, lineHeight:1.5 }}>{row.value || <span style={{ color:'var(--color-text-secondary)', fontStyle:'italic' }}>—</span>}</div>
        <div style={{ display:'flex', gap:8, marginTop:10, alignItems:'center' }}>
          <button onClick={() => { setDraft(row); setEditing(e => !e) }} style={{ padding:'4px 12px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'transparent', color:'var(--color-text-secondary)', fontSize:11, cursor:'pointer' }}>{editing ? 'Annuler' : '✎ Éditer'}</button>
          {msg && <span style={{ fontSize:11, color: msg.startsWith('✓') ? '#3B6D11' : '#993556' }}>{msg}</span>}
        </div>
      </div>
      {editing && (
        <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-secondary)', marginBottom:4 }}>Texte</div>
            {textarea ? <textarea value={draft.value} onChange={e => setDraft(d => ({ ...d, value: e.target.value }))} rows={3} style={{ ...inp, resize:'vertical', lineHeight:1.5 }} /> : <input value={draft.value} onChange={e => setDraft(d => ({ ...d, value: e.target.value }))} style={inp} />}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 1fr', gap:10 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-secondary)', marginBottom:4 }}>Couleur</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <input type="color" value={draft.color || '#111827'} onChange={e => setDraft(d => ({ ...d, color: e.target.value }))} style={{ width:32, height:32, border:'none', borderRadius:6, cursor:'pointer', padding:0 }} />
                <input value={draft.color || '#111827'} onChange={e => setDraft(d => ({ ...d, color: e.target.value }))} style={{ ...inp, width:80, fontSize:11 }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-secondary)', marginBottom:4 }}>Taille</div>
              <select value={draft.font_size || '16px'} onChange={e => setDraft(d => ({ ...d, font_size: e.target.value }))} style={{ ...inp, cursor:'pointer' }}>{SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-secondary)', marginBottom:4 }}>Police</div>
              <select value={draft.font_family || 'inherit'} onChange={e => setDraft(d => ({ ...d, font_family: e.target.value }))} style={{ ...inp, cursor:'pointer' }}>{FONTS.map(f => <option key={f} value={f}>{f.split(',')[0]}</option>)}</select>
            </div>
          </div>
          <div style={{ padding:'10px 14px', borderRadius:8, background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-secondary)', marginBottom:6 }}>Aperçu live</div>
            <div style={{ color: draft.color, fontSize: draft.font_size, fontFamily: draft.font_family, lineHeight:1.5 }}>{draft.value || '…'}</div>
          </div>
          <button onClick={save} disabled={saving} style={{ alignSelf:'flex-start', padding:'6px 18px', borderRadius:7, border:'none', background:'#B8961E', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
        </div>
      )}
      <AdminOnboardingItems />
    </div>
  )
}

export default function AdminOnboarding() {
  const [data, setData] = useState({})
  const [published, setPublished] = useState(true)
  const [days, setDays] = useState(['lun','mar','mer','jeu','ven','sam','dim'])
  const [savingSettings, setSavingSettings] = useState(false)
  const [msgSettings, setMsgSettings] = useState('')
  const DAYS = ['lun','mar','mer','jeu','ven','sam','dim']
  const DAYS_LABELS = { lun:'Lun', mar:'Mar', mer:'Mer', jeu:'Jeu', ven:'Ven', sam:'Sam', dim:'Dim' }
  useEffect(() => {
    supabase.from('landing_content')
      .select('key, value, color, font_size, font_family, published, days_active')
      .in('key', [...FIELDS.map(f => f.key), 'onboarding_settings'])
      .then(({ data: rows }) => {
        if (!rows) return
        const map = {}
        rows.forEach(r => { map[r.key] = r })
        setData(map)
        const settings = rows.find(r => r.key === 'onboarding_settings')
        if (settings) {
          setPublished(settings.published ?? true)
          setDays(settings.days_active ?? ['lun','mar','mer','jeu','ven','sam','dim'])
        }
      })
  }, [])
  function onSaved(key, val) { setData(d => ({ ...d, [key]: val })) }

  async function saveSettings() {
    setSavingSettings(true)
    const { error } = await supabase.from('landing_content').upsert(
      { key: 'onboarding_settings', value: '', published, days_active: days },
      { onConflict: 'key' }
    )
    setSavingSettings(false)
    if (error) setMsgSettings('✗ ' + error.message)
    else setMsgSettings('✓ Sauvegardé')
    setTimeout(() => setMsgSettings(''), 2500)
  }

  function toggleDay(d) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  return (
    <div style={{ padding:'2rem', maxWidth:700 }}>
      <div style={{ background:'var(--color-background-secondary)', borderRadius:12, border:'0.5px solid var(--color-border-tertiary)', padding:'16px 20px', marginBottom:24 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:14 }}>Paramètres de diffusion</div>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <input type="checkbox" id="published" checked={published} onChange={e => setPublished(e.target.checked)}
            style={{ width:16, height:16, cursor:'pointer', accentColor:'#6366f1' }} />
          <label htmlFor="published" style={{ fontSize:13, fontWeight:600, color:'var(--color-text-primary)', cursor:'pointer' }}>
            {published ? '✅ Popup actif' : '⬜ Popup désactivé'}
          </label>
        </div>

        <div style={{ fontSize:11, fontWeight:600, color:'var(--color-text-secondary)', marginBottom:8 }}>Jours d'affichage</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
          {DAYS.map(d => (
            <label key={d} style={{ display:'flex', alignItems:'center', gap:4, cursor:'pointer',
              background: days.includes(d) ? '#6366f1' : 'var(--color-background-primary)',
              color: days.includes(d) ? '#fff' : 'var(--color-text-secondary)',
              borderRadius:8, padding:'5px 12px', fontSize:12, fontWeight:600,
              border: '0.5px solid ' + (days.includes(d) ? '#6366f1' : 'var(--color-border-secondary)'),
              transition:'all .15s' }}>
              <input type="checkbox" checked={days.includes(d)} onChange={() => toggleDay(d)} style={{ display:'none' }} />
              {DAYS_LABELS[d]}
            </label>
          ))}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={saveSettings} disabled={savingSettings} style={{ padding:'6px 18px', borderRadius:7, border:'none', background:'#B8961E', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            {savingSettings ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          {msgSettings && <span style={{ fontSize:11, color: msgSettings.startsWith('✓') ? '#3B6D11' : '#993556' }}>{msgSettings}</span>}
        </div>
      </div>
      <h2 style={{ fontSize:16, fontWeight:700, marginBottom:24, color:'var(--color-text-primary)' }}>Popup Onboarding</h2>
      {FIELDS.map(({ key, label, textarea }) => (
        <FieldCard key={key} fieldKey={key} label={label} textarea={textarea} data={data} onSaved={onSaved} />
      ))}
    </div>
  )
}
