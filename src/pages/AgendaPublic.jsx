import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SUPABASE_URL = 'https://jzwwqngbgcdeyiqrvtle.supabase.co'
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

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
      const { data: d } = await supabase.from('disponibilites').select('*').eq('user_id', p.id).eq('actif', true).maybeSingle()
      setDispos(d)
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
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  }

  function formatDateLong(ymd) {
    return new Date(ymd + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function getSlotsForDate(ymd) {
    if (!dispos) return []
    const d = new Date(ymd + 'T00:00:00')
    const dow = d.getDay() === 0 ? 7 : d.getDay()
    if (!dispos.jour_semaine?.includes(dow)) return []
    const reserved = reservesByDate[ymd] || new Set()
    const slots = []
    const start = parseInt(dispos.heure_debut?.slice(0, 2) || 8)
    const end = parseInt(dispos.heure_fin?.slice(0, 2) || 19)
    for (let h = start; h <= end; h++) {
      const hStr = String(h).padStart(2, '0') + ':00'
      if (!reserved.has(hStr)) slots.push(hStr)
    }
    return slots
  }

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7
  const totalDays = new Date(year, month + 1, 0).getDate()
  const allCells = [...Array(startDow).fill(null), ...Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1))]
  const initials = ((profil.prenom?.[0] || '') + (profil.nom?.[0] || '')).toUpperCase() || '?'
  const isPrevDisabled = new Date(year, month, 1) <= new Date(today.getFullYear(), today.getMonth(), 1)
  const popupSlots = popupDate ? getSlotsForDate(popupDate) : []

  const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', color: '#111827' }

  async function submit() {
    if (!form.prenom || !form.nom || !form.email || !form.telephone || !selectedSlot) return
    setSending(true)
    try {
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
        type_seance: 'Autre',
        notes: form.motif || null,
      }])
      await fetch(SUPABASE_URL + '/functions/v1/send-rdv-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_ANON },
        body: JSON.stringify({
          to_client: form.email,
          praticien_id: profil.id,
          client: { prenom: form.prenom, nom: form.nom, email: form.email, telephone: form.telephone, motif: form.motif },
          praticien: profil.prenom + ' ' + profil.nom,
          date: formatDateLong(selectedSlot.date),
          heure: selectedSlot.heure,
          praticien_tel: profil.tel || profil.telephone || '',
          praticien_email: profil.email_contact || profil.email || '',
          praticien_adresse: [profil.adresse_rdv, profil.ville_rdv, profil.code_postal].filter(Boolean).join(', ') || '',
        })
      })
    } catch(e) {
      console.error('Erreur:', e)
    }
    setSent(true)
    setSending(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, system-ui, sans-serif' }}>
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
              Vous allez recevoir un email de confirmation. {profil.prenom} vous recontactera sous 24h.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
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
                  if (!day) return <div key={'b' + i} />
                  const ymd = toYMD(day)
                  const isPast = day < today
                  const slots = isPast ? [] : getSlotsForDate(ymd)
                  const hasSlots = slots.length > 0
                  const isSelected = selectedSlot?.date === ymd
                  const isToday = ymd === toYMD(new Date())
                  return (
                    <div key={ymd} onClick={() => { if (hasSlots) setPopupDate(ymd) }}
                      style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 8, cursor: hasSlots ? 'pointer' : 'default',
                        background: isSelected ? '#0F6E56' : isToday ? '#E1F5EE' : hasSlots ? '#F0FDF4' : 'transparent',
                        border: isSelected ? '2px solid #0F6E56' : isToday ? '1.5px solid #0F6E56' : hasSlots ? '1px solid #BBF7D0' : '1px solid transparent' }}>
                      <span style={{ fontSize: 13, fontWeight: isSelected || isToday ? 700 : hasSlots ? 600 : 400, color: isSelected ? '#fff' : isPast ? '#D1D5DB' : '#111827' }}>{day.getDate()}</span>
                      {hasSlots && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#fff' : '#0F6E56', marginTop: 1 }} />}
                    </div>
                  )
                })}
              </div>
              <div style={{ padding: '8px 16px 12px', display: 'flex', gap: 14, borderTop: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: '#F0FDF4', border: '1px solid #BBF7D0' }} />
                  <span style={{ fontSize: 10, color: '#6B7280' }}>Disponible</span>
                </div>
              </div>
              {selectedSlot && (
                <div style={{ margin: '0 12px 12px', padding: '10px 14px', borderRadius: 8, background: '#E1F5EE', border: '1px solid #BBF7D0', fontSize: 12, fontWeight: 600, color: '#0F6E56', textAlign: 'center' }}>
                  ✓ {formatDateLong(selectedSlot.date)} à {selectedSlot.heure}
                  <span onClick={() => setSelectedSlot(null)} style={{ marginLeft: 8, cursor: 'pointer', opacity: 0.6, fontSize: 11 }}>✕ changer</span>
                </div>
              )}
              {!selectedSlot && <div style={{ padding: '0 12px 12px', textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>👆 Cliquez sur un jour vert</div>}
            </div>

            <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid ' + (selectedSlot ? '#0F6E56' : '#E5E7EB'), padding: '20px' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Vos informations</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>Champs * obligatoires</div>
              {selectedSlot && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: '#E1F5EE', border: '1px solid #BBF7D0', fontSize: 13, fontWeight: 600, color: '#0F6E56' }}>
                  📅 {formatDateLong(selectedSlot.date)} à {selectedSlot.heure}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div><label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Prénom *</label><input style={inp} value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Marie" /></div>
                <div><label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nom *</label><input style={inp} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Dupont" /></div>
              </div>
              <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email *</label><input style={inp} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="marie@email.com" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div><label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Téléphone *</label><input style={inp} type="tel" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="06 00 00 00 00" /></div>
                <div><label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Date de naissance</label><input style={inp} type="date" value={form.date_naissance} onChange={e => setForm({ ...form, date_naissance: e.target.value })} /></div>
              </div>
              <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Adresse</label><input style={inp} value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} placeholder="12 rue des Fleurs, Nancy" /></div>
              <div style={{ marginBottom: 16 }}><label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Motif</label><textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })} placeholder="Décrivez brièvement votre demande..." /></div>
              {!selectedSlot && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: '#FFF9E6', border: '1px solid #FDE68A', fontSize: 12, color: '#92400E', textAlign: 'center' }}>⚠️ Sélectionnez d'abord un créneau</div>}
              <button onClick={submit} disabled={sending || !form.prenom || !form.nom || !form.email || !form.telephone || !selectedSlot}
                style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  background: (selectedSlot && form.prenom && form.nom && form.email && form.telephone) ? '#0F6E56' : '#E5E7EB',
                  color: (selectedSlot && form.prenom && form.nom && form.email && form.telephone) ? '#fff' : '#9CA3AF' }}>
                {sending ? 'Envoi...' : selectedSlot ? 'Confirmer le ' + formatDateLong(selectedSlot.date) + ' à ' + selectedSlot.heure : 'Choisir un créneau'}
              </button>
              <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 10 }}>Propulsé par <span style={{ fontWeight: 600, color: '#0F6E56' }}>Naposolo</span></div>
            </div>
          </div>
        )}
      </div>

      {popupDate && (
        <div onClick={() => setPopupDate(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4, textTransform: 'capitalize' }}>{formatDateLong(popupDate)}</div>
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
            <button onClick={() => setPopupDate(null)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, color: '#6B7280', cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}
