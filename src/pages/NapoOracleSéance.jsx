import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const MOIS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']

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

  const [tirages, setTirages] = useState([])
  const [decksPerso, setDecksPerso] = useState([])
  const [themesPerso, setThemesPerso] = useState([])
  const [cartesParDeck, setCartesParDeck] = useState({})
  const [questionsParTheme, setQuestionsParTheme] = useState({})

  const [showImportCartesFor, setShowImportCartesFor] = useState(null)
  const [showImportQuestionsFor, setShowImportQuestionsFor] = useState(null)
  const [texteImportCartes, setTexteImportCartes] = useState('')
  const [texteImportQuestions, setTexteImportQuestions] = useState('')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: s } = await supabase.from('napo_oracle_seances')
        .select('*, clients(id, prenom, nom)').eq('id', id).single()
      if (!s) { navigate('/napo-oracle'); return }
      setSeance(s)
      setClient(s.clients)

      const raw = s.cartes_tirees || []
      const estAncienneStructure = raw.length > 0 && raw[0] && !('cartes' in raw[0])
      if (estAncienneStructure) {
        setTirages([{
          id: crypto.randomUUID(),
          deck_utilise: s.deck_utilise || '',
          theme_utilise: '',
          question_texte: '',
          cartes: raw.map(c => ({ id: c.id || crypto.randomUUID(), carte_nom: c.carte_nom || c.nom || '' })),
          reponse_recue: raw.map(c => c.reponse_recue).filter(Boolean).join(' / '),
          interpretation: raw.map(c => c.interpretation).filter(Boolean).join('\n')
        }])
      } else {
        setTirages(raw.map(t => ({ theme_utilise: '', ...t })))
      }

      const { data: hist } = await supabase.from('napo_oracle_seances')
        .select('id, numero_seance, date_seance').eq('client_id', s.client_id)
        .order('date_seance', { ascending: false })
      setHistorique(hist || [])

      const { data: decks } = await supabase.from('napo_oracle_decks_perso')
        .select('nom').eq('user_id', user.id).order('nom')
      setDecksPerso((decks || []).map(d => d.nom))

      const { data: themes } = await supabase.from('napo_oracle_themes_perso')
        .select('nom').eq('user_id', user.id).order('nom')
      setThemesPerso((themes || []).map(t => t.nom))

      setLoading(false)
    }
    load()
  }, [id])

  async function chargerCartesDuDeck(nomDeck) {
    if (!nomDeck) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data: deck } = await supabase.from('napo_oracle_decks_perso')
      .select('id').eq('user_id', user.id).eq('nom', nomDeck).maybeSingle()
    if (!deck) { setCartesParDeck(prev => ({ ...prev, [nomDeck]: [] })); return }
    const { data: cartes } = await supabase.from('napo_oracle_cartes_perso')
      .select('nom, numero').eq('deck_id', deck.id).order('numero', { ascending: true, nullsFirst: false })
    setCartesParDeck(prev => ({ ...prev, [nomDeck]: (cartes || []).map(c => c.numero ? `${c.numero} — ${c.nom}` : c.nom) }))
  }

  async function chargerQuestionsDuTheme(nomTheme) {
    if (!nomTheme) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data: theme } = await supabase.from('napo_oracle_themes_perso')
      .select('id').eq('user_id', user.id).eq('nom', nomTheme).maybeSingle()
    if (!theme) { setQuestionsParTheme(prev => ({ ...prev, [nomTheme]: [] })); return }
    const { data: questions } = await supabase.from('napo_oracle_questions_perso')
      .select('texte').eq('theme_id', theme.id).order('texte')
    setQuestionsParTheme(prev => ({ ...prev, [nomTheme]: (questions || []).map(q => q.texte) }))
  }

  async function importerCartesPourTirage(tid) {
    const t = tirages.find(x => x.id === tid)
    if (!t?.deck_utilise) { alert("Renseigne d'abord un deck pour cette question."); return }
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('napo_oracle_decks_perso')
      .upsert({ user_id: user.id, nom: t.deck_utilise }, { onConflict: 'user_id,nom', ignoreDuplicates: true })
    const { data: deck } = await supabase.from('napo_oracle_decks_perso')
      .select('id').eq('user_id', user.id).eq('nom', t.deck_utilise).maybeSingle()
    if (!deck) return
    const lignes = texteImportCartes.split('\n').map(l => l.trim()).filter(Boolean)
    for (const ligne of lignes) {
      const match = ligne.match(/^(\d+)[.)\s-]+(.+)$/)
      const numero = match ? parseInt(match[1], 10) : null
      const nom = match ? match[2].trim() : ligne
      await supabase.from('napo_oracle_cartes_perso')
        .upsert({ user_id: user.id, deck_id: deck.id, nom, numero }, { onConflict: 'deck_id,nom', ignoreDuplicates: true })
    }
    await chargerCartesDuDeck(t.deck_utilise)
    setTexteImportCartes('')
    setShowImportCartesFor(null)
  }

  async function importerQuestionsPourTirage(tid) {
    const t = tirages.find(x => x.id === tid)
    if (!t?.theme_utilise) { alert("Renseigne d'abord un thème pour cette question."); return }
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('napo_oracle_themes_perso')
      .upsert({ user_id: user.id, nom: t.theme_utilise }, { onConflict: 'user_id,nom', ignoreDuplicates: true })
    const { data: theme } = await supabase.from('napo_oracle_themes_perso')
      .select('id').eq('user_id', user.id).eq('nom', t.theme_utilise).maybeSingle()
    if (!theme) return
    const textes = texteImportQuestions.split('\n').map(l => l.trim()).filter(Boolean)
    for (const texte of textes) {
      await supabase.from('napo_oracle_questions_perso')
        .upsert({ user_id: user.id, theme_id: theme.id, texte }, { onConflict: 'user_id,texte', ignoreDuplicates: true })
    }
    await chargerQuestionsDuTheme(t.theme_utilise)
    setTexteImportQuestions('')
    setShowImportQuestionsFor(null)
  }

  function ajouterTirage() {
    setTirages(prev => [...prev, {
      id: crypto.randomUUID(), deck_utilise: '', theme_utilise: '', question_texte: '',
      cartes: [], reponse_recue: '', interpretation: ''
    }])
  }
  function supprimerTirage(tid) {
    setTirages(prev => prev.filter(t => t.id !== tid))
  }
  function modifierTirage(tid, champ, val) {
    setTirages(prev => prev.map(t => t.id === tid ? { ...t, [champ]: val } : t))
    if (champ === 'deck_utilise') chargerCartesDuDeck(val)
    if (champ === 'theme_utilise') chargerQuestionsDuTheme(val)
  }
  function ajouterCarteAuTirage(tid) {
    setTirages(prev => prev.map(t => t.id === tid
      ? { ...t, cartes: t.cartes.length >= 15 ? t.cartes : [...t.cartes, { id: crypto.randomUUID(), carte_nom: '' }] }
      : t))
  }
  function modifierCarteDuTirage(tid, cid, val) {
    setTirages(prev => prev.map(t => t.id === tid
      ? { ...t, cartes: t.cartes.map(c => c.id === cid ? { ...c, carte_nom: val } : c) }
      : t))
  }
  function supprimerCarteDuTirage(tid, cid) {
    setTirages(prev => prev.map(t => t.id === tid
      ? { ...t, cartes: t.cartes.filter(c => c.id !== cid) }
      : t))
  }

  function updateSeanceField(field, value) {
    setSeance(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const decksUtilises = [...new Set(tirages.map(t => t.deck_utilise).filter(Boolean))]
    const deckIds = {}
    for (const nom of decksUtilises) {
      await supabase.from('napo_oracle_decks_perso')
        .upsert({ user_id: user.id, nom }, { onConflict: 'user_id,nom', ignoreDuplicates: true })
      const { data: deck } = await supabase.from('napo_oracle_decks_perso')
        .select('id').eq('user_id', user.id).eq('nom', nom).maybeSingle()
      if (deck) deckIds[nom] = deck.id
    }
    for (const t of tirages) {
      const deckId = deckIds[t.deck_utilise]
      if (!deckId) continue
      const noms = [...new Set(t.cartes.map(c => c.carte_nom).filter(Boolean))]
      for (const nom of noms) {
        await supabase.from('napo_oracle_cartes_perso')
          .upsert({ user_id: user.id, deck_id: deckId, nom }, { onConflict: 'deck_id,nom', ignoreDuplicates: true })
      }
    }

    const themesUtilises = [...new Set(tirages.map(t => t.theme_utilise).filter(Boolean))]
    const themeIds = {}
    for (const nom of themesUtilises) {
      await supabase.from('napo_oracle_themes_perso')
        .upsert({ user_id: user.id, nom }, { onConflict: 'user_id,nom', ignoreDuplicates: true })
      const { data: theme } = await supabase.from('napo_oracle_themes_perso')
        .select('id').eq('user_id', user.id).eq('nom', nom).maybeSingle()
      if (theme) themeIds[nom] = theme.id
    }
    for (const t of tirages) {
      if (!t.question_texte) continue
      const themeId = themeIds[t.theme_utilise] || null
      await supabase.from('napo_oracle_questions_perso')
        .upsert({ user_id: user.id, theme_id: themeId, texte: t.question_texte }, { onConflict: 'user_id,texte', ignoreDuplicates: true })
    }

    await supabase.from('napo_oracle_seances').update({
      date_seance: seance.date_seance,
      heure_seance: seance.heure_seance,
      note_globale: seance.note_globale,
      cartes_tirees: tirages,
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
          <button onClick={() => navigate(`/live/oracle/${id}`)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <i className="ti ti-video" style={{ fontSize:14 }} />Démarrer la séance en direct
          </button>
          <button onClick={handleSave} disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:8, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:13, fontWeight:600, cursor:saving ? 'not-allowed' : 'pointer', opacity:saving ? 0.7 : 1 }}>
            <i className="ti ti-device-floppy" style={{ fontSize:14 }} />{saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

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
              <span key={h.id} onClick={() => navigate(`/napo-oracle/${h.id}`)}
                style={{ fontSize:11, padding:'3px 10px', borderRadius:20, cursor:'pointer', background:h.id===id ? '#1e293b' : 'var(--color-background-primary)', color:h.id===id ? '#fff' : 'var(--color-text-secondary)', border:'0.5px solid var(--color-border-tertiary)' }}>
                #{h.numero_seance} {h.date_seance ? fmtDate(h.date_seance) : ''}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize:9, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>Note libre de séance</div>
          <textarea value={seance.note_globale || ''} onChange={e => updateSeanceField('note_globale', e.target.value)}
            rows={3} placeholder="Intention, contexte, ressenti général..."
            style={{ ...inp, resize:'none', lineHeight:1.6 }} />
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--color-text-primary)' }}>Questions & tirages</div>
        {tirages.length < 15 && (
          <button onClick={ajouterTirage} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            <i className="ti ti-plus" style={{ fontSize:13 }} />Ajouter une question
          </button>
        )}
      </div>

      <datalist id="decks-perso-list">
        {decksPerso.map(d => <option key={d} value={d} />)}
      </datalist>
      <datalist id="themes-perso-list">
        {themesPerso.map(t => <option key={t} value={t} />)}
      </datalist>
      {decksPerso.map(d => (
        <datalist key={`d-${d}`} id={`cartes-perso-list-${d}`}>
          {(cartesParDeck[d] || []).map(c => <option key={c} value={c} />)}
        </datalist>
      ))}
      {themesPerso.map(t => (
        <datalist key={`t-${t}`} id={`questions-perso-list-${t}`}>
          {(questionsParTheme[t] || []).map(q => <option key={q} value={q} />)}
        </datalist>
      ))}

      {tirages.length === 0 ? (
        <div style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:14, padding:'30px', textAlign:'center', color:'var(--color-text-secondary)', fontSize:13 }}>
          <i className="ti ti-cards" style={{ fontSize:28, display:'block', marginBottom:8 }} />
          Aucune question tirée pour cette séance.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {tirages.map((t, tIdx) => (
            <div key={t.id} style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:14, padding:'14px 16px' }}>

              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, color:'var(--color-text-muted)', fontWeight:600 }}>#{tIdx+1}</span>
                <input list="decks-perso-list" value={t.deck_utilise} onChange={e => modifierTirage(t.id, 'deck_utilise', e.target.value)}
                  onBlur={e => chargerCartesDuDeck(e.target.value)}
                  placeholder="Deck (ex: Oracle de l'Amour)" style={{ ...inp, flex:1, minWidth:150 }} />
                <button type="button" onClick={() => setShowImportCartesFor(v => v === t.id ? null : t.id)}
                  title="Importer les cartes de ce deck"
                  style={{ fontSize:10, padding:'5px 8px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-primary)', color:'var(--color-text-secondary)', cursor:'pointer' }}>
                  <i className="ti ti-cards" style={{ fontSize:12 }} />
                </button>
                <button onClick={() => supprimerTirage(t.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', fontSize:16, padding:'0 4px', marginLeft:'auto' }}>×</button>
              </div>

              {showImportCartesFor === t.id && (
                <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:10, padding:'10px 12px', marginBottom:10 }}>
                  <div style={{ fontSize:10, color:'var(--color-text-secondary)', marginBottom:6 }}>
                    Cartes du deck "{t.deck_utilise || '(deck non renseigné)'}", une par ligne.
                  </div>
                  <textarea value={texteImportCartes} onChange={e => setTexteImportCartes(e.target.value)}
                    rows={5} placeholder={'Le Soleil\nLa Lune\n...'}
                    style={{ width:'100%', padding:'6px 8px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', fontSize:12, boxSizing:'border-box', fontFamily:'inherit', resize:'vertical', marginBottom:8 }} />
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => importerCartesPourTirage(t.id)} style={{ padding:'6px 14px', borderRadius:6, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>Importer</button>
                    <button onClick={() => { setShowImportCartesFor(null); setTexteImportCartes('') }} style={{ padding:'6px 14px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'none', color:'var(--color-text-secondary)', fontSize:12, cursor:'pointer' }}>Annuler</button>
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10, flexWrap:'wrap' }}>
                <input list="themes-perso-list" value={t.theme_utilise} onChange={e => modifierTirage(t.id, 'theme_utilise', e.target.value)}
                  onBlur={e => chargerQuestionsDuTheme(e.target.value)}
                  placeholder="Thème (ex: Amour, Travail...)" style={{ ...inp, flex:1, minWidth:150 }} />
                <button type="button" onClick={() => setShowImportQuestionsFor(v => v === t.id ? null : t.id)}
                  title="Importer une liste de questions pour ce thème"
                  style={{ fontSize:10, padding:'5px 8px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-primary)', color:'var(--color-text-secondary)', cursor:'pointer' }}>
                  <i className="ti ti-upload" style={{ fontSize:12 }} />
                </button>
                <input list={t.theme_utilise ? `questions-perso-list-${t.theme_utilise}` : undefined}
                  value={t.question_texte} onChange={e => modifierTirage(t.id, 'question_texte', e.target.value)}
                  placeholder="Question (sélectionne ou tape la tienne)" style={{ ...inp, flex:2, minWidth:200 }} />
              </div>

              {showImportQuestionsFor === t.id && (
                <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:10, padding:'10px 12px', marginBottom:10 }}>
                  <div style={{ fontSize:10, color:'var(--color-text-secondary)', marginBottom:6 }}>
                    Questions du thème "{t.theme_utilise || '(thème non renseigné)'}", une par ligne.
                  </div>
                  <textarea value={texteImportQuestions} onChange={e => setTexteImportQuestions(e.target.value)}
                    rows={6} placeholder={"Quelle est l'énergie actuelle de ma vie amoureuse ?\n..."}
                    style={{ width:'100%', padding:'6px 8px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', fontSize:12, boxSizing:'border-box', fontFamily:'inherit', resize:'vertical', marginBottom:8 }} />
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => importerQuestionsPourTirage(t.id)} style={{ padding:'6px 14px', borderRadius:6, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>Importer</button>
                    <button onClick={() => { setShowImportQuestionsFor(null); setTexteImportQuestions('') }} style={{ padding:'6px 14px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'none', color:'var(--color-text-secondary)', fontSize:12, cursor:'pointer' }}>Annuler</button>
                  </div>
                </div>
              )}

              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:9, color:'var(--color-accent)', textTransform:'uppercase', letterSpacing:'.05em', fontWeight:600, marginBottom:6 }}>Cartes tirées</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {t.cartes.map((c, cIdx) => (
                    <div key={c.id} style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontSize:10, color:'var(--color-text-muted)', minWidth:14 }}>{cIdx+1}.</span>
                      <input list={t.deck_utilise ? `cartes-perso-list-${t.deck_utilise}` : undefined}
                        value={c.carte_nom} onChange={e => modifierCarteDuTirage(t.id, c.id, e.target.value)}
                        placeholder="Nom de la carte" style={{ ...inp, flex:1 }} />
                      <button onClick={() => supprimerCarteDuTirage(t.id, c.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', fontSize:14, padding:'0 4px' }}>×</button>
                    </div>
                  ))}
                  {t.cartes.length < 15 && (
                    <button onClick={() => ajouterCarteAuTirage(t.id)} style={{ alignSelf:'flex-start', fontSize:11, padding:'4px 10px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-primary)', color:'var(--color-text-secondary)', cursor:'pointer' }}>
                      + Ajouter une carte
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginBottom:8 }}>
                <input value={t.reponse_recue} onChange={e => modifierTirage(t.id, 'reponse_recue', e.target.value)}
                  placeholder="Réponse reçue" style={{ ...inp }} />
              </div>
              <textarea value={t.interpretation} onChange={e => modifierTirage(t.id, 'interpretation', e.target.value)}
                rows={2} placeholder="Interprétation, ressenti, message reçu..."
                style={{ ...inp, resize:'none', lineHeight:1.5 }} />
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
