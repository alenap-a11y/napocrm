import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const INDUCTIONS = ['Progressive', 'Rapide', 'Confusionnelle', 'Autre']
const MOIS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']

function fmtDate(d) {
  if (!d) return ''
  const [y,m,j] = d.slice(0,10).split('-')
  return `${parseInt(j)} ${MOIS[parseInt(m)-1]} ${y}`
}

export default function HypnotherapieSeance() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [seance, setSeance] = useState(null)
  const [client, setClient] = useState(null)
  const [historique, setHistorique] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('fiches_hypnotherapie')
        .select('*, clients(id, prenom, nom)').eq('id', id).single()
      if (!s) { navigate('/napo-hypnotherapie'); return }
      setSeance(s)
      setClient(s.clients)
      const { data: hist } = await supabase.from('fiches_hypnotherapie')
        .select('id, numero_seance, date_seance').eq('client_id', s.client_id)
        .order('date_seance', { ascending: false })
      setHistorique(hist || [])
      setLoading(false)
    }
    load()
  }, [id])

  function updateSeanceField(field, value) {
    setSeance(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('fiches_hypnotherapie').update({
      date_seance: seance.date_seance,
      heure_seance: seance.heure_seance,
      objectif_seance: seance.objectif_seance,
      type_induction: seance.type_induction,
      deroulement: seance.deroulement,
      bilan: seance.bilan,
      duree_minutes: parseInt(seance.duree_minutes) || 60,
      prix_euros: parseFloat(seance.prix_euros) || null,
      updated_at: new Date().toISOString()
    }).eq('id', id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div style={{ padding:'2rem', color:'var(--color-text-secondary)', fontSize:13 }}>Chargement…</div>

  const inp = { width:'100%', padding:'5px 8px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', fontSize:12, boxSizing:'border-box', fontFamily:'inherit' }

  return (
    <div style={{ padding:'1.6rem 2rem', fontFamily:'inherit', maxWidth:1100 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1.2rem' }}>
        <button onClick={() => navigate('/napo-hypnotherapie')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', fontSize:13, display:'flex', alignItems:'center', gap:4, padding:0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize:15 }} />Retour
        </button>
        <span style={{ color:'var(--color-border-secondary)' }}>/</span>
        <i className="ti ti-spiral" style={{ fontSize:18, color:'var(--color-accent)' }} />
        <div style={{ fontSize:16, fontWeight:600, color:'var(--color-text-primary)' }}>
          {client?.prenom} {client?.nom} — Séance #{seance.numero_seance}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          {saved && <span style={{ fontSize:11, color:'#16A34A', background:'#F0FDF4', border:'0.5px solid #A7F3D0', padding:'3px 10px', borderRadius:6 }}>Sauvegardé ✓</span>}
          <button onClick={() => navigate(`/live/hypnotherapie/${id}`)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <i className="ti ti-video" style={{ fontSize:14 }} />Démarrer la séance en direct
          </button>
          <button onClick={handleSave} disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:8, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:13, fontWeight:600, cursor:saving ? 'not-allowed' : 'pointer', opacity:saving ? 0.7 : 1 }}>
            <i className="ti ti-device-floppy" style={{ fontSize:14 }} />{saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* En-tête séance */}
      <div style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:14, padding:'14px 16px', marginBottom:14 }}>

        <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:10, color:'var(--color-text-muted)', textTransform:'uppercase', letterSpacing:'.05em' }}>Séance</span>
            <span style={{ fontSize:12, fontWeight:600, background:'#1e293b', color:'#fff', padding:'3px 10px', borderRadius:20 }}>#{seance.numero_seance}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:10, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.04em' }}>Date</span>
            <input type="date" value={seance.date_seance || ''} onChange={e => updateSeanceField('date_seance', e.target.value)}
              style={{ ...inp, width:'auto', fontSize:12 }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:10, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.04em' }}>Heure</span>
            <input type="time" value={seance.heure_seance?.slice(0,5) || ''} onChange={e => updateSeanceField('heure_seance', e.target.value)}
              style={{ ...inp, width:90, fontSize:12 }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:10, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.04em' }}>Induction</span>
            <select value={seance.type_induction || ''} onChange={e => updateSeanceField('type_induction', e.target.value)} style={{ ...inp, width:'auto' }}>
              <option value="">Sélectionner...</option>
              {INDUCTIONS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:10, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.04em' }}>Durée</span>
            <select value={seance.duree_minutes || '60'} onChange={e => updateSeanceField('duree_minutes', e.target.value)} style={{ ...inp, width:80 }}>
              {[30,45,60,75,90,120].map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:10, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.04em' }}>Prix</span>
            <input type="number" value={seance.prix_euros || ''} onChange={e => updateSeanceField('prix_euros', e.target.value)}
              placeholder="60" min="0" step="5"
              style={{ ...inp, width:70 }} />
            <span style={{ fontSize:11, color:'var(--color-text-secondary)' }}>€</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize:9, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Historique séances</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {historique.map(h => (
              <span key={h.id} onClick={() => navigate(`/napo-hypnotherapie/${h.id}`)}
                style={{ fontSize:11, padding:'3px 10px', borderRadius:20, cursor:'pointer', background:h.id===id ? '#1e293b' : 'var(--color-background-primary)', color:h.id===id ? '#fff' : 'var(--color-text-secondary)', border:'0.5px solid var(--color-border-tertiary)' }}>
                #{h.numero_seance} {h.date_seance ? fmtDate(h.date_seance) : ''}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu séance */}
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:9, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Objectif de séance</div>
          <textarea value={seance.objectif_seance || ''} onChange={e => updateSeanceField('objectif_seance', e.target.value)}
            rows={2} placeholder="Objectif travaillé..."
            style={{ ...inp, resize:'none', lineHeight:1.6 }} />
        </div>

        <div style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:9, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Déroulement / suggestions travaillées</div>
          <textarea value={seance.deroulement || ''} onChange={e => updateSeanceField('deroulement', e.target.value)}
            rows={4} placeholder="Déroulement de la séance, suggestions données..."
            style={{ ...inp, resize:'none', lineHeight:1.6 }} />
        </div>

        <div style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:9, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Bilan / synthèse</div>
          <textarea value={seance.bilan || ''} onChange={e => updateSeanceField('bilan', e.target.value)}
            rows={3} placeholder="Bilan de la séance..."
            style={{ ...inp, resize:'none', lineHeight:1.6 }} />
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
        <button onClick={handleSave} disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 24px', borderRadius:8, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:14, fontWeight:600, cursor:saving ? 'not-allowed' : 'pointer', opacity:saving ? 0.7 : 1 }}>
          <i className="ti ti-device-floppy" style={{ fontSize:15 }} />{saving ? 'Sauvegarde…' : 'Sauvegarder la séance'}
        </button>
      </div>

    </div>
  )
}
