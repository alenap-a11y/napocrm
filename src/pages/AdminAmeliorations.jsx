import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function formatDateFR(d) {
  if (!d) return '—'
  const [y, m, j] = d.slice(0, 10).split('-')
  return `${j}/${m}/${y}`
}

// Compare deux versions style "1.2.3" en ordre décroissant (fallback alpha si non numérique)
function compareVersionsDesc(a, b) {
  const sa = String(a ?? ''), sb = String(b ?? '')
  const pa = sa.split('.'), pb = sb.split('.')
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const na = parseInt(pa[i], 10), nb = parseInt(pb[i], 10)
    if (isNaN(na) || isNaN(nb)) return sb.localeCompare(sa)
    if (na !== nb) return nb - na
  }
  return sb.localeCompare(sa)
}

export default function AdminAmeliorations() {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // version en cours d'édition, ou {} pour création
  const [deleting, setDeleting] = useState(null) // version en attente de confirmation de suppression
  const [hoveredId, setHoveredId] = useState(null)

  useEffect(() => { fetchVersions() }, [])

  async function fetchVersions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('module_versions')
      .select('*')
      .order('module_nom', { ascending: true })
    if (!error) setVersions(data)
    setLoading(false)
  }

  const groupes = useMemo(() => {
    const parModule = new Map()
    for (const v of versions) {
      if (!parModule.has(v.module_nom)) parModule.set(v.module_nom, [])
      parModule.get(v.module_nom).push(v)
    }
    return [...parModule.keys()]
      .sort((a, b) => a.localeCompare(b, 'fr'))
      .map(module => ({
        module,
        items: [...parModule.get(module)].sort((x, y) => compareVersionsDesc(x.version, y.version)),
      }))
  }, [versions])

  async function saveVersion(v) {
    const payload = {
      module_nom:   v.module_nom.trim(),
      version:      v.version.trim(),
      amelioration: v.amelioration.trim(),
      date:         v.date,
    }
    if (v.id) {
      await supabase.from('module_versions').update(payload).eq('id', v.id)
    } else {
      await supabase.from('module_versions').insert(payload)
    }
    setEditing(null)
    fetchVersions()
  }

  async function deleteVersionConfirmed() {
    if (!deleting) return
    await supabase.from('module_versions').delete().eq('id', deleting.id)
    setDeleting(null)
    fetchVersions()
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Améliorations</h2>
        <button onClick={() => setEditing({})}>+ Ajouter une version</button>
      </div>

      {loading ? <p>Chargement…</p> : versions.length === 0 ? (
        <p style={{ color: '#666', fontSize: 13 }}>Aucune version enregistrée pour le moment.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e5e5e5' }}>
              <th style={{ padding: 8 }}>Module</th>
              <th style={{ padding: 8 }}>Version</th>
              <th style={{ padding: 8 }}>Amélioration</th>
              <th style={{ padding: 8 }}>Date</th>
              <th style={{ padding: 8 }}></th>
            </tr>
          </thead>
          <tbody>
            {groupes.map(({ module, items }) => (
              items.map((v, idx) => (
                <tr
                  key={v.id}
                  onMouseEnter={() => setHoveredId(v.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    borderBottom: '1px solid #eee',
                    borderTop: idx === 0 ? '1px solid #ddd' : 'none',
                    background: hoveredId === v.id ? '#fafafa' : 'transparent',
                  }}
                >
                  <td style={{ padding: 8, fontWeight: idx === 0 ? 700 : 400, color: idx === 0 ? undefined : '#aaa' }}>
                    {idx === 0 ? module : ''}
                  </td>
                  <td style={{ padding: 8 }}>{v.version}</td>
                  <td style={{ padding: 8, fontSize: 13, color: '#444' }}>{v.amelioration}</td>
                  <td style={{ padding: 8, fontSize: 12, color: '#666' }}>{formatDateFR(v.date)}</td>
                  <td style={{ padding: 8, whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <span style={{ display: 'inline-flex', gap: 6, opacity: hoveredId === v.id ? 1 : 0, transition: 'opacity .1s' }}>
                      <i
                        className="ti ti-pencil"
                        title="Modifier"
                        onClick={() => setEditing(v)}
                        style={{ cursor: 'pointer', fontSize: 14, color: '#666' }}
                      />
                      <i
                        className="ti ti-trash"
                        title="Supprimer"
                        onClick={() => setDeleting(v)}
                        style={{ cursor: 'pointer', fontSize: 14, color: '#dc2626' }}
                      />
                    </span>
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <VersionForm
          version={editing}
          onSave={saveVersion}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 380 }}>
            <h3 style={{ marginTop: 0 }}>Supprimer cette version ?</h3>
            <p style={{ fontSize: 13, color: '#444' }}>
              {deleting.module_nom} — v{deleting.version} sera supprimée définitivement.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setDeleting(null)}>Annuler</button>
              <button
                onClick={deleteVersionConfirmed}
                style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VersionForm({ version, onSave, onCancel }) {
  const [form, setForm] = useState({
    id:           version.id,
    module_nom:   version.module_nom || '',
    version:      version.version || '',
    amelioration: version.amelioration || '',
    date:         version.date || new Date().toISOString().slice(0, 10),
  })

  const valid = form.module_nom.trim() && form.version.trim() && form.amelioration.trim() && form.date

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 480 }}>
        <h3>{version.id ? 'Modifier la version' : 'Ajouter une version'}</h3>
        <label>Module</label>
        <input value={form.module_nom} onChange={e => setForm({ ...form, module_nom: e.target.value })} placeholder="ex: Agenda" style={{ width: '100%', marginBottom: 8 }} />
        <label>Version</label>
        <input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} placeholder="ex: 1.2.0" style={{ width: '100%', marginBottom: 8 }} />
        <label>Amélioration</label>
        <textarea value={form.amelioration} onChange={e => setForm({ ...form, amelioration: e.target.value })} placeholder="Description libre de l'amélioration…" style={{ width: '100%', marginBottom: 8 }} />
        <label>Date</label>
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '100%', marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel}>Annuler</button>
          <button disabled={!valid} onClick={() => onSave(form)}>Enregistrer</button>
        </div>
      </div>
    </div>
  )
}
