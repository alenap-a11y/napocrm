import { useState, useRef, useEffect } from 'react'
import { useSearch } from '../hooks/useSearch'

export default function SearchBar({ onNavigate }) {
  const [query,       setQuery]       = useState('')
  const [open,        setOpen]        = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const { results, loading } = useSearch(query)
  const inputRef = useRef(null)
  const wrapRef  = useRef(null)

  const groups = [
    { key: 'clients', label: 'Clients',  color: '#E8F4FD', nav: 'clients'  },
    { key: 'seances', label: 'Séances',  color: '#EDF7EE', nav: 'seances'  },
    { key: 'notes',   label: 'Notes',    color: '#FEF9E7', nav: 'notes'    },
    { key: 'taches',  label: 'Tâches',   color: '#FEF3E2', nav: 'taches'   },
    { key: 'modules', label: 'Modules',  color: '#F3EEF9', nav: null       },
  ]

  const hasResults = groups.some(g => results[g.key]?.items.length > 0)
  const isEmpty    = query.trim().length >= 2 && !loading && !hasResults

  // Spinner dès la frappe, s'éteint quand la requête finit
  useEffect(() => { setIsSearching(query.trim().length >= 2) }, [query])
  useEffect(() => { if (!loading) setIsSearching(false) }, [loading])

  // ⌘K / Escape
  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') { setOpen(false); setQuery(''); inputRef.current?.blur() }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  // Clic hors dropdown → ferme
  useEffect(() => {
    function onClickOut(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [])

  useEffect(() => { setOpen(query.trim().length >= 2) }, [query])

  function handleSelect(item) {
    onNavigate(item.nav)
    setQuery('')
    setOpen(false)
  }

  function highlight(text, q) {
    if (!q || q.length < 2 || typeof text !== 'string') return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: '#d4edda', color: 'inherit', borderRadius: 2, padding: '0 1px' }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    )
  }

  return (
    <div ref={wrapRef} style={{ flex: 1, maxWidth: 420, position: 'relative' }}>

      {/* ── Barre ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--color-background-secondary)',
        border: `0.5px solid ${open ? '#6B8F6E' : 'var(--color-border-tertiary)'}`,
        borderRadius: 10, padding: '0 12px', height: 36,
        boxShadow: open ? '0 0 0 3px rgba(107,143,110,0.12)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}>
        {isSearching
          ? <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 16, color: 'var(--color-text-tertiary)', flexShrink: 0 }} aria-hidden="true" />
          : <i className="ti ti-search"           style={{ fontSize: 16, color: 'var(--color-text-tertiary)', flexShrink: 0 }} aria-hidden="true" />
        }
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (query.trim().length >= 2) setOpen(true) }}
          placeholder="Rechercher un client, séance, note… (⌘K)"
          style={{
            border: 'none', background: 'transparent', outline: 'none',
            fontSize: 13, color: 'var(--color-text-primary)',
            width: '100%', fontFamily: 'var(--font-sans)',
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus() }}
            style={{
              width: 18, height: 18, borderRadius: '50%',
              background: 'var(--color-border-secondary)',
              border: 'none', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
              fontSize: 10, color: 'var(--color-text-secondary)',
              flexShrink: 0, padding: 0,
            }}>
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        )}
        {!query && (
          <span style={{
            fontSize: 10, color: 'var(--color-text-tertiary)',
            background: 'var(--color-background-tertiary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 4, padding: '1px 5px',
            fontFamily: 'var(--font-mono)', flexShrink: 0,
          }}>⌘K</span>
        )}
      </div>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)',
          left: 0, right: 0,
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 14,
          boxShadow: '0 8px 28px rgba(0,0,0,0.10)',
          zIndex: 400, overflow: 'hidden',
          animation: 'napoPopIn 0.14s ease',
        }}>

          {loading && (
            <div style={{ padding: '16px 14px', fontSize: 13, color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
              <i className="ti ti-loader-2 ti-spin" aria-hidden="true" /> Recherche…
            </div>
          )}

          {!loading && isEmpty && (
            <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 13, color: 'var(--color-text-tertiary)' }}>
              <i className="ti ti-mood-empty" style={{ fontSize: 20, display: 'block', marginBottom: 6 }} aria-hidden="true" />
              Aucun résultat pour « {query} »
            </div>
          )}

          {!loading && hasResults && groups.map(group => {
            const { items, hasMore } = results[group.key] || {}
            if (!items?.length) return null
            return (
              <div key={group.key}>
                {/* En-tête catégorie */}
                <div style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--color-text-tertiary)',
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  padding: '10px 14px 4px',
                }}>
                  {group.label}
                </div>

                {/* Résultats */}
                {items.map(item => (
                  <div
                    key={item.id || item.nav}
                    onClick={() => handleSelect(item)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, background: group.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <i className={`ti ${item.icon}`} style={{ fontSize: 16, color: '#6B8F6E' }} aria-hidden="true" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {highlight(item.name, query)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {highlight(item.sub, query)}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 5, flexShrink: 0,
                      background: 'var(--color-background-secondary)',
                      color: 'var(--color-text-secondary)',
                    }}>
                      {item.tag}
                    </span>
                  </div>
                ))}

                {/* Voir tout */}
                {hasMore && group.nav && (
                  <div
                    onClick={() => { onNavigate(group.nav); setQuery(''); setOpen(false) }}
                    style={{
                      padding: '5px 14px 8px', fontSize: 12,
                      color: '#6B8F6E', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <i className="ti ti-arrow-right" style={{ fontSize: 13 }} aria-hidden="true" />
                    Voir tout dans {group.label}
                  </div>
                )}

                <div style={{ height: '0.5px', background: 'var(--color-border-tertiary)', margin: '4px 0' }} />
              </div>
            )
          })}

          {/* Pied */}
          <div style={{
            padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6,
            borderTop: '0.5px solid var(--color-border-tertiary)',
            background: 'var(--color-background-secondary)',
          }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
              <i className="ti ti-corner-down-left" aria-hidden="true" /> Sélectionner
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 'auto' }}>
              Échap pour fermer
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
