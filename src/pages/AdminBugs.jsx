import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Statut = couleur (comme la légende Mnapo : 🔴 À faire · 🔵 En cours · 🟢 Fait)
const STATUTS = {
  a_faire:  { label: 'À faire',   color: '#dc2626', dot: '🔴' },
  en_cours: { label: 'En cours',  color: '#2563eb', dot: '🔵' },
  fait:     { label: 'Fait',      color: '#16a34a', dot: '🟢' },
}

// Priorité = texte SEUL, jamais de couleur (règle explicite de ta légende
// pour ne pas la confondre visuellement avec le statut)
const PRIORITES = {
  bloquant:  'Bloquant',
  utile:     'Utile',
  habillage: 'Habillage',
}

export default function AdminBugs() {
  const [bugs, setBugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [editing, setEditing] = useState(null) // bug en cours d'édition, ou {} pour création
  const [historiqueOuvert, setHistoriqueOuvert] = useState(null) // id du bug dont l'historique est déplié
  const [historique, setHistorique] = useState([])

  useEffect(() => { fetchBugs() }, [])

  async function fetchBugs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('bugs_admin')
      .select('*')
      .order('priorite', { ascending: true }) // bloquant d'abord (ordre alpha volontaire)
      .order('created_at', { ascending: false })
    if (!error) setBugs(data)
    setLoading(false)
  }

  async function toggleHistorique(bugId) {
    if (historiqueOuvert === bugId) {
      setHistoriqueOuvert(null)
      return
    }
    const { data, error } = await supabase
      .from('bugs_admin_historique')
      .select('*')
      .eq('bug_id', bugId)
      .order('changed_at', { ascending: true })
    if (!error) setHistorique(data)
    setHistoriqueOuvert(bugId)
  }

  function formatDateHeure(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  async function saveBug(bug) {
    if (bug.id) {
      await supabase.from('bugs_admin')
        .update({
          titre: bug.titre,
          description: bug.description,
          statut: bug.statut,
          priorite: bug.priorite,
          fichier_concerne: bug.fichier_concerne,
          commit_ref: bug.commit_ref,
        })
        .eq('id', bug.id)
    } else {
      await supabase.from('bugs_admin').insert({
        titre: bug.titre,
        description: bug.description,
        statut: bug.statut || 'a_faire',
        priorite: bug.priorite || 'utile',
        fichier_concerne: bug.fichier_concerne,
        commit_ref: bug.commit_ref,
      })
    }
    setEditing(null)
    fetchBugs()
  }

  async function deleteBug(id) {
    if (!confirm('Supprimer ce bug ?')) return
    await supabase.from('bugs_admin').delete().eq('id', id)
    fetchBugs()
  }

  const bugsAffiches = filtreStatut === 'tous'
    ? bugs
    : bugs.filter(b => b.statut === filtreStatut)

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Bugs connus</h2>
        <button onClick={() => setEditing({})}>+ Nouveau bug</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setFiltreStatut('tous')} style={{ fontWeight: filtreStatut === 'tous' ? 700 : 400 }}>
          Tous ({bugs.length})
        </button>
        {Object.entries(STATUTS).map(([key, s]) => (
          <button key={key} onClick={() => setFiltreStatut(key)} style={{ fontWeight: filtreStatut === key ? 700 : 400 }}>
            {s.dot} {s.label} ({bugs.filter(b => b.statut === key).length})
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
            {bugsAffiches.map(bug => (
              <>
                <tr key={bug.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>
                    <span style={{ color: STATUTS[bug.statut].color, fontWeight: 600 }}>
                      {STATUTS[bug.statut].dot} {STATUTS[bug.statut].label}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>
                    <strong>{bug.titre}</strong>
                    {bug.description && <div style={{ fontSize: 13, color: '#666' }}>{bug.description}</div>}
                  </td>
                  <td style={{ padding: 8 }}>{PRIORITES[bug.priorite]}</td>
                  <td style={{ padding: 8, fontSize: 12, color: '#666' }}>{formatDateHeure(bug.created_at)}</td>
                  <td style={{ padding: 8, fontSize: 12, color: '#666' }}>{formatDateHeure(bug.updated_at)}</td>
                  <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                    <button onClick={() => toggleHistorique(bug.id)}>
                      {historiqueOuvert === bug.id ? 'Fermer' : 'Historique'}
                    </button>
                    <button onClick={() => setEditing(bug)}>Éditer</button>
                    <button onClick={() => deleteBug(bug.id)}>Suppr.</button>
                  </td>
                </tr>
                {historiqueOuvert === bug.id && (
                  <tr key={`${bug.id}-hist`}>
                    <td colSpan={6} style={{ padding: '8px 8px 16px 32px', background: '#fafafa' }}>
                      {historique.length === 0 ? (
                        <em style={{ fontSize: 13 }}>Aucun historique.</em>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
                          {historique.map(h => (
                            <li key={h.id}>
                              {formatDateHeure(h.changed_at)} — {h.statut_avant
                                ? <>{STATUTS[h.statut_avant].dot} {STATUTS[h.statut_avant].label} → {STATUTS[h.statut_apres].dot} {STATUTS[h.statut_apres].label}</>
                                : <>Créé en statut {STATUTS[h.statut_apres].dot} {STATUTS[h.statut_apres].label}</>
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

      {editing && (
        <BugForm
          bug={editing}
          onSave={saveBug}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function BugForm({ bug, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: bug.id,
    titre: bug.titre || '',
    description: bug.description || '',
    statut: bug.statut || 'a_faire',
    priorite: bug.priorite || 'utile',
    fichier_concerne: bug.fichier_concerne || '',
    commit_ref: bug.commit_ref || '',
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 480 }}>
        <h3>{bug.id ? 'Éditer le bug' : 'Nouveau bug'}</h3>
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