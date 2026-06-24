import { useState, useEffect, useRef } from 'react'

const SYSTEM_PROMPT = `Tu es NapoAssistant, l'assistant officiel de Naposolo.

Naposolo est un CRM SaaS conçu exclusivement pour les praticiens du bien-être indépendants : sophrologues, naturopathes, coachs, énergéticiens, réflexologues, hypnothérapeutes, praticiens en fleurs de Bach, etc.

Phrase clé : "Resalib gère ton agenda. Naposolo gère ton cabinet."

━━━ QUI TU AIDES ━━━
- Les praticiens (abonnés Naposolo) : ils gèrent leur cabinet au quotidien
- Les clients finaux : ils ont pris RDV via un praticien Naposolo

━━━ FONCTIONNALITÉS NAPOSOLO ━━━
- Fiches clients complètes (historique, notes, anniversaires)
- Suivi des séances avec annotations sur schéma corporel 3D
- Agenda intégré avec prise de RDV en ligne (lien public /rdv/[slug-praticien])
- Module Fleurs de Bach (bilan, sélection, suivi)
- NapoOracle (tirage oracle bien-être)
- Tâches et rappels
- Dashboard avec stats CA, clients actifs, séances à venir
- Envoi d'emails de confirmation RDV automatique

━━━ TARIFS ━━━
- Napo-Réflexion : 9,95€/mois — fonctions essentielles
- Napo-Bâtisseur : 19,95€/mois — module avancés inclus
- Napo-Visionnaire : 29,95€/mois — tout inclus + priorité support
- Essai gratuit 14 jours, sans CB
- Addons : NapoOracle +5€/mois, Fleurs de Bach +3€/mois, Export PDF +3€/mois

━━━ FAQ PRATICIENS ━━━
Q: Comment ajouter un client ?
R: Dans le menu "Clients" > bouton "Nouveau client" en haut à droite. Remplis prénom, nom, email, téléphone et valide.

Q: Comment créer une séance ?
R: Depuis la fiche client > onglet "Séances" > "Nouvelle séance". Tu peux aussi cliquer sur un créneau dans l'Agenda.

Q: Comment partager mon lien de prise de RDV ?
R: Ton lien public est naposolo.com/rdv/[ton-slug]. Tu le trouves dans Paramètres > Mon profil. Partage-le sur ton site, Instagram, WhatsApp.

Q: Comment modifier mes disponibilités ?
R: Menu "Agenda" > onglet "Disponibilités". Tu définis tes plages horaires par jour de la semaine.

Q: Je ne reçois pas les emails de confirmation RDV ?
R: Vérifie ton dossier spam. Les emails partent depuis noreply@naposolo.com. Si le problème persiste, contacte le support.

Q: Comment accéder au module Fleurs de Bach ?
R: Menu latéral > icône "Fleurs de Bach". Disponible sur Napo-Bâtisseur et Napo-Visionnaire.

Q: Comment exporter mes données ?
R: Fonctionnalité disponible sur Napo-Visionnaire. Menu > Paramètres > Export.

Q: Mon agenda ne se met pas à jour ?
R: Rafraîchis la page (F5). Si ça persiste, vide le cache du navigateur ou contacte le support.

━━━ FAQ CLIENTS FINAUX ━━━
Q: Comment annuler ou modifier mon RDV ?
R: Contacte directement ton praticien par email ou téléphone. Les coordonnées sont dans ton email de confirmation.

Q: Je n'ai pas reçu ma confirmation de RDV ?
R: Vérifie tes spams. Si toujours rien après 10 minutes, contacte ton praticien directement.

━━━ RÈGLES DE RÉPONSE ━━━
- Réponds en français, ton chaleureux et direct
- Réponses courtes (3-5 lignes max sauf si explication technique)
- Si tu ne sais pas avec certitude → dis-le et propose le support
- Termine TOUJOURS par une proposition d'aide supplémentaire ou le contact support si le problème n'est pas résolu
- Support : contact@naposolo.com
- Ne fabrique jamais d'informations`

const ACCUEIL_PHRASES = [
  "Bonjour ! Je suis NapoAssistant 😊\nComment puis-je t'aider avec Naposolo aujourd'hui ?",
  "Salut ! NapoAssistant à ton service 🌿\nTu as une question sur ton cabinet ou sur Naposolo ?",
  "Bonjour ! Je suis là pour t'aider avec Naposolo ✨\nQu'est-ce que je peux faire pour toi ?",
  "Hello ! NapoAssistant disponible 👋\nUne question sur tes clients, séances ou l'agenda ?",
]

const QUICK_SETS = [
  [
    { label: "Ajouter un client", msg: "Comment ajouter un nouveau client ?" },
    { label: "Mon lien RDV", msg: "Comment trouver et partager mon lien de prise de RDV ?" },
    { label: "Tarifs", msg: "Quels sont les tarifs de Naposolo ?" },
  ],
  [
    { label: "Créer une séance", msg: "Comment créer une nouvelle séance ?" },
    { label: "Fleurs de Bach", msg: "Comment accéder au module Fleurs de Bach ?" },
    { label: "Email RDV", msg: "Je ne reçois pas les emails de confirmation RDV" },
  ],
  [
    { label: "Mes disponibilités", msg: "Comment modifier mes disponibilités dans l'agenda ?" },
    { label: "C'est quoi Naposolo ?", msg: "C'est quoi Naposolo et à qui ça s'adresse ?" },
    { label: "Essai gratuit", msg: "Comment fonctionne l'essai gratuit ?" },
  ],
]

export default function NapoAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuick, setShowQuick] = useState(true)
  const [quickSet] = useState(() => QUICK_SETS[Math.floor(Math.random() * QUICK_SETS.length)])
  const [accueil] = useState(() => ACCUEIL_PHRASES[Math.floor(Math.random() * ACCUEIL_PHRASES.length)])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: accueil }])
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput('')
    setLoading(true)
    setShowQuick(false)

    try {
      const res = await fetch('https://jzwwqngbgcdeyiqrvtle.supabase.co/functions/v1/chat-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ messages: newHistory, system: SYSTEM_PROMPT })
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || "Je n'ai pas pu répondre. Contacte-nous à contact@naposolo.com 😊"
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Une erreur est survenue 😕\nTu peux contacter le support directement : contact@naposolo.com"
      }])
    }
    setLoading(false)
  }

  const accent = '#1e2d4d'

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 54, height: 54, borderRadius: '50%',
          background: accent, border: 'none', cursor: 'pointer',
          color: 'white', fontSize: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, boxShadow: '0 4px 16px rgba(30,45,77,0.35)',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        aria-label="Ouvrir NapoAssistant"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24,
          width: 348, background: 'white',
          border: '0.5px solid #e0e0e0', borderRadius: 18,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', zIndex: 999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
          animation: 'popIn 0.18s ease',
        }}>
          <div style={{ background: accent, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
            }}>✨</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>NapoAssistant</p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, margin: 0 }}>Répond en quelques secondes · contact@naposolo.com</p>
            </div>
          </div>

          <div style={{ height: 300, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                maxWidth: '88%',
                padding: '9px 13px',
                borderRadius: 14,
                borderBottomLeftRadius: m.role === 'assistant' ? 3 : 14,
                borderBottomRightRadius: m.role === 'user' ? 3 : 14,
                background: m.role === 'user' ? accent : '#f2f4f7',
                color: m.role === 'user' ? 'white' : '#1a1a2e',
                fontSize: 13, lineHeight: 1.55,
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                whiteSpace: 'pre-wrap',
              }}>{m.content}</div>
            ))}
            {loading && (
              <div style={{
                display: 'flex', gap: 5, padding: '10px 14px',
                background: '#f2f4f7', borderRadius: 14, borderBottomLeftRadius: 3,
                width: 'fit-content', alignItems: 'center'
              }}>
                {[0, 0.18, 0.36].map((d, i) => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#aaa',
                    animation: `napoBounce 1.1s ${d}s infinite`
                  }} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {showQuick && (
            <div style={{ padding: '4px 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {quickSet.map((q) => (
                <button key={q.msg} onClick={() => send(q.msg)} style={{
                  fontSize: 11, padding: '5px 11px', borderRadius: 20,
                  border: `0.5px solid ${accent}33`,
                  background: '#f0f3f8', color: accent,
                  cursor: 'pointer', fontWeight: 500,
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f4'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f0f3f8'}
                >{q.label}</button>
              ))}
            </div>
          )}

          <div style={{ padding: '10px 12px', borderTop: '0.5px solid #eee', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
              }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              placeholder="Pose ta question..."
              rows={1}
              style={{
                flex: 1, resize: 'none', border: '0.5px solid #ddd',
                borderRadius: 10, padding: '8px 12px', fontSize: 13,
                background: '#f8f9fb', outline: 'none',
                minHeight: 36, maxHeight: 80, lineHeight: 1.5,
                fontFamily: 'inherit', color: '#1a1a2e',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: loading || !input.trim() ? '#ccc' : accent,
                border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                color: 'white', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >→</button>
          </div>
          <p style={{ textAlign: 'center', fontSize: 10, color: '#bbb', padding: '5px', borderTop: '0.5px solid #f0f0f0' }}>
            Propulsé par Claude · Naposolo
          </p>
        </div>
      )}

      <style>{`
        @keyframes napoBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes popIn { from{transform:scale(0.92) translateY(8px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
      `}</style>
    </>
  )
}
