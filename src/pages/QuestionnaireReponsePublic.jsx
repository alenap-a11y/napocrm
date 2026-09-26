import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { QUESTIONS } from '../data/questionsBank'

export default function QuestionnaireReponsePublic({ token }) {
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [q, setQ] = useState(null)
  const [consentement, setConsentement] = useState(false)
  const [reponses, setReponses] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc('get_questionnaire_public', { p_token: token })
      if (error || !data || data.length === 0) { setNotFound(true); setLoading(false); return }
      setQ(data[0])
      setLoading(false)
    }
    load()
  }, [token])

  function setReponse(id, val) {
    setReponses(prev => ({ ...prev, [id]: val }))
  }

  async function envoyer() {
    if (!consentement) return
    setSubmitting(true)
    setErreur('')
    const payload = (q.question_ids || []).map(id => ({ question_id: id, reponse: reponses[id] || '' }))
    const { error } = await supabase.rpc('submit_questionnaire_reponses', { p_token: token, p_reponses: payload })
    if (error) {
      setErreur("Une erreur est survenue — ce questionnaire a peut-être déjà été rempli, ou le lien n'est plus valide.")
      setSubmitting(false)
      return
    }
    setSubmitted(true)
    setSubmitting(false)
  }

  const wrap = { minHeight: '100vh', background: '#F7F5F2', display: 'flex', justifyContent: 'center', padding: '40px 16px', fontFamily: 'inherit' }
  const box = { background: '#fff', borderRadius: 14, padding: 28, maxWidth: 640, width: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', boxSizing: 'border-box' }

  if (loading) return <div style={wrap}><div style={box}>Chargement…</div></div>
  if (notFound) return <div style={wrap}><div style={box}>Questionnaire introuvable. Le lien n'est peut-être plus valide.</div></div>

  if (q.statut === 'repondu' || submitted) {
    return (
      <div style={wrap}>
        <div style={box}>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>Merci !</div>
          <div style={{ fontSize: 14, color: '#555' }}>Vos réponses ont bien été enregistrées et transmises à votre praticien.</div>
        </div>
      </div>
    )
  }

  const questions = (q.question_ids || []).map(id => QUESTIONS.find(x => x.id === id)).filter(Boolean)

  return (
    <div style={wrap}>
      <div style={box}>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>{q.titre}</div>
        <div style={{ fontSize: 13, color: '#777', marginBottom: 22 }}>{questions.length} question(s) — vos réponses sont confidentielles.</div>

        {questions.map((qu, idx) => (
          <div key={qu.id} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{idx + 1}. {qu.texte}</div>
            <textarea value={reponses[qu.id] || ''} onChange={e => setReponse(qu.id, e.target.value)} rows={2}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>
        ))}

        <div style={{ background: '#F7F5F2', borderRadius: 8, padding: 14, fontSize: 12, color: '#555', lineHeight: 1.5, marginBottom: 16 }}>
          {q.consentement_texte}
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, marginBottom: 18, cursor: 'pointer' }}>
          <input type="checkbox" checked={consentement} onChange={e => setConsentement(e.target.checked)} style={{ marginTop: 3 }} />
          <span>J'ai lu et j'accepte les conditions ci-dessus.</span>
        </label>

        {erreur && <div style={{ fontSize: 13, color: '#B3261E', marginBottom: 12 }}>{erreur}</div>}

        <button type="button" onClick={envoyer} disabled={!consentement || submitting}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: consentement ? '#F2B01E' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 600, cursor: consentement ? 'pointer' : 'default', opacity: submitting ? 0.7 : 1 }}>
          {submitting ? 'Envoi…' : 'Envoyer mes réponses'}
        </button>
      </div>
    </div>
  )
}
