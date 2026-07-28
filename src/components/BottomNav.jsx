import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const MENU_ITEMS = [
  { to: '/seances',       icon: 'ti-calendar-plus',    label: 'Seances'        },
  { to: '/napo-3d',       icon: 'ti-3d-cube-sphere',   label: 'Napo-3D'        },
  { to: '/fleurs-de-bach',icon: 'ti-leaf',             label: 'Fleurs de Bach' },
  { to: '/notes',         icon: 'ti-notebook',         label: 'Notes'          },
  { to: '/energie',       icon: 'ti-sparkles',         label: 'Energie'        },
  { to: '/factures',      icon: 'ti-file',             label: 'Facturation'    },
  { to: '/fiscal',        icon: 'ti-calculator',       label: 'Fiscalite'      },
  { to: '/marketplace',   icon: 'ti-building-store',   label: 'Marketplace'    },
]

export default function BottomNav({ accent }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  function go(to) {
    setOpen(false)
    navigate(to)
  }

  const btnStyle = active => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 2, background: 'none', border: 'none', cursor: 'pointer',
    color: active ? (accent || '#fff') : 'rgba(255,255,255,0.5)',
    fontSize: 10, padding: '4px 8px', minHeight: 44,
  })

  return (
    <>
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 60, background: '#1E1A4E',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        zIndex: 1000, borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button onClick={() => go('/board')} style={btnStyle(pathname.startsWith('/board'))}>
          <i className="ti ti-layout-dashboard" style={{ fontSize: 22 }} />
          <span>Board</span>
        </button>


        <button onClick={() => go('/agenda')} style={btnStyle(pathname.startsWith('/agenda'))}>
          <i className="ti ti-calendar" style={{ fontSize: 22 }} />
          <span>Agenda</span>
        </button>

        <button onClick={() => go('/clients')} style={btnStyle(pathname.startsWith('/clients'))}>
          <i className="ti ti-users" style={{ fontSize: 22 }} />
          <span>Clients</span>
        </button>

        <button onClick={() => go('/profil')} style={btnStyle(pathname.startsWith('/profil'))}>
          <i className="ti ti-user" style={{ fontSize: 22 }} />
          <span>Profil</span>
        </button>

        <button onClick={() => setOpen(true)} style={btnStyle(open)}>
          <i className="ti ti-menu-2" style={{ fontSize: 22 }} />
          <span>Menu</span>
        </button>
      </nav>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 1001, display: 'flex', alignItems: 'flex-end',
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1E1A4E', width: '100%',
              maxHeight: '70vh', overflowY: 'auto',
              borderTopLeftRadius: 16, borderTopRightRadius: 16,
              padding: '12px 0 24px',
            }}>
            {MENU_ITEMS.map(item => {
              const active = pathname.startsWith(item.to)
              return (
                <button key={item.to}
                  onClick={() => go(item.to)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    width: '100%', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                    color: active ? (accent || '#8B7FD6') : 'rgba(255,255,255,0.7)',
                    fontSize: 15, padding: '14px 20px', minHeight: 44,
                  }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize: 22, minWidth: 22 }} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
