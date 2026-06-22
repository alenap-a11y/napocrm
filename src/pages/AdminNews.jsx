import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TYPE_OPTIONS = [
  { id: 'new', label: '🟢 Nouveau' },
  { id: 'maj', label: '🔵 Amélioration' },
  { id: 'fix', label: '🟠 Correction' },
]

const EMPTY_NEWS = { titre: '', contenu: '', publie: false, version: '', tag: '', tag_label: '', tag_bg: '#E6F4EE', tag_color: '#1A7A4A', type_item: 'new' }
const EMPTY_ROAD = { titre: '', description: '', icon: 'ti-rocket', couleur: '#185FA5', bg: '#E6F1FB', eta: '', ordre: 0, publie: false }

export default function AdminNews() {
  const [activeTab, setActiveTab] = useState('changelog')
  const [news, setNews] = useState([])
  const [roadmap, setRoadmap] = useState([])
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_NEWS)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [{ data: n }, { data: r }] = await Promise.all([
      supabase.from('news').select('*').order('created_at', { ascending: false }),
      supabase.from('roadmap').select('*').order('ordre'),
    ])
    setNews(n || [])
    setRoadmap(r || [])
  }

  function startNew() {
    setEditId('new')
    setForm(activeTab === 'changelog' ? EMPTY_NEWS : { ...EMPTY_ROAD, ordre: roadmap.length })
  }

  function startEdit(item) {
    setEditId(item.id)
    if (activeTab === 'changelog') {
      setForm({ titre: item.titre || '', contenu: item.contenu || '', publie: item.publie || false, version: item.version || '', tag: item.tag || '', tag_label: item.tag_label || '', tag_bg: item.tag_bg || '#E6F4EE', tag_color: item.tag_color || '#1A7A4A', type_item: item.type_item || 'new' })
    } else {
      setForm({ titre: item.titre || '', description: item.description || '', icon: item.icon || 'ti-rocket', couleur: item.couleur || '#185FA5', bg: item.bg || '#E6F1FB', eta: item.eta || '', ordre: item.ordre || 0, publie: item.publie || false })
    }
  }

  async function save() {
    setLoading(true)
    const table = activeTab === 'changelog' ? 'news' : 'roadmap'
    if (editId === 'new') {
      await supabase.from(table).insert([form])
    } else {
      await supabase.from(table).update(form).eq('id', editId)
    }
    setEditId(null)
    setMsg('Sauvegardé ✓')
    setTimeout(() => setMsg(''), 2000)
    setLoading(false)
    fetchAll()
  }

  async function remove(id) {
    if (!confirm('Supprimer ?')) return
    const table = activeTab === 'changelog' ? 'news' : 'roadmap'
    await supabase.from(table).delete().eq('id', id)
    fetchAll()
  }

  async function togglePublie(item) {
    const table = activeTab === 'changelog' ? 'news' : 'roadmap'
    await supabase.from(table).update({ publie: !item.publie }).eq('id', item.id)
    fetchAll()
  }

  const s = {
    wrap: { padding: '2rem', maxWidth: 760 },
    btn: { padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500 },
    card: { background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '10px', padding: '1rem', marginBottom: '10px' },
    label: { fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' },
    input: { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: '13px', boxSizing: 'border-box', marginBottom: '10px' },
    textarea: { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: '13px', boxSizing: 'border-box', marginBottom: '10px', minHeight: '80px', resize: 'vertical' },
    row: { display: 'flex', gap: '10px' },
  }

  const TABS = [
    { id: 'changelog', label: '📋 Changelog' },
    { id: 'roadmap',   label: '🗺️ Roadmap' },
  ]

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>News Naposolo</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {msg && <span style={{ fontSize: '12px', color: '#4ade80' }}>{msg}</span>}
          <button onClick={startNew} style={{ ...s.btn, background: '#B8961E', color: '#fff' }}>+ Ajouter</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setEditId(null) }}
            style={{ ...s.btn, background: activeTab === t.id ? '#B8961E' : 'rgba(255,255,255,0.07)', color: activeTab === t.id ? '#fff' : 'var(--color-text-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Formulaire */}
      {editId && (
        <div style={{ ...s.card, border: '1px solid #B8961E', marginBottom: '1.5rem' }}>
          {activeTab === 'changelog' ? (
            <>
              <div style={s.row}>
                <div style={{ flex: 2 }}>
                  <label style={s.label}>Version (ex: Alpha v1.3)</label>
                  <input style={s.input} value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} placeholder="Alpha v1.3" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Type</label>
                  <select style={{ ...s.input }} value={form.type_item} onChange={e => setForm({ ...form, type_item: e.target.value })}>
                    {TYPE_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <label style={s.label}>Contenu de l'entrée</label>
              <textarea style={s.textarea} value={form.contenu} onChange={e => setForm({ ...form, contenu: e.target.value })} placeholder="Description de la nouveauté..." />
              <div style={s.row}>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Tag (ex: latest, alpha)</label>
                  <input style={s.input} value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} placeholder="latest" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Label du tag</label>
                  <input style={s.input} value={form.tag_label} onChange={e => setForm({ ...form, tag_label: e.target.value })} placeholder="Actuelle" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Couleur tag</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input type="color" value={form.tag_color} onChange={e => setForm({ ...form, tag_color: e.target.value })} style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                    <input type="color" value={form.tag_bg} onChange={e => setForm({ ...form, tag_bg: e.target.value })} style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={s.row}>
                <div style={{ flex: 2 }}>
                  <label style={s.label}>Titre</label>
                  <input style={s.input} value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} placeholder="Facturation PDF..." />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>ETA</label>
                  <input style={s.input} value={form.eta} onChange={e => setForm({ ...form, eta: e.target.value })} placeholder="Juillet 2026" />
                </div>
              </div>
              <label style={s.label}>Description</label>
              <textarea style={s.textarea} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description de la fonctionnalité..." />
              <div style={s.row}>
                <div style={{ flex: 2 }}>
                  <label style={s.label}>Icône Tabler</label>
                  <input style={s.input} value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="ti-rocket" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Couleur</label>
                  <input type="color" value={form.couleur} onChange={e => setForm({ ...form, couleur: e.target.value })} style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Fond</label>
                  <input type="color" value={form.bg} onChange={e => setForm({ ...form, bg: e.target.value })} style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Ordre</label>
                  <input style={s.input} type="number" value={form.ordre} onChange={e => setForm({ ...form, ordre: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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

      {/* Liste changelog */}
      {activeTab === 'changelog' && news.map(item => (
        <div key={item.id} style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, background: item.type_item === 'new' ? '#E6F4EE' : item.type_item === 'maj' ? '#E6F1FB' : '#FAEEDA', color: item.type_item === 'new' ? '#1A7A4A' : item.type_item === 'maj' ? '#185FA5' : '#854F0B', padding: '1px 6px', borderRadius: 20 }}>
                  {item.type_item === 'new' ? 'Nouveau' : item.type_item === 'maj' ? 'Amélioration' : 'Correction'}
                </span>
                {item.version && <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{item.version}</span>}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{item.contenu?.slice(0, 100)}{item.contenu?.length > 100 ? '...' : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginLeft: '1rem', flexShrink: 0 }}>
              <span onClick={() => togglePublie(item)} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', cursor: 'pointer', background: item.publie ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.07)', color: item.publie ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                {item.publie ? 'Publié' : 'Brouillon'}
              </span>
              <button onClick={() => startEdit(item)} style={{ ...s.btn, background: 'rgba(255,255,255,0.07)', color: 'var(--color-text-primary)' }}>Éditer</button>
              <button onClick={() => remove(item.id)} style={{ ...s.btn, background: 'rgba(226,75,74,0.15)', color: '#E24B4A' }}>Suppr.</button>
            </div>
          </div>
        </div>
      ))}

      {/* Liste roadmap */}
      {activeTab === 'roadmap' && roadmap.map(item => (
        <div key={item.id} style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: item.bg || '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`ti ${item.icon || 'ti-rocket'}`} style={{ color: item.couleur || '#185FA5', fontSize: 15 }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.titre}</div>
                {item.eta && <div style={{ fontSize: '11px', color: '#185FA5', marginTop: 1 }}>{item.eta}</div>}
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: 2 }}>{item.description?.slice(0, 80)}{item.description?.length > 80 ? '...' : ''}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginLeft: '1rem', flexShrink: 0 }}>
              <span onClick={() => togglePublie(item)} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', cursor: 'pointer', background: item.publie ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.07)', color: item.publie ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                {item.publie ? 'Publié' : 'Brouillon'}
              </span>
              <button onClick={() => startEdit(item)} style={{ ...s.btn, background: 'rgba(255,255,255,0.07)', color: 'var(--color-text-primary)' }}>Éditer</button>
              <button onClick={() => remove(item.id)} style={{ ...s.btn, background: 'rgba(226,75,74,0.15)', color: '#E24B4A' }}>Suppr.</button>
            </div>
          </div>
        </div>
      ))}

      {((activeTab === 'changelog' && news.length === 0) || (activeTab === 'roadmap' && roadmap.length === 0)) && !editId && (
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '3rem' }}>
          Aucun contenu — clique sur "+ Ajouter"
        </div>
      )}
    </div>
  )
}
