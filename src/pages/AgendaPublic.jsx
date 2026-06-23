import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AgendaPublic({ slug }) {
  const [profil, setProfil] = useState(null)
  const [dispos, setDispos] = useState(null)
  const [seancesReservees, setSeancesReservees] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [popupDate, setPopupDate] = useState(null)
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

      // Charger les disponibilités
      const { data: d } = await supabase.from('disponibilites').select('*').eq('user_id', p.id).eq('actif', true).maybeSingle()
      setDispos(d)

      // Charger les séances déjà réservées (non disponibles)
      const today = new Date().toISOString().split('T')[0]
      const { data: s } = await supabase.from('seances').select('date_seance, heure_seance').eq('user_id', p.id).gte('date_seance', today).neq('statut', 'disponible')
      setSeancesReservees(s || [])
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

  // Créneaux réservés par date
  const reservesByDate = {}
  seancesReservees.forEach(s => {
    const key = s.date_seance?.slice(0, 10)
    if (!reservesByDate[key]) reservesByDate[key] = new Set()
    reservesByDate[key].add(s.heure_seance?.slice(0, 5))
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

  function toYMD(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function formatDateLong(ymd) {
    const d = new Date(ymd + 'T00:00:00')
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  // Générer les créneaux pour un jour donné
  function getSlotsForDate(ymd) {
    if (!dispos) return []
    const d = new Date(ymd + 'T00:00:00')
    const dow = d.getDay() === 0 ? 7 : d.getDay() // 1=lundi, 7=dimanche
    if (!dispos.jour_semaine?.includes(dow)) return []
    const reserved = reservesByDate[ymd] || new Set()
    const slots = []
    const start = parseInt(dispos.heure_debut?.slice(0, 2) || 8)
    const end = parseInt(dispos.heure_fin?.slice(0, 2) || 19)
    const step = dispos.duree_minutes || 60
    for (let h = start; h <= end - step / 60; h++) {
      const hStr = `${String(h).padStart(2, '0')}:00`
      if (!reserved.has(hStr)) slots.push(hStr)
    }
    return slots
  }

  // Jours du mois
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDow = (firstDay.getDay() + 6) % 7
  const totalDays = new Date(year, month + 1, 0).getDate()
  const blanks = Array(startDow).fill(null)
  const days = Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1))
  const allCells = [...blanks, ...days]

  const initials = `${profil.prenom?.[0] || ''}${profil.nom?.[0] || ''}`.toUpperCase() || '?'
  const isPrevDisabled = new Date(year, month, 1) <= new Date(today.getFullYear(), today.getMonth(), 1)

  async function submit() {
    if (!form.prenom || !form.nom || !form.email || !form.telephone || !selectedSlot) return
    setSending(true)

    // 1. Créer la séance dans Supabase
    await supabase.from('seances').insert([{
      user_id: profil.id,
      prenom: form.prenom,
      nom: form.nom,
      email: form.email,
      tel: form.telephone,
      date_naissance: form.date_naissance || null,
      date_seance: selectedSlot.date,
      heure_seance: selectedSlot.heure + ':00',
      duree_minutes: 60,
      statut: 'planifié',
      type_seance: 'Séance',
      notes: form.motif || null,
    }])

    // 2. Email confirmation client via Resend
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Naposolo <onboarding@resend.dev>',
          to: [form.email],
          subject: `✅ RDV confirmé — ${profil.prenom} ${profil.nom}`,
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
              <div style="background: linear-gradient(135deg, #085041, #0F6E56); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                <h1 style="color: #fff; margin: 0; font-size: 20px;">Demande de RDV reçue ✅</h1>
              </div>
              <p style="color: #374151;">Bonjour <strong>${form.prenom}</strong>,</p>
              <p style="color: #374151;">Votre demande de rendez-vous a bien été reçue par <strong>${profil.prenom} ${profil.nom}</strong>.</p>
              <div style="background: #E1F5EE; border-radius: 10px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #0F6E56; font-weight: 600; font-size: 16px;">
                  📅 ${new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à ${selectedSlot.heure}
                </p>
              </div>
              <p style="color: #6B7280; font-size: 13px;">
                ${profil.prenom} vous recontactera sous 24h pour confirmer ce créneau.<br/>
                En cas de question : ${profil.telephone || profil.email || ''}
              </p>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;"/>
              <p style="color: #9CA3AF; font-size: 11px; text-align: center;">
                Propulsé par <strong style="color: #0F6E56;">Naposolo</strong>
              </p>
            </div>
          `
        })
      })
    } catch(e) {
      console.error('Email error:', e)
    }

    // 3. Email notif praticien
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Naposolo <onboarding@resend.dev>',
          to: [profil.email],
          subject: `🔔 Nouvelle demande RDV — ${form.prenom} ${form.nom}`,
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
              <h2 style="color: #111827;">Nouvelle demande de RDV 🔔</h2>
              <div style="background: #F9FAFB; border-radius: 10px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Client :</strong> ${form.prenom} ${form.nom}</p>
                <p style="margin: 4px 0;"><strong>Email :</strong> ${form.email}</p>
                <p style="margin: 4px 0;"><strong>Tél :</strong> ${form.telephone}</p>
                <p style="margin: 4px 0;"><strong>Date naissance :</strong> ${form.date_naissance || '—'}</p>
                <p style="margin: 4px 0;"><strong>Adresse :</strong> ${form.adresse || '—'}</p>
                <p style="margin: 4px 0;"><strong>Motif :</strong> ${form.motif || '—'}</p>
              </div>
              <div style="background: #E1F5EE; border-radius: 10px; padding: 16px;">
                <p style="margin: 0; color: #0F6E56; font-weight: 600;">
                  📅 ${new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${selectedSlot.heure}
                </p>
              </div>
              <p style="color: #6B7280; font-size: 13px; margin-top: 16px;">
                Connectez-vous à <a href="https://naposolo.com" style="color: #0F6E56;">naposolo.com</a> pour confirmer ce RDV.
              </p>
            </div>
          `
        })
      })
    } catch(e) {
      console.error('Email praticien error:', e)
    }

    setSent(true)
    setSending(false)
  }

  const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', color: '#111827' }

  const popupSlots = popupDate ? getSlotsForDate(popupDate) : []

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
              Votre demande pour le <strong>{formatDateLong(selectedSlot.date)}</strong> à <strong>{selectedSlot.heure}</strong> a bien été envoyée.<br />
              {profil.prenom} vous recontactera sous 24h pour confirmer.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* CALENDRIER */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
                <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} disabled={isPrevDisabled}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: isPrevDisabled ? 'not-allowed' : 'pointer', opacity: isPrevDisabled ? 0.3 : 1, fontSize: 18 }}>‹</button>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{MOIS_FR[month]} {year}</div>
                <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 18 }}>›</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '8px 8px 4px' }}>
                {JOURS.map(j => <div key={j} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#9CA3AF', padding: '4px 0' }}>{j}</div>)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, padding: '0 8px 12px' }}>
                {allCells.map((day, i) => {
                  if (!day) return <div key={`b${i}`} />
                  const ymd = toYMD(day)
                  const isPast = day < today
                  const slots = isPast ? [] : getSlotsForDate(ymd)
                  const hasSlots = slots.length > 0
                  const isSelected = selectedSlot?.date === ymd
                  const isToday = ymd === toYMD(new Date())
                  return (
                    <div key={ymd} onClick={() => { if (hasSlots) setPopupDate(ymd) }}
                      style={{
                        aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 8, cursor: hasSlots ? 'pointer' : 'default',
                        background: isSelected ? '#0F6E56' : isToday ? '#E1F5EE' : hasSlots ? '#F0FDF4' : 'transparent',
                        border: isSelected ? '2px solid #0F6E56' : isToday ? '1.5px solid #0F6E56' : hasSlots ? '1px solid #BBF7D0' : '1px solid transparent',
                      }}>
                      <span style={{ fontSize: 13, fontWeight: isSelected || isToday ? 700 : hasSlots ? 600 : 400, color: isSelected ? '#fff' : isPast ? '#D1D5DB' : '#111827' }}>
                        {day.getDate()}
                      </span>
                      {hasSlots && (
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#fff' : '#0F6E56', marginTop: 1 }} />
                      )}
                    </div>
                  )
                })}
              </div>

              <div style={{ padding: '8px 16px 12px', display: 'flex', gap: 14, borderTop: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: '#F0FDF4', border: '1px solid #BBF7D0' }} />
                  <span style={{ fontSize: 10, color: '#6B7280' }}>Disponible</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: '#0F6E56' }} />
                  <span style={{ fontSize: 10, color: '#6B7280' }}>Sélectionné</span>
                </div>
              </div>

              {selectedSlot && (
                <div style={{ margin: '0 12px 12px', padding: '10px 14px', borderRadius: 8, background: '#E1F5EE', border: '1px solid #BBF7D0', fontSize: 12, fontWeight: 600, color: '#0F6E56', textAlign: 'center' }}>
                  ✓ {formatDateLong(selectedSlot.date)} à {selectedSlot.heure}
                  <span onClick={() => setSelectedSlot(null)} style={{ marginLeft: 8, cursor: 'pointer', opacity: 0.6, fontSize: 11 }}>✕ changer</span>
                </div>
              )}

              {!selectedSlot && (
                <div style={{ padding: '0 12px 12px', textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
                  👆 Cliquez sur un jour vert
                </div>
              )}
            </div>

            {/* FORMULAIRE */}
            <div style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${selectedSlot ? '#0F6E56' : '#E5E7EB'}`, padding: '20px', transition: 'border-color 0.2s' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Vos informations</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>Champs * obligatoires</div>

              {selectedSlot && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: '#E1F5EE', border: '1px solid #BBF7D0', fontSize: 13, fontWeight: 600, color: '#0F6E56' }}>
                  📅 {formatDateLong(selectedSlot.date)} à {selectedSlot.heure}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Prénom *</label>
                  <input style={inp} value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Marie" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nom *</label>
                  <input style={inp} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Dupont" />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email *</label>
                <input style={inp} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="marie@email.com" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Téléphone *</label>
                  <input style={inp} type="tel" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="06 00 00 00 00" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Date de naissance</label>
                  <input style={inp} type="date" value={form.date_naissance} onChange={e => setForm({ ...form, date_naissance: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Adresse</label>
                <input style={inp} value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} placeholder="12 rue des Fleurs, Nancy" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Motif de consultation</label>
                <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })} placeholder="Décrivez brièvement votre demande..." />
              </div>

              {!selectedSlot && (
                <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: '#FFF9E6', border: '1px solid #FDE68A', fontSize: 12, color: '#92400E', textAlign: 'center' }}>
                  ⚠️ Sélectionnez d'abord un créneau dans le calendrier
                </div>
              )}

              <button onClick={submit} disabled={sending || !form.prenom || !form.nom || !form.email || !form.telephone || !selectedSlot}
                style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
                  background: selectedSlot && form.prenom && form.nom && form.email && form.telephone ? '#0F6E56' : '#E5E7EB',
                  color: selectedSlot && form.prenom && form.nom && form.email && form.telephone ? '#fff' : '#9CA3AF' }}>
                {sending ? 'Envoi...' : selectedSlot ? `✓ Confirmer le ${formatDateLong(selectedSlot.date)} à ${selectedSlot.heure}` : 'Choisir un créneau'}
              </button>

              <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 10 }}>
                Propulsé par <span style={{ fontWeight: 600, color: '#0F6E56' }}>Naposolo</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* POPUP HORAIRES */}
      {popupDate && (
        <div onClick={() => setPopupDate(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4, textTransform: 'capitalize' }}>
              {formatDateLong(popupDate)}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>Choisissez votre heure</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
              {popupSlots.map(heure => (
                <button key={heure} onClick={() => { setSelectedSlot({ date: popupDate, heure }); setPopupDate(null) }}
                  style={{ padding: '12px 8px', borderRadius: 10, border: '2px solid #BBF7D0', background: '#E1F5EE', color: '#0F6E56', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#0F6E56'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#E1F5EE'; e.currentTarget.style.color = '#0F6E56' }}>
                  {heure}
                </button>
              ))}
            </div>
            <button onClick={() => setPopupDate(null)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, color: '#6B7280', cursor: 'pointer' }}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
