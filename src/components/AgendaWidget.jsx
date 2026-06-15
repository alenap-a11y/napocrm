import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import NotesDuJour from './NotesDuJour'

const MONTHS_SHORT = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
const DAYS_SHORT   = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']

const STATUT_STYLE = {
  confirmé: { bg: '#E1F5EE', color: '#0F6E56' },
  planifié: { bg: '#E6F1FB', color: '#185FA5' },
  annulé:   { bg: '#F5F5F5', color: '#6B7280' },
}

function fmtDateRdv(iso) {
  if (!iso) return { day: '—', date: '—', heure: '—' }
  const d = new Date(iso)
  return {
    day:   DAYS_SHORT[d.getDay()],
    date:  `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`,
    heure: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
  }
}

function isToday(iso) {
  if (!iso) return false
  const d = new Date(iso)
  const t = new Date()
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}

export default function AgendaWidget({ accent, onNavigate }) {
  const [rdvs,    setRdvs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRdvs() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const now     = new Date()
        const in7days = new Date(now)
        in7days.setDate(in7days.getDate() + 7)

        const { data } = await supabase
          .from('rendez_vous')
          .select('id, date_rdv, type_seance, statut, notes, clients(nom, prenom)')
          .eq('user_id', user.id)
          .neq('statut', 'annulé')
          .gte('date_rdv', now.toISOString())
          .lte('date_rdv', in7days.toISOString())
          .order('date_rdv', { ascending: true })

        setRdvs(data || [])
      } catch {}
      setLoading(false)
    }
    fetchRdvs()
  }, [])

  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 10,
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-calendar-week" style={{ fontSize: 16, color: accent }} aria-hidden="true" />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            Rendez-vous à venir
          </span>
          {!loading && rdvs.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 600,
              background: `${accent}20`, color: accent,
              padding: '1px 7px', borderRadius: 20,
            }}>
              {rdvs.length}
            </span>
          )}
        </div>
        <button
          onClick={() => onNavigate?.('/agenda')}
          style={{ fontSize: 11, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Voir l'agenda →
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0', justifyContent: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite', fontSize: 15 }} aria-hidden="true" />
          Chargement…
        </div>
      ) : rdvs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          <i className="ti ti-calendar-off" style={{ fontSize: 26, display: 'block', marginBottom: 8, opacity: .5 }} aria-hidden="true" />
          Aucun rendez-vous dans les 7 prochains jours
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(() => {
            const byDate = {}
            rdvs.forEach(rdv => {
              const d = rdv.date_rdv.slice(0, 10)
              if (!byDate[d]) byDate[d] = []
              byDate[d].push(rdv)
            })
            return Object.entries(byDate).map(([dateStr, dayRdvs]) => (
              <div key={dateStr}>
                {dayRdvs.map(rdv => {
                  const { day, date, heure } = fmtDateRdv(rdv.date_rdv)
                  const today  = isToday(rdv.date_rdv)
                  const client = rdv.clients
                    ? `${rdv.clients.prenom || ''} ${rdv.clients.nom || ''}`.trim()
                    : 'Client non renseigné'
                  const statutStyle = STATUT_STYLE[rdv.statut] || STATUT_STYLE['planifié']
                  return (
                    <div
                      key={rdv.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 8,
                        background: today ? `${accent}0D` : 'var(--color-background-secondary)',
                        borderLeft: today ? `3px solid ${accent}` : '3px solid transparent',
                        transition: 'background .1s',
                      }}
                    >
                      {/* Bloc date */}
                      <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 46 }}>
                        <div style={{ fontSize: 10, fontWeight: 500, color: today ? accent : 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                          {today ? 'Auj.' : day}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: today ? accent : 'var(--color-text-primary)', lineHeight: 1.2 }}>
                          {date}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{heure}</div>
                      </div>

                      {/* Séparateur */}
                      <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--color-border-tertiary)', flexShrink: 0 }} />

                      {/* Infos */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {client}
                        </div>
                        {rdv.type_seance && (
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>
                            {rdv.type_seance}
                          </div>
                        )}
                      </div>

                      {/* Badge statut */}
                      <span style={{
                        fontSize: 10, fontWeight: 500,
                        background: statutStyle.bg, color: statutStyle.color,
                        padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                        textTransform: 'capitalize',
                      }}>
                        {rdv.statut}
                      </span>
                    </div>
                  )
                })}
                <NotesDuJour date={dateStr} />
              </div>
            ))
          })()}
        </div>
      )}
    </div>
  )
}
