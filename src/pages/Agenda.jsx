import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/* ─── Constants ─────────────────────────────────────────── */

const TYPE_COLORS = {
  Sophrologie: '#3498db',
  Naturopathie: '#27ae60',
  Coaching: '#c9a84c',
  Énergie: '#8e44ad',
  Massage: '#d4711e',
  Autre: '#888780',
}

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const H0 = 8   // heure début
const H1 = 20  // heure fin
const HH = 54  // pixels par heure

/* ─── Helpers ────────────────────────────────────────────── */

function toYMD(d) {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })
}

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const days = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  while (cells.length % 7) cells.push(null)
  return cells
}

function parseH(h) {
  if (!h) return 9
  const [hr, mn] = (h + '').split(':').map(Number)
  return hr + (mn || 0) / 60
}

function clientName(s) {
  const c = s.clients
  if (!c) return 'Client'
  return (`${c.prenom || ''} ${c.nom || ''}`).trim() || 'Client'
}

function tc(type) { return TYPE_COLORS[type] || '#888780' }

/* ─── Main component ─────────────────────────────────────── */

export default function Agenda() {
  const navigate = useNavigate()
  const today    = new Date()
  const todayStr = toYMD(today)

  /* Vue + période */
  const [view,      setView]      = useState('mois')
  const [year,      setYear]      = useState(today.getFullYear())
  const [month,     setMonth]     = useState(today.getMonth())
  const [weekStart, setWeekStart] = useState(() => getMonday(today))
  const [selDay,    setSelDay]    = useState(today)

  /* Données */
  const [seances, setSeances] = useState([])
  const [loading, setLoading] = useState(true)
  const [err,     setErr]     = useState(null)

  /* Panel détail */
  const [selSeance,  setSelSeance]  = useState(null)
  const [panelNotes, setPanelNotes] = useState([])
  const [noteText,   setNoteText]   = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [noteStatus, setNoteStatus] = useState(null)

  /* ─ Load seances ─ */
  const loadSeances = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      let debut, fin
      if (view === 'mois') {
        debut = toYMD(new Date(year, month, 1))
        fin   = toYMD(new Date(year, month + 1, 0))
      } else if (view === 'semaine') {
        const wd = getWeekDays(weekStart)
        debut = toYMD(wd[0])
        fin   = toYMD(wd[6])
      } else {
        debut = fin = toYMD(selDay)
      }

      const { data, error } = await supabase
        .from('seances')
        .select('*, clients(nom, prenom, email, tel)')
        .eq('user_id', user.id)
        .gte('date', debut)
        .lte('date', fin)
        .order('date')

      if (error) throw error
      setSeances(data || [])
    } catch (e) {
      console.error(e)
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [view, year, month, weekStart, selDay])

  useEffect(() => { loadSeances() }, [loadSeances])

  /* ─ Load notes for selected seance ─ */
  useEffect(() => {
    if (!selSeance) { setPanelNotes([]); return }
    supabase.from('notes')
      .select('*')
      .eq('seance_id', selSeance.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setPanelNotes(data || []))
      .catch(() => setPanelNotes([]))
  }, [selSeance?.id])

  /* ─ Navigation ─ */
  function prevPeriod() {
    if (view === 'mois') {
      if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
    } else if (view === 'semaine') {
      setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
    } else {
      setSelDay(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
    }
  }

  function nextPeriod() {
    if (view === 'mois') {
      if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
    } else if (view === 'semaine') {
      setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
    } else {
      setSelDay(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })
    }
  }

  function periodLabel() {
    if (view === 'mois') return `${MOIS[month]} ${year}`
    if (view === 'semaine') {
      const wd = getWeekDays(weekStart)
      const [a, b] = [wd[0], wd[6]]
      if (a.getMonth() === b.getMonth())
        return `${a.getDate()}–${b.getDate()} ${MOIS[a.getMonth()]} ${a.getFullYear()}`
      return `${a.getDate()} ${MOIS[a.getMonth()]} – ${b.getDate()} ${MOIS[b.getMonth()]}`
    }
    return selDay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  function forDay(dateStr) { return seances.filter(s => s.date === dateStr) }
  function openSeance(s) { setSelSeance(s); setNoteText(''); setNoteStatus(null) }

  /* ─ Save note ─ */
  async function saveNote() {
    if (!noteText.trim() || !selSeance) return
    setSavingNote(true)
    setNoteStatus(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('notes').insert({
        user_id: user.id,
        client_id: selSeance.client_id,
        seance_id: selSeance.id,
        contenu: noteText.trim(),
      })
      if (error) throw error
      setNoteText('')
      setNoteStatus('ok')
      const { data } = await supabase.from('notes').select('*')
        .eq('seance_id', selSeance.id).order('created_at', { ascending: false })
      setPanelNotes(data || [])
    } catch (e) {
      console.error(e)
      setNoteStatus('err')
    } finally {
      setSavingNote(false)
    }
  }

  /* ─ Derived ─ */
  const weekDays   = getWeekDays(weekStart)
  const monthCells = buildCalendar(year, month)
  const hoursArr   = Array.from({ length: H1 - H0 }, (_, i) => H0 + i)
  const daySeances = forDay(toYMD(selDay))

  /* ═══════════════════════════════════════════════════════
     VUE MOIS
  ═══════════════════════════════════════════════════════ */
  const MonthView = (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* En-têtes jours */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8f8f8', borderBottom: '1px solid #e5e5e5', flexShrink: 0 }}>
        {JOURS.map(j => (
          <div key={j} style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {j}
          </div>
        ))}
      </div>

      {/* Grille */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, overflowY: 'auto' }}>
        {monthCells.map((day, i) => {
          const ds = day
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            : null
          const dayS    = ds ? forDay(ds) : []
          const isToday = ds === todayStr
          const isSat   = i % 7 === 5
          const isSun   = i % 7 === 6

          return (
            <div
              key={i}
              onClick={() => ds && navigate(`/seances/nouvelle?date=${ds}`)}
              style={{
                minHeight: 96, padding: '5px 7px',
                borderRight: (i + 1) % 7 !== 0 ? '0.5px solid #e8e8e8' : 'none',
                borderBottom: '0.5px solid #e8e8e8',
                background: !day ? '#fafafa' : isToday ? '#fef9ec' : (isSat || isSun) ? '#fdfcfa' : '#fff',
                cursor: day ? 'pointer' : 'default',
              }}
            >
              {day && (
                <>
                  <div style={{
                    width: 22, height: 22, borderRadius: 3, marginBottom: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: isToday ? 700 : 400,
                    background: isToday ? '#1a2744' : 'transparent',
                    color: isToday ? '#c9a84c' : (isSat || isSun) ? '#b0b0b0' : '#374151',
                  }}>
                    {day}
                  </div>
                  {dayS.slice(0, 3).map(s => (
                    <div
                      key={s.id}
                      onClick={e => { e.stopPropagation(); openSeance(s) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        marginBottom: 2, padding: '2px 5px', borderRadius: 3,
                        background: tc(s.type), cursor: 'pointer', overflow: 'hidden',
                      }}
                    >
                      {s.heure && (
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', flexShrink: 0 }}>{s.heure.slice(0,5)}</span>
                      )}
                      <span style={{ fontSize: 10, color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {clientName(s)}
                      </span>
                    </div>
                  ))}
                  {dayS.length > 3 && (
                    <div style={{ fontSize: 10, color: '#9ca3af', paddingLeft: 3 }}>+{dayS.length - 3}</div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  /* ═══════════════════════════════════════════════════════
     VUE SEMAINE
  ═══════════════════════════════════════════════════════ */
  const WeekView = (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* En-têtes jours fixes */}
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ width: 48, flexShrink: 0 }} />
        {weekDays.map((day, di) => {
          const ds = toYMD(day)
          const isToday = ds === todayStr
          return (
            <div
              key={di}
              onClick={() => { setView('jour'); setSelDay(day) }}
              style={{
                flex: 1, padding: '8px 4px', textAlign: 'center',
                background: isToday ? '#fef9ec' : '#f8f8f8',
                cursor: 'pointer', borderRight: di < 6 ? '0.5px solid #e8e8e8' : 'none',
              }}
            >
              <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                {JOURS[di]}
              </div>
              <div style={{
                fontSize: 15, fontWeight: isToday ? 700 : 400,
                color: isToday ? '#1a2744' : '#374151', lineHeight: 1.2,
              }}>
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Corps scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex' }}>
        {/* Colonne heures */}
        <div style={{ width: 48, flexShrink: 0, borderRight: '1px solid #e5e5e5' }}>
          {hoursArr.map(h => (
            <div key={h} style={{ height: HH, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '3px 8px 0 0', borderBottom: '0.5px solid #f0f0f0', boxSizing: 'border-box' }}>
              <span style={{ fontSize: 10, color: '#c0c0c0' }}>{String(h).padStart(2, '0')}h</span>
            </div>
          ))}
        </div>

        {/* Colonnes jours */}
        {weekDays.map((day, di) => {
          const ds   = toYMD(day)
          const dayS = forDay(ds)
          return (
            <div key={di} style={{ flex: 1, position: 'relative', borderRight: di < 6 ? '0.5px solid #e8e8e8' : 'none', minWidth: 0 }}>
              {/* Lignes heures cliquables */}
              {hoursArr.map(h => (
                <div
                  key={h}
                  onClick={() => navigate(`/seances/nouvelle?date=${ds}&heure=${String(h).padStart(2, '0')}:00`)}
                  style={{ height: HH, borderBottom: '0.5px solid #f0f0f0', boxSizing: 'border-box', cursor: 'pointer' }}
                />
              ))}

              {/* Blocs séances */}
              {dayS.map(s => {
                const h      = parseH(s.heure)
                const durH   = (s.duree || 60) / 60
                const top    = (h - H0) * HH
                const height = Math.max(durH * HH - 2, 18)
                if (top < 0 || top >= (H1 - H0) * HH) return null
                return (
                  <div
                    key={s.id}
                    onClick={e => { e.stopPropagation(); openSeance(s) }}
                    style={{
                      position: 'absolute', top: top + 1, left: 2, right: 2, height,
                      background: tc(s.type), borderRadius: 3, padding: '2px 5px',
                      cursor: 'pointer', overflow: 'hidden', zIndex: 1, boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ fontSize: 10, color: '#fff', fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {clientName(s)}
                    </div>
                    {height > 28 && (
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>
                        {s.type} · {s.duree}min
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )

  /* ═══════════════════════════════════════════════════════
     VUE JOUR
  ═══════════════════════════════════════════════════════ */
  const DayView = (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderBottom: '1px solid #e8e8e8', flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          {daySeances.length} séance{daySeances.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => navigate(`/seances/nouvelle?date=${toYMD(selDay)}`)}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 3, border: 'none', background: '#1a2744', color: '#c9a84c', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          + Ajouter séance ce jour
        </button>
      </div>

      <div style={{ padding: '8px 20px 24px' }}>
        {hoursArr.map(h => {
          const hourS = daySeances.filter(s => Math.floor(parseH(s.heure)) === h)
          return (
            <div key={h} style={{ display: 'flex', gap: 10, minHeight: HH, boxSizing: 'border-box' }}>
              <div style={{ width: 38, flexShrink: 0, fontSize: 10, color: '#c0c0c0', paddingTop: 13, textAlign: 'right', fontWeight: 500 }}>
                {String(h).padStart(2, '0')}h
              </div>
              <div style={{ flex: 1, borderLeft: '1px solid #f0f0f0', paddingLeft: 10, paddingTop: hourS.length ? 6 : 0 }}>
                {hourS.map(s => (
                  <div
                    key={s.id}
                    onClick={() => openSeance(s)}
                    style={{
                      padding: '8px 12px', borderRadius: 3, marginBottom: 5,
                      background: tc(s.type) + '14', borderLeft: `3px solid ${tc(s.type)}`,
                      cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{clientName(s)}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                        {s.type} · {s.duree} min{s.prix ? ` · ${s.prix} €` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: tc(s.type) + '22', color: tc(s.type) }}>
                      {s.statut || 'Confirmé'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  /* ═══════════════════════════════════════════════════════
     PANEL DÉTAIL
  ═══════════════════════════════════════════════════════ */
  const Panel = selSeance && (
    <div style={{ width: 340, flexShrink: 0, borderLeft: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', background: '#f9fafb', overflow: 'hidden' }}>

      {/* Header panel */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: tc(selSeance.type) }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Détail séance</span>
        </div>
        <button onClick={() => setSelSeance(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 19, color: '#9ca3af', lineHeight: 1, padding: 0 }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

        {/* ── Client ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 3, background: '#1a2744', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9a84c', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              {(selSeance.clients?.prenom?.[0] || '?').toUpperCase()}{(selSeance.clients?.nom?.[0] || '').toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{clientName(selSeance)}</div>
              {selSeance.clients?.email && (
                <a href={`mailto:${selSeance.clients.email}`} style={{ fontSize: 11, color: '#3498db', textDecoration: 'none' }}>
                  {selSeance.clients.email}
                </a>
              )}
            </div>
          </div>
          {selSeance.clients?.tel && (
            <a href={`tel:${selSeance.clients.tel}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151', textDecoration: 'none', marginBottom: 7 }}>
              <i className="ti ti-phone" style={{ fontSize: 13, color: '#9ca3af' }} />
              {selSeance.clients.tel}
            </a>
          )}
          <button
            onClick={() => navigate(`/clients?id=${selSeance.client_id}`)}
            style={{ fontSize: 11, color: '#3498db', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <i className="ti ti-external-link" style={{ fontSize: 11 }} /> Voir fiche client
          </button>
        </div>

        {/* ── Séance ── */}
        <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Séance</div>
          {[
            ['Date',  selSeance.date ? new Date(selSeance.date + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'],
            ['Heure', selSeance.heure || '—'],
            ['Durée', `${selSeance.duree || '—'} min`],
            ['Prix',  selSeance.prix ? `${selSeance.prix} €` : '—'],
            ['Type',  selSeance.type || '—'],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, borderBottom: '0.5px solid #f3f3f3' }}>
              <span style={{ color: '#9ca3af' }}>{l}</span>
              <span style={{ color: '#111827', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Statut</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3, background: tc(selSeance.type) + '18', color: tc(selSeance.type) }}>
              {selSeance.statut || 'Confirmé'}
            </span>
          </div>
          <button
            onClick={() => navigate(`/seances/nouvelle?edit=${selSeance.id}`)}
            style={{ marginTop: 6, width: '100%', padding: '6px 0', borderRadius: 3, border: '1px solid #e0e0e0', background: '#fff', color: '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
          >
            <i className="ti ti-edit" style={{ fontSize: 12 }} /> Modifier la séance
          </button>
        </div>

        {/* ── Notes séance (notes_json) ── */}
        {Array.isArray(selSeance.notes_json) && selSeance.notes_json.length > 0 && (
          <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Notes de séance</div>
            {selSeance.notes_json.map((n, i) => (
              <div key={i} style={{ borderLeft: '3px solid #c9a84c', paddingLeft: 8, marginBottom: 6 }}>
                {n.time && <div style={{ fontSize: 10, color: '#9ca3af' }}>{n.time}</div>}
                <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.5 }}>{n.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Note globale ── */}
        <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            Note globale
          </div>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') saveNote() }}
            placeholder="Note rapide… (Ctrl+Entrée)"
            style={{ width: '100%', height: 68, resize: 'none', border: '1px solid #e0e0e0', borderRadius: 3, padding: '6px 8px', fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5, color: '#111827' }}
          />
          <button
            onClick={saveNote}
            disabled={savingNote || !noteText.trim()}
            style={{
              width: '100%', marginTop: 5, padding: '6px 0', borderRadius: 3, border: 'none',
              background: noteText.trim() ? '#1a2744' : '#ebebeb',
              color: noteText.trim() ? '#c9a84c' : '#aaa',
              fontSize: 11, fontWeight: 700, cursor: noteText.trim() ? 'pointer' : 'default',
            }}
          >
            {savingNote ? 'Sauvegarde…' : noteStatus === 'ok' ? '✓ Sauvegardé' : noteStatus === 'err' ? '✗ Erreur' : 'Sauvegarder note'}
          </button>

          {/* Notes existantes */}
          {panelNotes.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {panelNotes.map(n => (
                <div key={n.id} style={{ borderLeft: '3px solid #c9a84c', paddingLeft: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>
                    {new Date(n.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.5 }}>{n.contenu}</div>
                </div>
              ))}
              <button
                onClick={() => navigate(`/notes?client=${selSeance.client_id}`)}
                style={{ fontSize: 10, color: '#3498db', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}
              >
                Voir toutes les notes →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', fontFamily: 'inherit' }}>

      {/* ── Header ── */}
      <div style={{ padding: '10px 18px', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: '#fff' }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: '#1a2744', margin: 0 }}>Agenda</h1>
          <p style={{ fontSize: 10, color: '#9ca3af', margin: '1px 0 0' }}>Planifiez vos séances et rendez-vous</p>
        </div>

        {/* Navigation période */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 16 }}>
          <button onClick={prevPeriod} style={{ width: 26, height: 26, borderRadius: 3, border: '1px solid #e8e8e8', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', minWidth: 180, textAlign: 'center' }}>{periodLabel()}</span>
          <button onClick={nextPeriod} style={{ width: 26, height: 26, borderRadius: 3, border: '1px solid #e8e8e8', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Légende types */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginRight: 8 }}>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#9ca3af' }}>{type}</span>
            </div>
          ))}
        </div>

        {/* Toggle vues */}
        <div style={{ display: 'flex', border: '1px solid #e8e8e8', borderRadius: 3, overflow: 'hidden' }}>
          {[['mois', 'Mois'], ['semaine', 'Semaine'], ['jour', 'Jour']].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '5px 11px', border: 'none',
              background: view === v ? '#1a2744' : '#fff',
              color: view === v ? '#c9a84c' : '#6b7280',
              fontSize: 11, fontWeight: view === v ? 700 : 400, cursor: 'pointer',
              borderRight: v !== 'jour' ? '1px solid #e8e8e8' : 'none',
            }}>{l}</button>
          ))}
        </div>

        <button
          onClick={() => navigate('/seances/nouvelle')}
          style={{ padding: '6px 14px', borderRadius: 3, border: 'none', background: '#c9a84c', color: '#1a2744', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          + Nouveau RDV
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Vue principale */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12, gap: 8 }}>
              <i className="ti ti-loader-2 spin" style={{ fontSize: 20 }} />
              Chargement des séances…
            </div>
          ) : err ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 28, color: '#e8e8e8' }} />
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Erreur : {err}</div>
              <button onClick={loadSeances} style={{ fontSize: 11, color: '#3498db', background: 'none', border: 'none', cursor: 'pointer' }}>Réessayer</button>
            </div>
          ) : (
            <>
              {view === 'mois'    && MonthView}
              {view === 'semaine' && WeekView}
              {view === 'jour'    && DayView}
            </>
          )}
        </div>

        {/* Panel détail */}
        {Panel}
      </div>
    </div>
  )
}
