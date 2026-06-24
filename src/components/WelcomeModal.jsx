import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
export default function WelcomeModal({ user }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const key = `naposolo_welcomed_${user?.id}`
    if (!localStorage.getItem(key)) {
      setShow(true)
    }
  }, [user])
  function dismiss() {
    const key = `naposolo_welcomed_${user?.id}`
    localStorage.setItem(key, '1')
    setShow(false)
  }
  if (!show) return null
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div style={{background:'#fff',borderRadius:'20px',padding:'2.5rem',maxWidth:'420px',width:'100%',textAlign:'center',boxShadow:'0 25px 60px rgba(0,0,0,0.3)'}}>
        <div style={{fontSize:'52px',marginBottom:'12px'}}>👋</div>
        <h2 style={{fontSize:'1.6rem',fontWeight:'800',margin:'0 0 8px',color:'#0f172a'}}>Bienvenue sur Naposolo !</h2>
        <p style={{color:'#64748b',lineHeight:'1.6',marginBottom:'8px'}}>Votre espace de gestion bien-être est prêt.</p>
        <p style={{color:'#64748b',lineHeight:'1.6',marginBottom:'28px',fontSize:'0.9rem'}}>Commencez par ajouter votre premier client, puis planifiez une séance. On s'occupe du reste. 🌿</p>
        <button onClick={dismiss} style={{background:'#6366f1',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 32px',fontSize:'1rem',fontWeight:'700',cursor:'pointer',width:'100%'}}>
          C'est parti ! →
        </button>
        <p style={{marginTop:'16px',fontSize:'0.75rem',color:'#cbd5e1'}}>Fait avec ❤️ à Vandœuvre-lès-Nancy</p>
      </div>
    </div>
  )
}
