import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Mêmes 7 zones/chakras que NapoÉnergie (identité visuelle réutilisée), mais ici
// on ne mesure qu'un avant/après par zone sur échelle 0-8 — pas de rotation/état/
// taux Bovis/axes directionnels comme dans EnergieSéance.
const ZONES = [
  { id:1, nom:'Muladhara',    num:'1er', tag:'Racine · terre · sécurité', color:'#DC2626', bg:'#FEF2F2' },
  { id:2, nom:'Svadhisthana', num:'2e',  tag:'Sacré · eau · créativité', color:'#EA580C', bg:'#FFF7ED' },
  { id:3, nom:'Manipura',     num:'3e',  tag:'Plexus · feu · volonté', color:'#CA8A04', bg:'#FEFCE8' },
  { id:4, nom:'Anahata',      num:'4e',  tag:'Cœur · air · amour', color:'#16A34A', bg:'#F0FDF4' },
  { id:5, nom:'Vishuddha',    num:'5e',  tag:'Gorge · éther · expression', color:'#0369A1', bg:'#F0F9FF' },
  { id:6, nom:'Ajna',         num:'6e',  tag:'3e oeil · intuition', color:'#4F46E5', bg:'#EEF2FF' },
  { id:7, nom:'Sahasrara',    num:'7e',  tag:'Couronne · éveil', color:'#7C3AED', bg:'#FAF5FF' },
]

const ECHELLE = [0,1,2,3,4,5,6,7,8]
const OUTILS  = ['Mains','Pendule','Baguettes','Autre']
const MOIS    = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']

function fmtDate(d) {
  if (!d) return ''
  const [y,m,j] = d.slice(0,10).split('-')
  return `${parseInt(j)} ${MOIS[parseInt(m)-1]} ${y}`
}

export default function MagnetismeSeance() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [seance, setSeance] = useState(null)
  const [client, setClient] = useState(null)
  const [historique, setHistorique] = useState([])
  const [mesures, setMesures] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('fiches_magnetisme')
        .select('*, clients(id, prenom, nom)').eq('id', id).single()
      if (!s) { navigate('/magnetisme'); return }
      setSeance(s)
      setClient(s.clients)
      const { data: hist } = await supabase.from('fiches_magnetisme')
        .select('id, numero_seance, date_seance').eq('client_id', s.client_id)
        .order('date_seance', { ascending: false })
      setHistorique(hist || [])
      const { data: m } = await supabase.from('fiches_magnetisme_zones')
        .select('*').eq('fiche_id', id)
      const map = {}
      ;(m || []).forEach(row => { map[row.zone_id] = row })
      setMesures(map)
      setLoading(false)
    }
    load()
  }, [id])

  function updateMesure(zoneId, field, value) {
    setMesures(prev => ({
      ...prev,
      [zoneId]: { ...(prev[zoneId] || { zone_id: zoneId }), [field]: value }
    }))
  }

  function updateSeanceField(field, value) {
    setSeance(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('fiches_magnetisme').update({
      date_seance: seance.date_seance,
      heure_seance: seance.heure_seance,
      outil: seance.outil,
      bilan: seance.bilan,
      duree_minutes: parseInt(seance.duree_minutes) || 60,
      prix_euros: parseFloat(seance.prix_euros) || null,
      updated_at: new Date().toISOString()
    }).eq('id', id)
    for (const zoneId of Object.keys(mesures)) {
      const m = mesures[zoneId]
      const existing = m.id
      const payload = {
        fiche_id: id, user_id: user.id, zone_id: parseInt(zoneId),
        mesure_avant: m.mesure_avant ?? null,
        mesure_apres: m.mesure_apres ?? null,
      }
      if (existing) {
        await supabase.from('fiches_magnetisme_zones').update(payload).eq('id', existing)
      } else {
        const { data: ins } = await supabase.from('fiches_magnetisme_zones').insert(payload).select().single()
        if (ins) setMesures(prev => ({ ...prev, [zoneId]: ins }))
      }
    }
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
        <button onClick={() => navigate('/magnetisme')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', fontSize:13, display:'flex', alignItems:'center', gap:4, padding:0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize:15 }} />Retour
        </button>
        <span style={{ color:'var(--color-border-secondary)' }}>/</span>
        <i className="ti ti-hand-stop" style={{ fontSize:18, color:'var(--color-accent)' }} />
        <div style={{ fontSize:16, fontWeight:600, color:'var(--color-text-primary)' }}>
          {client?.prenom} {client?.nom} — Séance #{seance.numero_seance}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          {saved && <span style={{ fontSize:11, color:'#16A34A', background:'#F0FDF4', border:'0.5px solid #A7F3D0', padding:'3px 10px', borderRadius:6 }}>Sauvegardé ✓</span>}
          <button onClick={() => navigate(`/live/magnetisme/${id}`)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
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
            <span style={{ fontSize:10, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.04em' }}>Outil</span>
            <select value={seance.outil || ''} onChange={e => updateSeanceField('outil', e.target.value)} style={{ ...inp, width:'auto' }}>
              <option value="">Sélectionner...</option>
              {OUTILS.map(o => <option key={o} value={o}>{o}</option>)}
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

        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Historique séances</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {historique.map(h => (
              <span key={h.id} onClick={() => navigate(`/magnetisme/${h.id}`)}
                style={{ fontSize:11, padding:'3px 10px', borderRadius:20, cursor:'pointer', background:h.id===id ? '#1e293b' : 'var(--color-background-primary)', color:h.id===id ? '#fff' : 'var(--color-text-secondary)', border:'0.5px solid var(--color-border-tertiary)' }}>
                #{h.numero_seance} {h.date_seance ? fmtDate(h.date_seance) : ''}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize:9, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>Bilan / synthèse</div>
          <textarea value={seance.bilan || ''} onChange={e => updateSeanceField('bilan', e.target.value)}
            rows={3} placeholder="Bilan de la séance, ressenti, recommandations..."
            style={{ ...inp, resize:'none', lineHeight:1.6 }} />
        </div>
      </div>

      {/* Zones */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {ZONES.map(z => {
          const m = mesures[z.id] || {}
          return (
            <div key={z.id} style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:14, overflow:'hidden' }}>
              <div style={{ display:'flex', gap:12, padding:'12px 14px', alignItems:'center' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:z.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:z.color }}>{z.num}</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:z.color, marginBottom:2 }}>{z.nom} — {z.num} chakra</div>
                  <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>{z.tag}</div>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderTop:'0.5px solid var(--color-border-tertiary)' }}>
                {[['mesure_avant','Avant'],['mesure_apres','Après']].map(([field, label]) => (
                  <div key={field} style={{ padding:'10px 14px', borderRight: field==='mesure_avant' ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                    <div style={{ fontSize:9, color:z.color, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8, fontWeight:600 }}>{label} (0-8)</div>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {ECHELLE.map(v => (
                        <button key={v} onClick={() => updateMesure(z.id, field, m[field] === v ? null : v)}
                          style={{ width:26, height:26, borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', border:'0.5px solid var(--color-border-secondary)', background:m[field]===v ? z.color : 'var(--color-background-primary)', color:m[field]===v ? '#fff' : 'var(--color-text-secondary)' }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
        <button onClick={handleSave} disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 24px', borderRadius:8, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:14, fontWeight:600, cursor:saving ? 'not-allowed' : 'pointer', opacity:saving ? 0.7 : 1 }}>
          <i className="ti ti-device-floppy" style={{ fontSize:15 }} />{saving ? 'Sauvegarde…' : 'Sauvegarder la séance'}
        </button>
      </div>

    </div>
  )
}
