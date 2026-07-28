import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function NapoOracleGestion({ onClose }) {
  const [decks, setDecks] = useState([])
  const [themes, setThemes] = useState([])
  const [cartesParDeck, setCartesParDeck] = useState({})
  const [questionsParTheme, setQuestionsParTheme] = useState({})
  const [ouvert, setOuvert] = useState(null) // id du deck ou thème actuellement déplié
  const [nouvelleCarte, setNouvelleCarte] = useState('')
  const [nouvelleQuestion, setNouvelleQuestion] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: d } = await supabase.from('napo_oracle_decks_perso')
        .select('id, nom').eq('user_id', user.id).order('nom')
      setDecks(d || [])
      const { data: t } = await supabase.from('napo_oracle_themes_perso')
        .select('id, nom').eq('user_id', user.id).order('nom')
      setThemes(t || [])
      setLoading(false)
    }
    load()
  }, [])

  async function chargerCartes(deckId) {
    if (cartesParDeck[deckId]) return
    const { data } = await supabase.from('napo_oracle_cartes_perso')
      .select('id, nom, numero').eq('deck_id', deckId).order('numero', { ascending: true, nullsFirst: false })
    setCartesParDeck(prev => ({ ...prev, [deckId]: data || [] }))
  }
  async function chargerQuestions(themeId) {
    if (questionsParTheme[themeId]) return
    const { data } = await supabase.from('napo_oracle_questions_perso')
      .select('id, texte').eq('theme_id', themeId).order('texte')
    setQuestionsParTheme(prev => ({ ...prev, [themeId]: data || [] }))
  }

  async function renommerDeck(deck) {
    const nouveauNom = window.prompt('Renommer le deck :', deck.nom)
    if (!nouveauNom || nouveauNom === deck.nom) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('napo_oracle_decks_perso').update({ nom: nouveauNom }).eq('id', deck.id)
    if (error) { alert("Ce nom existe déjà dans ta liste de decks."); return }
    setDecks(prev => prev.map(d => d.id === deck.id ? { ...d, nom: nouveauNom } : d))
  }
  async function renommerTheme(theme) {
    const nouveauNom = window.prompt('Renommer le thème :', theme.nom)
    if (!nouveauNom || nouveauNom === theme.nom) return
    const { error } = await supabase.from('napo_oracle_themes_perso').update({ nom: nouveauNom }).eq('id', theme.id)
    if (error) { alert("Ce nom existe déjà dans ta liste de thèmes."); return }
    setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, nom: nouveauNom } : t))
  }
  async function renommerCarte(deckId, carte) {
    const nouveauNom = window.prompt('Renommer la carte :', carte.nom)
    if (!nouveauNom || nouveauNom === carte.nom) return
    const { error } = await supabase.from('napo_oracle_cartes_perso').update({ nom: nouveauNom }).eq('id', carte.id)
    if (error) { alert('Ce nom existe déjà dans ce deck.'); return }
    setCartesParDeck(prev => ({ ...prev, [deckId]: prev[deckId].map(c => c.id === carte.id ? { ...c, nom: nouveauNom } : c) }))
  }
  async function renommerQuestion(themeId, question) {
    const nouveauTexte = window.prompt('Modifier la question :', question.texte)
    if (!nouveauTexte || nouveauTexte === question.texte) return
    const { error } = await supabase.from('napo_oracle_questions_perso').update({ texte: nouveauTexte }).eq('id', question.id)
    if (error) { alert('Cette question existe déjà.'); return }
    setQuestionsParTheme(prev => ({ ...prev, [themeId]: prev[themeId].map(q => q.id === question.id ? { ...q, texte: nouveauTexte } : q) }))
  }

  async function ajouterCarte(deckId) {
    if (!nouvelleCarte.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const match = nouvelleCarte.trim().match(/^(\d+)[.)\s-]+(.+)$/)
    const numero = match ? parseInt(match[1], 10) : null
    const nom = match ? match[2].trim() : nouvelleCarte.trim()
    const { data, error } = await supabase.from('napo_oracle_cartes_perso')
      .insert({ user_id: user.id, deck_id: deckId, nom, numero }).select().single()
    if (error) { alert('Cette carte existe déjà dans ce deck.'); return }
    setCartesParDeck(prev => ({ ...prev, [deckId]: [...(prev[deckId] || []), data] }))
    setNouvelleCarte('')
  }
  async function ajouterQuestion(themeId) {
    if (!nouvelleQuestion.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('napo_oracle_questions_perso')
      .insert({ user_id: user.id, theme_id: themeId, texte: nouvelleQuestion.trim() }).select().single()
    if (error) { alert('Cette question existe déjà.'); return }
    setQuestionsParTheme(prev => ({ ...prev, [themeId]: [...(prev[themeId] || []), data] }))
    setNouvelleQuestion('')
  }

  const inp = { width:'100%', padding:'6px 8px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', fontSize:12, boxSizing:'border-box', fontFamily:'inherit' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:'var(--color-background-primary)', borderRadius:14, padding:'20px 24px', width:600, maxHeight:'80vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:16, fontWeight:600 }}>Gérer mes decks & thèmes</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18 }}>×</button>
        </div>

        {loading ? <div style={{ fontSize:13, color:'var(--color-text-secondary)' }}>Chargement…</div> : (
          <>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--color-accent)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>Decks</div>
            {decks.length === 0 && <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:16 }}>Aucun deck pour l'instant.</div>}
            {decks.map(deck => (
              <div key={deck.id} style={{ border:'0.5px solid var(--color-border-tertiary)', borderRadius:10, marginBottom:8, padding:'8px 12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={() => { setOuvert(o => o === `d-${deck.id}` ? null : `d-${deck.id}`); chargerCartes(deck.id) }}>
                  <span style={{ flex:1, fontSize:13, fontWeight:500 }}>{deck.nom}</span>
                  <button onClick={e => { e.stopPropagation(); renommerDeck(deck) }} style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'none', cursor:'pointer' }}>Renommer</button>
                </div>
                {ouvert === `d-${deck.id}` && (
                  <div style={{ marginTop:8, paddingLeft:8 }}>
                    {(cartesParDeck[deck.id] || []).map(c => (
                      <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'3px 0', fontSize:12 }}>
                        <span style={{ flex:1 }}>{c.numero ? `${c.numero} — ${c.nom}` : c.nom}</span>
                        <button onClick={() => renommerCarte(deck.id, c)} style={{ fontSize:10, padding:'2px 6px', borderRadius:5, border:'0.5px solid var(--color-border-secondary)', background:'none', cursor:'pointer' }}>Renommer</button>
                      </div>
                    ))}
                    <div style={{ display:'flex', gap:6, marginTop:8 }}>
                      <input value={nouvelleCarte} onChange={e => setNouvelleCarte(e.target.value)}
                        placeholder="ex: 54- Nouvelle carte" style={inp} />
                      <button onClick={() => ajouterCarte(deck.id)} style={{ fontSize:11, padding:'6px 12px', borderRadius:6, border:'none', background:'var(--color-accent)', color:'#fff', cursor:'pointer', whiteSpace:'nowrap' }}>+ Ajouter</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div style={{ fontSize:12, fontWeight:600, color:'var(--color-accent)', textTransform:'uppercase', letterSpacing:'.05em', margin:'20px 0 8px' }}>Thèmes</div>
            {themes.length === 0 && <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Aucun thème pour l'instant.</div>}
            {themes.map(theme => (
              <div key={theme.id} style={{ border:'0.5px solid var(--color-border-tertiary)', borderRadius:10, marginBottom:8, padding:'8px 12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={() => { setOuvert(o => o === `t-${theme.id}` ? null : `t-${theme.id}`); chargerQuestions(theme.id) }}>
                  <span style={{ flex:1, fontSize:13, fontWeight:500 }}>{theme.nom}</span>
                  <button onClick={e => { e.stopPropagation(); renommerTheme(theme) }} style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'none', cursor:'pointer' }}>Renommer</button>
                </div>
                {ouvert === `t-${theme.id}` && (
                  <div style={{ marginTop:8, paddingLeft:8 }}>
                    {(questionsParTheme[theme.id] || []).map(q => (
                      <div key={q.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'3px 0', fontSize:12 }}>
                        <span style={{ flex:1 }}>{q.texte}</span>
                        <button onClick={() => renommerQuestion(theme.id, q)} style={{ fontSize:10, padding:'2px 6px', borderRadius:5, border:'0.5px solid var(--color-border-secondary)', background:'none', cursor:'pointer' }}>Modifier</button>
                      </div>
                    ))}
                    <div style={{ display:'flex', gap:6, marginTop:8 }}>
                      <input value={nouvelleQuestion} onChange={e => setNouvelleQuestion(e.target.value)}
                        placeholder="Nouvelle question" style={inp} />
                      <button onClick={() => ajouterQuestion(theme.id)} style={{ fontSize:11, padding:'6px 12px', borderRadius:6, border:'none', background:'var(--color-accent)', color:'#fff', cursor:'pointer', whiteSpace:'nowrap' }}>+ Ajouter</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
