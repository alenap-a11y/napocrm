import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { insertNotif } from '../lib/notif'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'
import NouveauRdv from '../components/NouveauRdv'
import SeanceNotesPreview from '../components/SeanceNotesPreview'
import NotesDuJour from '../components/NotesDuJour'

/* ─── Constantes ─────────────────────────────────────────── */

const TYPES = ['Sophrologie','Naturopathie','Coaching','Énergie','Massage','Fleurs de Bach','Autre']

const STATUTS = [
  { value: 'planifié', label: 'Planifié' },
  { value: 'confirmé', label: 'Confirmé' },
  { value: 'annulé',   label: 'Annulé'   },
]

const TYPE_COLOR = {
  Sophrologie:     '#3498db',
  Naturopathie:    '#27ae60',
  Coaching:        '#c9a84c',
  Énergie:         '#8e44ad',
  Massage:         '#d4711e',
  'Fleurs de Bach':'#7F3FBF',
  Autre:           '#888780',
}

const STATUT_BG = {
  confirmé: { bg: '#E1F5EE', color: '#0F6E56' },
  planifié: { bg: '#E6F1FB', color: '#185FA5' },
  annulé:   { bg: '#F5F5F5', color: '#6B7280' },
}

const JOURS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
const MOIS  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const today = new Date()

/* ─── Helpers ────────────────────────────────────────────── */

function toYMD(d) {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const offset   = firstDay === 0 ? 6 : firstDay - 1
  const days     = new Date(year, month + 1, 0).getDate()
  const cells    = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  while (cells.length % 7) cells.push(null)
  return cells
}

function rdvClientName(rdv) {
  if (!rdv?.clients) return 'Client non renseigné'
  return `${rdv.clients.prenom || ''} ${rdv.clients.nom || ''}`.trim() || 'Client'
}

function eventColor(rdv) {
  if (rdv.statut === 'annulé') return '#9CA3AF'
  return TYPE_COLOR[rdv.type_seance] || '#888780'
}

function fmtDatetime(iso) {
  if (!iso) return { date: '—', heure: '—' }
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    heure: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
  }
}

const todayStr = toYMD(new Date())
const FC_VIEW_MAP = { mois: 'dayGridMonth', semaine: 'timeGridWeek', jour: 'timeGridDay' }
const EMPTY_EDIT = { clientId: '', date: todayStr, heure: '10:00', typeSeance: 'Sophrologie', statut: 'planifié', notes: '' }

/* ─── Composant principal ─────────────────────────────────── */

export default function Agenda() {
  const calRef = useRef(null)
  const noteOpenRef = useRef(false)

  const [view,      setView]      = useState('mois')
  const [year,      setYear]      = useState(today.getFullYear())
  const [fcTitle,   setFcTitle]   = useState('')

  const [rdvs,         setRdvs]         = useState([])
  const [clientsAll,   setClientsAll]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [detail,       setDetail]       = useState(null)
  const [selectedDate, setSelectedDate] = useState(todayStr)

  const [modal,      setModal]      = useState(false)
  const [modalMode,  setModalMode]  = useState('create')
  const [prefillDate,setPrefillDate]= useState(todayStr)
  const [editingId,  setEditingId]  = useState(null)
  const [editForm,   setEditForm]   = useState(EMPTY_EDIT)
  const [editMsg,    setEditMsg]    = useState('')
  const [editSaving, setEditSaving] = useState(false)

  /* ── Chargement ── */
  useEffect(() => { fetchRdvs(); fetchClients() }, [])

  async function fetchRdvs() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('rendez_vous')
        .select('id, date_rdv, type_seance, statut, notes, client_id, clients(nom, prenom)')
        .eq('user_id', user.id)
        .order('date_rdv', { ascending: true })
      setRdvs(data || [])
    } catch {}
    setLoading(false)
  }

  async function fetchClients() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('clients')
        .select('id, nom, prenom')
        .eq('user_id', user.id)
        .order('nom')
      setClientsAll(data || [])
    } catch {}
  }

  /* Recalcul taille FC après changement de vue */
  useEffect(() => {
    if (view !== 'annee' && calRef.current) {
      setTimeout(() => calRef.current?.getApi().updateSize(), 0)
    }
  }, [view])

  /* ── Événements FullCalendar ── */
  const fcEvents = rdvs.map(rdv => {
    const start = new Date(rdv.date_rdv)
    const end   = new Date(start.getTime() + 60 * 60 * 1000)
    const color = eventColor(rdv)
    return {
      id: rdv.id,
      title: rdvClientName(rdv),
      start: rdv.date_rdv,
      end: end.toISOString(),
      backgroundColor: color,
      borderColor: color,
      textColor: '#fff',
      extendedProps: { rdv },
    }
  })

  /* ── Navigation ── */
  function switchView(newView) {
    if (newView === view) return
    setView(newView)
    if (newView !== 'annee' && calRef.current) {
      calRef.current.getApi().changeView(FC_VIEW_MAP[newView])
    }
  }

  function prev() {
    if (view === 'annee') setYear(y => y - 1)
    else calRef.current?.getApi().prev()
  }

  function next() {
    if (view === 'annee') setYear(y => y + 1)
    else calRef.current?.getApi().next()
  }

  function goToday() {
    if (view === 'annee') setYear(today.getFullYear())
    else calRef.current?.getApi().today()
  }

  function periodLabel() {
    return view === 'annee' ? String(year) : fcTitle
  }

  function goToDay(ds) {
    setView('jour')
    calRef.current?.getApi().changeView('timeGridDay', ds)
  }

  function goToMonth(mi) {
    setView('mois')
    const ds = `${year}-${String(mi + 1).padStart(2, '0')}-01`
    calRef.current?.getApi().changeView('dayGridMonth', ds)
  }

  /* ── Modal create ── */
  function openCreate(dateStr = todayStr) {
    setPrefillDate(dateStr)
    setModalMode('create')
    setModal(true)
  }

  /* ── Modal edit ── */
  function openEdit(rdv) {
    const dt = new Date(rdv.date_rdv)
    setEditingId(rdv.id)
    setEditForm({
      clientId:  rdv.client_id || '',
      date:      toYMD(dt),
      heure:     `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`,
      typeSeance:rdv.type_seance || 'Sophrologie',
      statut:    rdv.statut || 'planifié',
      notes:     rdv.notes || '',
    })
    setEditMsg('')
    setModalMode('edit')
    setModal(true)
    setDetail(null)
  }

  async function saveEdit() {
    if (!editForm.date || !editForm.heure) { setEditMsg('Date et heure requises.'); return }
    setEditSaving(true); setEditMsg('')
    try {
      const date_rdv = new Date(`${editForm.date}T${editForm.heure}:00`).toISOString()
      const { error } = await supabase.from('rendez_vous').update({
        client_id:   editForm.clientId  || null,
        date_rdv,
        type_seance: editForm.typeSeance || null,
        statut:      editForm.statut,
        notes:       editForm.notes.trim() || null,
      }).eq('id', editingId)
      if (error) throw error
      const client = clientsAll.find(c => c.id === editForm.clientId)
      const label  = client ? `${client.prenom || ''} ${client.nom || ''}`.trim() : ''
      insertNotif({ msg: `RDV modifié${label ? ` — ${label}` : ''}`, icon: 'ti-calendar', iconColor: '#185FA5', bg: '#E6F1FB' })
      await fetchRdvs()
      setModal(false)
    } catch (e) {
      setEditMsg(`✗ ${e.message}`)
    }
    setEditSaving(false)
  }

  /* ── Suppression ── */
  async function deleteRdv(id) {
    const { error } = await supabase.from('rendez_vous').delete().eq('id', id)
    if (!error) { setRdvs(prev => prev.filter(r => r.id !== id)); setDetail(null) }
  }

  /* ── Styles ── */
  const inp = {
    width: '100%', padding: '7px 10px', borderRadius: 6,
    border: '0.5px solid var(--color-border-secondary)',
    background: 'var(--color-background-primary)',
    color: 'var(--color-text-primary)', fontSize: 13,
    boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const ef = k => e => setEditForm(p => ({ ...p, [k]: e.target.value }))

  /* ════════════════════════════════════════════
     VUE ANNÉE (custom)
  ════════════════════════════════════════════ */
  const YearView = (
    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {MOIS.map((mName, mi) => {
          const cells = buildCalendar(year, mi)
          const isCurrentMonth = mi === today.getMonth() && year === today.getFullYear()
          return (
            <div key={mi}
              style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: 12, border: isCurrentMonth ? '1.5px solid var(--color-accent)' : '0.5px solid var(--color-border-tertiary)', cursor: 'pointer' }}
              onClick={() => goToMonth(mi)}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>{mName}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
                {JOURS.map(j => <div key={j} style={{ fontSize: 7, color: 'var(--color-text-secondary)', textAlign: 'center' }}>{j[0]}</div>)}
                {cells.map((d, i) => {
                  const ds  = d ? `${year}-${String(mi+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` : null
                  const evs = ds ? rdvs.filter(r => r.date_rdv.slice(0,10) === ds) : []
                  const isT = ds === todayStr
                  return (
                    <div key={i} style={{ textAlign: 'center', position: 'relative' }}
                      onClick={e => { if (!ds) return; e.stopPropagation(); goToDay(ds) }}>
                      <span style={{ fontSize: 8, color: isT ? '#fff' : d ? 'var(--color-text-secondary)' : 'transparent', background: isT ? '#1a2744' : 'transparent', borderRadius: 3, padding: '1px 2px', fontWeight: isT ? 700 : 400 }}>{d || ''}</span>
                      {evs.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 1, marginTop: 1 }}>
                          {evs.slice(0,3).map((ev, ei) => (
                            <div key={ei} style={{ width: 4, height: 4, borderRadius: '50%', background: eventColor(ev) }} />
                          ))}
                        </div>
                      )}
                      {ds && <NotesDuJour date={ds} />}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  /* ════════════════════════════════════════════
     PANEL DÉTAIL
  ════════════════════════════════════════════ */
  const Panel = (detail || selectedDate) && (() => {
    /* ── Mode RDV ── */
    if (detail) {
      const { date, heure } = fmtDatetime(detail.date_rdv)
      const color  = eventColor(detail)
      const sStyle = STATUT_BG[detail.statut] || STATUT_BG['planifié']
      return (
        <div style={{ width: 320, flexShrink: 0, borderLeft: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', background: 'var(--color-background-secondary)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--color-background-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>Détail rendez-vous</span>
            </div>
            <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 19, color: 'var(--color-text-secondary)', lineHeight: 1, padding: 0 }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                {rdvClientName(detail).split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{rdvClientName(detail)}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {detail.type_seance && (
                    <span style={{ fontSize: 10, fontWeight: 600, background: `${color}22`, color, padding: '2px 8px', borderRadius: 20 }}>{detail.type_seance}</span>
                  )}
                  <span style={{ fontSize: 10, fontWeight: 600, background: sStyle.bg, color: sStyle.color, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>{detail.statut}</span>
                </div>
              </div>
            </div>
            <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', paddingTop: 12, marginBottom: 14 }}>
              {[['Date', date], ['Heure', heure]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{l}</span>
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            {detail.notes && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Notes</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6, background: 'var(--color-background-primary)', padding: '10px 12px', borderRadius: 8 }}>{detail.notes}</div>
              </div>
            )}
            <SeanceNotesPreview seanceId={detail.id} />
            <NotesDuJour date={selectedDate} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => deleteRdv(detail.id)}
                style={{ padding: '7px 12px', borderRadius: 6, border: '0.5px solid #FBEAF0', background: 'transparent', color: '#993556', cursor: 'pointer', fontSize: 12 }}>
                <i className="ti ti-trash" style={{ marginRight: 4 }} aria-hidden="true" />Supprimer
              </button>
              <button onClick={() => openEdit(detail)}
                style={{ flex: 1, padding: '7px 12px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                <i className="ti ti-pencil" style={{ marginRight: 4 }} aria-hidden="true" />Modifier
              </button>
            </div>
          </div>
        </div>
      )
    }

    /* ── Mode jour (date cliquée sans RDV sélectionné) ── */
    return (
      <div style={{ width: 320, flexShrink: 0, borderLeft: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', background: 'var(--color-background-secondary)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--color-background-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <i className="ti ti-calendar-event" style={{ fontSize: 14, color: 'var(--color-accent)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 19, color: 'var(--color-text-secondary)', lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            Notes du jour
          </div>
          <NotesDuJour date={selectedDate} />
          <button onClick={() => openCreate(selectedDate)}
            style={{ marginTop: 16, width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <i className="ti ti-plus" />Nouveau RDV ce jour
          </button>
        </div>
      </div>
    )
  })()

  /* ════════════════════════════════════════════
     MODAL CREATE / EDIT
  ════════════════════════════════════════════ */
  const Modal = modal && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
      onClick={e => e.target === e.currentTarget && setModal(false)}>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: 16, width: 520, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {modalMode === 'create' ? 'Nouveau rendez-vous' : 'Modifier le rendez-vous'}
          </div>
          <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--color-text-secondary)' }}>×</button>
        </div>

        {/* ── Mode création : NouveauRdv ── */}
        {modalMode === 'create' && (
          <NouveauRdv
            key={prefillDate}
            prefillDate={prefillDate}
            onSuccess={async () => { await fetchRdvs(); setModal(false) }}
            onCancel={() => setModal(false)}
          />
        )}

        {/* ── Mode édition ── */}
        {modalMode === 'edit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Client */}
            <Fld label="Client">
              <select value={editForm.clientId} onChange={ef('clientId')} style={inp}>
                <option value="">— Sans client —</option>
                {clientsAll.map(c => (
                  <option key={c.id} value={c.id}>{`${c.prenom || ''} ${c.nom || ''}`.trim() || '—'}</option>
                ))}
              </select>
            </Fld>

            {/* Date + Heure */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Fld label="Date"><input type="date" value={editForm.date}  onChange={ef('date')}  style={inp} /></Fld>
              <Fld label="Heure"><input type="time" value={editForm.heure} onChange={ef('heure')} style={inp} /></Fld>
            </div>

            {/* Type séance */}
            <Fld label="Type de séance">
              <select value={editForm.typeSeance} onChange={ef('typeSeance')} style={inp}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Fld>

            {/* Statut */}
            <Fld label="Statut">
              <div style={{ display: 'flex', gap: 6 }}>
                {STATUTS.map(s => (
                  <button key={s.value} type="button" onClick={() => setEditForm(p => ({ ...p, statut: s.value }))}
                    style={{
                      flex: 1, padding: '7px 4px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
                      border: editForm.statut === s.value ? '1.5px solid var(--color-accent)' : '0.5px solid var(--color-border-secondary)',
                      background: editForm.statut === s.value ? 'var(--color-accent)' : 'var(--color-background-secondary)',
                      color: editForm.statut === s.value ? '#fff' : 'var(--color-text-secondary)',
                      fontWeight: editForm.statut === s.value ? 600 : 400,
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </Fld>

            {/* Notes */}
            <Fld label="Notes">
              <textarea value={editForm.notes} onChange={ef('notes')}
                placeholder="Demande particulière, rappels…" rows={3}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
            </Fld>

            {editMsg && (
              <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, background: '#FBEAF0', color: '#993556' }}>{editMsg}</div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 2 }}>
              <button onClick={() => setModal(false)} disabled={editSaving}
                style={{ padding: '9px 18px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 13 }}>
                Annuler
              </button>
              <button onClick={saveEdit} disabled={editSaving}
                style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: editSaving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: editSaving ? .7 : 1 }}>
                <i className="ti ti-check" style={{ marginRight: 6 }} aria-hidden="true" />
                {editSaving ? 'Enregistrement…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', fontFamily: 'inherit' }}>

      {/* ── Header ── */}
      <div style={{ padding: '10px 18px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: 'var(--color-background-primary)', flexWrap: 'wrap' }}>

        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Agenda</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
            {loading ? 'Chargement…' : `${rdvs.length} rendez-vous`}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 12 }}>
          <button onClick={prev} style={{ width: 28, height: 28, borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', cursor: 'pointer', fontSize: 15, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Période précédente">‹</button>
          <button onClick={goToday} style={{ padding: '5px 10px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', cursor: 'pointer', fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Aujourd'hui</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', minWidth: 180, textAlign: 'center', textTransform: 'capitalize' }}>{periodLabel()}</span>
          <button onClick={next} style={{ width: 28, height: 28, borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', cursor: 'pointer', fontSize: 15, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Période suivante">›</button>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', border: '0.5px solid var(--color-border-secondary)', borderRadius: 6, overflow: 'hidden' }}>
          {[['annee','Année'],['mois','Mois'],['semaine','Semaine'],['jour','Jour']].map(([v, l]) => (
            <button key={v} onClick={() => switchView(v)}
              style={{ padding: '5px 11px', border: 'none', background: view === v ? '#1a2744' : 'var(--color-background-secondary)', color: view === v ? '#c9a84c' : 'var(--color-text-secondary)', fontSize: 11, fontWeight: view === v ? 700 : 400, cursor: 'pointer', borderRight: v !== 'jour' ? '0.5px solid var(--color-border-secondary)' : 'none' }}>
              {l}
            </button>
          ))}
        </div>

        <button onClick={() => openCreate()}
          style={{ padding: '7px 14px', borderRadius: 6, border: 'none', background: '#c9a84c', color: '#1a2744', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-plus" aria-hidden="true" />Nouveau RDV
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Vue année custom */}
          {view === 'annee' && YearView}

          {/* FullCalendar — toujours monté, masqué en vue année */}
          <div style={{ flex: 1, display: view !== 'annee' ? 'flex' : 'none', flexDirection: 'column', overflow: 'hidden' }}>
            <FullCalendar
              ref={calRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={frLocale}
              firstDay={1}
              headerToolbar={false}
              height="100%"
              events={fcEvents}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              eventClick={info => {
                const rdv = info.event.extendedProps.rdv
                setDetail(rdv)
                setSelectedDate(rdv.date_rdv.slice(0, 10))
                info.jsEvent.stopPropagation()
              }}
              dateClick={info => {
                if (noteOpenRef.current) return;
                if (info.jsEvent.target.closest('.notes-panel')) return;
                const ds = info.dateStr.split('T')[0]
                setSelectedDate(ds)
                setDetail(null)
                openCreate(ds)
              }}
              datesSet={info => setFcTitle(info.view.title)}
              dayCellContent={info => (
                <>
                  <span>{info.dayNumberText}</span>
                  <NotesDuJour date={toYMD(info.date)} onNoteOpen={v => noteOpenRef.current = v} />
                </>
              )}
            />
          </div>
        </div>

        {Panel}
      </div>

      {Modal}
    </div>
  )
}

/* ─── Utilitaire ─────────────────────────────────────────── */

function Fld({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}
