import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AgendaPublic({ slug }) {
  const [profil, setProfil] = useState(null)
  const [seances, setSeances] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', adresse: '', date_naissance: '', motif: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

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
      const { data: s } = await supabase.from('seances').select('*').eq('user_id', p.id).gte('date_seance', today).eq('statut', 'disponible').order('date_seance').order('heure_seance').limit(100)
      setSeances(s || [])
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 13, color: '#6B7280' }}>Chargement...</div>
  if (notFound) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12 }}>
      <i className="ti ti-calendar-off" style={{ fontSize: 48, color: '#D1D5DB' }} />
      <div style={{ fontSize: 18, fontWeight: 600 }}>Agenda introuvable</div>
      <div style={{ fontSize: 13, color: '#6B7280' }}>Ce lien n'existe pas ou l'agenda public est désactivé.</div>
    </div>
  )

  // Grouper créneaux par date
  const slotsByDate = {}
  seances.forEach(s => {
    if (!slotsByDate[s.date_seance]) slotsByDate[s.date_seance] = []
    slotsByDate[s.date_seance].push(s)
  })

  const today = new Date()
  today.setHours(0,0,0,0)

  const JOURS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
  const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

  function toYMD(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  // Jours du mois
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // Lundi = 0
  const totalDays = lastDay.getDate()

  // Cases vides avant le 1er
  const blanks = Array(startDow).fill(null)
  const days = Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1))
  const allCells = [...blanks, ...days]

  const initials = `${profil.prenom?.[0] || ''}${profil.nom?.[0] || ''}`.toUpperCase() || '?'

  const slotsForSelected = selectedDate ? (slotsByDate[selectedDate] || []) : []

  async function submit() {
    if (!form.prenom || !form.nom || !form.email || !form.telephone || !selectedSlot) return
    setSending(true)
    await supabase.from('messages_support').insert([{
      email: form.email,
      sujet: `Demande RDV — ${profil.prenom} ${profil.nom}`,
      message: `Nom: ${form.nom}\nPrénom: ${form.prenom}\nEmail: ${form.email}\nTél: ${form.telephone}\nAdresse: ${form.adresse}\nDate naissance: ${form.date_naissance}\nMotif: ${form.motif}\nCréneau: ${selectedSlot.date_seance} à ${selectedSlot.heure_seance?.slice(0,5)}`,
    }])
    setSent(true)
    setSending(false)
  }

  const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', color: '#111827' }

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))
  const isPrevDisabled = new Date(year, month, 1) <= new Date(today.getFullYear(), today.getMonth(), 1)

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #085041 0%, #0F6E56 100%)', padding: '28px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{profil.prenom} {profil.nom}</div>
            {profil.activite && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{profil.activite}</div>}
            {profil.ville && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>📍 {profil.ville}</div>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Demande confirmée !</div>
            <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>
              Votre demande pour le <strong>{new Date(selectedSlot.date_seance + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> à <strong>{selectedSlot.heure_seance?.slice(0,5)}</strong> a bien été envoyée.<br/>
              {profil.prenom} vous recontactera sous 24h pour confirmer.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* GAUCHE : Calendrier mensuel */}
            <div>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', marginBottom: 16 }}>

                {/* Nav mois */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
                  <button onClick={prevMonth} disabled={isPrevDisabled}
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: isPrevDisabled ? 'not-allowed' : 'pointer', opacity: isPrevDisabled ? 0.3 : 1, fontSize: 18 }}>‹</button>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{MOIS[month]} {year}</div>
                  <button onClick={nextMonth}
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 18 }}>›</button>
                </div>

                {/* Entêtes jours */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '8px 8px 4px' }}>
                  {JOURS.map(j => (
                    <div key={j} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#9CA3AF', padding: '4px 0' }}>{j}</div>
                  ))}
                </div>

                {/* Grille jours */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, padding: '0 8px 12px' }}>
                  {allCells.map((day, i) => {
                    if (!day) return <div key={`blank-${i}`} />
                    const ymd = toYMD(day)
                    const hasSlots = !!slotsByDate[ymd]
                    const isPast = day < today
                    const isSelected = selectedDate === ymd
                    const isToday = ymd === toYMD(new Date())
                    return (
                      <div key={ymd}
                        onClick={() => { if (!isPast && hasSlots) { setSelectedDate(ymd); setSelectedSlot(null) } }}
                        style={{
                          aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 8, cursor: hasSlots && !isPast ? 'pointer' : 'default',
                          background: isSelected ? '#0F6E56' : isToday ? '#E1F5EE' : hasSlots && !isPast ? '#F0FDF4' : 'transparent',
                          border: isSelected ? '2px solid #0F6E56' : isToday ? '1px solid #0F6E56' : hasSlots && !isPast ? '1px solid #D1FAE5' : '1px solid transparent',
                          transition: 'all 0.1s',
                          position: 'relative',
                        }}>
                        <span style={{ fontSize: 13, fontWeight: isSelected || isToday ? 700 : hasSlots ? 600 : 400, color: isSelected ? '#fff' : isPast ? '#D1D5DB' : '#111827' }}>
                          {day.getDate()}
                        </span>
                        {hasSlots && !isPast && (
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#fff' : '#0F6E56', marginTop: 2 }} />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Légende */}
                <div style={{ padding: '8px 16px 12px', display: 'flex', gap: 14, borderTop: '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#F0FDF4', border: '1px solid #D1FAE5' }} />
                    <span style={{ fontSize: 10, color: '#6B7280' }}>Créneaux dispo</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#0F6E56' }} />
                    <span style={{ fontSize: 10, color: '#6B7280' }}>Jour sélectionné</span>
                  </div>
                </div>
              </div>

              {/* Créneaux du jour sélectionné */}
              {selectedDate && (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                    Créneaux disponibles — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  {slotsForSelected.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '12px 0' }}>Aucun créneau ce jour</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {slotsForSelected.map(slot => (
                        <button key={slot.id} onClick={() => setSelectedSlot(slot)}
                          style={{ padding: '10px 16px', borderRadius: 8, border: `2px solid ${selectedSlot?.id === slot.id ? '#0F6E56' : '#D1FAE5'}`, background: selectedSlot?.id === slot.id ? '#0F6E56' : '#E1F5EE', color: selectedSlot?.id === slot.id ? '#fff' : '#0F6E56', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                          {slot.heure_seance?.slice(0,5)}
                          {slot.duree_minutes && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.8 }}>{slot.duree_minutes}min</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!selectedDate && (
                <div style={{ textAlign: 'center', padding: '16px', fontSize: 13, color: '#9CA3AF' }}>
                  👆 Cliquez sur un jour vert pour voir les créneaux
                </div>
              )}
            </div>

            {/* DROITE : Formulaire */}
            <div style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${selectedSlot ? '#0F6E56' : '#E5E7EB'}`, padding: '20px', transition: 'border-color 0.2s' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Vos informations</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>Champs * obligatoires</div>

              {selectedSlot && (
                <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#E1F5EE', border: '1px solid #D1FAE5', fontSize: 13, fontWeight: 600, color: '#0F6E56' }}>
                  📅 {new Date(selectedSlot.date_seance + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {selectedSlot.heure_seance?.slice(0,5)}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Prénom *</label>
                  <input style={inp} value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} placeholder="Marie" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nom *</label>
                  <input style={inp} value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Dupont" />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email *</label>
                <input style={inp} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="marie@email.com" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Téléphone *</label>
                  <input style={inp} type="tel" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} placeholder="06 00 00 00 00" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Date de naissance</label>
                  <input style={inp} type="date" value={form.date_naissance} onChange={e => setForm({...form, date_naissance: e.target.value})} />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Adresse</label>
                <input style={inp} value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} placeholder="12 rue des Fleurs, Nancy" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Motif de consultation</label>
                <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={form.motif} onChange={e => setForm({...form, motif: e.target.value})} placeholder="Décrivez brièvement votre demande..." />
              </div>

              {!selectedSlot && (
                <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: '#FFF9E6', border: '1px solid #FDE68A', fontSize: 12, color: '#92400E', textAlign: 'center' }}>
                  ⚠️ Sélectionnez d'abord un jour puis un créneau horaire
                </div>
              )}

              <button onClick={submit}
                disabled={sending || !form.prenom || !form.nom || !form.email || !form.telephone || !selectedSlot}
                style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
                  background: selectedSlot && form.prenom && form.nom && form.email && form.telephone ? '#0F6E56' : '#E5E7EB',
                  color: selectedSlot && form.prenom && form.nom && form.email && form.telephone ? '#fff' : '#9CA3AF' }}>
                {sending ? 'Envoi...' : selectedSlot ? `✓ Confirmer le ${new Date(selectedSlot.date_seance + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à ${selectedSlot.heure_seance?.slice(0,5)}` : 'Choisir un créneau'}
              </button>

              <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 10 }}>
                Propulsé par <span style={{ fontWeight: 600, color: '#0F6E56' }}>Naposolo</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
