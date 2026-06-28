import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminUserDetail({ user, onBack }) {
  const [stats, setStats] = useState({ clients: 0, seances: 0, notes: 0, taches: 0, bach: 0, rdv: 0 })
  const [profile, setProfile] = useState(null)
  const [lastSeance, setLastSeance] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const [c, s, n, t, b, r, p, ls] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('seances').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('taches').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('fiches_bach').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('rendez_vous').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('seances').select('date_seance').eq('user_id', user.id).order('date_seance', { ascending: false }).limit(1).single(),
      ])
      setStats({ clients: c.count||0, seances: s.count||0, notes: n.count||0, taches: t.count||0, bach: b.count||0, rdv: r.count||0 })
      if (p.data) {
        setProfile(p.data)
        setAdminNotes(p.data.admin_notes || '')
        setTags(p.data.tags || [])
      }
      if (ls.data) setLastSeance(ls.data.date_seance)
      setLoading(false)
    }
    fetchAll()
  }, [user.id])

  async function saveNotes() {
    setSaving(true)
    await supabase.from('profiles').update({ admin_notes: adminNotes, tags }).eq('id', user.id)
    setSaving(false)
  }

  async function updatePlan(plan) {
    await supabase.from('profiles').update({ plan }).eq('id', user.id)
    setProfile(p => ({ ...p, plan }))
  }

  function addTag() {
    if (!newTag.trim() || tags.includes(newTag.trim())) return
    setTags(t => [...t, newTag.trim()])
    setNewTag('')
  }

  function removeTag(tag) {
    setTags(t => t.filter(x => x !== tag))
  }

  function fmt(date) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function daysAgo(date) {
    if (!date) return '—'
    const diff = Math.floor((Date.now() - new Date(date)) / 86400000)
    if (diff === 0) return "aujourd'hui"
    return `il y a ${diff} jour${diff > 1 ? 's' : ''}`
  }

  function trialDaysLeft() {
    if (!profile?.trial_ends_at) return null
    const diff = Math.ceil((new Date(profile.trial_ends_at) - Date.now()) / 86400000)
    return diff
  }

  const planColors = { trial: '#B8961E', reflexion: '#4BBFCE', batisseur: '#7C9A7E', visionnaire: '#534AB7' }
  const planLabels = { trial: 'Trial', reflexion: 'Napo-Réflexion', batisseur: 'Napo-Bâtisseur', visionnaire: 'Napo-Visionnaire' }

  const statCards = [
    { label: 'Clients',   value: stats.clients,  icon: 'ti-users',        color: '#4BBFCE' },
    { label: 'Séances',   value: stats.seances,  icon: 'ti-calendar',     color: '#7C9A7E' },
    { label: 'Notes',     value: stats.notes,    icon: 'ti-notes',        color: '#B8961E' },
    { label: 'Tâches',    value: stats.taches,   icon: 'ti-check',        color: '#534AB7' },
    { label: 'Bach',      value: stats.bach,     icon: 'ti-leaf',         color: '#4BBFCE' },
    { label: 'RDV pris',  value: stats.rdv,      icon: 'ti-clock',        color: '#7C9A7E' },
  ]

  const currentPlan = profile?.plan || 'trial'
  const daysLeft = trialDaysLeft()

  return (
    <div style={{ padding: '2rem', maxWidth: '720px' }}>
      <button onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent',
          border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-secondary)',
          marginBottom: '1.5rem', padding: 0 }}>
        <i className="ti ti-arrow-left" /> Retour
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.5rem' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#4BBFCE',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', fontWeight: 700, color: '#fff' }}>
          {(user.prenom || '?')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: '17px', fontWeight: 600 }}>{user.prenom || '—'}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {user.is_admin ? '⭐ Admin' : 'Utilisateur'} · Inscrit {daysAgo(profile?.welcomed_at)}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
          background: planColors[currentPlan] + '22', color: planColors[currentPlan], border: `1px solid ${planColors[currentPlan]}44` }}>
          {planLabels[currentPlan] || currentPlan}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '1.5rem' }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: 'var(--color-background-primary)', borderRadius: '10px',
            border: '0.5px solid var(--color-border-tertiary)', padding: '0.75rem', textAlign: 'center' }}>
            <i className={`ti ${s.icon}`} style={{ fontSize: '16px', color: s.color, display: 'block', marginBottom: '4px' }} />
            <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{loading ? '…' : s.value}</div>
            <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Infos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--color-background-primary)', borderRadius: '10px',
          border: '0.5px solid var(--color-border-tertiary)', padding: '1.25rem' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>📋 Infos compte</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span>📅 Inscription : {fmt(profile?.welcomed_at)}</span>
            <span>🕐 Dernière connexion : {daysAgo(profile?.last_active_at)}</span>
            <span>🔢 Connexions totales : {profile?.login_count || 0}</span>
            <span>📅 Dernière séance : {fmt(lastSeance)}</span>
            <span>🌐 Agenda public : {user.agenda_public ? '✅ Oui' : '❌ Non'}</span>
            {user.slug && (
              <span>🔗 Slug : <a href={`/rdv/${user.slug}`} target="_blank" rel="noreferrer"
                style={{ color: '#4BBFCE' }}>/rdv/{user.slug}</a></span>
            )}
          </div>
        </div>

        <div style={{ background: 'var(--color-background-primary)', borderRadius: '10px',
          border: '0.5px solid var(--color-border-tertiary)', padding: '1.25rem' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>💳 Plan & Trial</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span>Plan actuel : <strong style={{ color: planColors[currentPlan] }}>{planLabels[currentPlan]}</strong></span>
            {currentPlan === 'trial' && daysLeft !== null && (
              <span style={{ color: daysLeft <= 3 ? '#E24B4A' : '#B8961E' }}>
                ⏳ Trial : {daysLeft > 0 ? `${daysLeft} jours restants` : 'Expiré'}
              </span>
            )}
            <span>📅 Fin trial : {fmt(profile?.trial_ends_at)}</span>
            <span>✅ Converti le : {fmt(profile?.converted_at)}</span>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {['trial','reflexion','batisseur','visionnaire'].map(p => (
              <button key={p} onClick={() => updatePlan(p)}
                style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '12px', cursor: 'pointer',
                  background: currentPlan === p ? planColors[p] : 'transparent',
                  color: currentPlan === p ? '#fff' : planColors[p],
                  border: `1px solid ${planColors[p]}` }}>
                {planLabels[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div style={{ background: 'var(--color-background-primary)', borderRadius: '10px',
        border: '0.5px solid var(--color-border-tertiary)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>🏷️ Tags internes</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          {tags.map(tag => (
            <span key={tag} style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px',
              background: '#4BBFCE22', color: '#4BBFCE', border: '1px solid #4BBFCE44',
              cursor: 'pointer' }} onClick={() => removeTag(tag)}>
              {tag} ×
            </span>
          ))}
          {tags.length === 0 && <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Aucun tag</span>}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input value={newTag} onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag()}
            placeholder="ex: testeur alpha, à relancer, VIP..."
            style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', fontSize: '11px',
              border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)',
              color: 'var(--color-text-primary)' }} />
          <button onClick={addTag}
            style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer',
              background: '#4BBFCE', color: '#fff', border: 'none' }}>
            Ajouter
          </button>
        </div>
      </div>

      {/* Notes admin */}
      <div style={{ background: 'var(--color-background-primary)', borderRadius: '10px',
        border: '0.5px solid var(--color-border-tertiary)', padding: '1.25rem' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>📝 Notes admin privées</div>
        <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
          placeholder="Notes internes sur cet utilisateur..."
          rows={4}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', fontSize: '11px',
            border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)',
            color: 'var(--color-text-primary)', resize: 'vertical', boxSizing: 'border-box' }} />
        <button onClick={saveNotes}
          style={{ marginTop: '8px', padding: '6px 16px', borderRadius: '6px', fontSize: '11px',
            cursor: 'pointer', background: '#7C9A7E', color: '#fff', border: 'none' }}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}
