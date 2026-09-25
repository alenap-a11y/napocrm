import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function FormationSéance() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [seance, setSeance] = useState(null)
  const [participants, setParticipants] = useState([])
  const [clientsDispo, setClientsDispo] = useState([])
  const [ajoutClientId, setAjoutClientId] = useState('')
  const [objectifs, setObjectifs] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [invitationTexte, setInvitationTexte] = useState('')
  const [invitationCopiee, setInvitationCopiee] = useState(false)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [envoiResultat, setEnvoiResultat] = useState('')

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: s } = await supabase.from('formation_seances')
      .select('*, formation_participants(id, client_id, evaluation_individuelle, clients(id, prenom, nom, email))').eq('id', id).single()
    if (!s) { navigate('/formation'); return }
    setSeance(s)
    setObjectifs(Array.isArray(s.objectifs) ? s.objectifs : [])
    setParticipants(s.formation_participants || [])
    const { data: c } = await supabase.from('clients').select('id, prenom, nom, email').eq('user_id', user.id).order('nom')
    setClientsDispo(c || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  function updateSeanceField(field, value) {
    setSeance(prev => ({ ...prev, [field]: value }))
  }

  function ajouterObjectif() {
    setObjectifs(prev => prev.length >= 20 ? prev : [...prev, { id: crypto.randomUUID(), texte: '' }])
  }
  function modifierObjectif(oid, texte) {
    setObjectifs(prev => prev.map(o => o.id === oid ? { ...o, texte } : o))
  }
  function supprimerObjectif(oid) {
    setObjectifs(prev => prev.filter(o => o.id !== oid))
  }

  function modifierEvaluationIndividuelle(participantId, texte) {
    setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, evaluation_individuelle: texte } : p))
  }

  async function ajouterParticipant() {
    if (!ajoutClientId) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('formation_participants').insert({ user_id: user.id, seance_id: id, client_id: ajoutClientId })
    setAjoutClientId('')
    await load()
  }

  async function retirerParticipant(participantId) {
    await supabase.from('formation_participants').delete().eq('id', participantId)
    setParticipants(prev => prev.filter(p => p.id !== participantId))
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('formation_seances').update({
      date_seance: seance.date_seance,
      heure_seance: seance.heure_seance,
      duree_minutes: parseInt(seance.duree_minutes) || 60,
      prix_euros: seance.prix_euros === '' || seance.prix_euros === null ? null : parseFloat(seance.prix_euros),
      theme: seance.theme,
      anime_par: seance.anime_par,
      programme: seance.programme,
      objectifs: objectifs,
      evaluation: seance.evaluation,
      note_globale: seance.note_globale,
      updated_at: new Date().toISOString()
    }).eq('id', id)
    await Promise.all(participants.map(p =>
      supabase.from('formation_participants').update({ evaluation_individuelle: p.evaluation_individuelle }).eq('id', p.id)
    ))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function genererInvitation() {
    const MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
    const d = seance.date_seance ? new Date(seance.date_seance) : null
    const dateTxt = d ? `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}` : 'date à confirmer'
    const lienVisio = seance.jitsi_room_id ? `https://meet.jit.si/${seance.jitsi_room_id}` : null
    const texte = `Bonjour,

Vous êtes invité·e à la séance de formation « ${seance.theme || 'Formation'} » le ${dateTxt}${seance.heure_seance ? ` à ${seance.heure_seance}` : ''} (${seance.duree_minutes || 60} min).
${seance.anime_par ? `Animée par ${seance.anime_par}.` : ''}
${lienVisio ? `\nLien de connexion : ${lienVisio}` : ''}

À bientôt !`
    setInvitationTexte(texte)
    setInvitationCopiee(false)
  }

  async function copierInvitation() {
    try {
      await navigator.clipboard.writeText(invitationTexte)
      setInvitationCopiee(true)
      setTimeout(() => setInvitationCopiee(false), 2500)
    } catch {}
  }

  async function envoyerEmailsInvitation() {
    setEnvoiEnCours(true)
    setEnvoiResultat('')
    const destinataires = participants.filter(p => p.clients?.email)
    if (destinataires.length === 0) {
      setEnvoiResultat('Aucun participant n\'a d\'email enregistré.')
      setEnvoiEnCours(false)
      return
    }
    let succes = 0, echecs = 0
    for (const p of destinataires) {
      const { error } = await supabase.functions.invoke('send-formation-invitation', {
        body: { to: p.clients.email, subject: `Invitation — Formation : ${seance.theme || 'Séance'}`, texte: invitationTexte }
      })
      if (error) echecs++; else succes++
    }
    setEnvoiResultat(`${succes} email(s) envoyé(s)${echecs ? `, ${echecs} échec(s)` : ''}.`)
    setEnvoiEnCours(false)
  }

  if (loading) return <div style={{ padding:'2rem', color:'var(--color-text-secondary)', fontSize:13 }}>Chargement…</div>

  const inp = { width:'100%', padding:'7px 10px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', fontSize:13, boxSizing:'border-box', fontFamily:'inherit' }
  const label = { fontSize:10, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6, fontWeight:600 }
  const card = { background:'var(--color-background-secondary)', borderRadius:14, border:'0.5px solid var(--color-border-tertiary)', padding:20, marginBottom:16 }
  const participantsRestants = clientsDispo.filter(c => !participants.some(p => p.client_id === c.id))

  return (
    <div style={{ padding:'1.6rem 2rem', fontFamily:'inherit', maxWidth:900 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div onClick={() => navigate('/formation')} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--color-text-secondary)', cursor:'pointer', marginBottom:8 }}>
            <i className="ti ti-arrow-left" style={{ fontSize:13 }} />Retour à Formation
          </div>
          <div style={{ fontSize:20, fontWeight:600, color:'var(--color-text-primary)' }}>
            Séance #{seance.numero_seance} — {participants.length} participant{participants.length > 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <button onClick={() => navigate(`/live/formation/${id}`)} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          <i className="ti ti-video" style={{ fontSize:14 }} />Démarrer la séance en direct
        </button>
        <button onClick={handleSave} disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:8, border:'none', background: saved ? '#0F6E56' : 'var(--color-accent)', color:'#fff', fontSize:13, fontWeight:500, cursor:'pointer', opacity: saving ? 0.7 : 1 }}>
          <i className={`ti ${saved ? 'ti-check' : 'ti-device-floppy'}`} style={{ fontSize:15 }} />
          {saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Sauvegarder'}
        </button>
        </div>
      </div>

      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'#EEEDFE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#534AB7' }}>
            #{seance.numero_seance}
          </div>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--color-text-primary)' }}>En-tête de séance</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12 }}>
          <div>
            <div style={label}>Date</div>
            <input type="date" value={seance.date_seance || ''} onChange={e => updateSeanceField('date_seance', e.target.value)} style={inp} />
          </div>
          <div>
            <div style={label}>Heure</div>
            <input type="time" value={seance.heure_seance || ''} onChange={e => updateSeanceField('heure_seance', e.target.value)} style={inp} />
          </div>
          <div>
            <div style={label}>Durée</div>
            <select value={seance.duree_minutes || 60} onChange={e => updateSeanceField('duree_minutes', e.target.value)} style={inp}>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1h</option>
              <option value={90}>1h30</option>
              <option value={120}>2h</option>
              <option value={180}>3h</option>
            </select>
          </div>
          <div>
            <div style={label}>Prix (€)</div>
            <input type="number" step="0.01" value={seance.prix_euros ?? ''} onChange={e => updateSeanceField('prix_euros', e.target.value)} style={inp} />
          </div>
        </div>
        <div style={{ marginTop:12 }}>
          <div style={label}>Animé par</div>
          <input value={seance.anime_par || ''} onChange={e => updateSeanceField('anime_par', e.target.value)} placeholder="Ton nom ou celui du formateur" style={inp} />
        </div>
      </div>

      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={label}>Participants ({participants.length}/50)</div>
        </div>
        {participants.length === 0 ? (
          <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:12 }}>Aucun participant.</div>
        ) : participants.map(p => (
          <div key={p.id} style={{ border:'0.5px solid var(--color-border-tertiary)', borderRadius:10, padding:12, marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'#EEEDFE', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#534AB7' }}>{(p.clients?.prenom||'?')[0]}{(p.clients?.nom||'?')[0]}</span>
              </div>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--color-text-primary)', flex:1 }}>{p.clients?.prenom} {p.clients?.nom}</div>
              <button onClick={() => retirerParticipant(p.id)}
                style={{ width:24, height:24, borderRadius:6, border:'none', background:'transparent', color:'var(--color-text-secondary)', cursor:'pointer' }}>
                <i className="ti ti-x" style={{ fontSize:13 }} />
              </button>
            </div>
            <textarea rows={2} value={p.evaluation_individuelle || ''} onChange={e => modifierEvaluationIndividuelle(p.id, e.target.value)}
              placeholder="Évaluation individuelle / acquis de cet apprenant…" style={{ ...inp, resize:'vertical' }} />
          </div>
        ))}
        {participantsRestants.length > 0 && participants.length < 50 && (
          <div style={{ display:'flex', gap:8, marginTop:6 }}>
            <select value={ajoutClientId} onChange={e => setAjoutClientId(e.target.value)} style={{ ...inp, flex:1 }}>
              <option value="">Ajouter un participant…</option>
              {participantsRestants.map(c => (
                <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
              ))}
            </select>
            <button onClick={ajouterParticipant} disabled={!ajoutClientId}
              style={{ padding:'0 16px', borderRadius:6, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:13, cursor:'pointer', opacity: ajoutClientId ? 1 : 0.5 }}>
              <i className="ti ti-plus" style={{ fontSize:14 }} />
            </button>
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={label}>Inviter les participants</div>
          <button onClick={genererInvitation}
            style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:12, cursor:'pointer' }}>
            <i className="ti ti-mail" style={{ fontSize:12 }} />Générer le texte d'invitation
          </button>
        </div>
        {participants.length > 0 && (
          <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:8 }}>
            Destinataires : {participants.map(p => p.clients?.email || `${p.clients?.prenom} ${p.clients?.nom} (pas d'email)`).join(', ')}
          </div>
        )}
        {invitationTexte && (
          <>
            <textarea readOnly rows={7} value={invitationTexte} style={{ ...inp, resize:'vertical', fontFamily:'inherit' }} />
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:8 }}>
              <button onClick={copierInvitation}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'transparent', color:'var(--color-text-primary)', fontSize:12, fontWeight:500, cursor:'pointer' }}>
                <i className={`ti ${invitationCopiee ? 'ti-check' : 'ti-copy'}`} style={{ fontSize:13 }} />
                {invitationCopiee ? 'Copié !' : 'Copier le texte'}
              </button>
              <button onClick={envoyerEmailsInvitation} disabled={envoiEnCours}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:12, fontWeight:500, cursor:'pointer', opacity: envoiEnCours ? 0.7 : 1 }}>
                <i className="ti ti-send" style={{ fontSize:13 }} />
                {envoiEnCours ? 'Envoi…' : 'Envoyer par email'}
              </button>
            </div>
            {envoiResultat && <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:6, textAlign:'right' }}>{envoiResultat}</div>}
          </>
        )}
        <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:8, fontStyle:'italic' }}>
          Colle ce texte dans ton propre email ou SMS pour chaque participant — aucun envoi automatique n'est encore branché.
        </div>
      </div>

      <div style={card}>
        <div style={label}>Note libre de séance</div>
        <textarea rows={3} value={seance.note_globale || ''} onChange={e => updateSeanceField('note_globale', e.target.value)}
          placeholder="Notes générales sur la séance…" style={{ ...inp, resize:'vertical', marginTop:6 }} />
      </div>

      <div style={card}>
        <div style={label}>Thème / sujet traité</div>
        <input value={seance.theme || ''} onChange={e => updateSeanceField('theme', e.target.value)}
          placeholder="Ex : Communication non violente, gestion du stress…" style={{ ...inp, marginTop:6 }} />
      </div>

      <div style={card}>
        <div style={label}>Programme / contenu détaillé</div>
        <textarea rows={6} value={seance.programme || ''} onChange={e => updateSeanceField('programme', e.target.value)}
          placeholder="Déroulé de la séance, exercices, supports utilisés…" style={{ ...inp, resize:'vertical', marginTop:6 }} />
      </div>

      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={label}>Objectifs pédagogiques</div>
          <button onClick={ajouterObjectif} disabled={objectifs.length >= 20}
            style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:12, cursor:'pointer' }}>
            <i className="ti ti-plus" style={{ fontSize:12 }} />Ajouter
          </button>
        </div>
        {objectifs.length === 0 ? (
          <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Aucun objectif ajouté.</div>
        ) : objectifs.map(o => (
          <div key={o.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <i className="ti ti-target-arrow" style={{ fontSize:14, color:'var(--color-text-secondary)', flexShrink:0 }} />
            <input value={o.texte} onChange={e => modifierObjectif(o.id, e.target.value)}
              placeholder="Objectif…" style={{ ...inp, flex:1 }} />
            <button onClick={() => supprimerObjectif(o.id)}
              style={{ width:26, height:26, borderRadius:6, border:'none', background:'transparent', color:'var(--color-text-secondary)', cursor:'pointer', flexShrink:0 }}>
              <i className="ti ti-x" style={{ fontSize:14 }} />
            </button>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={label}>Évaluation globale du groupe</div>
        <textarea rows={4} value={seance.evaluation || ''} onChange={e => updateSeanceField('evaluation', e.target.value)}
          placeholder="Appréciation d'ensemble de la séance…" style={{ ...inp, resize:'vertical', marginTop:6 }} />
        <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:6, fontStyle:'italic' }}>
          Appréciation déclarée par le praticien — pas une certification officielle.
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:20 }}>
        <button onClick={handleSave} disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:8, border:'none', background: saved ? '#0F6E56' : 'var(--color-accent)', color:'#fff', fontSize:13, fontWeight:500, cursor:'pointer', opacity: saving ? 0.7 : 1 }}>
          <i className={`ti ${saved ? 'ti-check' : 'ti-device-floppy'}`} style={{ fontSize:15 }} />
          {saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}
