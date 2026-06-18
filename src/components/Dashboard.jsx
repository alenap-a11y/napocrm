import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { useRealtimeDashboard } from '../hooks/useRealtimeDashboard'
import AgendaWidget from './AgendaWidget'
import { getProchainAnniversaire } from '../utils/anniversaires'

const MANTRAS = [
  { t: '"Ce que l\'esprit conçoit et croit, il l\'accomplit."', s: '— Napoleon Hill' },
  { t: '"Ils ont juste commencé."', s: '— Xavier Niel' },
  { t: '"Un coup pratiqué dix mille fois."', s: '— Bruce Lee' },
  { t: '"Le mouvement crée la clarté."', s: '— Sagesse' },
]

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']


// ─── Utilitaires ─────────────────────────────────────────────────────────────

function isSameDay(a, b) {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function formatHour(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function daysUntil(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.round((d - today) / 86400000)
}

// ─── Composant Agenda ─────────────────────────────────────────────────────────

function AgendaCalendrier({ accent, onNavigate }) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState(today)
  const [showModal, setShowModal] = useState(false)
  const [newRdv, setNewRdv] = useState({ client: '', type: 'Sophrologie', heure: '09:00', duree: 60 })
  const [rdvList, setRdvList] = useState([])

  useEffect(() => {
    async function fetchRdv() {
      const { data } = await supabase.from('seances').select('id, prenom, nom, type_seance, date_seance, heure_seance, duree_minutes').order('date_seance', { ascending: true })
      setRdvList((data || []).map(s => {
        const [h, m] = (s.heure_seance || '09:00').split(':').map(Number)
        const d = new Date(s.date_seance)
        d.setHours(h, m, 0, 0)
        return { id: s.id, client: `${s.prenom || ''} ${s.nom || ''}`.trim(), type: s.type_seance, date: d, duree: s.duree_minutes }
      }))
    }
    fetchRdv()
  }, [])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const offset = firstDay === 0 ? 6 : firstDay - 1

  const rdvDuJour = rdvList
    .filter(r => isSameDay(r.date, selectedDay))
    .sort((a, b) => a.date - b.date)

  const rdvDuMois = rdvList.filter(
    r => r.date.getMonth() === currentMonth && r.date.getFullYear() === currentYear
  )

  const hasRdv = (day) => rdvList.some(r =>
    r.date.getDate() === day &&
    r.date.getMonth() === currentMonth &&
    r.date.getFullYear() === currentYear
  )

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const addRdv = () => {
    const [h, m] = newRdv.heure.split(':').map(Number)
    const date = new Date(selectedDay)
    date.setHours(h, m, 0, 0)
    setRdvList(prev => [...prev, {
      id: Date.now(),
      client: newRdv.client,
      type: newRdv.type,
      date,
      duree: Number(newRdv.duree),
    }])
    setShowModal(false)
    setNewRdv({ client: '', type: 'Sophrologie', heure: '09:00', duree: 60 })
  }

  return (
    <div className="dash-agenda-grid">

      {/* Calendrier */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={prevMonth} style={iconBtnStyle} aria-label="Mois précédent">
            <i className="ti ti-chevron-left" style={{ fontSize: 15 }} aria-hidden="true" />
          </button>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {MONTHS_SHORT[currentMonth]} {currentYear}
          </span>
          <button onClick={nextMonth} style={iconBtnStyle} aria-label="Mois suivant">
            <i className="ti ti-chevron-right" style={{ fontSize: 15 }} aria-hidden="true" />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {DAYS_SHORT.slice(1).concat(DAYS_SHORT[0]).map(d => (
            <div key={d} style={{ fontSize: 10, color: 'var(--color-text-secondary)', textAlign: 'center', fontWeight: 500, padding: '2px 0' }}>
              {d}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const thisDate = new Date(currentYear, currentMonth, day)
            const isToday = isSameDay(thisDate, today)
            const isSelected = isSameDay(thisDate, selectedDay)
            const hasR = hasRdv(day)
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(thisDate)}
                aria-label={`${day} ${MONTHS[currentMonth]}`}
                aria-pressed={isSelected}
                style={{
                  position: 'relative', aspectRatio: '1', border: 'none', borderRadius: 6,
                  fontSize: 12, cursor: 'pointer',
                  background: isSelected ? accent : isToday ? `${accent}22` : 'transparent',
                  color: isSelected ? '#fff' : isToday ? accent : 'var(--color-text-primary)',
                  fontWeight: isToday || isSelected ? 600 : 400,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: 1,
                }}
              >
                {day}
                {hasR && !isSelected && (
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: accent, display: 'block' }} />
                )}
              </button>
            )
          })}
        </div>

        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              {rdvDuMois.length} RDV ce mois
            </span>
            <button
              onClick={() => onNavigate?.('/agenda')}
              style={{ fontSize: 11, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Voir tout →
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-coin" style={{ fontSize: 13, color: '#1D9E75' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1D9E75' }}>
              {rdvDuMois.reduce((sum, r) => sum + (r.prix || 0), 0).toFixed(0)} € ce mois
            </span>
          </div>
        </div>
      </div>

      {/* RDV du jour sélectionné */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {DAYS[selectedDay.getDay()]} {selectedDay.getDate()} {MONTHS[selectedDay.getMonth()]}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              {rdvDuJour.length} rendez-vous
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: accent, color: '#fff', border: 'none',
              borderRadius: 8, padding: '6px 12px', fontSize: 12,
              cursor: 'pointer', fontWeight: 500,
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" />
            Ajouter RDV
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
          {rdvDuJour.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
              <i className="ti ti-calendar-off" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} aria-hidden="true" />
              Aucun RDV ce jour
            </div>
          ) : rdvDuJour.map(r => (
            <div
              key={r.id}
              onClick={() => onNavigate?.('/seances')}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 8, background: 'var(--color-background-secondary)',
                borderLeft: `3px solid ${accent}`, cursor: 'pointer', transition: 'background .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-border-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
            >
              <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 44 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: accent }}>{formatHour(r.date)}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{r.duree}min</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{r.client}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{r.type}</div>
              </div>
              <i className="ti ti-chevron-right" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }} aria-hidden="true" />
            </div>
          ))}
        </div>

        {rdvDuJour.length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: 6 }}>
              DERNIERS RDV
            </div>
            {rdvList
              .filter(r => r.date < new Date() && !isSameDay(r.date, today))
              .sort((a, b) => b.date - a.date)
              .slice(0, 2)
              .map(r => (
                <div
                  key={r.id}
                  onClick={() => onNavigate?.('/clients')}
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 12, padding: '5px 6px', borderRadius: 6,
                    color: 'var(--color-text-secondary)', cursor: 'pointer',
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontWeight: 500 }}>{r.client}</span>
                  <span>{r.date.getDate()} {MONTHS_SHORT[r.date.getMonth()]}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modal ajout RDV */}
      {showModal && (
        <div
          role="dialog" aria-modal="true" aria-label="Ajouter un rendez-vous"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div style={{ background: 'var(--color-background-primary)', borderRadius: 12, padding: 24, width: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)' }}>Nouveau RDV</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-secondary)' }} aria-label="Fermer">×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Client</label>
                <input style={inputStyle} placeholder="Nom du client" value={newRdv.client} onChange={e => setNewRdv(p => ({ ...p, client: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Type de séance</label>
                <select style={inputStyle} value={newRdv.type} onChange={e => setNewRdv(p => ({ ...p, type: e.target.value }))}>
                  {['Sophrologie', 'Coaching', 'Naturopathie', 'Fleurs de Bach', 'Autre'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Heure</label>
                  <input type="time" style={inputStyle} value={newRdv.heure} onChange={e => setNewRdv(p => ({ ...p, heure: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Durée (min)</label>
                  <input type="number" style={inputStyle} value={newRdv.duree} min={15} step={15} onChange={e => setNewRdv(p => ({ ...p, duree: e.target.value }))} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--color-text-primary)' }}>Annuler</button>
              <button onClick={addRdv} disabled={!newRdv.client} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: newRdv.client ? accent : 'var(--color-background-secondary)', color: newRdv.client ? '#fff' : 'var(--color-text-secondary)', cursor: newRdv.client ? 'pointer' : 'default', fontSize: 13, fontWeight: 500 }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Composant Anniversaires ──────────────────────────────────────────────────

function Anniversaires({ accent }) {
  const [clients, setClients] = useState([])

  useEffect(() => {
    supabase
      .from('clients')
      .select('id, prenom, nom, date_naissance')
      .not('date_naissance', 'is', null)
      .then(({ data }) => setClients(data || []))
  }, [])

  const prochains = clients
    .map(c => {
      const anniv = getProchainAnniversaire(c)
      if (!anniv) return null
      return { ...c, ...anniv }
    })
    .filter(Boolean)
    .sort((a, b) => a.joursRestants - b.joursRestants)
    .slice(0, 3)

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <i className="ti ti-cake" style={{ fontSize: 16, color: accent }} aria-hidden="true" />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Prochains anniversaires</span>
      </div>
      {prochains.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center', padding: '16px 0' }}>
          Aucun anniversaire à venir
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {prochains.map(c => {
            const name = `${c.prenom || ''} ${c.nom || ''}`.trim()
            const initials = `${(c.prenom || '')[0] || ''}${(c.nom || '')[0] || ''}`.toUpperCase()
            const isToday = c.joursRestants === 0
            return (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8,
                background: isToday ? `${accent}18` : 'var(--color-background-secondary)',
                border: isToday ? `1px solid ${accent}44` : 'none',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${accent}22`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    {isToday ? "🎂 Aujourd'hui !" : `dans ${c.joursRestants} jour${c.joursRestants > 1 ? 's' : ''}`}
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                  {c.age} ans
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Styles partagés ─────────────────────────────────────────────────────────

const cardStyle = {
  background: 'var(--color-background-primary)',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 10,
  padding: 16,
}

const iconBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--color-text-secondary)', padding: 4,
  display: 'flex', alignItems: 'center',
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 500,
  color: 'var(--color-text-secondary)', marginBottom: 5,
}

const inputStyle = {
  width: '100%', padding: '8px 10px', fontSize: 13,
  border: '0.5px solid var(--color-border-secondary)',
  borderRadius: 8, background: 'var(--color-background-secondary)',
  color: 'var(--color-text-primary)', boxSizing: 'border-box',
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

export default function Dashboard({ accent, sbActif, sbItems, widgets, setWidgets, onNavigate }) {
  const { revenusCeMois } = useRealtimeDashboard()

  const { data: taches } = useRealtimeTable(
    'taches',
    () => supabase.from('taches').select('*, clients(nom, prenom)').eq('statut', 'todo').limit(5)
  )

  const [time, setTime] = useState(new Date())
  const [mantra] = useState(() => MANTRAS[Math.floor(Math.random() * MANTRAS.length)])
  const [prenom, setPrenom]               = useState('')
  const [recentSeances,   setRecentSeances]   = useState([])
  const [monthStats,      setMonthStats]      = useState({ count: 0, revenue: 0, clientsCount: 0 })
  const [derniersClients, setDerniersClients] = useState([])
  const [dernieresSeances,setDernieresSeances]= useState([])
  const [clientsActifs,   setClientsActifs]   = useState(0)
  const [seancesAVenir,   setSeancesAVenir]   = useState(0)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const p = user?.user_metadata?.prenom || user?.email
      setPrenom(p)
    }
    getUser()
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser()
      const uid = user?.id

      const monthStart = new Date()
      monthStart.setDate(1)
      const monthStartStr = monthStart.toISOString().slice(0, 10)
      const todayStr = new Date().toISOString().slice(0, 10)

      const queries = [
        supabase.from('seances').select('*').order('created_at',    { ascending: false }).limit(5),
        supabase.from('seances').select('prix_euros').gte('date_seance', monthStartStr),
        supabase.from('clients').select('*').order('date_creation', { ascending: false }).limit(5),
        supabase.from('seances').select('*').order('date_seance',   { ascending: false }).limit(5),
        supabase.from('clients').select('id').gte('date_creation',  monthStartStr),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('statut', 'actif'),
        supabase.from('seances').select('*', { count: 'exact', head: true }).gte('date_seance', todayStr),
      ]

      const [
        { data: recent },
        { data: monthly },
        { data: clients },
        { data: seances },
        { data: newClients },
        { count: actifs },
        { count: avenir },
      ] = await Promise.all(queries)

      setRecentSeances(recent || [])
      setDerniersClients(clients || [])
      setDernieresSeances(seances || [])
      const m  = monthly    || []
      const cc = newClients || []
      setMonthStats({
        count:        m.length,
        revenue:      m.reduce((s, x) => s + (parseFloat(x.prix_euros) || 0), 0),
        clientsCount: cc.length,
      })
      setClientsActifs(actifs ?? 0)
      setSeancesAVenir(avenir ?? 0)
    }
    loadStats()
  }, [])

  const activeSbItem = sbItems.find(i => i.id === sbActif)
  const timeStr = [time.getHours(), time.getMinutes(), time.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':')
  const dateStr = `${DAYS[time.getDay()]} ${time.getDate()} ${MONTHS[time.getMonth()]} ${time.getFullYear()}`
  const showClockBot = widgets.fete || widgets.ferie

  return (
    <div className="dash" style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div className="dash-head" style={{ marginBottom: 24 }}>
        <i className={`ti ${activeSbItem?.icon || 'ti-layout-dashboard'}`} style={{ color: accent, fontSize: 22 }} aria-hidden="true" />
        <div>
          <div className="dash-title" style={{ fontSize: 20, fontWeight: 500 }}>{activeSbItem?.label || 'Dashboard'}</div>
          <div className="dash-sub" style={{ fontSize: 13 }}>Bonjour {prenom} — {dateStr}</div>
        </div>
      </div>

      {/* Ligne 1 : Horloge + Mantra + Métriques */}
      <div className="dash-row-top">

        {widgets.clock && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>{timeStr}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{dateStr}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
                {widgets.meteo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-background-secondary)', padding: '3px 8px', borderRadius: 20 }}>
                    <i className="ti ti-cloud-sun" style={{ color: '#378ADD' }} aria-hidden="true" /><span>18°C, nuageux</span>
                  </div>
                )}
                {widgets.lune && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-background-secondary)', padding: '3px 8px', borderRadius: 20 }}>
                    <i className="ti ti-moon" style={{ color: '#7F77DD' }} aria-hidden="true" /><span>Croissant gibbeuse</span>
                  </div>
                )}
              </div>
            </div>
            {showClockBot && <div style={{ height: '0.5px', background: 'var(--color-border-tertiary)', margin: '12px 0' }} />}
            {showClockBot && (
              <div style={{ display: 'flex', gap: 16 }}>
                {widgets.fete && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-star" style={{ color: accent, fontSize: 14 }} aria-hidden="true" />
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Fête du jour</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>Sainte Émilie</div>
                    </div>
                  </div>
                )}
                {widgets.ferie && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-calendar-event" style={{ color: '#D4537E', fontSize: 14 }} aria-hidden="true" />
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Prochain férié</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>Pentecôte — 1 juin</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {widgets.mantra && (
          <div style={{ ...cardStyle, borderLeft: `3px solid ${accent}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--color-text-primary)', lineHeight: 1.5, marginBottom: 8 }}>{mantra.t}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{mantra.s}</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Clients actifs', val: clientsActifs, icon: 'ti-users', color: accent },
            { label: 'Séances à venir', val: seancesAVenir, icon: 'ti-calendar-event', color: '#1D9E75' },
          ].map(m => (
            <div key={m.label} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`ti ${m.icon}`} style={{ fontSize: 16, color: m.color }} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{m.val}</div>
              </div>
            </div>
          ))}

          <div style={{ ...cardStyle, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#D4537E18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-checkbox" style={{ fontSize: 16, color: '#D4537E' }} aria-hidden="true" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Tâches</span>
            </div>
            {taches.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center', padding: '8px 0' }}>
                Aucune tâche en cours
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {taches.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <input type="checkbox" style={{ marginTop: 2, accentColor: '#D4537E', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {t.clients?.prenom} {t.clients?.nom}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{t.contenu}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Ligne 2 : Agenda */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          AGENDA
        </div>
        <AgendaCalendrier accent={accent} onNavigate={onNavigate} />
      </div>

      {/* Rendez-vous à venir (7 jours) */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          RENDEZ-VOUS À VENIR
        </div>
        <AgendaWidget accent={accent} onNavigate={onNavigate} />
      </div>

      {/* Vue d'ensemble */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>VUE D'ENSEMBLE</div>

        {/* Compteurs */}
        <div className="dash-overview-grid">
          <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-users" style={{ fontSize: 18, color: accent }} aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Clients ce mois</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{monthStats.clientsCount}</div>
            </div>
          </div>
          <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-coin" style={{ fontSize: 18, color: '#1D9E75' }} aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Revenus ce mois</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{revenusCeMois.toFixed(0)} €</div>
            </div>
          </div>
        </div>

        {/* Listes côte à côte */}
        <div className="dash-lists-grid">

          {/* 5 derniers clients */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Derniers clients</span>
              <button onClick={() => onNavigate?.('/clients')} style={{ fontSize: 11, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Voir tout →</button>
            </div>
            {derniersClients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--color-text-secondary)', fontSize: 12 }}>Aucun client</div>
            ) : derniersClients.map(c => (
              <div key={c.id}
                onClick={() => onNavigate?.('/clients')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 6px', borderRadius: 8, cursor: 'pointer', transition: 'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${accent}18`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                  {(c.prenom?.[0] || '?')}{(c.nom?.[0] || '')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.prenom} {c.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{c.specialite || c.ville || '—'}</div>
                </div>
                {c.statut && (
                  <span style={{ fontSize: 10, fontWeight: 500, background: c.statut === 'actif' ? '#E1F5EE' : '#F5F5F5', color: c.statut === 'actif' ? '#0F6E56' : '#6B7280', padding: '1px 7px', borderRadius: 20, flexShrink: 0 }}>
                    {c.statut}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 5 dernières séances */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Dernières séances</span>
              <button onClick={() => onNavigate?.('/seances')} style={{ fontSize: 11, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Voir tout →</button>
            </div>
            {dernieresSeances.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--color-text-secondary)', fontSize: 12 }}>Aucune séance</div>
            ) : dernieresSeances.map(s => {
              const MOIS_V = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
              const [, vm, vj] = (s.date_seance || '').split('-')
              const dateLabel = s.date_seance ? `${vj} ${MOIS_V[parseInt(vm)-1]}` : '—'
              return (
                <div key={s.id}
                  onClick={() => onNavigate?.('/seances')}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 6px', borderRadius: 8, cursor: 'pointer', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accent}18`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                    {(s.prenom?.[0] || '?')}{(s.nom?.[0] || '')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.prenom} {s.nom}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{s.type_seance}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{dateLabel}</div>
                    {s.prix_euros != null && <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.prix_euros} €</div>}
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>

      {/* Activité récente */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>ACTIVITÉ RÉCENTE</div>
        <div style={cardStyle}>
          {/* Compteurs du mois */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--color-background-secondary)' }}>
              <i className="ti ti-calendar-stats" style={{ fontSize: 20, color: accent }} aria-hidden="true" />
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Séances ce mois</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{monthStats.count}</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--color-background-secondary)' }}>
              <i className="ti ti-coin" style={{ fontSize: 20, color: '#1D9E75' }} aria-hidden="true" />
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Encaissés ce mois</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{revenusCeMois.toFixed(0)} €</div>
              </div>
            </div>
          </div>
          {/* Liste */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Dernières séances</span>
            <button onClick={() => onNavigate?.('/seances')} style={{ fontSize: 11, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Voir tout →</button>
          </div>
          {recentSeances.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>Aucune séance enregistrée</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentSeances.map(s => {
                const MOIS_D = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
                const [, dm, dj] = (s.date_seance || '').split('-')
                const dateLabel = s.date_seance ? `${dj} ${MOIS_D[parseInt(dm)-1]}` : '—'
                return (
                  <div
                    key={s.id}
                    onClick={() => onNavigate?.('/seances')}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 8, cursor: 'pointer', transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}18`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                      {(s.prenom?.[0] || '?')}{(s.nom?.[0] || '')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.prenom} {s.nom}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{s.type_seance}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{dateLabel}</div>
                      {s.prix_euros != null && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.prix_euros} €</div>}
                    </div>
                    <i className="ti ti-chevron-right" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }} aria-hidden="true" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ligne 3 : Clients récents + Anniversaires */}
      <div className="dash-row-bottom">

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Clients récents</span>
            <button onClick={() => onNavigate?.('/clients')} style={{ fontSize: 11, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Voir tout →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {derniersClients.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 12 }}>
                <i className="ti ti-users" style={{ fontSize: 22, display: 'block', marginBottom: 6 }} />Aucun client récent
              </div>
            ) : derniersClients.map(c => {
              const initials = `${(c.prenom||'')[0]||''}${(c.nom||'')[0]||''}`.toUpperCase()
              const name = `${c.prenom||''} ${c.nom||''}`.trim()
              const meta = `${c.specialite || '—'} · ${c.nb_seances || 0} séance(s)`
              return (
                <div
                  key={c.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.12s' }}
                  onClick={() => onNavigate?.('/clients')}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  role="button" tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && onNavigate?.('/clients')}
                  aria-label={`Voir la fiche de ${name}`}
                >
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${accent}22`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{meta}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#1D9E75', background: '#E1F5EE', padding: '2px 8px', borderRadius: 20 }}>
                    {c.statut === 'actif' ? 'Actif' : c.statut === 'inactif' ? 'Inactif' : 'Archivé'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <Anniversaires accent={accent} />

      </div>
    </div>
  )
}
