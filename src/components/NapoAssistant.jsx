import { useState, useRef, useEffect } from 'react'

const SYSTEM_PROMPT = `Tu es NapoAssistant, l'assistant intégré de Naposolo — un CRM SaaS conçu pour les praticiens du bien-être indépendants (sophrologues, naturopathes, coachs, énergéticiens...).

Tu réponds de façon concise, utile et chaleureuse. Tu t'adresses à deux types d'utilisateurs :
- Les praticiens (abonnés Naposolo) qui gèrent leurs clients, séances, tâches et agenda.
- Les clients finaux qui ont pris rendez-vous via un praticien.

Fonctionnalités de Naposolo :
- Gestion des clients (fiches, historique, notes)
- Suivi des séances avec annotations corporelles 3D
- Agenda avec prise de rendez-vous en ligne (/rdv/:slug)
- Module Fleurs de Bach
- NapoOracle (tirage oracle)
- Tâches et rappels
- Dashboard admin

Tarifs : Napo-Réflexion 9,95€/mois · Napo-Bâtisseur 19,95€/mois · Napo-Visionnaire 29,95€/mois · Essai gratuit 14 jours.

Si tu ne sais pas, dis-le honnêtement et invite à contacter le support.`

const QUICK_REPLIES = [
  { label: "C'est quoi Naposolo ?", msg: "C'est quoi Naposolo ?" },
  { label: 'Créer un client', msg: 'Comment créer un client ?' },
  { label: 'Tarifs', msg: 'Quels sont les tarifs ?' },
]

export default function NapoAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuick, setShowQuick] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: 'Bonjour ! Je suis NapoAssistant 👋\nComment puis-je t\'aider avec Naposolo ?' }])
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text }
    const newHistory = [...messages.filter(m => m.role !== 'system'), userMsg]
    setMessages(newHistory)
    setInput('')
    setLoading(true)
    setShowQuick(false)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newHistory
        })
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || 'Désolé, je n\'ai pas pu répondre.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erreur réseau. Réessaie dans un instant.' }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Bulle flottante */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 52, height: 52, borderRadius: '50%',
          background: '#1e2d4d', border: 'none', cursor: 'pointer',
          color: 'white', fontSize: 22, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'transform 0.2s',
        }}
        aria-label="Ouvrir l'assistant"
      >
        💬
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 86, right: 24,
          width: 340, background: 'white',
          border: '0.5px solid #e0e0e0', borderRadius: 16,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', zIndex: 999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}>
          {/* Header */}
          <div style={{ background: '#1e2d4d', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✨</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'white', fontWeight: 500, fontSize: 14, margin: 0 }}>NapoAssistant</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>Répond en quelques secondes</p>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ height: 280, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                maxWidth: '85%', padding: '9px 12px',
                borderRadius: 12,
                borderBottomLeftRadius: m.role === 'assistant' ? 3 : 12,
                borderBottomRightRadius: m.role === 'user' ? 3 : 12,
                background: m.role === 'user' ? '#1e2d4d' : '#f4f4f4',
                color: m.role === 'user' ? 'white' : '#1a1a1a',
                fontSize: 13, lineHeight: 1.5,
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                whiteSpace: 'pre-wrap',
              }}>{m.content}</div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 4, padding: '10px 14px', background: '#f4f4f4', borderRadius: 12, borderBottomLeftRadius: 3, width: 'fit-content' }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#999', animation: `bounce 1.2s ${d}s infinite` }} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {showQuick && (
            <div style={{ padding: '0 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK_REPLIES.map((q) => (
                <button key={q.msg} onClick={() => send(q.msg)} style={{
                  fontSize: 11, padding: '5px 10px', borderRadius: 20,
                  border: '0.5px solid #ddd', background: '#f8f8f8',
                  color: '#555', cursor: 'pointer',
                }}>{q.label}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: 12, borderTop: '0.5px solid #eee', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              placeholder="Pose ta question..."
              rows={1}
              style={{
                flex: 1, resize: 'none', border: '0.5px solid #ddd',
                borderRadius: 10, padding: '8px 12px', fontSize: 13,
                background: '#f8f8f8', outline: 'none', minHeight: 36, maxHeight: 80,
                lineHeight: 1.5, fontFamily: 'inherit',
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#1e2d4d', border: 'none', cursor: 'pointer',
                color: 'white', fontSize: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                opacity: loading || !input.trim() ? 0.4 : 1,
              }}
            >→</button>
          </div>
          <p style={{ textAlign: 'center', fontSize: 10, color: '#aaa', padding: '6px', borderTop: '0.5px solid #eee' }}>
            Propulsé par Claude · Naposolo
          </p>
        </div>
      )}

      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }`}</style>
    </>
  )
}
