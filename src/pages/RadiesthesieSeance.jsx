import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const OUTILS = ['Pendule', 'Baguettes', 'Antenne de Lecher', 'Autre']
const OBJETS = ['Personne absente', 'Lieu', 'Objet perdu', 'Question oui-non', 'Autre']
const REPONSES = ['Oui', 'Non', 'Intensité']
const ECHELLE = [0,1,2,3,4,5,6,7,8]
const MOIS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']

function fmtDate(d) {
  if (!d) return ''
  const [y,m,j] = d.slice(0,10).split('-')
  return `${parseInt(j)} ${MOIS[parseInt(m)-1]} ${y}`
}

function newQuestion() {
  return { localId: crypto.randomUUID(), id: null, objet_recherche: '', question: '', reponse_type: '', reponse_intensite: null }
}

export default function RadiesthesieSeance() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [seance, setSeance] = useState(null)
  const [client, setClient] = useState(null)
  const [historique, setHistorique] = useState([])
  const [questions, setQuestions] = useState([])
  const [removedIds, setRemovedIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('fiches_radiesthesie')
        .select('*, clients(id, prenom, nom)').eq('id', id).single()
      if (!s) { navigate('/radiesthesie'); return }
      setSeance(s)
      setClient(s.clients)
      const { data: hist } = await supabase.from('fiches_radiesthesie')
        .select('id, numero_seance, date_seance').eq('client_id', s.client_id)
        .order('date_seance', { ascending: false })
      setHistorique(hist || [])
      const { data: q } = await supabase.from('fiches_radiesthesie_questions')
        .select('*').eq('fiche_id', id).order('created_at')
      setQuestions((q || []).map(row => ({ localId: row.id, ...row })))
      setLoading(false)
    }
    load()
  }, [id])

  function updateSeanceField(field, value) {
    setSeance(prev => ({ ...prev, [field]: value }))
  }

  function ajouterQuestion() {
    setQuestions(prev => [...prev, newQuestion()])
  }
  function modifierQuestion(localId, field, value) {
    setQuestions(prev => prev.map(q => q.localId === localId ? { ...q, [field]: value } : q))
  }
  function supprimerQuestion(localId) {
    setQuestions(prev => {
      const target = prev.find(q => q.localId === localId)
      if (target?.id) setRemovedIds(r => [...r, target.id])
      return prev.filter(q => q.localId !== localId)
    })
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('fiches_radiesthesie').update({
      date_seance: seance.date_seance,
      heure_seance: seance.heure_seance,
      outil: seance.outil,
      bilan: seance.bilan,
      duree_minutes: parseInt(seance.duree_minutes) || 60,
      prix_euros: parseFloat(seance.prix_euros) || null,
      updated_at: new Date().toISOString()
    }).eq('id', id)

    for (const removedId of removedIds) {
      await supabase.from('fiches_radiesthesie_questions').delete().eq('id', removedId)
    }
    setRemovedIds([])

    const updated = [...questions]
    for (let i = 0; i < updated.length; i++) {
      const q = updated[i]
      const payload = {
        fiche_id: id, user_id: user.id,
        objet_recherche: q.objet_recherche || null,
        question: q.question || null,
        reponse_type: q.reponse_type || null,
        reponse_intensite: q.reponse_type === 'Intensité' ? (q.reponse_intensite ?? null) : null,
      }
      if (q.id) {
        await supabase.from('fiches_radiesthesie_questions').update(payload).eq('id', q.id)
      } else {
        const { data: ins } = await supabase.from('fiches_radiesthesie_questions').insert(payload).select().single()
        if (ins) updated[i] = { localId: ins.id, ...ins }
      }
    }
    setQuestions(updated)
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
        <button onClick={() => navigate('/radiesthesie')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', fontSize:13, display:'flex', alignItems:'center', gap:4, padding:0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize:15 }} />Retour
        </button>
        <span style={{ color:'var(--color-border-secondary)' }}>/</span>
        <i className="ti ti-pendulum" style={{ fontSize:18, color:'var(--color-accent)' }} />
        <div style={{ fontSize:16, fontWeight:600, color:'var(--color-text-primary)' }}>
          {client?.prenom} {client?.nom} — Séance #{seance.numero_seance}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          {saved && <span style={{ fontSize:11, color:'#16A34A', background:'#F0FDF4', border:'0.5px solid #A7F3D0', padding:'3px 10px', borderRadius:6 }}>Sauvegardé ✓</span>}
          <button onClick={() => navigate(`/live/radiesthesie/${id}`)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
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
              <span key={h.id} onClick={() => navigate(`/radiesthesie/${h.id}`)}
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

      {/* Questions */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--color-text-primary)' }}>Questions posées</div>
        <button onClick={ajouterQuestion} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', fontSize:12, cursor:'pointer' }}>
          <i className="ti ti-plus" style={{ fontSize:13 }} />Ajouter une question
        </button>
      </div>

      {questions.length === 0 ? (
        <div style={{ padding:'24px', textAlign:'center', color:'var(--color-text-secondary)', fontSize:13, background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12 }}>
          Aucune question ajoutée pour l'instant.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {questions.map(q => (
            <div key={q.localId} style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:14, padding:'12px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, color:'var(--color-text-secondary)', minWidth:40 }}>Objet</span>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {OBJETS.map(o => (
                      <button key={o} onClick={() => modifierQuestion(q.localId, 'objet_recherche', q.objet_recherche === o ? '' : o)}
                        style={{ fontSize:10, padding:'3px 7px', borderRadius:5, cursor:'pointer', border:'0.5px solid var(--color-border-secondary)', background:q.objet_recherche===o ? '#CA8A04' : 'var(--color-background-primary)', color:q.objet_recherche===o ? '#fff' : 'var(--color-text-secondary)' }}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => supprimerQuestion(q.localId)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', fontSize:14 }} aria-label="Supprimer">
                  <i className="ti ti-trash" />
                </button>
              </div>

              <textarea value={q.question || ''} onChange={e => modifierQuestion(q.localId, 'question', e.target.value)}
                rows={2} placeholder="Question posée..."
                style={{ ...inp, resize:'none', lineHeight:1.5, marginBottom:10 }} />

              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom: q.reponse_type === 'Intensité' ? 8 : 0 }}>
                <span style={{ fontSize:11, color:'var(--color-text-secondary)', minWidth:80 }}>Réponse</span>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {REPONSES.map(r => (
                    <button key={r} onClick={() => modifierQuestion(q.localId, 'reponse_type', q.reponse_type === r ? '' : r)}
                      style={{ fontSize:10, padding:'3px 7px', borderRadius:5, cursor:'pointer', border:'0.5px solid var(--color-border-secondary)', background:q.reponse_type===r ? '#0F6E56' : 'var(--color-background-primary)', color:q.reponse_type===r ? '#fff' : 'var(--color-text-secondary)' }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {q.reponse_type === 'Intensité' && (
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, color:'var(--color-text-secondary)', minWidth:80 }}>Intensité (0-8)</span>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {ECHELLE.map(v => (
                      <button key={v} onClick={() => modifierQuestion(q.localId, 'reponse_intensite', q.reponse_intensite === v ? null : v)}
                        style={{ width:26, height:26, borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', border:'0.5px solid var(--color-border-secondary)', background:q.reponse_intensite===v ? '#0F6E56' : 'var(--color-background-primary)', color:q.reponse_intensite===v ? '#fff' : 'var(--color-text-secondary)' }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
