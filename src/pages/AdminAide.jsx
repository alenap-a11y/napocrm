import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  { id: 'demarrage',  label: '🚀 Démarrage' },
  { id: 'ressources', label: '📚 Ressources' },
  { id: 'support',    label: '🛟 Support' },
  { id: 'raccourcis', label: '⌨️ Raccourcis' },
]

const EMPTY_FORM = { titre: '', contenu: '', categorie: 'demarrage', ordre: 0, publie: false, icon: '', couleur: '#0F6E56', bg: '#E1F5EE', cta: '', lien: '', sous_titre: '', numero: '' }

export default function AdminAide() {
  const [items, setItems] = useState([])
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filterCat, setFilterCat] = useState('demarrage')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const { data } = await supabase.from('aide').select('*').order('ordre')
    setItems(data || [])
  }

  function startNew() {
    setEditId('new')
    setForm({ ...EMPTY_FORM, categorie: filterCat, ordre: items.filter(i => i.categorie === filterCat).length })
  }

  function startEdit(item) {
    setEditId(item.id)
    setForm({ titre: item.titre || '', contenu: item.contenu || '', categorie: item.categorie || 'demarrage', ordre: item.ordre || 0, publie: item.publie || false, icon: item.icon || '', couleur: item.couleur || '#0F6E56', bg: item.bg || '#E1F5EE', cta: item.cta || '', lien: item.lien || '', sous_titre: item.sous_titre || '', numero: item.numero || '' })
  }

  async function save() {
    setLoading(true)
    if (editId === 'new') {
      await supabase.from('aide').insert([form])
    } else {
      await supabase.from('aide').update(form).eq('id', editId)
    }
    setEditId(null)
    setMsg('Sauvegardé ✓')
    setTimeout(() => setMsg(''), 2000)
    setLoading(false)
    fetchAll()
  }

  async function remove(id) {
    if (!confirm('Supprimer ?')) return
    await supabase.from('aide').delete().eq('id', id)
    fetchAll()
  }

  async function togglePublie(item) {
    await supabase.from('aide').update({ publie: !item.publie }).eq('id', item.id)
    fetchAll()
  }

  const filtered = items.filter(i => i.categorie === filterCat)

  const s = {
    wrap: { padding: '2rem', maxWidth: 760 },
    btn: { padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500 },
    card: { background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '10px', padding: '1rem', marginBottom: '10px' },
    label: { fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' },
    input: { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: '13px', boxSizing: 'border-box', marginBottom: '10px' },
    textarea: { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: '13px', boxSizing: 'border-box', marginBottom: '10px', minHeight: '100px', resize: 'vertical' },
    row: { display: 'flex', gap: '10px' },
  }

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Centre d'aide</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {msg && <span style={{ fontSize: '12px', color: '#4ade80' }}>{msg}</span>}
          <button onClick={startNew} style={{ ...s.btn, background: '#B8961E', color: '#fff' }}>+ Ajouter</button>
        </div>
      </div>

      {/* Filtre par catégorie */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setFilterCat(cat.id)} style={{ ...s.btn, background: filterCat === cat.id ? '#B8961E' : 'rgba(255,255,255,0.07)', color: filterCat === cat.id ? '#fff' : 'var(--color-text-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Formulaire édition */}
      {editId && (
        <div style={{ ...s.card, border: '1px solid #B8961E', marginBottom: '1.5rem' }}>
          <div style={s.row}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Catégorie</label>
              <select style={{ ...s.input }} value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Ordre</label>
              <input style={s.input} type="number" value={form.ordre} onChange={e => setForm({ ...form, ordre: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          <label style={s.label}>Titre</label>
          <input style={s.input} value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} placeholder="Titre..." />

          <label style={s.label}>Contenu / Description</label>
          <textarea style={s.textarea} value={form.contenu} onChange={e => setForm({ ...form, contenu: e.target.value })} placeholder="Contenu..." />

          <div style={s.row}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Sous-titre (support: email/info)</label>
              <input style={s.input} value={form.sous_titre} onChange={e => setForm({ ...form, sous_titre: e.target.value })} placeholder="ex: support@naposolo.fr" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Numéro (démarrage: 01, 02...)</label>
              <input style={s.input} value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="01" />
            </div>
          </div>

          <div style={s.row}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Icône Tabler (ex: ti-video)</label>
              <input style={s.input} value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="ti-video" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Couleur texte</label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input type="color" value={form.couleur} onChange={e => setForm({ ...form, couleur: e.target.value })} style={{ width: 36, height: 36, borderRadius: 6, border: 'none', cursor: 'pointer' }} />
                <input style={{ ...s.input, marginBottom: 0, flex: 1 }} value={form.couleur} onChange={e => setForm({ ...form, couleur: e.target.value })} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Couleur fond</label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input type="color" value={form.bg} onChange={e => setForm({ ...form, bg: e.target.value })} style={{ width: 36, height: 36, borderRadius: 6, border: 'none', cursor: 'pointer' }} />
                <input style={{ ...s.input, marginBottom: 0, flex: 1 }} value={form.bg} onChange={e => setForm({ ...form, bg: e.target.value })} />
              </div>
            </div>
          </div>

          <div style={{ ...s.row, marginTop: '6px' }}>
            <div style={{ flex: 2 }}>
              <label style={s.label}>Lien URL</label>
              <input style={s.input} value={form.lien} onChange={e => setForm({ ...form, lien: e.target.value })} placeholder="https://... ou mailto:..." />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Texte du bouton CTA</label>
              <input style={s.input} value={form.cta} onChange={e => setForm({ ...form, cta: e.target.value })} placeholder="Accéder" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
            <label style={{ ...s.label, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.publie} onChange={e => setForm({ ...form, publie: e.target.checked })} />
              Publié
            </label>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button onClick={() => setEditId(null)} style={{ ...s.btn, background: 'transparent', border: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)' }}>Annuler</button>
              <button onClick={save} disabled={loading} style={{ ...s.btn, background: '#B8961E', color: '#fff' }}>Sauvegarder</button>
            </div>
          </div>
        </div>
      )}

      {/* Liste */}
      {filtered.map(item => (
        <div key={item.id} style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: item.bg || '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon ? <i className={`ti ${item.icon}`} style={{ color: item.couleur || '#0F6E56', fontSize: 15 }} /> : <span style={{ fontSize: 11, fontWeight: 700, color: item.couleur || '#0F6E56' }}>{item.numero || '—'}</span>}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.titre}</div>
                {item.sous_titre && <div style={{ fontSize: '11px', color: item.couleur || '#0F6E56', marginTop: 1 }}>{item.sous_titre}</div>}
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: 2 }}>{item.contenu?.slice(0, 100)}{item.contenu?.length > 100 ? '...' : ''}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginLeft: '1rem', flexShrink: 0, alignItems: 'center' }}>
              <span onClick={() => togglePublie(item)} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', cursor: 'pointer', background: item.publie ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.07)', color: item.publie ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                {item.publie ? 'Publié' : 'Brouillon'}
              </span>
              <button onClick={() => startEdit(item)} style={{ ...s.btn, background: 'rgba(255,255,255,0.07)', color: 'var(--color-text-primary)' }}>Éditer</button>
              <button onClick={() => remove(item.id)} style={{ ...s.btn, background: 'rgba(226,75,74,0.15)', color: '#E24B4A' }}>Suppr.</button>
            </div>
          </div>
        </div>
      ))}

      {filtered.length === 0 && !editId && (
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '3rem' }}>
          Aucun contenu dans cette catégorie — clique sur "+ Ajouter"
        </div>
      )}
    </div>
  )
}
