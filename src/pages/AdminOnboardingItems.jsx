import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ICONS = ['ti-star','ti-heart','ti-leaf','ti-sparkles','ti-bolt','ti-users','ti-calendar','ti-check','ti-info-circle','ti-alert-circle','ti-gift','ti-rocket','ti-brain','ti-bell','ti-messages','ti-world']
const TYPES = ['icon','link','button']
const inp = { width:'100%', padding:'7px 10px', borderRadius:7, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:12, boxSizing:'border-box', fontFamily:'inherit', outline:'none' }

const EMPTY = { type:'icon', label:'', value:'', icon:'ti-star', ordre:99, color:'#111827' }

export default function AdminOnboardingItems() {
  const [items, setItems] = useState([])
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    const { data } = await supabase.from('onboarding_items').select('*').order('ordre')
    if (data) setItems(data)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('onboarding_items').insert({ ...draft })
    setSaving(false)
    if (error) { setMsg('✗ ' + error.message); setTimeout(() => setMsg(''), 3000); return }
    setMsg('✓ Ajouté'); setTimeout(() => setMsg(''), 2000)
    setDraft(EMPTY); setAdding(false); load()
  }

  async function remove(id) {
    await supabase.from('onboarding_items').delete().eq('id', id)
    load()
  }

  const typeLabel = { icon:'🔷 Icône', link:'🔗 Lien', button:'🟣 Bouton' }

  return (
    <div style={{ marginTop:32 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h3 style={{ fontSize:13, fontWeight:700, color:'var(--color-text-primary)', margin:0 }}>Blocs dynamiques</h3>
        <button onClick={() => setAdding(a => !a)} style={{ padding:'6px 14px', borderRadius:7, border:'none', background:'#6366f1', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
          {adding ? 'Annuler' : '+ Ajouter un bloc'}
        </button>
      </div>

      {adding && (
        <div style={{ background:'var(--color-background-secondary)', borderRadius:10, border:'0.5px solid var(--color-border-tertiary)', padding:'16px', marginBottom:16, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-secondary)', marginBottom:4 }}>Type</div>
              <select value={draft.type} onChange={e => setDraft(d => ({ ...d, type: e.target.value }))} style={{ ...inp, cursor:'pointer' }}>
                {TYPES.map(t => <option key={t} value={t}>{typeLabel[t]}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-secondary)', marginBottom:4 }}>Icône</div>
              <select value={draft.icon} onChange={e => setDraft(d => ({ ...d, icon: e.target.value }))} style={{ ...inp, cursor:'pointer' }}>
                {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-secondary)', marginBottom:4 }}>Label (texte affiché)</div>
            <input value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} style={inp} placeholder="Ex: Découvrir les fonctionnalités" />
          </div>
          {(draft.type === 'link' || draft.type === 'button') && (
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-secondary)', marginBottom:4 }}>URL</div>
              <input value={draft.value} onChange={e => setDraft(d => ({ ...d, value: e.target.value }))} style={inp} placeholder="https://..." />
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:10 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-secondary)', marginBottom:4 }}>Couleur</div>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input type="color" value={draft.color} onChange={e => setDraft(d => ({ ...d, color: e.target.value }))} style={{ width:32, height:32, border:'none', borderRadius:6, cursor:'pointer', padding:0 }} />
                <input value={draft.color} onChange={e => setDraft(d => ({ ...d, color: e.target.value }))} style={{ ...inp, width:80, fontSize:11 }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-secondary)', marginBottom:4 }}>Ordre</div>
              <input type="number" value={draft.ordre} onChange={e => setDraft(d => ({ ...d, ordre: Number(e.target.value) }))} style={inp} />
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={save} disabled={saving} style={{ padding:'6px 18px', borderRadius:7, border:'none', background:'#B8961E', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            {msg && <span style={{ fontSize:11, color: msg.startsWith('✓') ? '#3B6D11' : '#993556' }}>{msg}</span>}
          </div>
        </div>
      )}

      {items.length === 0 && !adding && (
        <div style={{ color:'var(--color-text-secondary)', fontSize:12, fontStyle:'italic' }}>Aucun bloc ajouté.</div>
      )}

      {items.map(item => (
        <div key={item.id} style={{ background:'var(--color-background-secondary)', borderRadius:10, border:'0.5px solid var(--color-border-tertiary)', padding:'12px 16px', marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <i className={`ti ${item.icon}`} style={{ fontSize:16, color: item.color }} />
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.05em' }}>{typeLabel[item.type]}</div>
              <div style={{ fontSize:13, color: item.color, fontWeight:500 }}>{item.label}</div>
              {item.value && <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>{item.value}</div>}
            </div>
          </div>
          <button onClick={() => remove(item.id)} style={{ padding:'4px 10px', borderRadius:6, border:'0.5px solid #f87171', background:'transparent', color:'#f87171', fontSize:11, cursor:'pointer' }}>✕ Supprimer</button>
        </div>
      ))}
    </div>
  )
}
