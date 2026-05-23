import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const MANTRAS = [
  { t: '"Ce que l\'esprit conçoit et croit, il l\'accomplit."', s: '— Napoleon Hill' },
  { t: '"Ils ont juste commencé."', s: '— Xavier Niel' },
  { t: '"Un coup pratiqué dix mille fois."', s: '— Bruce Lee' },
  { t: '"Le mouvement crée la clarté."', s: '— Sagesse' },
]

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

export default function Dashboard({ accent, sbActif, sbItems, widgets, setWidgets }) {
  const [time, setTime] = useState(new Date())
  const [mantra] = useState(() => MANTRAS[Math.floor(Math.random() * MANTRAS.length)])
  const [prenom, setPrenom] = useState('')

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

  const activeSbItem = sbItems.find(i => i.id === sbActif)
  const timeStr = [time.getHours(), time.getMinutes(), time.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':')
  const dateStr = `${DAYS[time.getDay()]} ${time.getDate()} ${MONTHS[time.getMonth()]} ${time.getFullYear()}`

  const showClockBot = widgets.fete || widgets.ferie

  return (
    <div className="dash">
      <div className="dash-head">
        <i className={`ti ${activeSbItem?.icon || 'ti-layout-dashboard'}`} style={{ color: accent }} aria-hidden="true" />
        <div>
          <div className="dash-title">{activeSbItem?.label || 'Dashboard'}</div>
          <div className="dash-sub">Bonjour {prenom} — {dateStr}</div>
        </div>
      </div>

      {widgets.clock && (
        <div className="clock-block">
          <div className="cl-top">
            <div>
              <div className="cl-time">{timeStr}</div>
              <div className="cl-date">{dateStr}</div>
            </div>
            <div className="cl-right">
              {widgets.meteo && (
                <div className="cl-badge">
                  <i className="ti ti-cloud-sun" style={{ color: '#378ADD' }} aria-hidden="true" />
                  <span>18°C, nuageux</span>
                </div>
              )}
              {widgets.lune && (
                <div className="cl-badge">
                  <i className="ti ti-moon" style={{ color: '#7F77DD' }} aria-hidden="true" />
                  <span>Croissant gibbeuse</span>
                </div>
              )}
            </div>
          </div>
          {showClockBot && <div className="cl-div" />}
          {showClockBot && (
            <div className="cl-bot">
              {widgets.fete && (
                <div className="cl-info">
                  <i className="ti ti-star" style={{ color: accent }} aria-hidden="true" />
                  <div>
                    <div className="ci-lbl">Fête du jour</div>
                    <div className="ci-val">Sainte Émilie</div>
                  </div>
                </div>
              )}
              {widgets.ferie && (
                <div className="cl-info">
                  <i className="ti ti-calendar-event" style={{ color: '#D4537E' }} aria-hidden="true" />
                  <div>
                    <div className="ci-lbl">Prochain férié</div>
                    <div className="ci-val">Pentecôte — 1 juin</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {widgets.mantra && (
        <div className="mantra" style={{ borderLeftColor: accent }}>
          <div className="mantra-t">{mantra.t}</div>
          <div className="mantra-s">{mantra.s}</div>
        </div>
      )}

      <div className="metrics">
        <div className="mc"><div className="mc-lbl">Clients actifs</div><div className="mc-val">12</div></div>
        <div className="mc"><div className="mc-lbl">Séances à venir</div><div className="mc-val">5</div></div>
        <div className="mc"><div className="mc-lbl">Tâches</div><div className="mc-val">3</div></div>
      </div>

      <div className="recent-block">
        <div className="rb-title">Clients récents</div>
        {[
          { initials: 'MJ', name: 'Marie Joubert', meta: 'Sophrologue · 3 séances' },
          { initials: 'PL', name: 'Pierre Laurent', meta: 'Coaching · 1 séance' },
          { initials: 'SC', name: 'Sophie Caron', meta: 'Naturo · 5 séances' },
        ].map(c => (
          <div className="rb-row" key={c.initials}>
            <div className="rb-av" style={{ color: accent }}>{c.initials}</div>
            <div>
              <div className="rb-name">{c.name}</div>
              <div className="rb-meta">{c.meta}</div>
            </div>
            <div className="rb-badge">Actif</div>
          </div>
        ))}
      </div>
    </div>
  )
}
