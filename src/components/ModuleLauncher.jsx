import { useState, useRef, useEffect } from 'react'
import { MODULES } from '../hooks/useSearch'

const FAVORITES_KEY = 'napo_favorites'

const DEFAULT_FAVORITES = ['crm', 'agenda', 'seances', 'notes', 'fleurs', 'factures', 'annuaire', 'oracle', 'sms']

export default function ModuleLauncher({ open, onClose, onNavigate }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY)
      return saved ? JSON.parse(saved) : DEFAULT_FAVORITES
    } catch { return DEFAULT_FAVORITES }
  })
  const [editMode, setEditMode] = useState(false)
  const dragSrc = useRef(null)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  function saveFavorites(next) {
    setFavorites(next)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  }

  function onDragStart(e, idx) {
    dragSrc.current = idx
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e) { e.preventDefault() }

  function onDrop(e, toIdx) {
    e.preventDefault()
    if (dragSrc.current === null || dragSrc.current === toIdx) return
    const next = [...favorites]
    const [moved] = next.splice(dragSrc.current, 1)
    next.splice(toIdx, 0, moved)
    dragSrc.current = null
    saveFavorites(next)
  }

  function toggleFavorite(id) {
    if (favorites.includes(id)) {
      saveFavorites(favorites.filter(f => f !== id))
    } else {
      saveFavorites([...favorites, id])
    }
  }

  const favModules = favorites.map(id => MODULES.find(m => m.id === id)).filter(Boolean)
  const otherModules = MODULES.filter(m => !favorites.includes(m.id))

  if (!open) return null

  return (
    <div ref={ref} style={{
      position: 'absolute',
      top: 'calc(100% + 10px)',
      right: 120,
      width: 300,
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 18,
      padding: '1rem 0.875rem 0.75rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      zIndex: 300,
      animation: 'napoPopIn 0.16s ease',
    }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 4px' }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>Vos modules</span>
        <button
          onClick={() => setEditMode(e => !e)}
          style={{
            width: 30, height: 30, borderRadius: '50%',
            background: editMode ? 'var(--color-background-info)' : 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: editMode ? 'var(--color-text-info)' : 'var(--color-text-secondary)',
            fontSize: 14,
          }}>
          <i className={`ti ${editMode ? 'ti-check' : 'ti-pencil'}`} aria-hidden="true" />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {favModules.map((mod, idx) => (
          <div
            key={mod.id}
            draggable
            onDragStart={e => onDragStart(e, idx)}
            onDragOver={onDragOver}
            onDrop={e => onDrop(e, idx)}
            onClick={() => { if (!editMode) { onNavigate(mod.nav); onClose() } }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 5, padding: '9px 4px 8px',
              borderRadius: 12, cursor: editMode ? 'grab' : 'pointer',
              transition: 'background 0.13s',
              position: 'relative',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {editMode && (
              <button
                onClick={e => { e.stopPropagation(); toggleFavorite(mod.id) }}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#E24B4A', border: 'none',
                  color: '#fff', fontSize: 10, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1, padding: 0,
                }}>
                <i className="ti ti-x" aria-hidden="true" style={{ fontSize: 9 }} />
              </button>
            )}
            <div style={{
              width: 50, height: 50, borderRadius: 13,
              background: 'var(--color-background-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              <i className={`ti ${mod.icon}`} style={{ fontSize: 22, color: '#6B8F6E' }} aria-hidden="true" />
            </div>
            <span style={{ fontSize: 10.5, color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>
              {mod.name}
            </span>
          </div>
        ))}
      </div>

      {editMode && otherModules.length > 0 && (
        <>
          <div style={{ height: '0.5px', background: 'var(--color-border-tertiary)', margin: '0.75rem 0' }} />
          <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)', padding: '0 4px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ajouter aux favoris
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {otherModules.map(mod => (
              <div
                key={mod.id}
                onClick={() => toggleFavorite(mod.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 5, padding: '9px 4px 8px',
                  borderRadius: 12, cursor: 'pointer', opacity: 0.5,
                  transition: 'background 0.13s, opacity 0.13s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-background-secondary)'; e.currentTarget.style.opacity = 1 }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = 0.5 }}
              >
                <div style={{
                  width: 50, height: 50, borderRadius: 13,
                  background: 'var(--color-background-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`ti ${mod.icon}`} style={{ fontSize: 22, color: '#6B8F6E' }} aria-hidden="true" />
                </div>
                <span style={{ fontSize: 10.5, color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>
                  {mod.name}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ height: '0.5px', background: 'var(--color-border-tertiary)', margin: '0.6rem 0 0.4rem' }} />
      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-tertiary)' }}>
        <i className="ti ti-arrows-move" aria-hidden="true" /> Glisser pour réorganiser
      </p>
    </div>
  )
}
