import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TYPES_SEANCE = ['Reiki', 'Énergétique', 'Soins chakras', 'Autre']

export default function EditSeanceEnergeticien() {
  const { clientId, seanceId } = useParams()
  const navigate = useNavigate()
  const [seances, setSeances] = useState([])
  const [clientNom, setClientNom] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  // Formulaire édition
  const [form, setForm] = useState({ date_seance: '', type: '', duree_minutes: '', prix_euros: '' })

  useEffect(() => {
    async function load() {
      const { data: client } = await supabase
        .from('clients').select('prenom, nom').eq('id', clientId).single()
      if (client) setClientNom(`${client.prenom} ${client.nom}`)

      if (seanceId) {
        const { data } = await supabase
          .from('seances').select('id, date_seance, type, duree_minutes, prix_euros')
          .eq('id', seanceId).single()
        if (data) setForm({
          date_seance: data.date_seance?.slice(0, 10) || '',
          type: data.type || '',
          duree_minutes: data.duree_minutes || '',
          prix_euros: data.prix_euros || ''
        })
      } else {
        const { data } = await supabase
          .from('seances').select('id, date_seance, type, duree_minutes, prix_euros')
          .eq('client_id', clientId).order('date_seance', { ascending: false })
        setSeances(data || [])
      }
      setLoading(false)
    }
    load()
  }, [clientId, seanceId])

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('seances').update({
      date_seance: form.date_seance,
      type: form.type,
      duree_minutes: parseInt(form.duree_minutes) || null,
      prix_euros: parseFloat(form.prix_euros) || null
    }).eq('id', seanceId)
    setSaving(false)
    if (error) { setSaveStatus('error'); return }
    setSaveStatus('ok')
    setTimeout(() => navigate(`/chakras/edit/${clientId}`), 1200)
  }

  if (loading) return <div style={{ padding: 32 }}>Chargement...</div>

  // MODE FORMULAIRE
  if (seanceId) return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate(`/chakras/edit/${clientId}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontWeight: 600, marginBottom: 16 }}>
        ← Retour
      </button>
      <h2 style={{ marginBottom: 24 }}>Modifier la séance — {clientNom}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Date</label>
          <input type="date" value={form.date_seance} onChange={e => setForm(f => ({ ...f, date_seance: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: 14 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Type de soin</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: 14 }}>
            <option value="">— Sélectionner —</option>
            {TYPES_SEANCE.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Durée (min)</label>
          <input type="number" value={form.duree_minutes} onChange={e => setForm(f => ({ ...f, duree_minutes: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: 14 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Tarif (€)</label>
          <input type="number" value={form.prix_euros} onChange={e => setForm(f => ({ ...f, prix_euros: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: 14 }} />
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: '12px', borderRadius: 8, border: 'none', background: saveStatus === 'ok' ? '#27AE60' : saveStatus === 'error' ? '#993556' : 'var(--color-accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {saving ? 'Enregistrement…' : saveStatus === 'ok' ? '✓ Sauvegardé' : saveStatus === 'error' ? '✗ Erreur' : '💾 Enregistrer'}
        </button>
      </div>
    </div>
  )

  // MODE LISTE
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontWeight: 600, marginBottom: 16 }}>
        ← Retour
      </button>
      <h2 style={{ marginBottom: 4 }}>Séances de {clientNom}</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: 14 }}>Sélectionne une séance à modifier</p>
      {seances.length === 0 && <p style={{ color: 'var(--color-text-secondary)' }}>Aucune séance trouvée.</p>}
      {seances.map(s => {
        const dateLabel = s.date_seance ? new Date(s.date_seance.slice(0,10) + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--color-border)', marginBottom: 10, background: 'var(--color-surface)' }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{dateLabel}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{s.type} · {s.duree_minutes} min{s.prix_euros ? ` · ${s.prix_euros}€` : ''}</div>
            </div>
            <button onClick={() => navigate(`/chakras/edit/${clientId}/${s.id}`)}
              style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid var(--color-accent)', background: 'transparent', color: 'var(--color-accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Éditer
            </button>
          </div>
        )
      })}
    </div>
  )
}
