import { useRef, useState } from 'react'
import napopetit from '../assets/napopetitv1.png'
import NotificationBell from './NotificationBell'
import SearchBar from './SearchBar'
import ModuleLauncher from './ModuleLauncher'

export default function TopBar({
  tbItems, setTbItems,
  tbActif, setTbActif,
  accent,
  username, initials,
  decoOpen, setDecoOpen,
  onNavigate,
}) {
  const dragSrc = useRef(null)
  const [launcherOpen, setLauncherOpen] = useState(false)

  function handleClick(item) {
    setTbActif(item.id)
    if (['faq', 'aide', 'newsnapo'].includes(item.id)) onNavigate(item.id)
  }

  function onDragStart(e, idx) {
    dragSrc.current = idx
    e.currentTarget.classList.add('dragging')
    e.dataTransfer.effectAllowed = 'move'
  }
  function onDragEnd(e) {
    e.currentTarget.classList.remove('dragging')
    document.querySelectorAll('.tb-btn').forEach(b => b.classList.remove('drag-over'))
  }
  function onDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over') }
  function onDragLeave(e) { e.currentTarget.classList.remove('drag-over') }
  function onDrop(e, toIdx) {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    if (dragSrc.current !== null && dragSrc.current !== toIdx) {
      const next = [...tbItems]
      const [moved] = next.splice(dragSrc.current, 1)
      next.splice(toIdx, 0, moved)
      dragSrc.current = null
      setTbItems(next)
    }
  }

  const visibleItems = tbItems.filter(o => o.vis)

  return (
    <div className="topbar" style={{ position: 'relative' }}>

      <img
        src={napopetit}
        alt="Naposolo"
        style={{ height: 32, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
      />

      <nav className="tb-nav" aria-label="Navigation principale">
        {visibleItems.map((item) => {
          const isActive = item.id === tbActif
          return (
            <button
              key={item.id}
              className={`tb-btn${isActive ? ' active' : ''}`}
              draggable
              title={item.label}
              onClick={() => handleClick(item)}
              onDragStart={e => onDragStart(e, tbItems.indexOf(item))}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={e => onDrop(e, tbItems.indexOf(item))}
              style={isActive ? { '--btn-accent': accent } : {}}
            >
              <i className={`ti ${item.icon}`} style={{ color: isActive ? accent : '#6B7280' }} aria-hidden="true" />
              <span style={{ color: isActive ? accent : '#6B7280' }}>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="tb-right">

        <SearchBar onNavigate={onNavigate} />

        <NotificationBell />

        <div className="tb-sep-v" />

        <div style={{ position: 'relative' }}>
          <button
            className={`tb-icon${launcherOpen ? ' active' : ''}`}
            aria-label="Modules"
            title="Modules Naposolo"
            onClick={() => setLauncherOpen(o => !o)}
            style={{
              background: launcherOpen ? 'var(--color-background-secondary)' : 'transparent',
              border: launcherOpen ? '0.5px solid var(--color-border-secondary)' : '0.5px solid transparent',
            }}
          >
            <i className="ti ti-grid-dots" aria-hidden="true" />
          </button>

          <ModuleLauncher
            open={launcherOpen}
            onClose={() => setLauncherOpen(false)}
            onNavigate={onNavigate}
          />
        </div>

        <div className="tb-sep-v" />

        <button
          className="tb-profile"
          aria-label="Mon profil"
          onClick={() => onNavigate('profil')}
        >
          <div className="tb-av" style={{ color: accent }}>{initials}</div>
          <span className="tb-uname">{username}</span>
          <i className="ti ti-chevron-down" style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }} aria-hidden="true" />
        </button>

        <div className="tb-sep-v" />

        <button
          className="tb-deco"
          aria-label="Se déconnecter"
          title="Se déconnecter"
          onClick={() => setDecoOpen(true)}
        >
          <i className="ti ti-power" aria-hidden="true" />
        </button>

      </div>
    </div>
  )
}
