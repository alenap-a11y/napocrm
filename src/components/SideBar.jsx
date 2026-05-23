import { useRef } from 'react'

export default function SideBar({
  sbItems, setSbItems,
  sbActif, setSbActif,
  accent, bgCol,
  curView,
  activePanel, setActivePanel,
  onNavigate,
}) {
  const dragSrc = useRef(null)

  function handleItemClick(item) {
    setSbActif(item.id)
    onNavigate('dash')
  }

  function onDragStart(e, idx) {
    dragSrc.current = idx
    e.currentTarget.classList.add('dragging')
    e.dataTransfer.effectAllowed = 'move'
  }
  function onDragEnd(e) {
    e.currentTarget.classList.remove('dragging')
    document.querySelectorAll('.sb-item').forEach(el => el.classList.remove('drag-over'))
  }
  function onDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over') }
  function onDragLeave(e) { e.currentTarget.classList.remove('drag-over') }
  function onDrop(e, toIdx) {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    if (dragSrc.current !== null && dragSrc.current !== toIdx) {
      const next = [...sbItems]
      const [moved] = next.splice(dragSrc.current, 1)
      next.splice(toIdx, 0, moved)
      dragSrc.current = null
      setSbItems(next)
    }
  }

  function togglePanel(name) {
    setActivePanel(p => p === name ? null : name)
  }

  return (
    <aside className="sidebar" style={{ background: bgCol }}>
      <div className="sb-logo">
        <span className="sb-logo-t" style={{ color: accent }}>NAPO</span>
      </div>

      <div className="sb-items">
        {sbItems.map((item, idx) => {
          const isActive = item.id === sbActif && curView === 'dash'
          return (
            <div
              key={item.id}
              className={`sb-item${isActive ? ' active' : ''}`}
              style={isActive ? { borderRight: `3px solid ${accent}` } : {}}
              draggable
              title={item.label}
              role="button"
              tabIndex={0}
              onClick={() => handleItemClick(item)}
              onKeyDown={e => e.key === 'Enter' && handleItemClick(item)}
              onDragStart={e => onDragStart(e, idx)}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={e => onDrop(e, idx)}
            >
              <i className={`ti ${item.icon}`} style={{ color: isActive ? accent : '#6B7280' }} aria-hidden="true" />
              <span className="sb-item-lbl" style={{ color: isActive ? accent : '#6B7280' }}>{item.label}</span>
            </div>
          )
        })}
      </div>

      <div className="sb-bottom">
        <div
          className={`sb-bot-btn${activePanel === 'perso' ? ' active' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => togglePanel('perso')}
          onKeyDown={e => e.key === 'Enter' && togglePanel('perso')}
        >
          <i className="ti ti-adjustments-horizontal" style={{ color: activePanel === 'perso' ? accent : '#6B7280' }} aria-hidden="true" />
          <span style={{ color: activePanel === 'perso' ? accent : '#6B7280' }}>Perso</span>
        </div>
        <div
          className={`sb-bot-btn${activePanel === 'settings' ? ' active' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => togglePanel('settings')}
          onKeyDown={e => e.key === 'Enter' && togglePanel('settings')}
        >
          <i className="ti ti-settings" style={{ color: activePanel === 'settings' ? accent : '#6B7280' }} aria-hidden="true" />
          <span style={{ color: activePanel === 'settings' ? accent : '#6B7280' }}>Réglages</span>
        </div>
      </div>
    </aside>
  )
}
