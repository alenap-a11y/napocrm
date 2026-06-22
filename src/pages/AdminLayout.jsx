import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminDashboard from './AdminDashboard'

export default function AdminLayout({ user }) {
  const navigate = useNavigate()
  const [decoOpen, setDecoOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>

      {/* Sidebar admin */}
      <div style={{width:'180px',flexShrink:0,borderRight:'0.5px solid var(--color-border-tertiary)',
        background:'#111827',display:'flex',flexDirection:'column'}}>
        
        {/* Logo */}
        <div style={{padding:'1.25rem 1rem',borderBottom:'0.5px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontSize:'13px',fontWeight:500,color:'#fff'}}>Naposolo</div>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.4)',marginTop:'2px'}}>Admin</div>
        </div>

        {/* Nav */}
        <div style={{flex:1,padding:'0.75rem 0'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 1rem',
            background:'rgba(255,255,255,0.08)',borderLeft:'2px solid #B8961E',cursor:'pointer'}}>
            <i className="ti ti-shield-check" style={{fontSize:'15px',color:'#B8961E'}} aria-hidden="true"/>
            <span style={{fontSize:'12px',fontWeight:500,color:'#fff'}}>Dashboard</span>
          </div>
        </div>

        {/* User bas */}
        <div style={{padding:'1rem',borderTop:'0.5px solid rgba(255,255,255,0.08)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'#B8961E',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:500,color:'#fff',flexShrink:0}}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div style={{overflow:'hidden'}}>
              <div style={{fontSize:'11px',fontWeight:500,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                {user?.email?.split('@')[0]}
              </div>
              <div style={{fontSize:'10px',color:'rgba(255,255,255,0.4)'}}>Admin</div>
            </div>
          </div>
          <button onClick={() => setDecoOpen(true)}
            style={{width:'100%',padding:'6px',borderRadius:'6px',border:'0.5px solid rgba(255,255,255,0.15)',
              background:'transparent',color:'rgba(255,255,255,0.6)',fontSize:'11px',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:'5px'}}>
            <i className="ti ti-logout" style={{fontSize:'13px'}} aria-hidden="true"/>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{flex:1,overflow:'auto',background:'var(--color-background-tertiary)'}}>
        <AdminDashboard />
      </div>

      {/* Modal déco */}
      {decoOpen && (
        <div onClick={() => setDecoOpen(false)}
          style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}>
          <div onClick={e => e.stopPropagation()}
            style={{background:'var(--color-background-primary)',borderRadius:'12px',padding:'1.5rem',width:'280px',
              border:'0.5px solid var(--color-border-tertiary)'}}>
            <div style={{fontSize:'15px',fontWeight:500,marginBottom:'6px'}}>Se déconnecter ?</div>
            <div style={{fontSize:'12px',color:'var(--color-text-secondary)',marginBottom:'1.25rem'}}>
              {user?.email}
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={() => setDecoOpen(false)}
                style={{flex:1,padding:'8px',borderRadius:'8px',border:'0.5px solid var(--color-border-tertiary)',
                  background:'transparent',cursor:'pointer',fontSize:'13px'}}>
                Annuler
              </button>
              <button onClick={signOut}
                style={{flex:1,padding:'8px',borderRadius:'8px',border:'none',
                  background:'#E24B4A',color:'#fff',cursor:'pointer',fontSize:'13px',fontWeight:500}}>
                Déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
