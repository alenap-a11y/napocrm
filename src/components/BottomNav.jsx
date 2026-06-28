import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/board',    icon: 'ti-layout-dashboard', label: 'Board'    },
  { to: '/clients',  icon: 'ti-users',            label: 'Clients'  },
  { to: '/seances',  icon: 'ti-calendar-plus',    label: 'Séances'  },
  { to: '/agenda',   icon: 'ti-calendar',         label: 'Agenda'   },
  { to: '/profil',   icon: 'ti-user',             label: 'Profil'   },
]

export default function BottomNav({ accent }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 60, background: '#1E1A4E',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      zIndex: 1000, borderTop: '1px solid rgba(255,255,255,0.1)'
    }}>
      {NAV_ITEMS.map(item => {
        const active = pathname.startsWith(item.to)
        return (
          <button key={item.to}
            onClick={() => navigate(item.to)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, background: 'none', border: 'none', cursor: 'pointer',
              color: active ? accent : 'rgba(255,255,255,0.5)',
              fontSize: 10, padding: '4px 8px'
            }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 22 }} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
