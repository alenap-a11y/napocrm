import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { useRealtimeDashboard } from '../hooks/useRealtimeDashboard'
import { FETES } from '../data/fetes'
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

// Couleurs des modules — source unique, réutilisée par le camembert et les barres empilées
const MODULES = [
  { key: 'energie', name: 'Énergétique', color: '#639922' },
  { key: 'oracle',  name: 'Oracle',      color: '#993556' },
  { key: 'bach',    name: 'Bach',        color: '#EF9F27' },
  { key: 'autres',  name: 'Autres',      color: '#888780' },
]


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
  const [rdvList, setRdvList] = useState([])
  const [notesList, setNotesList] = useState([])

  useEffect(() => {
    async function fetchRdv() {
      const { data } = await supabase.from('seances').select('id, client_id, prenom, nom, type_seance, date_seance, heure_seance, duree_minutes, prix_euros').order('date_seance', { ascending: true })
      setRdvList((data || []).map(s => {
        const [h, m] = (s.heure_seance || '09:00').split(':').map(Number)
        const d = new Date(s.date_seance)
        d.setHours(h, m, 0, 0)
        return { id: s.id, clientId: s.client_id, client: `${s.prenom || ''} ${s.nom || ''}`.trim(), type: s.type_seance, date: d, duree: s.duree_minutes, prix: s.prix_euros }
      }))
    }
    fetchRdv()
    async function fetchNotes() {
      const { data } = await supabase.from('notes').select('id, contenu, created_at, seance_id').order('created_at', { ascending: true })
      setNotesList(data || [])
    }
    fetchNotes()
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

  const notesDuJour = notesList.filter(n => {
    const d = new Date(n.created_at)
    return isSameDay(d, selectedDay)
  })

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

  return (
    <>

      {/* Calendrier */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
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
                  position: 'relative', aspectRatio: '1.6', minHeight: 26, border: 'none', borderRadius: 6,
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

        <div style={{ marginTop: 8, paddingTop: 7, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {DAYS[selectedDay.getDay()]} {selectedDay.getDate()} {MONTHS[selectedDay.getMonth()]}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              {rdvDuJour.length} rendez-vous
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 260, overflowY: 'auto' }}>
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
                display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px',
                borderRadius: 6, background: 'var(--color-background-secondary)',
                borderLeft: `2px solid ${accent}`, cursor: 'pointer', transition: 'background .1s',
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

        {notesDuJour.length > 0 && (
          <div style={{ marginTop: 7, paddingTop: 7, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: 6 }}>NOTES</div>
            {notesDuJour.map(n => (
              <div
                key={n.id}
                onClick={() => onNavigate?.('/notes')}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8, background: '#FAEEDA', borderLeft: '3px solid #854F0B', cursor: 'pointer', marginBottom: 6 }}
              >
                <i className="ti ti-notebook" style={{ fontSize: 14, color: '#854F0B', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 12, color: '#854F0B', lineHeight: 1.4 }}>{n.contenu.slice(0, 80)}{n.contenu.length > 80 ? '…' : ''}</div>
              </div>
            ))}
          </div>
        )}

        {rdvDuJour.length > 0 && (
          <div style={{ marginTop: 7, paddingTop: 7, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
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
                  onClick={() => onNavigate?.('/clients', { state: { searchClient: r.client } })}
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 12, padding: '3px 6px', borderRadius: 6,
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
    </>
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
  padding: 9,
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

// ─── Tooltip de graphique (survol) ────────────────────────────────────────────
function ChartTooltip({ style, children }) {
  return (
    <div
      style={{
        position: 'absolute',
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 6,
        padding: '6px 10px',
        fontSize: 12,
        color: 'var(--color-text-primary)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 10,
        lineHeight: 1.4,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Chiffre avec fondu au changement de valeur ───────────────────────────────
function FadeValue({ value, style }) {
  const [display, setDisplay] = useState(value)
  const [visible, setVisible] = useState(true)
  const prevValue = useRef(value)

  useEffect(() => {
    if (prevValue.current === value) return
    prevValue.current = value
    setVisible(false)
    const timer = setTimeout(() => {
      setDisplay(value)
      setVisible(true)
    }, 150)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <span style={{ display: 'inline-block', transition: 'opacity 150ms ease', opacity: visible ? 1 : 0, ...style }}>
      {display}
    </span>
  )
}


// ─── Widget Anniversaires compact ────────────────────────────────────────────
function AnniversairesWidget({ accent, clients, onNavigate }) {
  const prochains = clients
    .map(c => { const a = getProchainAnniversaire(c); return a ? { ...c, ...a } : null })
    .filter(Boolean)
    .sort((a, b) => a.joursRestants - b.joursRestants)
    .slice(0, 3)
  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <i className="ti ti-cake" style={{ fontSize: 14, color: accent }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>Anniversaires</span>
      </div>
      {prochains.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'center', padding: '8px 0' }}>Aucun à venir</div>
      ) : prochains.map(c => {
        const name = `${c.prenom || ''} ${c.nom || ''}`.trim()
        const isToday = c.joursRestants === 0
        return (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${accent}22`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
              {(c.prenom||'')[0]}{(c.nom||'')[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-primary)' }}>{name}</div>
              <div style={{ fontSize: 10, color: isToday ? accent : 'var(--color-text-secondary)' }}>
                {isToday ? "🎂 Aujourd'hui !" : `dans ${c.joursRestants}j · ${c.age} ans`}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

export default function Dashboard({ accent, sbActif, sbItems, widgets, setWidgets, onNavigate }) {
  const { revenusCeMois } = useRealtimeDashboard()

  const { data: taches } = useRealtimeTable(
    'taches',
    () => supabase.from('taches').select('*, clients(nom, prenom)').eq('statut', 'todo').limit(5)
  )

  const [time, setTime] = useState(new Date())
  const [meteoData, setMeteoData] = useState(null)
  const [lunePct,   setLunePct]   = useState(0)
  const [luneNom,   setLuneNom]   = useState('')
  const [mantra] = useState(() => MANTRAS[Math.floor(Math.random() * MANTRAS.length)])
  const [prenom, setPrenom]               = useState('')
  const [recentSeances,   setRecentSeances]   = useState([])
  const [monthStats,      setMonthStats]      = useState({ count: 0, revenue: 0, clientsCount: 0 })
  const [derniersClients, setDerniersClients] = useState([])
  const [dernieresSeances,setDernieresSeances]= useState([])
  const [clientsActifs,   setClientsActifs]   = useState(0)
  const [totalClients,    setTotalClients]    = useState(0)
  const [totalSeances,    setTotalSeances]    = useState(0)
  const [monthlyBars,     setMonthlyBars]      = useState([])
  const [moduleBreakdown, setModuleBreakdown]  = useState({ energie: 0, oracle: 0, bach: 0, autres: 0 })
  const [clientsARelancer, setClientsARelancer] = useState([])
  const [totalSeancesTousModules, setTotalSeancesTousModules] = useState(0)
  const [seancesPeriode, setSeancesPeriode] = useState(0)
  const [seancesAVenir,   setSeancesAVenir]   = useState(0)
  const [notesCount,      setNotesCount]      = useState(0)
  const [rdvList, setRdvList] = useState([])
  const [filtrePeriode,   setFiltrePeriode]   = useState('mois')
  const [caFiltre,        setCaFiltre]         = useState(0)
  const [nouveauxClients, setNouveauxClients]  = useState(0)
  const [filtreDate,      setFiltreDate]       = useState(new Date().toISOString().slice(0,10))
  const [filtreMoisNum,   setFiltreMoisNum]    = useState(new Date().getMonth() + 1)
  const [filtreAnnee,     setFiltreAnnee]      = useState(new Date().getFullYear())
  const [caHistory,       setCaHistory]        = useState([])
  const [anniversaireClients, setAnniversaireClients] = useState([])
  const [caHover,      setCaHover]      = useState(null)
  const [barHoverIdx,  setBarHoverIdx]  = useState(null)
  const [pieHoverIdx,  setPieHoverIdx]  = useState(null)
  const caChartRef = useRef(null)
  const pieWrapRef = useRef(null)

  useEffect(() => {
    function fetchMeteoCoords(lat, lon) {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&timezone=auto`)
        .then(r => r.json())
        .then(d => setMeteoData(d.current))
        .catch(() => {})
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchMeteoCoords(pos.coords.latitude, pos.coords.longitude),
        ()  => fetchMeteoCoords(48.69, 6.18) // fallback Nancy
      )
    } else {
      fetchMeteoCoords(48.69, 6.18)
    }
    const id = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => fetchMeteoCoords(pos.coords.latitude, pos.coords.longitude),
          ()  => fetchMeteoCoords(48.69, 6.18)
        )
      }
    }, 600000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function calcLune() {
      const now = new Date()
      const ref = new Date('2000-01-06T18:14:00Z')
      const cycle = 29.53058867
      const diff = (now - ref) / (1000 * 60 * 60 * 24)
      const phase = ((diff % cycle) + cycle) % cycle
      const pct = Math.round((phase / cycle) * 100)
      setLunePct(pct)
      const phases = [
        [0,2,'🌑 Nouvelle lune'], [2,6,'🌒 Premier croissant'], [6,9,'🌓 Premier quartier'],
        [9,13,'🌔 Gibbeuse croissante'], [13,16,'🌕 Pleine lune'], [16,20,'🌖 Gibbeuse décroissante'],
        [20,24,'🌗 Dernier quartier'], [24,28,'🌘 Dernier croissant'], [28,30,'🌑 Nouvelle lune']
      ]
      const p = phases.find(([a,b]) => phase >= a && phase < b)
      setLuneNom(p ? p[2] : '🌙 Lune')
    }
    calcLune()
  }, [time])

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
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('seances').select('*', { count: 'exact', head: true }),
      ]

      const [
        { data: recent },
        { data: monthly },
        { data: clients },
        { data: seances },
        { data: newClients },
        { count: actifs },
        { count: avenir },
        { count: notes },
        { count: totClients },
        { count: totSeances },
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
      setNotesCount(notes ?? 0)
      setTotalClients(totClients ?? 0)
      setTotalSeances(totSeances ?? 0)
    }
    loadStats()
  }, [])
  useEffect(() => {
    async function loadStatsAvancees() {
      const now = new Date()
      const [
        { count: nbEnergie },
        { count: nbOracle },
        { count: nbBach },
        { count: nbSeancesTotal },
        { data: clientsList },
        { data: seancesDates },
        { data: energieDates },
        { data: oracleDates },
        { data: bachDates },
      ] = await Promise.all([
        supabase.from('energie_seances').select('*', { count: 'exact', head: true }),
        supabase.from('napo_oracle_seances').select('*', { count: 'exact', head: true }),
        supabase.from('fiches_bach').select('*', { count: 'exact', head: true }),
        supabase.from('seances').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('id, prenom, nom'),
        supabase.from('seances').select('client_id, date_seance'),
        supabase.from('energie_seances').select('client_id, date_seance'),
        supabase.from('napo_oracle_seances').select('client_id, date_seance'),
        supabase.from('fiches_bach').select('client_id, created_at'),
      ])

      const energie = nbEnergie || 0
      const oracle = nbOracle || 0
      const bach = nbBach || 0
      const total = nbSeancesTotal || 0
      const autres = nbSeancesTotal || 0
      setModuleBreakdown({ energie, oracle, bach, autres })
      setTotalSeancesTousModules(energie + oracle + bach + autres)

      const dernierParClient = {}
      const majDate = (clientId, dateStr) => {
        if (!clientId || !dateStr) return
        if (!dernierParClient[clientId] || dateStr > dernierParClient[clientId]) {
          dernierParClient[clientId] = dateStr
        }
      }
      ;(seancesDates || []).forEach(s => majDate(s.client_id, s.date_seance))
      ;(energieDates || []).forEach(s => majDate(s.client_id, s.date_seance))
      ;(oracleDates || []).forEach(s => majDate(s.client_id, s.date_seance))
      ;(bachDates || []).forEach(s => majDate(s.client_id, s.created_at ? s.created_at.slice(0,10) : null))

      const seuil = new Date()
      seuil.setDate(seuil.getDate() - 45)
      const seuilStr = seuil.toISOString().slice(0, 10)
      const relance = (clientsList || [])
        .map(c => ({ ...c, derniere: dernierParClient[c.id] || null }))
        .filter(c => c.derniere && c.derniere < seuilStr)
        .sort((a, b) => a.derniere.localeCompare(b.derniere))
        .slice(0, 6)
        .map(c => {
          const jours = Math.floor((now - new Date(c.derniere)) / (1000 * 60 * 60 * 24))
          return { nom: `${c.prenom || ''} ${c.nom || ''}`.trim(), jours }
        })
      setClientsARelancer(relance)
    }
    loadStatsAvancees()
  }, [])

  useEffect(() => {
    async function loadPeriode() {
      let debutStr, finStr
      const now = new Date()
      if (filtrePeriode === 'jour') {
        debutStr = filtreDate
        finStr   = filtreDate
      } else if (filtrePeriode === 'semaine') {
        const day = now.getDay() || 7
        const debut = new Date(now); debut.setDate(now.getDate() - day + 1)
        const fin   = new Date(debut); fin.setDate(debut.getDate() + 6)
        debutStr = debut.toISOString().slice(0,10)
        finStr   = fin.toISOString().slice(0,10)
      } else if (filtrePeriode === 'mois') {
        const m = String(filtreMoisNum).padStart(2,'0')
        debutStr = `${filtreAnnee}-${m}-01`
        const lastDay = new Date(filtreAnnee, filtreMoisNum, 0).getDate()
        finStr = `${filtreAnnee}-${m}-${String(lastDay).padStart(2,'0')}`
      } else {
        debutStr = `${filtreAnnee}-01-01`
        finStr   = `${filtreAnnee}-12-31`
      }
      const [{ data: seancesP }, { data: clientsP }, { count: energieP }, { count: oracleP }, { count: bachP }] = await Promise.all([
        supabase.from('seances').select('prix_euros').gte('date_seance', debutStr).lte('date_seance', finStr),
        supabase.from('clients').select('id').gte('date_creation', debutStr).lte('date_creation', finStr),
        supabase.from('energie_seances').select('*', { count: 'exact', head: true }).gte('date_seance', debutStr).lte('date_seance', finStr),
        supabase.from('napo_oracle_seances').select('*', { count: 'exact', head: true }).gte('date_seance', debutStr).lte('date_seance', finStr),
        supabase.from('fiches_bach').select('*', { count: 'exact', head: true }).gte('created_at', debutStr).lte('created_at', finStr + 'T23:59:59'),
      ])
      setCaFiltre((seancesP || []).reduce((s, x) => s + (parseFloat(x.prix_euros) || 0), 0))
      setNouveauxClients((clientsP || []).length)
      setSeancesPeriode((seancesP || []).length + (energieP || 0) + (oracleP || 0) + (bachP || 0))
    }
    loadPeriode()
  }, [filtrePeriode, filtreDate, filtreMoisNum, filtreAnnee])

  // Barres "Séances par module" — regroupées jour/mois/année selon filtrePeriode
  useEffect(() => {
    async function loadBarsData() {
      const now = new Date()
      const moisLabels = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
      let granularity, buckets

      if (filtrePeriode === 'année') {
        granularity = 'year'
        const startYear = now.getFullYear() - 4
        buckets = Array.from({ length: 5 }, (_, i) => {
          const y = startYear + i
          return { key: String(y), label: String(y), fullLabel: String(y) }
        })
      } else if (filtrePeriode === 'mois') {
        granularity = 'month'
        buckets = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
          return {
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: moisLabels[d.getMonth()],
            fullLabel: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
          }
        })
      } else {
        // 'jour' et 'semaine' → 7 derniers jours
        granularity = 'day'
        buckets = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(now)
          d.setDate(now.getDate() - (6 - i))
          return {
            key: d.toISOString().slice(0, 10),
            label: `${DAYS_SHORT[d.getDay()]} ${d.getDate()}`,
            fullLabel: `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`,
          }
        })
      }

      let debutStr
      if (granularity === 'year') debutStr = `${buckets[0].key}-01-01`
      else if (granularity === 'month') debutStr = `${buckets[0].key}-01`
      else debutStr = buckets[0].key

      const [{ data: seancesD }, { data: energieD }, { data: oracleD }, { data: bachD }] = await Promise.all([
        supabase.from('seances').select('date_seance').gte('date_seance', debutStr),
        supabase.from('energie_seances').select('date_seance').gte('date_seance', debutStr),
        supabase.from('napo_oracle_seances').select('date_seance').gte('date_seance', debutStr),
        supabase.from('fiches_bach').select('created_at').gte('created_at', debutStr),
      ])

      const keyOf = dateStr => {
        if (!dateStr) return null
        if (granularity === 'year') return dateStr.slice(0, 4)
        if (granularity === 'month') return dateStr.slice(0, 7)
        return dateStr.slice(0, 10)
      }
      const counts = {}
      const bump = (dateStr, field) => {
        const k = keyOf(dateStr)
        if (!k) return
        if (!counts[k]) counts[k] = { energie: 0, oracle: 0, bach: 0, autres: 0 }
        counts[k][field]++
      }
      ;(seancesD || []).forEach(s => bump(s.date_seance, 'autres'))
      ;(energieD || []).forEach(s => bump(s.date_seance, 'energie'))
      ;(oracleD || []).forEach(s => bump(s.date_seance, 'oracle'))
      ;(bachD || []).forEach(s => bump(s.created_at ? s.created_at.slice(0, 10) : null, 'bach'))

      setMonthlyBars(buckets.map(b => {
        const c = counts[b.key] || { energie: 0, oracle: 0, bach: 0, autres: 0 }
        return { ...b, ...c, total: c.energie + c.oracle + c.bach + c.autres }
      }))
    }
    loadBarsData()
  }, [filtrePeriode])

  useEffect(() => {
    async function fetchRdv() {
      const { data } = await supabase
        .from('seances')
        .select('id, client_id, prenom, nom, type_seance, date_seance, heure_seance, duree_minutes, prix_euros')
        .order('date_seance', { ascending: false })
      setRdvList(data || [])
    }
    fetchRdv()
  }, [])

  // Historique CA sur 8 mois (pour la courbe)
  useEffect(() => {
    async function loadCaHistory() {
      const now = new Date()
      const debut8mois = new Date(now.getFullYear(), now.getMonth() - 7, 1).toISOString().slice(0, 10)
      const { data } = await supabase
        .from('seances')
        .select('date_seance, prix_euros')
        .gte('date_seance', debut8mois)

      const parMois = {}
      ;(data || []).forEach(s => {
        if (!s.date_seance) return
        const mois = s.date_seance.slice(0, 7)
        parMois[mois] = (parMois[mois] || 0) + (parseFloat(s.prix_euros) || 0)
      })

      const moisLabels = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
      const cles = Array.from({ length: 8 }).map((_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 7 + i, 1)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      })
      setCaHistory(cles.map(cle => ({
        label: moisLabels[parseInt(cle.slice(5, 7)) - 1],
        fullLabel: `${MONTHS[parseInt(cle.slice(5, 7)) - 1]} ${cle.slice(0, 4)}`,
        total: parMois[cle] || 0,
      })))
    }
    loadCaHistory()
  }, [])

  // Anniversaires (partagé entre le widget "Prochains anniversaires" et le bloc "À traiter")
  useEffect(() => {
    async function loadAnniversaireClients() {
      const { data } = await supabase
        .from('clients')
        .select('id, prenom, nom, date_naissance')
        .not('date_naissance', 'is', null)
      setAnniversaireClients(data || [])
    }
    loadAnniversaireClients()
  }, [])

  function weatherLabel(code) {
    if (code === 0) return { icon: '☀️', label: 'Ensoleillé' }
    if (code <= 2)  return { icon: '🌤️', label: 'Peu nuageux' }
    if (code <= 3)  return { icon: '☁️', label: 'Nuageux' }
    if (code <= 48) return { icon: '🌫️', label: 'Brouillard' }
    if (code <= 67) return { icon: '🌧️', label: 'Pluie' }
    if (code <= 77) return { icon: '❄️', label: 'Neige' }
    if (code <= 82) return { icon: '🌦️', label: 'Averses' }
    return { icon: '⛈️', label: 'Orage' }
  }

  const activeSbItem = sbItems.find(i => i.id === sbActif)
  const timeStr = [time.getHours(), time.getMinutes(), time.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':')
  const dateStr = `${DAYS[time.getDay()]} ${time.getDate()} ${MONTHS[time.getMonth()]} ${time.getFullYear()}`
  const showClockBot = widgets.fete || widgets.ferie

  const todayStr = new Date().toISOString().slice(0, 10)
  const finSemaine = new Date()
  finSemaine.setDate(finSemaine.getDate() + 6)
  const finSemaineStr = finSemaine.toISOString().slice(0, 10)

  const rdvAujourdhui = rdvList.filter(r => r.date_seance === todayStr).length
  const seancesSemaineAVenir = rdvList.filter(r => r.date_seance >= todayStr && r.date_seance <= finSemaineStr).length

  const anniversairesAujourdhui = anniversaireClients
    .map(c => { const a = getProchainAnniversaire(c); return a ? { ...c, ...a } : null })
    .filter(c => c && c.joursRestants === 0)

  return (
    <div className="dash" style={{ width: '100%' }}>

      {/* Header */}
      <div className="dash-head" style={{ marginBottom: 14 }}>
        <i className={`ti ${activeSbItem?.icon || 'ti-layout-dashboard'}`} style={{ color: accent, fontSize: 22 }} aria-hidden="true" />
        <div>
          <div className="dash-title" style={{ fontSize: 20, fontWeight: 500 }}>{activeSbItem?.label || 'Dashboard'}</div>
          <div className="dash-sub" style={{ fontSize: 13 }}>Bonjour {prenom} — {dateStr}</div>
        </div>
      </div>

      {/* Bandeau de métriques */}
      <div className="dash-metrics-row" style={{ marginBottom: 9 }}>
        {[
          { label: "RDV aujourd'hui", val: rdvAujourdhui, icon: 'ti-calendar-event', color: '#639922' },
          { label: 'Clients ce mois', val: monthStats.clientsCount, icon: 'ti-users', color: '#1D9E75' },
          { label: 'Séances ce mois', val: monthStats.count, icon: 'ti-notes', color: '#7F77DD' },
          { label: "Chiffre d'affaires", val: `${monthStats.revenue.toFixed(0)} €`, icon: 'ti-coin', color: '#EF9F27', sub: 'ce mois-ci' },
          { label: 'Nouveaux clients', val: nouveauxClients, icon: 'ti-user-plus', color: '#993556', sub: `période : ${filtrePeriode}` },
        ].map(m => (
          <div key={m.label} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 9px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${m.icon}`} style={{ fontSize: 17, color: m.color }} aria-hidden="true" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{m.label}</div>
              <div style={{ fontSize: 21, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{m.val}</div>
              {m.sub && <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 1 }}>{m.sub}</div>}
            </div>
          </div>
        ))}
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
                    <i className="ti ti-cloud-sun" style={{ color: '#378ADD' }} aria-hidden="true" /><span>{meteoData ? `${Math.round(meteoData.temperature_2m)}°C · ${weatherLabel(meteoData.weathercode).icon} ${weatherLabel(meteoData.weathercode).label}` : 'Chargement…'}</span>
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
                      <div style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>{(() => { const k = String(time.getMonth()+1).padStart(2,'0') + '-' + String(time.getDate()).padStart(2,'0'); return FETES[k] || '—' })()}</div>
                    </div>
                  </div>
                )}
                {widgets.ferie && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-calendar-event" style={{ color: '#D4537E', fontSize: 14 }} aria-hidden="true" />
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Prochain férié</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>{(() => {
                        const y = time.getFullYear()
                        const easter = (y) => {
                          const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1
                          return new Date(y,month-1,day)
                        }
                        const e = easter(y)
                        const add = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r }
                        const feris = [
                          [new Date(y,0,1),"Jour de l'An"],
                          [add(e,1),"Lundi de Pâques"],
                          [new Date(y,4,1),"Fête du Travail"],
                          [new Date(y,4,8),"Victoire 1945"],
                          [add(e,39),"Ascension"],
                          [add(e,50),"Lundi de Pentecôte"],
                          [new Date(y,6,14),"Fête Nationale"],
                          [new Date(y,7,15),"Assomption"],
                          [new Date(y,10,1),"Toussaint"],
                          [new Date(y,10,11),"Armistice"],
                          [new Date(y,11,25),"Noël"],
                        ]
                        const today = new Date(new Date().toDateString())
                        const next = feris.filter(([d])=>d>=today).sort((a,b)=>a[0]-b[0])[0]
                        if(!next) return "—"
                        const [nd,nl] = next
                        return nl+" — "+nd.toLocaleDateString("fr-FR",{day:"numeric",month:"long"})
                      })()}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {widgets.mantra && (
          <div style={{ ...cardStyle, borderLeft: `3px solid ${accent}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--color-text-primary)', lineHeight: 1.4, marginBottom: 6 }}>{mantra.t}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{mantra.s}</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Séances à venir', val: seancesAVenir, icon: 'ti-calendar-event', color: '#1D9E75' },
            { label: 'Notes', val: notesCount, icon: 'ti-notes', color: '#7F77DD' },
          ].map(m => (
            <div key={m.label} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10, padding: '6px 9px', width: '50%' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`ti ${m.icon}`} style={{ fontSize: 16, color: m.color }} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{m.val}</div>
              </div>
            </div>
          ))}

        </div>

      </div>

      {/* Ligne 2 : Agenda + Calendrier + À traiter */}
      <div className="dash-line2-grid" style={{ marginBottom: 9 }}>

        <AgendaCalendrier accent={accent} onNavigate={onNavigate} />

        {/* À traiter */}
        <div style={cardStyle}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 500, color: '#173404', marginBottom: 10 }}>À traiter</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

            {/* Clients à relancer */}
            <div
              onClick={() => onNavigate?.('/clients')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 6px', borderRadius: 8, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <i className="ti ti-clock-exclamation" style={{ fontSize: 16, color: '#993556', flexShrink: 0 }} aria-hidden="true" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>Clients à relancer</div>
                {clientsARelancer.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    {clientsARelancer.slice(0, 2).map(c => c.nom).join(', ')}{clientsARelancer.length > 2 ? '…' : ''}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: clientsARelancer.length ? '#993556' : 'var(--color-text-secondary)', background: clientsARelancer.length ? '#FAEAEF' : 'var(--color-background-secondary)', padding: '2px 9px', borderRadius: 20, flexShrink: 0 }}>
                {clientsARelancer.length}
              </span>
            </div>

            {/* Anniversaires du jour */}
            <div
              onClick={() => onNavigate?.('/clients')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 6px', borderRadius: 8, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <i className="ti ti-cake" style={{ fontSize: 16, color: '#EF9F27', flexShrink: 0 }} aria-hidden="true" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>Anniversaire aujourd'hui</div>
                {anniversairesAujourdhui.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    {anniversairesAujourdhui.map(c => `${c.prenom || ''} ${c.nom || ''}`.trim()).join(', ')}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: anniversairesAujourdhui.length ? '#EF9F27' : 'var(--color-text-secondary)', background: anniversairesAujourdhui.length ? '#FDF2E3' : 'var(--color-background-secondary)', padding: '2px 9px', borderRadius: 20, flexShrink: 0 }}>
                {anniversairesAujourdhui.length}
              </span>
            </div>

            {/* Séances à venir cette semaine */}
            <div
              onClick={() => onNavigate?.('/agenda')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 6px', borderRadius: 8, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <i className="ti ti-calendar-week" style={{ fontSize: 16, color: '#639922', flexShrink: 0 }} aria-hidden="true" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>Séances à venir cette semaine</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: seancesSemaineAVenir ? '#639922' : 'var(--color-text-secondary)', background: seancesSemaineAVenir ? '#EAF3E0' : 'var(--color-background-secondary)', padding: '2px 9px', borderRadius: 20, flexShrink: 0 }}>
                {seancesSemaineAVenir}
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Ligne 3 : Statistiques clés + Évolution du CA */}
      <div className="dash-line3-grid" style={{ marginBottom: 9 }}>

        {/* Statistiques avancees */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 500, color: '#173404' }}>Statistiques avancees</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['semaine', 'mois', 'année'].map(p => (
                <button key={p} onClick={() => setFiltrePeriode(p)} style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, border: 'none', cursor: 'pointer', background: filtrePeriode === p ? '#639922' : 'var(--color-background-secondary)', color: filtrePeriode === p ? '#fff' : 'var(--color-text-secondary)' }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 16px', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total clients</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 3 }}>{totalClients}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 1 }}>Tous statuts confondus</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Clients actifs</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 3 }}>{clientsActifs}</div>
              <div style={{ fontSize: 10, color: '#639922', marginTop: 1 }}>Séance récente</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Nouveaux clients</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 3 }}><FadeValue value={nouveauxClients} /></div>
              <div style={{ fontSize: 10, color: '#639922', marginTop: 1 }}>Période sélectionnée ci-dessous</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Séances</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 3 }}><FadeValue value={seancesPeriode} /></div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 1 }}>Sur la période sélectionnée</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Chiffre d'affaires</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 3 }}><FadeValue value={`${caFiltre.toFixed(0)} €`} /></div>
              <div style={{ display: 'flex', gap: 2, marginTop: 4, flexWrap: 'wrap' }}>
                {['jour','semaine','mois','année'].map(p => (
                  <button key={p} onClick={() => setFiltrePeriode(p)} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 12, border: 'none', cursor: 'pointer', background: filtrePeriode === p ? '#639922' : 'var(--color-background-secondary)', color: filtrePeriode === p ? '#fff' : 'var(--color-text-secondary)' }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Annulations</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-secondary)', marginTop: 3 }}>Bientot disponible</div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
            Séances par {filtrePeriode === 'mois' ? 'mois' : filtrePeriode === 'année' ? 'année' : 'jour'}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 54, marginBottom: 8 }}>
            {monthlyBars.map((b, i) => {
              const maxVal = Math.max(...monthlyBars.map(x => x.total), 1)
              const h = Math.max((b.total / maxVal) * 100, 8)
              const isHovered = barHoverIdx === i
              return (
                <div
                  key={i}
                  style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: 54, cursor: 'default' }}
                  onMouseEnter={() => setBarHoverIdx(i)}
                  onMouseLeave={() => setBarHoverIdx(null)}
                >
                  {isHovered && (
                    <ChartTooltip style={{ bottom: '100%', left: '50%', transform: 'translate(-50%, -8px)', marginBottom: 0 }}>
                      <strong>{b.fullLabel || b.label}</strong> — {b.total} séance{b.total > 1 ? 's' : ''}
                      <br />
                      {MODULES.map(m => `${m.name}: ${b[m.key] || 0}`).join(' · ')}
                    </ChartTooltip>
                  )}
                  <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 3 }}>{b.total}</span>
                  <div style={{
                    width: '100%',
                    height: `${h}%`,
                    borderRadius: '3px 3px 0 0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    background: b.total === 0 ? 'var(--color-border-tertiary)' : undefined,
                    filter: isHovered ? 'brightness(.85)' : 'none',
                    transition: 'filter .12s ease',
                  }}>
                    {MODULES.map(m => {
                      const val = b[m.key] || 0
                      if (!val || !b.total) return null
                      return <div key={m.key} style={{ width: '100%', height: `${(val / b.total) * 100}%`, background: m.color }} />
                    })}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 4 }}>{b.label}</span>
                </div>
              )
            })}
          </div>

          {/* Légende des modules (barres) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginBottom: 12 }}>
            {MODULES.map(m => (
              <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{m.name}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div ref={pieWrapRef} style={{ position: 'relative', flexShrink: 0, width: 76, height: 76 }}>
              <svg width="76" height="76" viewBox="0 0 42 42" role="img" aria-label="Repartition par module">
                <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="var(--color-border-tertiary)" strokeWidth="6" />
                {(() => {
                  const total = moduleBreakdown.energie + moduleBreakdown.oracle + moduleBreakdown.bach + moduleBreakdown.autres || 1
                  const segs = MODULES.map(m => ({
                    name: m.name,
                    color: m.color,
                    pct: (moduleBreakdown[m.key] / total) * 100,
                  }))
                  const withOffsets = segs.map((s, i) => ({
                    ...s,
                    offset: 25 - segs.slice(0, i).reduce((sum, x) => sum + x.pct, 0),
                  }))
                  return withOffsets.map((s, i) => {
                    const isHovered = pieHoverIdx === i
                    return (
                      <circle
                        key={i}
                        cx="21" cy="21" r="15.9" fill="transparent"
                        stroke={s.color}
                        strokeWidth={isHovered ? 7.5 : 6}
                        strokeDasharray={`${s.pct} ${100 - s.pct}`}
                        strokeDashoffset={s.offset}
                        transform="rotate(-90 21 21)"
                        style={{ transition: 'stroke-width .15s ease, filter .15s ease', filter: isHovered ? 'brightness(1.2)' : 'none', cursor: 'default' }}
                        onMouseEnter={() => setPieHoverIdx(i)}
                        onMouseLeave={() => setPieHoverIdx(null)}
                      />
                    )
                  })
                })()}
              </svg>
              {pieHoverIdx !== null && (() => {
                const total = moduleBreakdown.energie + moduleBreakdown.oracle + moduleBreakdown.bach + moduleBreakdown.autres || 1
                const segs = MODULES.map(m => ({ name: m.name, val: moduleBreakdown[m.key] }))
                const s = segs[pieHoverIdx]
                const pct = Math.round((s.val / total) * 100)
                return (
                  <ChartTooltip style={{ left: '50%', top: -6, transform: 'translate(-50%, -100%)' }}>
                    <strong>{s.name}</strong> — {s.val} ({pct}%)
                  </ChartTooltip>
                )
              })()}
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              {MODULES.map(m => (
                <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
                  <span>{m.name} {moduleBreakdown[m.key]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Courbe CA 8 mois */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 500, color: '#173404' }}>Évolution du chiffre d'affaires</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>8 derniers mois</div>
          </div>
          {(() => {
            const w = 600, h = 140, padX = 8, padTop = 12, padBottom = 24
            const maxVal = Math.max(...caHistory.map(c => c.total), 1)
            const n = caHistory.length || 1
            const stepX = n > 1 ? (w - padX * 2) / (n - 1) : 0
            const points = caHistory.map((c, i) => {
              const x = padX + i * stepX
              const y = padTop + (1 - c.total / maxVal) * (h - padTop - padBottom)
              return { x, y, ...c }
            })
            const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
            const areaPath = points.length
              ? `${linePath} L${points[points.length - 1].x},${h - padBottom} L${points[0].x},${h - padBottom} Z`
              : ''
            const hovered = caHover !== null ? points[caHover] : null
            return (
              <div
                ref={caChartRef}
                style={{ position: 'relative' }}
                onMouseMove={e => {
                  if (!points.length) return
                  const rect = caChartRef.current.getBoundingClientRect()
                  const fracX = (e.clientX - rect.left) / rect.width
                  const idx = Math.max(0, Math.min(points.length - 1, Math.round(fracX * (points.length - 1))))
                  setCaHover(idx)
                }}
                onMouseLeave={() => setCaHover(null)}
              >
                <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="140" role="img" aria-label="Évolution du chiffre d'affaires sur 8 mois" preserveAspectRatio="none">
                  {areaPath && <path d={areaPath} fill="#639922" opacity="0.1" />}
                  {linePath && <path d={linePath} fill="none" stroke="#639922" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
                  {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#639922" />
                  ))}
                  {hovered && (
                    <circle cx={hovered.x} cy={hovered.y} r="5.5" fill="#639922" stroke="var(--color-background-primary)" strokeWidth="2" />
                  )}
                  {points.map((p, i) => (
                    <text key={`l${i}`} x={p.x} y={h - 6} fontSize="10" fill="var(--color-text-secondary)" textAnchor="middle">{p.label}</text>
                  ))}
                </svg>
                {hovered && (
                  <ChartTooltip style={{
                    left: `${(hovered.x / w) * 100}%`,
                    top: `${(hovered.y / h) * 100}%`,
                    transform: 'translate(-50%, calc(-100% - 10px))',
                  }}>
                    <strong>{hovered.fullLabel || hovered.label}</strong><br />
                    {hovered.total.toFixed(0)} €
                  </ChartTooltip>
                )}
              </div>
            )
          })()}
        </div>

      </div>

      {/* Ligne 4 : Derniers clients + Dernières séances + Activité récente + Anniversaires */}
      <div className="dash-line4-grid">

          {/* Derniers clients */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Derniers clients</span>
              <button onClick={() => onNavigate?.('/clients')} style={{ fontSize: 11, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Voir tout →</button>
            </div>
            {derniersClients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--color-text-secondary)', fontSize: 12 }}>Aucun client</div>
            ) : (
              <div style={{ maxHeight: 210, overflowY: 'auto' }}>
                {derniersClients.map(c => (
                  <div key={c.id}
                    onClick={() => onNavigate?.('/clients')}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 6px', borderRadius: 8, cursor: 'pointer', transition: 'background .1s' }}
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
            )}
          </div>

          {/* Dernières séances */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Dernières séances</span>
              <button onClick={() => onNavigate?.('/seances')} style={{ fontSize: 11, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Voir tout →</button>
            </div>
            {dernieresSeances.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--color-text-secondary)', fontSize: 12 }}>Aucune séance</div>
            ) : (
              <div style={{ maxHeight: 210, overflowY: 'auto' }}>
                {dernieresSeances.map(s => {
                  const dateLabel = s.date_seance ? (() => { const d = new Date(s.date_seance.slice(0,10) + 'T00:00:00'); const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); const heureStr = s.heure_seance ? s.heure_seance.slice(0,5) : '—'; return `${dateStr}, ${heureStr}` })() : '—'
                  return (
                    <div key={s.id}
                      onClick={() => onNavigate?.('/seances')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 6px', borderRadius: 8, cursor: 'pointer', transition: 'background .1s' }}
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
            )}
          </div>

          {/* Activité récente */}
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 8 }}>Activité récente</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 11px', borderRadius: 8, background: 'var(--color-background-secondary)' }}>
                <i className="ti ti-calendar-stats" style={{ fontSize: 20, color: accent }} aria-hidden="true" />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Séances ce mois</div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{monthStats.count}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 11px', borderRadius: 8, background: 'var(--color-background-secondary)' }}>
                <i className="ti ti-coin" style={{ fontSize: 20, color: '#1D9E75' }} aria-hidden="true" />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Encaissés ce mois</div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{revenusCeMois.toFixed(0)} €</div>
                </div>
              </div>
            </div>
          </div>

          {/* Anniversaires prochains */}
          <AnniversairesWidget accent={accent} clients={anniversaireClients} onNavigate={onNavigate} />

      </div>
    </div>
  )
}
