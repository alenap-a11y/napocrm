import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TYPES = { feat: { label: '✨ Feature', color: '#6366f1' }, fix: { label: '🔧 Fix', color: '#10b981' }, bug: { label: '🐛 Bug', color: '#ef4444' }, note: { label: '📝 Note', color: '#f59e0b' } }
const STATUTS = { done: { label: '✅ Fait', color: '#10b981' }, 'en-cours': { label: '🔄 En cours', color: '#f59e0b' }, prevu: { label: '📅 Prévu', color: '#6366f1' } }
const inp = { width: '100%', padding: '7px 10px', borderRadius: 7, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }
const EMPTY = { date: new Date().toISOString().slice(0,10), version: '', titre: '', description: '', type: 'feat', statut: 'done', ordre: 99 }

export default function AdminRoadmap() {
  const [items, setItems] = useState([])
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    const { data } = await supabase.from('roadmap').select('*').order('date', { ascending: false }).order('ordre')
    if (data) setItems(data)
  }

  useEffect(() => { load() }, [])

  async function save() {
    if (!draft.titre) return setMsg('✗ Titre requis')
    setSaving(true)
    const { error } = await supabase.from('roadmap').insert(draft)
    setSaving(false)
    if (error) { setMsg('✗ ' + error.message); setTimeout(() => setMsg(''), 3000); return }
    setMsg('✓ Ajouté'); setTimeout(() => setMsg(''), 2000)
    setDraft(EMPTY); setAdding(false); load()
  }

  async function remove(id) {
    if (!confirm('Supprimer ?')) return
    await supabase.from('roadmap').delete().eq('id', id)
    load()
  }

  const byDate = items.reduce((acc, item) => {
    const d = item.date
    if (!acc[d]) acc[d] = []
    acc[d].push(item)
    return acc
  }, {})

  return (
    <div style={{ padding: '2rem', maxWidth: 750 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>🗺️ Roadmap Naposolo</h2>
        <button onClick={() => { setAdding(a => !a); setDraft(EMPTY) }} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          {adding ? 'Annuler' : '+ Ajouter une entrée'}
        </button>
      </div>

      {adding && (
        <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)', padding: '20px', marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Date</div>
              <input type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Version</div>
              <input value={draft.version} onChange={e => setDraft(d => ({ ...d, version: e.target.value }))} style={inp} placeholder="ex: alpha 0.3" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Type</div>
              <select value={draft.type} onChange={e => setDraft(d => ({ ...d, type: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Statut</div>
              <select value={draft.statut} onChange={e => setDraft(d => ({ ...d, statut: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Titre *</div>
            <input value={draft.titre} onChange={e => setDraft(d => ({ ...d, titre: e.target.value }))} style={inp} placeholder="ex: Popup onboarding CMS" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Description</div>
            <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} placeholder="Détails, contexte, lien..." />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={save} disabled={saving} style={{ padding: '7px 20px', borderRadius: 7, border: 'none', background: '#B8961E', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            {msg && <span style={{ fontSize: 11, color: msg.startsWith('✓') ? '#3B6D11' : '#993556' }}>{msg}</span>}
          </div>
        </div>
      )}

      {Object.entries(byDate).map(([date, entries]) => (
        <div key={date} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              📅 {new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            {entries[0]?.version && (
              <span style={{ fontSize: 10, fontWeight: 700, background: '#6366f1', color: '#fff', borderRadius: 6, padding: '2px 8px', textTransform: 'uppercase' }}>
                {entries[0].version}
              </span>
            )}
          </div>
          {entries.map(item => (
            <div key={item.id} style={{ background: 'var(--color-background-secondary)', borderRadius: 10, border: '0.5px solid var(--color-border-tertiary)', padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: TYPES[item.type]?.color, background: TYPES[item.type]?.color + '18', borderRadius: 5, padding: '2px 8px' }}>{TYPES[item.type]?.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: STATUTS[item.statut]?.color }}>{STATUTS[item.statut]?.label}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>{item.titre}</div>
                {item.description && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{item.description}</div>}
              </div>
              <button onClick={() => remove(item.id)} style={{ marginLeft: 12, padding: '3px 8px', borderRadius: 5, border: '0.5px solid #f87171', background: 'transparent', color: '#f87171', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>
      ))}

      {items.length === 0 && !adding && (
        <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 40 }}>
          Aucune entrée roadmap. Commence par ajouter la session d'aujourd'hui ! 🚀
        </div>
      )}
    </div>
  )
}
