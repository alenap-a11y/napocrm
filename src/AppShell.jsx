import { useState, useRef, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import TopBar from './components/TopBar'
import SideBar from './components/SideBar'
import Dashboard from './components/Dashboard'
import ProfilPage from './components/ProfilPage'
import SimplePage from './components/SimplePage'
import Seances from './pages/Seances'
import NouvelleSeance from './pages/NouvelleSeance'
import Clients from './pages/Clients'
import Agenda from './pages/Agenda'
import Notes from './pages/Notes'
import FicheClientBach from './components/FicheClientBach'
import SimulateurFiscal from './components/SimulateurFiscal'
import { supabase } from './lib/supabase'

const ALL_SB_ITEMS = [
  { id: 'board',    label: 'Board',    icon: 'ti-layout-dashboard', to: '/board'    },
  { id: 'seances',  label: 'Séances',  icon: 'ti-calendar-plus',    to: '/seances'  },
  { id: 'clients',     label: 'Clients',        icon: 'ti-users',          to: '/clients'                        },
  { id: 'bach',        label: 'Fleurs de Bach', icon: 'ti-leaf',           to: '/fleurs-de-bach'                 },
  { id: 'agenda',      label: 'Agenda',         icon: 'ti-calendar',       to: '/agenda'                         },
  { id: 'notes',    label: 'Notes',    icon: 'ti-notebook',         to: '/notes'    },
  { id: 'factures', label: 'Factures', icon: 'ti-file',             to: '/factures' },
  { id: 'fiscal',   label: 'Fiscal',   icon: 'ti-calculator',       to: '/fiscal'   },
]

const SB_STORAGE_KEY = 'napo_sb_items'

function loadSbItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(SB_STORAGE_KEY))
    if (!Array.isArray(saved) || saved.length === 0) return ALL_SB_ITEMS
    const map = Object.fromEntries(ALL_SB_ITEMS.map(i => [i.id, i]))
    const result = saved.map(id => map[id]).filter(Boolean)
    if (result.length === 0) return ALL_SB_ITEMS
    // Append any new items not yet in saved order
    const resultIds = new Set(result.map(i => i.id))
    ALL_SB_ITEMS.filter(i => !resultIds.has(i.id)).forEach(i => result.push(i))
    return result
  } catch { return ALL_SB_ITEMS }
}

const DEFAULT_TB_ITEMS = [
  { id: 'faq',  label: 'FAQ',  icon: 'ti-help-circle',  vis: true },
  { id: 'aide', label: 'Aide', icon: 'ti-lifebuoy',     vis: true },
  { id: 'news', label: 'News', icon: 'ti-speakerphone', vis: true },
]

const DEFAULT_WIDGETS = { clock: true, meteo: true, lune: true, fete: true, ferie: true, mantra: true }

const THEMES = [
  { bg: '#111827', ac: '#B8961E', name: 'Navy gold' },
  { bg: '#085041', ac: '#5DCAA5', name: 'Zen sauge' },
  { bg: '#26215C', ac: '#AFA9EC', name: 'Violet' },
  { bg: '#4A1B0C', ac: '#F0997B', name: 'Corail' },
  { bg: '#2C2C2A', ac: '#B4B2A9', name: 'Ardoise' },
  { bg: '#4B1528', ac: '#ED93B1', name: 'Rose' },
]

const ACCENT_SWATCHES = ['#B8961E', '#534AB7', '#0F6E56', '#993C1D', '#185FA5', '#993556']
const BG_SWATCHES = ['#111827', '#1e293b', '#26215C', '#4A1B0C', '#085041', '#2C2C2A']

export default function AppShell({ user, onSignOut }) {
  const [sbItems, setSbItems] = useState(loadSbItems)
  const [tbItems, setTbItems] = useState(DEFAULT_TB_ITEMS)
  const [sbActif, setSbActif] = useState('dashboard')
  const [tbActif, setTbActif] = useState('')
  const [curView, setCurView] = useState('dash')
  const [accent, setAccent] = useState('#B8961E')
  const [bgCol, setBgCol] = useState('#1E1A4E')
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS)
  const [activePanel, setActivePanel] = useState(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifDot, setNotifDot] = useState(true)
  const [notifs, setNotifs] = useState([
    { id: 1, unread: true, bg: '#E6F1FB', icon: 'ti-user-plus', iconColor: '#185FA5', msg: 'Nouveau client — Anne Bernard', time: 'Il y a 12 min' },
    { id: 2, unread: true, bg: '#FAEEDA', icon: 'ti-clock', iconColor: '#854F0B', msg: 'Rappel — Marie Joubert demain 10h', time: 'Il y a 1h' },
    { id: 3, unread: true, bg: '#EAF3DE', icon: 'ti-check', iconColor: '#3B6D11', msg: 'Facture #0042 payée — Sophie Caron', time: 'Il y a 3h' },
    { id: 4, unread: false, bg: '#EEEDFE', icon: 'ti-mail', iconColor: '#534AB7', msg: 'Message de Pierre Laurent', time: 'Hier' },
  ])
  const [searchOpen, setSearchOpen] = useState(false)
  const [decoOpen, setDecoOpen] = useState(false)
  const [username, setUsername] = useState(() => {
    // sera remplacé par les données Supabase au montage
    return user?.user_metadata?.prenom || user?.email?.split('@')[0] || 'Utilisateur'
  })
  const [fs, setFs] = useState(() => parseInt(localStorage.getItem('napo_font_size') || '100', 10))
  const searchInputRef = useRef(null)
  const sbDragSrc = useRef(null)
  const tbDragSrc = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        const prenom = u.user_metadata?.prenom || u.email?.split('@')[0] || 'Utilisateur'
        setUsername(prenom)
      }
    })
  }, [])

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus()
  }, [searchOpen])

  useEffect(() => {
    function handler(e) {
      if (!e.target.closest('#notif-drop') && !e.target.closest('.tb-icon[data-notif]')) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  function navigate(view) {
    setCurView(view)
  }

  function clearNotifs() {
    setNotifs(n => n.map(x => ({ ...x, unread: false })))
    setNotifDot(false)
  }

  function addSbItem(id) {
    const item = ALL_SB_ITEMS.find(i => i.id === id)
    if (!item || sbItems.find(i => i.id === id)) return
    setSbItems(prev => [...prev, item])
  }

  function removeSbItem(id) {
    setSbItems(prev => prev.length <= 1 ? prev : prev.filter(i => i.id !== id))
  }

  function toggleTbVis(idx) {
    setTbItems(prev => prev.map((item, i) => i === idx ? { ...item, vis: !item.vis } : item))
  }

  function toggleWidget(key) {
    setWidgets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleAllWidgets() {
    const allOn = Object.values(widgets).every(Boolean)
    setWidgets(Object.fromEntries(Object.keys(widgets).map(k => [k, !allOn])))
  }

  function applyTheme(th) {
    setAccent(th.ac)
    setBgCol(th.bg)
  }

  function handleSignOut() {
    setDecoOpen(false)
    setUsername('Déconnecté')
    onSignOut?.()
  }

  // Drag helpers for panel lists
  function sbPanelDrop(fromIdx, toIdx) {
    const next = [...sbItems]
    const [m] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, m)
    setSbItems(next)
  }

  function tbPanelDrop(fromIdx, toIdx) {
    const next = [...tbItems]
    const [m] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, m)
    setTbItems(next)
  }

  useEffect(() => {
    document.documentElement.style.fontSize = `${fs}%`
    localStorage.setItem('napo_font_size', fs)
  }, [fs])

  useEffect(() => {
    localStorage.setItem(SB_STORAGE_KEY, JSON.stringify(sbItems.map(i => i.id)))
  }, [sbItems])

  return (
    <div className="app" id="app">
      <TopBar
        tbItems={tbItems} setTbItems={setTbItems}
        tbActif={tbActif} setTbActif={setTbActif}
        accent={accent}
        username={username} initials={username.charAt(0).toUpperCase()}
        notifOpen={notifOpen} setNotifOpen={setNotifOpen}
        notifDot={notifDot} setNotifDot={setNotifDot}
        searchOpen={searchOpen} setSearchOpen={setSearchOpen}
        decoOpen={decoOpen} setDecoOpen={setDecoOpen}
        onNavigate={navigate}
      />

      {/* Notifications dropdown */}
      <div className={`notif-drop${notifOpen ? ' open' : ''}`} id="notif-drop">
        <div className="nd-head">
          <span className="nd-title">Notifications</span>
          <button className="nd-clear" onClick={clearNotifs}>Tout marquer lu</button>
        </div>
        {notifs.map(n => (
          <div key={n.id} className={`nd-item${n.unread ? ' unread' : ''}`}>
            <div className="nd-ico" style={{ background: n.bg }}>
              <i className={`ti ${n.icon}`} style={{ color: n.iconColor }} aria-hidden="true" />
            </div>
            <div className="nd-body">
              <div className="nd-msg">{n.msg}</div>
              <div className="nd-time">{n.time}</div>
            </div>
            {n.unread && <div className="nd-dot" />}
          </div>
        ))}
      </div>

      {/* Search overlay */}
      <div className={`search-overlay${searchOpen ? ' open' : ''}`}>
        <i className="ti ti-search" style={{ fontSize: 14, color: 'var(--color-text-secondary)' }} aria-hidden="true" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Rechercher un client, une tâche, une facture..."
          aria-label="Recherche"
        />
        <button onClick={() => setSearchOpen(false)}>Fermer</button>
      </div>

      {/* Logout modal */}
      <div className={`deco-backdrop${decoOpen ? ' open' : ''}`}>
        <div className="deco-box">
          <div className="deco-head">
            <div className="deco-ring"><i className="ti ti-power" aria-hidden="true" /></div>
            <div className="deco-name">Se déconnecter ?</div>
            <div className="deco-sub">Nathalie Alpha · Plan Créateur</div>
          </div>
          <div className="deco-foot">
            <button className="deco-cancel" onClick={() => setDecoOpen(false)}>Annuler</button>
            <button className="deco-confirm" onClick={handleSignOut}>Déconnecter</button>
          </div>
        </div>
      </div>

      <div className="body">
        <SideBar
          accent={accent} bgCol={bgCol}
          activePanel={activePanel} setActivePanel={setActivePanel}
          username={username}
          items={sbItems} setItems={setSbItems}
        />

        {/* Panel Perso */}
        <div className={`side-panel${activePanel === 'perso' ? ' open' : ''}`}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Personnaliser</div>
              <div className="panel-sub">Sidebar et topbar</div>
            </div>
            <button className="panel-close" aria-label="Fermer" onClick={() => setActivePanel(null)}>
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="panel-body">
            <div className="pl">Sidebar — glisse pour réordonner</div>
            {sbItems.map((item, idx) => (
              <DragRow
                key={item.id}
                icon={item.icon} label={item.label} accent={accent}
                onDragStart={() => { sbDragSrc.current = idx }}
                onDrop={() => { if (sbDragSrc.current !== null && sbDragSrc.current !== idx) { sbPanelDrop(sbDragSrc.current, idx); sbDragSrc.current = null } }}
                action={<button aria-label={`Supprimer ${item.label}`} onClick={() => removeSbItem(item.id)}><i className="ti ti-trash" /></button>}
              />
            ))}
            {ALL_SB_ITEMS.filter(i => !sbItems.find(s => s.id === i.id)).length > 0 && (
              <>
                <div className="pl">Éléments disponibles</div>
                {ALL_SB_ITEMS.filter(i => !sbItems.find(s => s.id === i.id)).map(item => (
                  <div key={item.id} className="drag-row" style={{ cursor: 'default', opacity: .7 }}>
                    <i className={`ti ${item.icon} ico`} style={{ color: accent }} aria-hidden="true" />
                    <span className="dname">{item.label}</span>
                    <button aria-label={`Ajouter ${item.label}`} onClick={() => addSbItem(item.id)}>
                      <i className="ti ti-plus" />
                    </button>
                  </div>
                ))}
              </>
            )}
            <div className="pl" style={{ marginTop: 12 }}>Topbar — glisse + œil pour masquer</div>
            {tbItems.map((item, idx) => (
              <DragRow
                key={item.id}
                icon={item.icon} label={item.label} accent={accent}
                onDragStart={() => { tbDragSrc.current = idx }}
                onDrop={() => { if (tbDragSrc.current !== null && tbDragSrc.current !== idx) { tbPanelDrop(tbDragSrc.current, idx); tbDragSrc.current = null } }}
                action={
                  <button aria-label={item.vis ? `Masquer ${item.label}` : `Afficher ${item.label}`} onClick={() => toggleTbVis(idx)}>
                    <i className={`ti ${item.vis ? 'ti-eye' : 'ti-eye-off'}`} />
                  </button>
                }
              />
            ))}
          </div>
        </div>

        {/* Panel Settings */}
        <div className={`side-panel${activePanel === 'settings' ? ' open' : ''}`}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Paramètres</div>
              <div className="panel-sub">Apparence & accessibilité</div>
            </div>
            <button className="panel-close" aria-label="Fermer" onClick={() => setActivePanel(null)}>
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="panel-body">
            <div className="pl">Couleur accent</div>
            <div className="sw-group">
              {ACCENT_SWATCHES.map(c => (
                <div key={c} className={`sw${accent === c ? ' sel' : ''}`} style={{ background: c }}
                  onClick={() => setAccent(c)} />
              ))}
            </div>
            <div className="cr">
              <label>Libre :</label>
              <input type="color" value={accent} onChange={e => setAccent(e.target.value)} />
            </div>

            <div className="pl">Fond sidebar</div>
            <div className="sw-group">
              {BG_SWATCHES.map(c => (
                <div key={c} className={`sw${bgCol === c ? ' sel' : ''}`} style={{ background: c }}
                  onClick={() => setBgCol(c)} />
              ))}
            </div>
            <div className="cr">
              <label>Libre :</label>
              <input type="color" value={bgCol} onChange={e => setBgCol(e.target.value)} />
            </div>

            <div className="pl">Thèmes</div>
            <div className="th-grid">
              {THEMES.map(th => (
                <div key={th.name} className={`th-card${accent === th.ac && bgCol === th.bg ? ' sel' : ''}`}
                  onClick={() => applyTheme(th)}>
                  <div className="th-dot" style={{ background: th.bg }} />
                  <div className="th-name">{th.name}</div>
                </div>
              ))}
            </div>

            <div className="pl" style={{ marginTop: 10 }}>Widgets dashboard</div>
            {[
              { key: 'clock', label: 'Horloge', bg: '#E6F1FB', icon: 'ti-clock', color: '#185FA5' },
              { key: 'meteo', label: 'Météo', bg: '#E6F1FB', icon: 'ti-cloud-sun', color: '#378ADD' },
              { key: 'lune', label: 'Phase de lune', bg: '#EEEDFE', icon: 'ti-moon', color: '#534AB7' },
              { key: 'fete', label: 'Fête du jour', bg: '#FAEEDA', icon: 'ti-star', color: '#854F0B' },
              { key: 'ferie', label: 'Jours fériés', bg: '#FBEAF0', icon: 'ti-calendar-event', color: '#993556' },
              { key: 'mantra', label: 'Mantra', bg: '#E6F1FB', icon: 'ti-message-circle', color: '#185FA5' },
            ].map(w => (
              <div className="prow" key={w.key}>
                <div className="pico" style={{ background: w.bg }}>
                  <i className={`ti ${w.icon}`} style={{ color: w.color }} aria-hidden="true" />
                </div>
                <div className="ptxt"><div className="plbl">{w.label}</div></div>
                <Toggle on={widgets[w.key]} onClick={() => toggleWidget(w.key)} label={w.label} />
              </div>
            ))}
            <div className="prow" style={{ borderTop: '2px solid var(--color-border-secondary)', marginTop: 5, paddingTop: 7 }}>
              <div className="pico" style={{ background: '#f1efe8' }}>
                <i className="ti ti-power" style={{ color: '#5F5E5A' }} aria-hidden="true" />
              </div>
              <div className="ptxt"><div className="plbl">Tout désactiver</div></div>
              <Toggle on={Object.values(widgets).every(Boolean)} onClick={toggleAllWidgets} label="Tout" />
            </div>

            <div className="pl" style={{ marginTop: 12 }}>Accessibilité</div>
            <div className="prow">
              <div className="pico" style={{ background: '#E6F1FB' }}>
                <i className="ti ti-typography" style={{ color: '#185FA5' }} aria-hidden="true" />
              </div>
              <div className="ptxt">
                <div className="plbl">Taille police</div>
                <div className="fsc">
                  <button className="fsb" onClick={() => setFs(f => Math.max(70, f - 10))}>−</button>
                  <span className="fsv">{fs}%</span>
                  <button className="fsb" onClick={() => setFs(f => Math.min(150, f + 10))}>+</button>
                </div>
              </div>
            </div>
            <div className="prow">
              <div className="pico" style={{ background: '#f1efe8' }}>
                <i className="ti ti-refresh" style={{ color: '#5F5E5A' }} aria-hidden="true" />
              </div>
              <div className="ptxt"><div className="plbl">Réinitialiser</div></div>
              <button className="rst-btn" onClick={() => { setFs(100); setAccent('#B8961E'); setBgCol('#1E1A4E') }}>Reset</button>
            </div>
          </div>
        </div>

        <main className="main">
          <Routes>
            <Route path="/"         element={<Navigate to="/board" replace />} />
            <Route path="/board"    element={<Dashboard accent={accent} sbActif="dashboard" sbItems={sbItems} widgets={widgets} setWidgets={setWidgets} />} />
            <Route path="/seances/nouvelle" element={<NouvelleSeance />} />
            <Route path="/seances"          element={<Seances />} />
            <Route path="/clients"  element={<Clients />} />
            <Route path="/agenda"   element={<Agenda />} />
            <Route path="/notes"    element={<Notes />} />
            <Route path="/fleurs-de-bach"                element={<FicheClientBach />} />
            <Route path="/fleurs-de-bach/nouvelle-seance" element={<FicheClientBach />} />
            <Route path="/factures" element={<SimplePage view="factures" />} />
            <Route path="/fiscal"   element={<SimulateurFiscal />} />
            <Route path="/profil"   element={<ProfilPage accent={accent} onSignOut={() => setDecoOpen(true)} />} />
            <Route path="/faq"      element={<SimplePage view="faq" />} />
            <Route path="/aide"     element={<SimplePage view="aide" />} />
            <Route path="/news"     element={<SimplePage view="news" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function Toggle({ on, onClick, label }) {
  return (
    <button className={`tog ${on ? 'on' : 'off'}`} aria-label={label} onClick={onClick}>
      <div className="tog-thumb" />
    </button>
  )
}

function DragRow({ icon, label, accent, onDragStart, onDrop, action }) {
  return (
    <div
      className="drag-row"
      draggable
      onDragStart={e => { onDragStart(); e.currentTarget.style.opacity = '.4'; e.dataTransfer.effectAllowed = 'move' }}
      onDragEnd={e => { e.currentTarget.style.opacity = '1' }}
      onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over-r') }}
      onDragLeave={e => e.currentTarget.classList.remove('drag-over-r')}
      onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('drag-over-r'); onDrop() }}
    >
      <i className="ti ti-grip-vertical grip" aria-hidden="true" />
      <i className={`ti ${icon} ico`} style={{ color: accent }} aria-hidden="true" />
      <span className="dname">{label}</span>
      {action}
    </div>
  )
}
