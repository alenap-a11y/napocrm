import { useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'

function SbLabel({ collapsed, className, style, children }) {
  return (
    <span
      className={`sb-label${collapsed ? ' collapsed' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      {children}
    </span>
  )
}

export default function SideBar({
  accent, bgCol,
  activePanel, setActivePanel,
  username,
  items,
  setItems,
  collapsed, onToggleCollapse,
}) {
  const [hoveredTo, setHoveredTo] = useState(null)
  const [dragOverTo, setDragOverTo] = useState(null)
  const dragSrc = useRef(null)

  function togglePanel(name) {
    setActivePanel(p => p === name ? null : name)
  }

  function onDragStart(e, idx) {
    dragSrc.current = idx
    e.dataTransfer.effectAllowed = 'move'
    e.currentTarget.style.opacity = '.4'
  }

  function onDragEnd(e) {
    e.currentTarget.style.opacity = '1'
    setDragOverTo(null)
  }

  function onDragOver(e, to) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverTo(to)
  }

  function onDrop(e, toIdx) {
    e.preventDefault()
    setDragOverTo(null)
    const from = dragSrc.current
    if (from === null || from === toIdx) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(toIdx, 0, moved)
    dragSrc.current = null
    setItems(next)
  }

  const initials = username ? username.charAt(0).toUpperCase() : 'U'

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`} style={{ background: bgCol }}>

      <div className="sb-logo">
        <div className="sb-logo-mark" style={{ background: `${accent}33`, color: accent }}>N</div>
        <SbLabel collapsed={collapsed} className="sb-logo-word">NAPOSOLO</SbLabel>
      </div>

      <div className="sb-items">
        {items.map(({ to, icon, label }, idx) => (
          <NavLink
            key={to}
            to={to}
            draggable
            className={({ isActive }) =>
              `sb-item${isActive ? ' active' : ''}${dragOverTo === to ? ' drag-over' : ''}`
            }
            title={label}
            style={{ textDecoration: 'none' }}
            onMouseEnter={() => setHoveredTo(to)}
            onMouseLeave={() => setHoveredTo(null)}
            onDragStart={e => onDragStart(e, idx)}
            onDragEnd={onDragEnd}
            onDragOver={e => onDragOver(e, to)}
            onDragLeave={() => setDragOverTo(null)}
            onDrop={e => onDrop(e, idx)}
          >
            {({ isActive }) => (
              <>
                <div
                  className="sb-icon-sq"
                  style={{ background: isActive || hoveredTo === to ? accent : 'transparent' }}
                >
                  <i className={`ti ${icon}`} aria-hidden="true" />
                </div>
                <SbLabel collapsed={collapsed} className="sb-item-lbl">{label}</SbLabel>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="sb-bottom">
        <div
          className={`sb-bot-btn${activePanel === 'perso' ? ' active' : ''}`}
          role="button" tabIndex={0}
          onClick={() => togglePanel('perso')}
          onKeyDown={e => e.key === 'Enter' && togglePanel('perso')}
        >
          <i className="ti ti-adjustments-horizontal" style={{ color: activePanel === 'perso' ? accent : 'rgba(255,255,255,0.5)' }} aria-hidden="true" />
          <SbLabel collapsed={collapsed} style={{ color: activePanel === 'perso' ? accent : 'rgba(255,255,255,0.5)' }}>Perso</SbLabel>
        </div>
        <div
          className={`sb-bot-btn${activePanel === 'settings' ? ' active' : ''}`}
          role="button" tabIndex={0}
          onClick={() => togglePanel('settings')}
          onKeyDown={e => e.key === 'Enter' && togglePanel('settings')}
        >
          <i className="ti ti-settings" style={{ color: activePanel === 'settings' ? accent : 'rgba(255,255,255,0.5)' }} aria-hidden="true" />
          <SbLabel collapsed={collapsed} style={{ color: activePanel === 'settings' ? accent : 'rgba(255,255,255,0.5)' }}>Réglages</SbLabel>
        </div>
        <div className="sb-bot-btn sb-avatar-row">
          <div className="sb-av-circle">
            <span>{initials}</span>
          </div>
          <SbLabel collapsed={collapsed} style={{ color: 'rgba(255,255,255,0.5)' }}>{username || 'Mon compte'}</SbLabel>
        </div>
        <button
          type="button"
          className="sb-bot-btn sb-collapse-btn"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Déployer la barre latérale' : 'Réduire la barre latérale'}
          title={collapsed ? 'Déployer' : 'Réduire'}
        >
          <i className={`ti ${collapsed ? 'ti-chevron-right' : 'ti-chevron-left'}`} style={{ color: 'rgba(255,255,255,0.5)' }} aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
