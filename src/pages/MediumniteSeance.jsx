import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TYPES_PERCEPTION = ['Message', 'Ressenti', 'Image', 'Nom-date', 'Autre']
const VALIDATIONS = ['A résonné', "N'a pas résonné", 'Neutre']
const MOIS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']

function fmtDate(d) {
  if (!d) return ''
  const [y,m,j] = d.slice(0,10).split('-')
  return `${parseInt(j)} ${MOIS[parseInt(m)-1]} ${y}`
}

function newPerception() {
  return { localId: crypto.randomUUID(), id: null, type_perception: '', contenu: '', validation_client: '' }
}

export default function MediumniteSeance() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [seance, setSeance] = useState(null)
  const [client, setClient] = useState(null)
  const [historique, setHistorique] = useState([])
  const [perceptions, setPerceptions] = useState([])
  const [removedIds, setRemovedIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('fiches_mediumnite')
        .select('*, clients(id, prenom, nom)').eq('id', id).single()
      if (!s) { navigate('/mediumnite'); return }
      setSeance(s)
      setClient(s.clients)
      const { data: hist } = await supabase.from('fiches_mediumnite')
        .select('id, numero_seance, date_seance').eq('client_id', s.client_id)
        .order('date_seance', { ascending: false })
      setHistorique(hist || [])
      const { data: p } = await supabase.from('fiches_mediumnite_perceptions')
        .select('*').eq('fiche_id', id).order('created_at')
      setPerceptions((p || []).map(row => ({ localId: row.id, ...row })))
      setLoading(false)
    }
    load()
  }, [id])

  function updateSeanceField(field, value) {
    setSeance(prev => ({ ...prev, [field]: value }))
  }

  function ajouterPerception() {
    setPerceptions(prev => [...prev, newPerception()])
  }
  function modifierPerception(localId, field, value) {
    setPerceptions(prev => prev.map(p => p.localId === localId ? { ...p, [field]: value } : p))
  }
  function supprimerPerception(localId) {
    setPerceptions(prev => {
      const target = prev.find(p => p.localId === localId)
      if (target?.id) setRemovedIds(r => [...r, target.id])
      return prev.filter(p => p.localId !== localId)
    })
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('fiches_mediumnite').update({
      date_seance: seance.date_seance,
      heure_seance: seance.heure_seance,
      bilan: seance.bilan,
      duree_minutes: parseInt(seance.duree_minutes) || 60,
      prix_euros: parseFloat(seance.prix_euros) || null,
      updated_at: new Date().toISOString()
    }).eq('id', id)

    for (const removedId of removedIds) {
      await supabase.from('fiches_mediumnite_perceptions').delete().eq('id', removedId)
    }
    setRemovedIds([])

    const updated = [...perceptions]
    for (let i = 0; i < updated.length; i++) {
      const p = updated[i]
      const payload = {
        fiche_id: id, user_id: user.id,
        type_perception: p.type_perception || null,
        contenu: p.contenu || null,
        validation_client: p.validation_client || null,
      }
      if (p.id) {
        await supabase.from('fiches_mediumnite_perceptions').update(payload).eq('id', p.id)
      } else {
        const { data: ins } = await supabase.from('fiches_mediumnite_perceptions').insert(payload).select().single()
        if (ins) updated[i] = { localId: ins.id, ...ins }
      }
    }
    setPerceptions(updated)
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
        <button onClick={() => navigate('/mediumnite')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', fontSize:13, display:'flex', alignItems:'center', gap:4, padding:0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize:15 }} />Retour
        </button>
        <span style={{ color:'var(--color-border-secondary)' }}>/</span>
        <i className="ti ti-ghost" style={{ fontSize:18, color:'var(--color-accent)' }} />
        <div style={{ fontSize:16, fontWeight:600, color:'var(--color-text-primary)' }}>
          {client?.prenom} {client?.nom} — Séance #{seance.numero_seance}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          {saved && <span style={{ fontSize:11, color:'#16A34A', background:'#F0FDF4', border:'0.5px solid #A7F3D0', padding:'3px 10px', borderRadius:6 }}>Sauvegardé ✓</span>}
          <button onClick={() => navigate(`/live/mediumnite/${id}`)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
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
              <span key={h.id} onClick={() => navigate(`/mediumnite/${h.id}`)}
                style={{ fontSize:11, padding:'3px 10px', borderRadius:20, cursor:'pointer', background:h.id===id ? '#1e293b' : 'var(--color-background-primary)', color:h.id===id ? '#fff' : 'var(--color-text-secondary)', border:'0.5px solid var(--color-border-tertiary)' }}>
                #{h.numero_seance} {h.date_seance ? fmtDate(h.date_seance) : ''}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize:9, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>Bilan / synthèse</div>
          <textarea value={seance.bilan || ''} onChange={e => updateSeanceField('bilan', e.target.value)}
            rows={3} placeholder="Bilan de la séance, ressenti général..."
            style={{ ...inp, resize:'none', lineHeight:1.6 }} />
        </div>
      </div>

      {/* Perceptions */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--color-text-primary)' }}>Perceptions reçues</div>
        <button onClick={ajouterPerception} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', fontSize:12, cursor:'pointer' }}>
          <i className="ti ti-plus" style={{ fontSize:13 }} />Ajouter une perception
        </button>
      </div>

      {perceptions.length === 0 ? (
        <div style={{ padding:'24px', textAlign:'center', color:'var(--color-text-secondary)', fontSize:13, background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12 }}>
          Aucune perception ajoutée pour l'instant.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {perceptions.map((p, idx) => (
            <div key={p.localId} style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:14, padding:'12px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:11, color:'var(--color-text-secondary)', minWidth:50 }}>Type</span>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {TYPES_PERCEPTION.map(t => (
                      <button key={t} onClick={() => modifierPerception(p.localId, 'type_perception', p.type_perception === t ? '' : t)}
                        style={{ fontSize:10, padding:'3px 7px', borderRadius:5, cursor:'pointer', border:'0.5px solid var(--color-border-secondary)', background:p.type_perception===t ? '#534AB7' : 'var(--color-background-primary)', color:p.type_perception===t ? '#fff' : 'var(--color-text-secondary)' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => supprimerPerception(p.localId)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', fontSize:14 }} aria-label="Supprimer">
                  <i className="ti ti-trash" />
                </button>
              </div>

              <textarea value={p.contenu || ''} onChange={e => modifierPerception(p.localId, 'contenu', e.target.value)}
                rows={2} placeholder="Contenu reçu — message, image, ressenti..."
                style={{ ...inp, resize:'none', lineHeight:1.5, marginBottom:10 }} />

              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:11, color:'var(--color-text-secondary)', minWidth:80 }}>Validation client</span>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {VALIDATIONS.map(v => (
                    <button key={v} onClick={() => modifierPerception(p.localId, 'validation_client', p.validation_client === v ? '' : v)}
                      style={{ fontSize:10, padding:'3px 7px', borderRadius:5, cursor:'pointer', border:'0.5px solid var(--color-border-secondary)', background:p.validation_client===v ? '#0F6E56' : 'var(--color-background-primary)', color:p.validation_client===v ? '#fff' : 'var(--color-text-secondary)' }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
        <button onClick={handleSave} disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 24px', borderRadius:8, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:14, fontWeight:600, cursor:saving ? 'not-allowed' : 'pointer', opacity:saving ? 0.7 : 1 }}>
          <i className="ti ti-device-floppy" style={{ fontSize:15 }} />{saving ? 'Sauvegarde…' : 'Sauvegarder la séance'}
        </button>
      </div>

    </div>
  )
}
