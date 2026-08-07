import React, { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import TopBar from './components/TopBar'
import SideBar from './components/SideBar'
import { supabase } from './lib/supabase'
import { useActivityTracker } from './hooks/useActivityTracker'
import { useIsMobile } from './hooks/useIsMobile'
import WelcomeModal from './components/WelcomeModal'
import ConsentRgpdGate from './components/ConsentRgpdGate'
import NapoAssistant from './components/NapoAssistant'
import BottomNav from './components/BottomNav'

const scopedKey = (key, userId) => `${key}_${userId ?? 'guest'}`

const Dashboard = lazy(() => import('./components/Dashboard'))
const ProfilPage = lazy(() => import('./components/ProfilPage'))
const Seances = lazy(() => import('./pages/Seances'))
const NouvelleSeance = lazy(() => import('./pages/NouvelleSeance'))
const Clients = lazy(() => import('./pages/Clients'))
const Agenda = lazy(() => import('./pages/Agenda'))
const Notes = lazy(() => import('./pages/Notes'))
const FicheClientBach = lazy(() => import('./components/FicheClientBach'))
const PageBach = lazy(() => import('./pages/PageBach'))
const SimulateurFiscal = lazy(() => import('./components/SimulateurFiscal'))
const Factures = lazy(() => import('./pages/Factures'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Aide = lazy(() => import('./pages/Aide'))
const NewsNapo = lazy(() => import('./pages/NewsNapo'))
const NapoMarketplace = lazy(() => import('./pages/NapoMarketplace'))
const NotFound = lazy(() => import('./pages/NotFound'))
const FicheSeance = lazy(() => import('./pages/FicheSeance'))
const BilanMiParcours = lazy(() => import('./pages/BilanMiParcours'))
const Energie = lazy(() => import('./pages/Energie'))
const EnergieSéance = lazy(() => import('./pages/EnergieSéance'))
const Magnetisme = lazy(() => import('./pages/Magnetisme'))
const MagnetismeSeance = lazy(() => import('./pages/MagnetismeSeance'))
const Mediumnite = lazy(() => import('./pages/Mediumnite'))
const MediumniteSeance = lazy(() => import('./pages/MediumniteSeance'))
const Radiesthesie = lazy(() => import('./pages/Radiesthesie'))
const RadiesthesieSeance = lazy(() => import('./pages/RadiesthesieSeance'))
const NapoLive = lazy(() => import('./components/NapoLive'))
const Yoga = lazy(() => import('./pages/Yoga'))
const YogaSeance = lazy(() => import('./pages/YogaSeance'))
const Naturopathie = lazy(() => import('./pages/Naturopathie'))
const NaturopathieSeance = lazy(() => import('./pages/NaturopathieSeance'))
const Aromatherapie = lazy(() => import('./pages/Aromatherapie'))
const AromatherapieSeance = lazy(() => import('./pages/AromatherapieSeance'))
const Sonotherapie = lazy(() => import('./pages/Sonotherapie'))
const SonotherapieSeance = lazy(() => import('./pages/SonotherapieSeance'))
const Massage = lazy(() => import('./pages/Massage'))
const MassageSeance = lazy(() => import('./pages/MassageSeance'))
const Sophrologie = lazy(() => import('./pages/Sophrologie'))
const SophrologieSeance = lazy(() => import('./pages/SophrologieSeance'))
const Hypnotherapie = lazy(() => import('./pages/Hypnotherapie'))
const HypnotherapieSeance = lazy(() => import('./pages/HypnotherapieSeance'))
const Chamanisme = lazy(() => import('./pages/Chamanisme'))
const ChamanismeSeance = lazy(() => import('./pages/ChamanismeSeance'))
const Astrologie = lazy(() => import('./pages/Astrologie'))
const AstrologieSeance = lazy(() => import('./pages/AstrologieSeance'))
const NapoOracle = lazy(() => import('./pages/NapoOracle'))
const NapoOracleSéance = lazy(() => import('./pages/NapoOracleSéance'))
const Napo3D = lazy(() => import('./pages/Napo3D'))
const Napo3DSeance = lazy(() => import('./pages/Napo3DSeance'))
const NouvelleSeanceStandard = lazy(() => import('./pages/NouvelleSeanceStandard'))

class ChunkErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch() {
    const reloads = parseInt(sessionStorage.getItem('chunk_reloads') || '0')
    if (reloads < 2) {
      sessionStorage.setItem('chunk_reloads', reloads + 1)
      window.location.reload()
    } else {
      sessionStorage.removeItem('chunk_reloads')
    }
  }
  render() {
    if (this.state.hasError) return <div style={{padding:'2rem',color:'#666'}}>Rechargement...</div>
    return this.props.children
  }
}

const ALL_SB_ITEMS = [
  { id: 'board',    label: 'Board',    icon: 'ti-layout-dashboard', to: '/board'    },
  { id: 'seances',  label: 'Séances',  icon: 'ti-calendar-plus',    to: '/seances'  },
  { id: 'napo3d',   label: 'Napo-3D',  icon: 'ti-3d-cube-sphere',   to: '/napo-3d', moduleTitle: '3D Humains'  },
  { id: 'clients',     label: 'Clients',        icon: 'ti-users',          to: '/clients'                        },
  { id: 'bach',        label: 'Fleurs de Bach', icon: 'ti-leaf',           to: '/fleurs-de-bach', moduleTitle: 'Fleurs de Bach'                 },
  { id: 'agenda',      label: 'Agenda',         icon: 'ti-calendar',       to: '/agenda'                         },
  { id: 'notes',    label: 'Notes',    icon: 'ti-notebook',         to: '/notes'    },
  { id: 'energie',  label: 'Énergie',  icon: 'ti-sparkles',         to: '/energie', moduleTitle: 'NapoÉnergie' },
  { id: 'magnetisme', label: 'Magnétisme', icon: 'ti-hand-stop',    to: '/magnetisme', moduleTitle: 'Napo-Magnétiseur' },
  { id: 'mediumnite', label: 'Médium',     icon: 'ti-ghost',        to: '/mediumnite', moduleTitle: 'Napo-Médium' },
  { id: 'radiesthesie', label: 'Radiesthésie', icon: 'ti-pendulum', to: '/radiesthesie', moduleTitle: 'Napo-Radiesthésie' },
  { id: 'napo-yoga', label: 'Yoga', icon: 'ti-yoga', to: '/napo-yoga', moduleTitle: 'Napo-Yoga' },
  { id: 'napo-naturopathie', label: 'Naturopathie', icon: 'ti-plant-2', to: '/napo-naturopathie', moduleTitle: 'Napo-Naturopathie' },
  { id: 'napo-aromatherapie', label: 'Aromathérapie', icon: 'ti-droplet', to: '/napo-aromatherapie', moduleTitle: 'Napo-Aromathérapie' },
  { id: 'napo-sonotherapie', label: 'Sonothérapie', icon: 'ti-wave-sine', to: '/napo-sonotherapie', moduleTitle: 'Napo-Sonothérapie' },
  { id: 'napo-massage', label: 'Massage', icon: 'ti-hand-move', to: '/napo-massage', moduleTitle: 'Napo-Massage' },
  { id: 'napo-sophrologie', label: 'Sophrologie', icon: 'ti-mood-smile', to: '/napo-sophrologie', moduleTitle: 'Napo-Sophrologie' },
  { id: 'napo-hypnotherapie', label: 'Hypnothérapie', icon: 'ti-spiral', to: '/napo-hypnotherapie', moduleTitle: 'Napo-Hypnothérapie' },
  { id: 'napo-chamanisme', label: 'Chamanisme', icon: 'ti-feather', to: '/napo-chamanisme', moduleTitle: 'Napo-Chamanisme' },
  { id: 'napo-astrologie', label: 'Astrologie', icon: 'ti-moon-stars', to: '/napo-astrologie', moduleTitle: 'Napo-Astrologie' },
  { id: 'napo-oracle', label: 'Napo-Oracle', icon: 'ti-cards', to: '/napo-oracle', moduleTitle: 'NapoOracle' },
  { id: 'factures', label: 'Facturation', icon: 'ti-file',       to: '/factures' },
  { id: 'fiscal',   label: 'Fiscalité', icon: 'ti-calculator',   to: '/fiscal'   },
  { id: 'marketplace',   label: 'Marketplace',  icon: 'ti-building-store',  to: '/marketplace'    },
]

const SB_STORAGE_KEY = 'napo_sb_items_v2'
const SB_REMOVED_KEY = 'napo_sb_removed_v1'
function loadSbRemoved(userId) {
  try {
    const saved = JSON.parse(localStorage.getItem(scopedKey(SB_REMOVED_KEY, userId)))
    if (Array.isArray(saved)) return saved
  } catch {}
  return []
}

function loadSbItems(userId) {
  try {
    const saved = JSON.parse(localStorage.getItem(scopedKey(SB_STORAGE_KEY, userId)))
    if (!Array.isArray(saved) || saved.length === 0) return ALL_SB_ITEMS
    const map = Object.fromEntries(ALL_SB_ITEMS.map(i => [i.id, i]))
    const result = saved.map(id => map[id]).filter(Boolean)
    if (result.length === 0) return ALL_SB_ITEMS
    // Append any new items not yet in saved order — sauf ceux explicitement supprimés par l'utilisateur
    const removed = new Set(loadSbRemoved(userId))
    const resultIds = new Set(result.map(i => i.id))
    ALL_SB_ITEMS.filter(i => !resultIds.has(i.id) && !removed.has(i.id)).forEach(i => result.push(i))
    return result
  } catch { return ALL_SB_ITEMS }
}

const SB_VIS_KEY = 'napo_sb_vis_v1'

function loadSbVis(userId) {
  try {
    const saved = JSON.parse(localStorage.getItem(scopedKey(SB_VIS_KEY, userId)))
    if (saved && typeof saved === 'object') return saved
  } catch {}
  return { factures: false, fiscal: false }
}

const DEFAULT_TB_ITEMS = [
  { id: 'faq',  label: 'FAQ',  icon: 'ti-help-circle',  vis: true },
  { id: 'aide', label: 'Aide', icon: 'ti-lifebuoy',     vis: true },
  { id: 'newsnapo', label: 'News', icon: 'ti-speakerphone', vis: true },
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
  useActivityTracker()
  const isMobile = useIsMobile()
  const routerNavigate = useNavigate()
  const [sbItems, setSbItems] = useState(() => loadSbItems(user?.id))
  const [sbRemoved, setSbRemoved] = useState(() => loadSbRemoved(user?.id))
  const [sbVis, setSbVis] = useState(() => loadSbVis(user?.id))
  const [metierModuleMap, setMetierModuleMap] = useState({})
  const [activeModuleIds, setActiveModuleIds] = useState(new Set())
  const [tbItems, setTbItems] = useState(DEFAULT_TB_ITEMS)
  const [sbActif, setSbActif] = useState('dashboard')
  const [tbActif, setTbActif] = useState('')
  const [curView, setCurView] = useState('dash')
  const [accent, setAccent] = useState(() => localStorage.getItem(scopedKey('napo_accent', user?.id)) || '#B8961E')
  const [bgCol, setBgCol] = useState(() => localStorage.getItem(scopedKey('napo_bgcol', user?.id)) || '#1E1A4E')
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem(scopedKey('napo_widgets', user?.id))
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS
  })
  const [activePanel, setActivePanel] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [decoOpen, setDecoOpen] = useState(false)
  const [username, setUsername] = useState(() => {
    // sera remplacé par les données Supabase au montage
    return user?.user_metadata?.prenom || user?.email?.split('@')[0] || 'Utilisateur'
  })
  const [fs, setFs] = useState(() => parseInt(localStorage.getItem('napo_font_size') || '100', 10))
  const [userId,     setUserId]     = useState(null)
  const [prefsLoaded,setPrefsLoaded]= useState(false)
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

  // Gating sidebar : une entrée liée à un module Napo-Métiers (moduleTitle)
  // n'est visible que si ce module est présent dans profil_modules_actifs
  // pour ce praticien. Ré-vérifié à chaque montage (pas de state figé).
  useEffect(() => {
    if (!user?.id) return
    async function loadGating() {
      const { data: mods } = await supabase.from('marketplace_modules')
        .select('id, title').eq('category', 'Napo-Métiers').eq('status', 'available')
      const map = {}
      ;(mods || []).forEach(m => { map[m.title] = m.id })
      setMetierModuleMap(map)
      const ids = (mods || []).map(m => m.id)
      if (ids.length) {
        const { data: actifs } = await supabase.from('profil_modules_actifs')
          .select('module_id').eq('user_id', user.id).in('module_id', ids)
        setActiveModuleIds(new Set((actifs || []).map(a => a.module_id)))
      }
    }
    loadGating()
  }, [user?.id])

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus()
  }, [searchOpen])

  function navigate(view) {
    setCurView(view)
  }

  function addSbItem(id) {
    const item = ALL_SB_ITEMS.find(i => i.id === id)
    if (!item || sbItems.find(i => i.id === id)) return
    setSbItems(prev => [...prev, item])
    setSbRemoved(prev => prev.filter(rid => rid !== id))
  }

  function removeSbItem(id) {
    setSbItems(prev => prev.length <= 1 ? prev : prev.filter(i => i.id !== id))
    setSbRemoved(prev => prev.includes(id) ? prev : [...prev, id])
  }

  function toggleSbVis(id) {
    setSbVis(prev => ({ ...prev, [id]: prev[id] === false }))
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
    document.documentElement.style.setProperty('--color-accent', accent)
    localStorage.setItem(scopedKey('napo_accent', user?.id), accent)
  }, [accent])

  useEffect(() => {
    localStorage.setItem(scopedKey('napo_bgcol', user?.id), bgCol)
  }, [bgCol])

  useEffect(() => {
    localStorage.setItem(scopedKey('napo_widgets', user?.id), JSON.stringify(widgets))
  }, [widgets])

  useEffect(() => {
    localStorage.setItem(scopedKey(SB_STORAGE_KEY, user?.id), JSON.stringify(sbItems.map(i => i.id)))
  }, [sbItems])
  useEffect(() => {
    localStorage.setItem(scopedKey(SB_REMOVED_KEY, user?.id), JSON.stringify(sbRemoved))
  }, [sbRemoved])

  useEffect(() => {
    localStorage.setItem(scopedKey(SB_VIS_KEY, user?.id), JSON.stringify(sbVis))
  }, [sbVis])

  // Sauvegarde auto Supabase (debounce 1s)
  useEffect(() => {
    if (!userId || !prefsLoaded) return
    const timer = setTimeout(async () => {
      try {
        await supabase.from('profiles').update({
          preferences: {
            accent, bgCol, fs,
            widgets,
            sbItems: sbItems.map(i => i.id),
            sbVis,
          }
        }).eq('id', userId)
      } catch(e) { console.warn('savePrefs:', e) }
    }, 1000)
    return () => clearTimeout(timer)
  }, [accent, bgCol, fs, widgets, sbItems, sbVis, userId, prefsLoaded])

  return (
    <div className="app" id="app">
      <TopBar
        tbItems={tbItems} setTbItems={setTbItems}
        tbActif={tbActif} setTbActif={setTbActif}
        accent={accent}
        username={username} initials={username.charAt(0).toUpperCase()}
        searchOpen={searchOpen} setSearchOpen={setSearchOpen}
        decoOpen={decoOpen} setDecoOpen={setDecoOpen}
        onNavigate={id => routerNavigate(`/${id}`)}
      />

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
        {!isMobile && <SideBar
          accent={accent} bgCol={bgCol}
          activePanel={activePanel} setActivePanel={setActivePanel}
          username={username}
          items={sbItems.filter(i => {
            if (sbVis[i.id] === false) return false
            if (i.moduleTitle) {
              const modId = metierModuleMap[i.moduleTitle]
              if (modId && !activeModuleIds.has(modId)) return false
            }
            return true
          })} setItems={setSbItems}
        />}
        {isMobile && <BottomNav accent={accent} />}

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
            <div className="pl">Sidebar — glisse + œil pour masquer</div>
            {sbItems.map((item, idx) => (
              <DragRow
                key={item.id}
                icon={item.icon} label={item.label} accent={accent}
                onDragStart={() => { sbDragSrc.current = idx }}
                onDrop={() => { if (sbDragSrc.current !== null && sbDragSrc.current !== idx) { sbPanelDrop(sbDragSrc.current, idx); sbDragSrc.current = null } }}
                action={
                  (item.id === 'factures' || item.id === 'fiscal')
                    ? <button aria-label={sbVis[item.id] !== false ? `Masquer ${item.label}` : `Afficher ${item.label}`} onClick={() => toggleSbVis(item.id)}>
                        <i className={`ti ${sbVis[item.id] !== false ? 'ti-eye' : 'ti-eye-off'}`} />
                      </button>
                    : <button aria-label={`Supprimer ${item.label}`} onClick={() => removeSbItem(item.id)}><i className="ti ti-trash" /></button>
                }
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
          <ChunkErrorBoundary><Suspense fallback={<div style={{padding:'2rem',color:'#666'}}>Chargement...</div>}>
            <Routes>
              <Route path="/"         element={<Navigate to="/board" replace />} />
              <Route path="/board"    element={<Dashboard accent={accent} sbActif="dashboard" sbItems={sbItems} widgets={widgets} setWidgets={setWidgets} onNavigate={routerNavigate} />} />
              <Route path="/seances/nouvelle" element={<NouvelleSeance />} />
              <Route path="/seances/nouvelle-standard" element={<NouvelleSeanceStandard />} />
              <Route path="/seances/:id/fiche" element={<FicheSeance />} />
              <Route path="/seances"          element={<Seances />} />
              <Route path="/napo-3d" element={<Napo3D />} />
              <Route path="/napo-3d/seance/:id" element={<Napo3DSeance />} />
              <Route path="/napo-3d/nouvelle" element={<NouvelleSeance />} />
              <Route path="/clients/:clientId/bilan" element={<BilanMiParcours />} />
              <Route path="/clients"  element={<Clients />} />
              <Route path="/agenda"   element={<Agenda />} />
              <Route path="/notes"    element={<Notes />} />
              <Route path="/energie"              element={<Energie />} />
              <Route path="/energie/:id"          element={<EnergieSéance />} />
              <Route path="/magnetisme"           element={<Magnetisme />} />
              <Route path="/magnetisme/:id"       element={<MagnetismeSeance />} />
              <Route path="/mediumnite"           element={<Mediumnite />} />
              <Route path="/mediumnite/:id"       element={<MediumniteSeance />} />
              <Route path="/radiesthesie"         element={<Radiesthesie />} />
              <Route path="/radiesthesie/:id"     element={<RadiesthesieSeance />} />
              <Route path="/live/:module/:id"     element={<NapoLive />} />
              <Route path="/napo-yoga"            element={<Yoga />} />
              <Route path="/napo-yoga/:id"        element={<YogaSeance />} />
              <Route path="/napo-naturopathie"      element={<Naturopathie />} />
              <Route path="/napo-naturopathie/:id"  element={<NaturopathieSeance />} />
              <Route path="/napo-aromatherapie"     element={<Aromatherapie />} />
              <Route path="/napo-aromatherapie/:id" element={<AromatherapieSeance />} />
              <Route path="/napo-sonotherapie"      element={<Sonotherapie />} />
              <Route path="/napo-sonotherapie/:id"  element={<SonotherapieSeance />} />
              <Route path="/napo-massage"           element={<Massage />} />
              <Route path="/napo-massage/:id"       element={<MassageSeance />} />
              <Route path="/napo-sophrologie"       element={<Sophrologie />} />
              <Route path="/napo-sophrologie/:id"   element={<SophrologieSeance />} />
              <Route path="/napo-hypnotherapie"     element={<Hypnotherapie />} />
              <Route path="/napo-hypnotherapie/:id" element={<HypnotherapieSeance />} />
              <Route path="/napo-chamanisme"        element={<Chamanisme />} />
              <Route path="/napo-chamanisme/:id"    element={<ChamanismeSeance />} />
              <Route path="/napo-astrologie"        element={<Astrologie />} />
              <Route path="/napo-astrologie/:id"    element={<AstrologieSeance />} />
              <Route path="/napo-oracle"              element={<NapoOracle />} />
              <Route path="/napo-oracle/:id"          element={<NapoOracleSéance />} />
              <Route path="/fleurs-de-bach"                element={<PageBach />} />
              <Route path="/fleurs-de-bach/:clientId?" element={<FicheClientBach />} />
              <Route path="/factures" element={<Factures />} />
              <Route path="/fiscal"    element={<SimulateurFiscal />} />
              <Route path="/marketplace" element={<NapoMarketplace />} />
              <Route path="/profil"   element={<ProfilPage accent={accent} onSignOut={() => setDecoOpen(true)} />} />
              <Route path="/faq"      element={<FAQ />} />
              <Route path="/aide"     element={<Aide />} />
              <Route path="/newsnapo" element={<NewsNapo />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense></ChunkErrorBoundary>
        </main>
      </div>
      <ConsentRgpdGate user={user} />
      <WelcomeModal user={user} />
      <NapoAssistant />
      {isMobile && <BottomNav accent={accent} />}
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
