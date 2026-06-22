import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AgendaPublic({ slug }) {
  const [profil, setProfil] = useState(null)
  const [seances, setSeances] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [form, setForm] = useState({ prenom: '', email: '', telephone: '', motif: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(0)

  useEffect(() => {
    async function load() {
      let { data: p } = await supabase.from('profils').select('*').eq('slug', slug).eq('agenda_public', true).maybeSingle()
      if (!p) {
        const { data: p2 } = await supabase.from('profiles').select('*').eq('slug', slug).eq('agenda_public', true).maybeSingle()
        p = p2
      }
      if (!p) { setNotFound(true); setLoading(false); return }
      setProfil(p)
      const today = new Date().toISOString().split('T')[0]
      const { data: s } = await supabase.from('seances').select('*').eq('user_id', p.id).gte('date_seance', today).eq('statut', 'disponible').order('date_seance').order('heure_seance').limit(50)
      setSeances(s || [])
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 13, color: '#6B7280' }}>Chargement...</div>
  if (notFound) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12 }}>
      <i className="ti ti-calendar-off" style={{ fontSize: 48, color: '#D1D5DB' }} />
      <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Agenda introuvable</div>
      <div style={{ fontSize: 13, color: '#6B7280' }}>Ce lien n'existe pas ou l'agenda public est désactivé.</div>
    </div>
  )

  const slotsByDate = {}
  seances.forEach(s => {
    if (!slotsByDate[s.date_seance]) slotsByDate[s.date_seance] = []
    slotsByDate[s.date_seance].push(s)
  })

  const today = new Date()
  today.setHours(0,0,0,0)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1 + currentWeek * 7)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d
  })

  const JOURS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
  const MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']

  function toYMD(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  const initials = `${profil.prenom?.[0] || ''}${profil.nom?.[0] || ''}`.toUpperCase() || '?'
  const moisAffiche = `${MOIS[startOfWeek.getMonth()]} ${startOfWeek.getFullYear()}`

  async function submit() {
    if (!form.prenom || !form.email || !selectedSlot) return
    setSending(true)
    await supabase.from('messages_support').insert([{
      email: form.email,
      sujet: `Demande RDV — ${profil.prenom} ${profil.nom}`,
      message: `Prénom: ${form.prenom}\nTél: ${form.telephone}\nEmail: ${form.email}\nMotif: ${form.motif}\nCréneau: ${selectedSlot.date_seance} à ${selectedSlot.heure_seance?.slice(0,5)}`,
    }])
    setSent(true)
    setSending(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg, #085041 0%, #0F6E56 100%)', padding: '32px 24px 28px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{profil.prenom} {profil.nom}</div>
            {profil.activite && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{profil.activite}</div>}
            {profil.ville && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>📍 {profil.ville}</div>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Demande envoyée !</div>
            <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>
              {profil.prenom} a bien reçu votre demande.<br/>Elle vous recontactera sous 24h.
            </div>
          </div>
        ) : (
          <>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
                <button onClick={() => setCurrentWeek(w => Math.max(0, w-1))} disabled={currentWeek === 0}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: currentWeek === 0 ? 'not-allowed' : 'pointer', opacity: currentWeek === 0 ? 0.4 : 1, fontSize: 18 }}>‹</button>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', textTransform: 'capitalize' }}>{moisAffiche}</div>
                <button onClick={() => setCurrentWeek(w => w+1)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 18 }}>›</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {weekDays.map((day, i) => {
                  const ymd = toYMD(day)
                  const slots = slotsByDate[ymd] || []
                  const isToday = ymd === toYMD(new Date())
                  const isPast = day < today
                  return (
                    <div key={ymd} style={{ borderRight: i < 6 ? '1px solid #F3F4F6' : 'none', minHeight: 120 }}>
                      <div style={{ padding: '10px 4px 6px', textAlign: 'center', borderBottom: '1px solid #F3F4F6', background: isToday ? '#E1F5EE' : '#FAFAFA' }}>
                        <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500, marginBottom: 2 }}>{JOURS[i]}</div>
                        <div style={{ fontSize: 15, fontWeight: isToday ? 700 : 500, color: isToday ? '#0F6E56' : isPast ? '#D1D5DB' : '#111827' }}>{day.getDate()}</div>
                      </div>
                      <div style={{ padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {slots.map(slot => (
                          <button key={slot.id} onClick={() => setSelectedSlot(slot)}
                            style={{ padding: '4px 2px', borderRadius: 6, border: `1.5px solid ${selectedSlot?.id === slot.id ? '#0F6E56' : '#D1FAE5'}`, background: selectedSlot?.id === slot.id ? '#0F6E56' : '#E1F5EE', color: selectedSlot?.id === slot.id ? '#fff' : '#0F6E56', fontSize: 11, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                            {slot.heure_seance?.slice(0,5)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ padding: '10px 16px', display: 'flex', gap: 16, alignItems: 'center', borderTop: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: '#E1F5EE', border: '1px solid #D1FAE5' }} />
                  <span style={{ fontSize: 11, color: '#6B7280' }}>Disponible</span>
                </div>
                {selectedSlot && (
                  <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#0F6E56' }}>
                    ✓ {new Date(selectedSlot.date_seance + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {selectedSlot.heure_seance?.slice(0,5)}
                  </div>
                )}
              </div>
            </div>

            {selectedSlot && (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '20px' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Vos informations</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  {[
                    { key: 'prenom', label: 'Prénom *', placeholder: 'Marie', type: 'text' },
                    { key: 'telephone', label: 'Téléphone', placeholder: '06 00 00 00 00', type: 'tel' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>{f.label}</label>
                      <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="marie@email.com"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Motif de consultation</label>
                  <textarea value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })} placeholder="Décrivez brièvement votre demande..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box', minHeight: 70, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <button onClick={submit} disabled={sending || !form.prenom || !form.email}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (!form.prenom || !form.email) ? 0.5 : 1 }}>
                  {sending ? 'Envoi...' : `Confirmer le ${new Date(selectedSlot.date_seance + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à ${selectedSlot.heure_seance?.slice(0,5)}`}
                </button>
                <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 10 }}>
                  Propulsé par <span style={{ fontWeight: 600, color: '#0F6E56' }}>Naposolo</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
