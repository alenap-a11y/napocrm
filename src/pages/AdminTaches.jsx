import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const STATUTS = {
  a_faire:  { label: 'À faire',   color: '#dc2626', dot: '🔴' },
  en_cours: { label: 'En cours',  color: '#2563eb', dot: '🔵' },
  fait:     { label: 'Fait',      color: '#16a34a', dot: '🟢' },
}

const PRIORITES = {
  bloquant:  'Bloquant',
  utile:     'Utile',
  habillage: 'Habillage',
}

export default function AdminTaches() {
  const [taches, setTaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [editing, setEditing] = useState(null)
  const [historiqueOuvert, setHistoriqueOuvert] = useState(null)
  const [historique, setHistorique] = useState([])

  useEffect(() => { fetchTaches() }, [])

  async function fetchTaches() {
    setLoading(true)
    const { data, error } = await supabase
      .from('taches_admin')
      .select('*')
      .order('priorite', { ascending: true })
      .order('created_at', { ascending: false })
    if (!error) setTaches(data)
    setLoading(false)
  }

  async function toggleHistorique(tacheId) {
    if (historiqueOuvert === tacheId) {
      setHistoriqueOuvert(null)
      return
    }
    const { data, error } = await supabase
      .from('taches_admin_historique')
      .select('*')
      .eq('tache_id', tacheId)
      .order('changed_at', { ascending: true })
    if (!error) setHistorique(data)
    setHistoriqueOuvert(tacheId)
  }

  function formatDateHeure(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  async function saveTache(t) {
    if (t.id) {
      await supabase.from('taches_admin')
        .update({
          titre: t.titre, description: t.description,
          statut: t.statut, priorite: t.priorite,
          fichier_concerne: t.fichier_concerne, commit_ref: t.commit_ref,
        })
        .eq('id', t.id)
    } else {
      await supabase.from('taches_admin').insert({
        titre: t.titre, description: t.description,
        statut: t.statut || 'a_faire', priorite: t.priorite || 'utile',
        fichier_concerne: t.fichier_concerne, commit_ref: t.commit_ref,
      })
    }
    setEditing(null)
    fetchTaches()
  }

  async function deleteTache(id) {
    if (!confirm('Supprimer cette tâche ?')) return
    await supabase.from('taches_admin').delete().eq('id', id)
    fetchTaches()
  }

  const tachesAffichees = filtreStatut === 'tous' ? taches : taches.filter(t => t.statut === filtreStatut)

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>À faire</h2>
        <button onClick={() => setEditing({})}>+ Nouvelle tâche</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setFiltreStatut('tous')} style={{ fontWeight: filtreStatut === 'tous' ? 700 : 400 }}>
          Tous ({taches.length})
        </button>
        {Object.entries(STATUTS).map(([key, s]) => (
          <button key={key} onClick={() => setFiltreStatut(key)} style={{ fontWeight: filtreStatut === key ? 700 : 400 }}>
            {s.dot} {s.label} ({taches.filter(t => t.statut === key).length})
          </button>
        ))}
      </div>

      {loading ? <p>Chargement…</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e5e5e5' }}>
              <th style={{ padding: 8 }}>Statut</th>
              <th style={{ padding: 8 }}>Titre</th>
              <th style={{ padding: 8 }}>Priorité</th>
              <th style={{ padding: 8 }}>Créé le</th>
              <th style={{ padding: 8 }}>Modifié le</th>
              <th style={{ padding: 8 }}></th>
            </tr>
          </thead>
          <tbody>
            {tachesAffichees.map(t => (
              <>
                <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>
                    <span style={{ color: STATUTS[t.statut].color, fontWeight: 600 }}>
                      {STATUTS[t.statut].dot} {STATUTS[t.statut].label}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>
                    <strong>{t.titre}</strong>
                    {t.description && <div style={{ fontSize: 13, color: '#666' }}>{t.description}</div>}
                  </td>
                  <td style={{ padding: 8 }}>{PRIORITES[t.priorite]}</td>
                  <td style={{ padding: 8, fontSize: 12, color: '#666' }}>{formatDateHeure(t.created_at)}</td>
                  <td style={{ padding: 8, fontSize: 12, color: '#666' }}>{formatDateHeure(t.updated_at)}</td>
                  <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                    <button onClick={() => toggleHistorique(t.id)}>
                      {historiqueOuvert === t.id ? 'Fermer' : 'Historique'}
                    </button>
                    <button onClick={() => setEditing(t)}>Éditer</button>
                    <button onClick={() => deleteTache(t.id)}>Suppr.</button>
                  </td>
                </tr>
                {historiqueOuvert === t.id && (
                  <tr key={`${t.id}-hist`}>
                    <td colSpan={6} style={{ padding: '8px 8px 16px 32px', background: '#fafafa' }}>
                      {historique.length === 0 ? (
                        <em style={{ fontSize: 13 }}>Aucun historique.</em>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
                          {historique.map(h => (
                            <li key={h.id}>
                              {formatDateHeure(h.changed_at)} — {h.statut_avant
                                ? <>{STATUTS[h.statut_avant].dot} {STATUTS[h.statut_avant].label} → {STATUTS[h.statut_apres].dot} {STATUTS[h.statut_apres].label}</>
                                : <>Créée en statut {STATUTS[h.statut_apres].dot} {STATUTS[h.statut_apres].label}</>
                              }
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}

      {editing && <TacheForm tache={editing} onSave={saveTache} onCancel={() => setEditing(null)} />}
    </div>
  )
}

function TacheForm({ tache, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: tache.id,
    titre: tache.titre || '',
    description: tache.description || '',
    statut: tache.statut || 'a_faire',
    priorite: tache.priorite || 'utile',
    fichier_concerne: tache.fichier_concerne || '',
    commit_ref: tache.commit_ref || '',
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 480 }}>
        <h3>{tache.id ? 'Éditer la tâche' : 'Nouvelle tâche'}</h3>
        <label>Titre</label>
        <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <label>Description</label>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <label>Statut</label>
        <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })} style={{ width: '100%', marginBottom: 8 }}>
          {Object.entries(STATUTS).map(([key, s]) => <option key={key} value={key}>{s.dot} {s.label}</option>)}
        </select>
        <label>Priorité</label>
        <select value={form.priorite} onChange={e => setForm({ ...form, priorite: e.target.value })} style={{ width: '100%', marginBottom: 8 }}>
          {Object.entries(PRIORITES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <label>Fichier concerné (optionnel)</label>
        <input value={form.fichier_concerne} onChange={e => setForm({ ...form, fichier_concerne: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <label>Commit (optionnel)</label>
        <input value={form.commit_ref} onChange={e => setForm({ ...form, commit_ref: e.target.value })} style={{ width: '100%', marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel}>Annuler</button>
          <button onClick={() => onSave(form)}>Enregistrer</button>
        </div>
      </div>
    </div>
  )
}
