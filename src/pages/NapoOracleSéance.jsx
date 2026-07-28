import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const MOIS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
const POSITIONS = ['Passé','Présent','Futur','Obstacle','Conseil','Autre']

function fmtDate(d) {
  if (!d) return ''
  const [y,m,j] = d.slice(0,10).split('-')
  return `${parseInt(j)} ${MOIS[parseInt(m)-1]} ${y}`
}

export default function NapoOracleSéance() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [seance, setSeance] = useState(null)
  const [client, setClient] = useState(null)
  const [historique, setHistorique] = useState([])

  const [cartesTirees, setCartesTirees] = useState([])

  function ajouterCarte() {
    setCartesTirees(prev => prev.length >= 20 ? prev : [...prev, {
      id: crypto.randomUUID(), nom: '', position: '', interpretation: ''
    }])
  }
  function modifierCarte(id, champ, val) {
    setCartesTirees(prev => prev.map(c => c.id === id ? { ...c, [champ]: val } : c))
  }
  function supprimerCarte(id) {
    setCartesTirees(prev => prev.filter(c => c.id !== id))
  }

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('napo_oracle_seances')
        .select('*, clients(id, prenom, nom)').eq('id', id).single()
      if (!s) { navigate('/napo-oracle'); return }
      setSeance(s)
      setCartesTirees(s.cartes_tirees || [])
      setClient(s.clients)
      const { data: hist } = await supabase.from('napo_oracle_seances')
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
    await supabase.from('napo_oracle_seances').update({
      date_seance: seance.date_seance,
      heure_seance: seance.heure_seance,
      deck_utilise: seance.deck_utilise,
      note_globale: seance.note_globale,
      cartes_tirees: cartesTirees,
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
        <button onClick={() => navigate('/napo-oracle')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', fontSize:13, display:'flex', alignItems:'center', gap:4, padding:0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize:15 }} />Retour
        </button>
        <span style={{ color:'var(--color-border-secondary)' }}>/</span>
        <i className="ti ti-cards" style={{ fontSize:18, color:'var(--color-accent)' }} />
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

        {/* Ligne 1 : date heure deck */}
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
            <span style={{ fontSize:10, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.04em' }}>Deck</span>
            <input value={seance.deck_utilise || ''} onChange={e => updateSeanceField('deck_utilise', e.target.value)}
              placeholder="ex: Oracle des anges" style={{ ...inp, width:'auto' }} />
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
              <span key={h.id} onClick={() => navigate(`/napo-oracle/${h.id}`)}
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

      {/* Tirage de cartes */}
      <div style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:14, padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ fontSize:9, color:'var(--color-accent)', textTransform:'uppercase', letterSpacing:'.05em', fontWeight:600 }}>Tirage de cartes</div>
          {cartesTirees.length < 20 && (
            <button onClick={ajouterCarte} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, padding:'4px 10px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-primary)', color:'var(--color-text-secondary)', cursor:'pointer' }}>
              <i className="ti ti-plus" style={{ fontSize:12 }} />Ajouter une carte
            </button>
          )}
        </div>

        {cartesTirees.length === 0 ? (
          <div style={{ padding:'20px 0', textAlign:'center', color:'var(--color-text-secondary)', fontSize:12 }}>
            Aucune carte tirée pour cette séance.
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {cartesTirees.map((c, idx) => (
              <div key={c.id} style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontSize:10, color:'var(--color-text-muted)', minWidth:16 }}>{idx+1}.</span>
                  <input value={c.nom} onChange={e => modifierCarte(c.id, 'nom', e.target.value)}
                    placeholder="Nom de la carte" style={{ ...inp, flex:2 }} />
                  <select value={c.position} onChange={e => modifierCarte(c.id, 'position', e.target.value)} style={{ ...inp, flex:1 }}>
                    <option value="">Position…</option>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button onClick={() => supprimerCarte(c.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', fontSize:16, padding:'0 4px' }}>×</button>
                </div>
                <textarea value={c.interpretation} onChange={e => modifierCarte(c.id, 'interpretation', e.target.value)}
                  rows={2} placeholder="Interprétation, ressenti, message reçu..."
                  style={{ ...inp, resize:'none', lineHeight:1.5 }} />
              </div>
            ))}
          </div>
        )}
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