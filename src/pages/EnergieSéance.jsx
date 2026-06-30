import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const CHAKRAS = [
  { id:1, nom:'Muladhara',    num:'1er', tag:'Racine · terre · sécurité', color:'#DC2626', bg:'#FEF2F2',
    lotus:(c)=>`<ellipse cx="50" cy="14" rx="12" ry="22" fill="${c}" opacity=".85" transform="rotate(0 50 50)"/><ellipse cx="50" cy="14" rx="12" ry="22" fill="${c}" opacity=".85" transform="rotate(90 50 50)"/><ellipse cx="50" cy="14" rx="12" ry="22" fill="${c}" opacity=".85" transform="rotate(180 50 50)"/><ellipse cx="50" cy="14" rx="12" ry="22" fill="${c}" opacity=".85" transform="rotate(270 50 50)"/><circle cx="50" cy="50" r="22" fill="${c}"/><circle cx="50" cy="50" r="8" fill="#fff" opacity=".4"/>` },
  { id:2, nom:'Svadhisthana', num:'2e',  tag:'Sacré · eau · créativité', color:'#EA580C', bg:'#FFF7ED',
    lotus:(c)=>[0,60,120,180,240,300].map(r=>`<ellipse cx="50" cy="10" rx="11" ry="22" fill="${c}" opacity=".85" transform="rotate(${r} 50 50)"/>`).join('')+`<circle cx="50" cy="50" r="22" fill="${c}"/><path d="M50 30 A20 20 0 1 1 50 70 A12 12 0 1 0 50 30Z" fill="none" stroke="#fff" stroke-width="1.5" opacity=".7"/>` },
  { id:3, nom:'Manipura',     num:'3e',  tag:'Plexus · feu · volonté', color:'#CA8A04', bg:'#FEFCE8',
    lotus:(c)=>[0,36,72,108,144,180,216,252,288,324].map(r=>`<ellipse cx="50" cy="10" rx="10" ry="20" fill="${c}" opacity=".85" transform="rotate(${r} 50 50)"/>`).join('')+`<circle cx="50" cy="50" r="22" fill="${c}"/><polygon points="50,30 64,60 36,60" fill="#fff" opacity=".3"/><polygon points="50,70 64,40 36,40" fill="#fff" opacity=".2"/>` },
  { id:4, nom:'Anahata',      num:'4e',  tag:'Cœur · air · amour', color:'#16A34A', bg:'#F0FDF4',
    lotus:(c)=>[0,30,60,90,120,150,180,210,240,270,300,330].map(r=>`<ellipse cx="50" cy="10" rx="10" ry="20" fill="${c}" opacity=".85" transform="rotate(${r} 50 50)"/>`).join('')+`<circle cx="50" cy="50" r="22" fill="${c}"/><polygon points="50,32 64,58 36,58" fill="#fff" opacity=".3"/><polygon points="50,68 64,42 36,42" fill="#fff" opacity=".25"/>` },
  { id:5, nom:'Vishuddha',    num:'5e',  tag:'Gorge · éther · expression', color:'#0369A1', bg:'#F0F9FF',
    lotus:(c)=>[0,22.5,45,67.5,90,112.5,135,157.5,180,202.5,225,247.5,270,292.5,315,337.5].map(r=>`<ellipse cx="50" cy="10" rx="9" ry="18" fill="${c}" opacity=".85" transform="rotate(${r} 50 50)"/>`).join('')+`<circle cx="50" cy="50" r="22" fill="${c}"/><circle cx="50" cy="50" r="12" fill="#fff" opacity=".25"/><circle cx="50" cy="50" r="5" fill="#fff" opacity=".5"/>` },
  { id:6, nom:'Ajna',         num:'6e',  tag:'3e oeil · intuition', color:'#4F46E5', bg:'#EEF2FF',
    lotus:(c)=>`<ellipse cx="50" cy="12" rx="14" ry="26" fill="${c}" opacity=".85" transform="rotate(0 50 50)"/><ellipse cx="50" cy="12" rx="14" ry="26" fill="${c}" opacity=".85" transform="rotate(180 50 50)"/><circle cx="50" cy="50" r="22" fill="${c}"/><circle cx="50" cy="50" r="12" fill="#fff" opacity=".2"/><circle cx="50" cy="50" r="5" fill="#fff" opacity=".6"/>` },
  { id:7, nom:'Sahasrara',    num:'7e',  tag:'Couronne · éveil', color:'#7C3AED', bg:'#FAF5FF',
    lotus:(c)=>[0,20,40,60,80,100,120,140,160,180,200,220,240,260,280,300,320,340].map(r=>`<ellipse cx="50" cy="12" rx="7" ry="16" fill="${c}" opacity=".8" transform="rotate(${r} 50 50)"/>`).join('')+`<circle cx="50" cy="50" r="22" fill="${c}"/><circle cx="50" cy="50" r="12" fill="#fff" opacity=".2"/><circle cx="50" cy="50" r="5" fill="#fff" opacity=".5"/><circle cx="50" cy="50" r="2" fill="#fff" opacity=".9"/>` },
]

const ETATS   = ['Ouvert','Fermé','Hyper','Hypo','Inversé','Fragmenté']
const OUTILS  = ['Pendule','Mains','Baguettes','Radiestésie','Autre']
const ROT     = ['Horaire ↻','Anti ↺','Ellipse','Immobile']
const MOIS    = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']

function fmtDate(d) {
  if (!d) return ''
  const [y,m,j] = d.slice(0,10).split('-')
  return `${parseInt(j)} ${MOIS[parseInt(m)-1]} ${y}`
}

export default function EnergieSéance() {
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
      const { data: s } = await supabase.from('energie_seances')
        .select('*, clients(id, prenom, nom)').eq('id', id).single()
      if (!s) { navigate('/energie'); return }
      setSeance(s)
      setClient(s.clients)
      const { data: hist } = await supabase.from('energie_seances')
        .select('id, numero_seance, date_seance').eq('client_id', s.client_id)
        .order('date_seance', { ascending: false })
      setHistorique(hist || [])
      const { data: m } = await supabase.from('energie_chakras_mesures')
        .select('*').eq('seance_id', id)
      const map = {}
      ;(m || []).forEach(row => { map[row.chakra_id] = row })
      setMesures(map)
      setLoading(false)
    }
    load()
  }, [id])

  function updateMesure(chakraId, field, value) {
    setMesures(prev => ({
      ...prev,
      [chakraId]: { ...(prev[chakraId] || { chakra_id: chakraId }), [field]: value }
    }))
  }

  function updateSeanceField(field, value) {
    setSeance(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('energie_seances').update({
      date_seance: seance.date_seance,
      heure_seance: seance.heure_seance,
      outil: seance.outil,
      note_globale: seance.note_globale,
      duree_minutes: parseInt(seance.duree_minutes) || 60,
      prix_euros: parseFloat(seance.prix_euros) || null,
      updated_at: new Date().toISOString()
    }).eq('id', id)
    for (const chakraId of Object.keys(mesures)) {
      const m = mesures[chakraId]
      const existing = m.id
      const payload = {
        seance_id: id, user_id: user.id, chakra_id: parseInt(chakraId),
        taux_bovis: m.taux_bovis || null, rotation: m.rotation || null,
        etat: m.etat || null, couleur_percue: m.couleur_percue || null,
        avant: m.avant || null, arriere: m.arriere || null,
        gauche: m.gauche || null, droite: m.droite || null,
        observation: m.observation || null
      }
      if (existing) {
        await supabase.from('energie_chakras_mesures').update(payload).eq('id', existing)
      } else {
        const { data: ins } = await supabase.from('energie_chakras_mesures').insert(payload).select().single()
        if (ins) setMesures(prev => ({ ...prev, [chakraId]: ins }))
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
        <button onClick={() => navigate('/energie')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', fontSize:13, display:'flex', alignItems:'center', gap:4, padding:0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize:15 }} />Retour
        </button>
        <span style={{ color:'var(--color-border-secondary)' }}>/</span>
        <i className="ti ti-sparkles" style={{ fontSize:18, color:'var(--color-accent)' }} />
        <div style={{ fontSize:16, fontWeight:600, color:'var(--color-text-primary)' }}>
          {client?.prenom} {client?.nom} — Séance #{seance.numero_seance}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          {saved && <span style={{ fontSize:11, color:'#16A34A', background:'#F0FDF4', border:'0.5px solid #A7F3D0', padding:'3px 10px', borderRadius:6 }}>Sauvegardé ✓</span>}
          <button onClick={handleSave} disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:8, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:13, fontWeight:600, cursor:saving ? 'not-allowed' : 'pointer', opacity:saving ? 0.7 : 1 }}>
            <i className="ti ti-device-floppy" style={{ fontSize:14 }} />{saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* En-tete seance */}
      <div style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:14, padding:'14px 16px', marginBottom:14 }}>

        {/* Ligne 1 : date heure outil */}
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
            <span style={{ fontSize:10, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.04em' }}>Duree</span>
            <select value={seance.duree_minutes || '60'} onChange={e => updateSeanceField('duree_minutes', e.target.value)} style={{ ...inp, width:80 }}>
              {[30,45,60,75,90,120].map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:10, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.04em' }}>Prix</span>
            <input type="number" value={seance.prix_euros || ''} onChange={e => updateSeanceField('prix_euros', e.target.value)} placeholder="60" min="0" step="5" style={{ ...inp, width:70 }} />
            <span style={{ fontSize:11, color:'var(--color-text-secondary)' }}>EUR</span>
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

        {/* Historique */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Historique séances</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {historique.map(h => (
              <span key={h.id} onClick={() => navigate(`/energie/${h.id}`)}
                style={{ fontSize:11, padding:'3px 10px', borderRadius:20, cursor:'pointer', background:h.id===id ? '#1e293b' : 'var(--color-background-primary)', color:h.id===id ? '#fff' : 'var(--color-text-secondary)', border:'0.5px solid var(--color-border-tertiary)' }}>
                #{h.numero_seance} {h.date_seance ? fmtDate(h.date_seance) : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Note globale */}
        <div>
          <div style={{ fontSize:9, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>Note libre de séance</div>
          <textarea value={seance.note_globale || ''} onChange={e => updateSeanceField('note_globale', e.target.value)}
            rows={3} placeholder="Intention, contexte, ressenti général..."
            style={{ ...inp, resize:'none', lineHeight:1.6 }} />
        </div>
      </div>

      {/* Chakras */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {CHAKRAS.map(ch => {
          const m = mesures[ch.id] || {}
          return (
            <div key={ch.id} style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:14, overflow:'hidden' }}>

              {/* Top : lotus + nom + attrs */}
              <div style={{ display:'flex', gap:12, padding:'12px 14px', alignItems:'flex-start' }}>
                <div style={{ flexShrink:0 }}>
                  <svg width="50" height="50" viewBox="0 0 100 100" dangerouslySetInnerHTML={{ __html: ch.lotus(ch.color) }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:ch.color, marginBottom:2 }}>{ch.nom} — {ch.num} chakra</div>
                  <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:8 }}>{ch.tag}</div>
                </div>
              </div>

              {/* Mesures */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderTop:'0.5px solid var(--color-border-tertiary)' }}>

                {/* Colonne gauche */}
                <div style={{ padding:'10px 14px', borderRight:'0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ fontSize:9, color:ch.color, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8, fontWeight:600 }}>Mesures praticien</div>

                  {/* Rotation */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                    <span style={{ fontSize:11, color:'var(--color-text-secondary)', minWidth:80 }}>Rotation</span>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {ROT.map(r => (
                        <button key={r} onClick={() => updateMesure(ch.id, 'rotation', m.rotation===r ? null : r)}
                          style={{ fontSize:10, padding:'3px 7px', borderRadius:5, cursor:'pointer', border:'0.5px solid var(--color-border-secondary)', background:m.rotation===r ? ch.color : 'var(--color-background-primary)', color:m.rotation===r ? '#fff' : 'var(--color-text-secondary)' }}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Etat */}
                  <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:7 }}>
                    <span style={{ fontSize:11, color:'var(--color-text-secondary)', minWidth:80, paddingTop:4 }}>Etat</span>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {ETATS.map(e => (
                        <button key={e} onClick={() => updateMesure(ch.id, 'etat', m.etat===e ? null : e)}
                          style={{ fontSize:10, padding:'3px 7px', borderRadius:5, cursor:'pointer', border:'0.5px solid var(--color-border-secondary)', background:m.etat===e ? ch.color : 'var(--color-background-primary)', color:m.etat===e ? '#fff' : 'var(--color-text-secondary)' }}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Taux Bovis */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                    <span style={{ fontSize:11, color:'var(--color-text-secondary)', minWidth:80 }}>Taux Bovis</span>
                    <input value={m.taux_bovis || ''} onChange={e => updateMesure(ch.id, 'taux_bovis', e.target.value)}
                      placeholder="ex: 7500..." style={{ ...inp, flex:1 }} />
                    <span style={{ fontSize:10, color:'var(--color-text-secondary)', whiteSpace:'nowrap' }}>UB</span>
                  </div>

                  {/* Couleur percue */}
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:11, color:'var(--color-text-secondary)', minWidth:80 }}>Couleur</span>
                    <input value={m.couleur_percue || ''} onChange={e => updateMesure(ch.id, 'couleur_percue', e.target.value)}
                      placeholder="rouge vif, gris terne..." style={{ ...inp, flex:1 }} />
                  </div>
                </div>

                {/* Colonne droite */}
                <div style={{ padding:'10px 14px' }}>
                  <div style={{ fontSize:9, color:ch.color, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8, fontWeight:600 }}>Axes énergétiques</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 }}>
                    {[['avant','Avant (conscient)'],['arriere','Arrière (inconscient)'],['gauche','Gauche ♀'],['droite','Droite ♂']].map(([field, label]) => (
                      <div key={field} style={{ background:'var(--color-background-primary)', borderRadius:6, padding:'5px 8px' }}>
                        <div style={{ fontSize:9, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:3 }}>{label}</div>
                        <input value={m[field] || ''} onChange={e => updateMesure(ch.id, field, e.target.value)}
                          placeholder="état, taux..." style={{ width:'100%', background:'transparent', border:'none', outline:'none', fontSize:11, color:'var(--color-text-primary)', fontFamily:'inherit' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:9, color:ch.color, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5, fontWeight:600 }}>Observation</div>
                  <textarea value={m.observation || ''} onChange={e => updateMesure(ch.id, 'observation', e.target.value)}
                    rows={3} placeholder="Image, sensation, résistance, message reçu..."
                    style={{ ...inp, resize:'none', lineHeight:1.5 }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bouton bas */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
        <button onClick={handleSave} disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 24px', borderRadius:8, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:14, fontWeight:600, cursor:saving ? 'not-allowed' : 'pointer', opacity:saving ? 0.7 : 1 }}>
          <i className="ti ti-device-floppy" style={{ fontSize:15 }} />{saving ? 'Sauvegarde…' : 'Sauvegarder la séance'}
        </button>
      </div>

    </div>
  )
}
