import { useState, useEffect } from 'react'

import { supabase } from '../lib/supabase'

export default function AgendaPublic({ slug }) {
  const [profil, setProfil] = useState(null)
  const [seances, setSeances] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState({ prenom: '', email: '', motif: '' })
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function load() {
      console.log('SEARCHING slug:', slug)
      let { data: p, error: e1 } = await supabase
        .from('profils')
        .select('*')
        .eq('slug', slug)
        .eq('agenda_public', true)
        .maybeSingle()
      if (!p) {
        console.log('ERROR profils:', e1)
        const { data: p2, error: e2 } = await supabase
          .from('profiles')
          .select('*')
          .eq('slug', slug)
          .eq('agenda_public', true)
          .maybeSingle()
        console.log('ERROR profiles:', e2, 'RESULT p2:', p2)
        p = p2
      }
      console.log('PROFIL RESULT:', p)
      if (!p) { setNotFound(true); setLoading(false); return }
      setProfil(p)
      const today = new Date().toISOString()
      const { data: s } = await supabase
        .from('seances')
        .select('*')
        .eq('user_id', p.id)
        .gte('date_seance', today.split('T')[0])
        .eq('statut', 'disponible')
        .order('date_seance')
        .order('heure_seance')
        .limit(20)
      setSeances(s || [])
      setLoading(false)
    }
    load()
  }, [slug])

  async function submit() {
    if (!form.prenom || !form.email) return
    setSending(true)
    await supabase.from('messages_support').insert([{
      email: form.email,
      sujet: `Demande RDV — ${profil.prenom} ${profil.nom}`,
      message: `Prénom: ${form.prenom}\nEmail: ${form.email}\nMotif: ${form.motif}\nCréneau souhaité: ${selectedSlot ? new Date(selectedSlot).toLocaleString('fr-FR') : 'Non précisé'}`,
    }])
    setSent(true)
    setSending(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 13, color: '#6B7280' }}>
      Chargement...
    </div>
  )

  if (notFound) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12 }}>
      <i className="ti ti-calendar-off" style={{ fontSize: 48, color: '#D1D5DB' }} />
      <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Agenda introuvable</div>
      <div style={{ fontSize: 13, color: '#6B7280' }}>Ce lien n'existe pas ou l'agenda public est désactivé.</div>
    </div>
  )

  const initials = `${profil.prenom?.[0] || ''}${profil.nom?.[0] || ''}`.toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #085041 0%, #0F6E56 100%)', padding: '40px 24px 48px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{profil.prenom} {profil.nom}</div>
            {profil.activite && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>{profil.activite}</div>}
            {profil.ville && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>📍 {profil.ville}</div>}
          </div>
        </div>
        <div style={{ maxWidth: 560, margin: '16px auto 0', background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 16px' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>
            🔗 <span style={{ fontWeight: 500 }}>naposolo.com/rdv/{slug}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 24px' }}>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Demande envoyée !</div>
            <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
              {profil.prenom} a bien reçu votre demande de rendez-vous.<br />
              Elle vous recontactera sous 24h pour confirmer.
            </div>
          </div>
        ) : (
          <>
            {/* Créneaux */}
            {seances.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                  Créneaux disponibles
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {seances.map(s => (
                    <button key={s.id} onClick={() => setSelectedSlot(s.date_heure)}
                      style={{ padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${selectedSlot === s.date_heure ? '#0F6E56' : '#E5E7EB'}`, background: selectedSlot === s.date_heure ? '#E1F5EE' : '#fff', color: selectedSlot === s.date_heure ? '#0F6E56' : '#374151', fontSize: 13, fontWeight: selectedSlot === s.date_heure ? 600 : 400, cursor: 'pointer' }}>
                      {new Date(s.date_seance).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' à '}
                      {s.heure_seance?.slice(0,5)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Formulaire */}
            <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E5E7EB', padding: '24px' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 18 }}>
                Demander un rendez-vous
              </div>

              {[
                { key: 'prenom', label: 'Votre prénom *', placeholder: 'Marie', type: 'text' },
                { key: 'email',  label: 'Votre email *',  placeholder: 'marie@email.com', type: 'email' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#111827' }} />
                </div>
              ))}

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Motif de consultation</label>
                <textarea value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })}
                  placeholder="Décrivez brièvement votre demande..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box', minHeight: 80, resize: 'vertical', outline: 'none', color: '#111827', fontFamily: 'inherit' }} />
              </div>

              {selectedSlot && (
                <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#E1F5EE', fontSize: 13, color: '#0F6E56', fontWeight: 500 }}>
                  📅 Créneau sélectionné : {selectedSlot}
                </div>
              )}

              <button onClick={submit} disabled={sending || !form.prenom || !form.email}
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (!form.prenom || !form.email) ? 0.5 : 1 }}>
                {sending ? 'Envoi...' : 'Envoyer ma demande'}
              </button>

              <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 12 }}>
                Propulsé par <span style={{ fontWeight: 600, color: '#0F6E56' }}>Naposolo</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
