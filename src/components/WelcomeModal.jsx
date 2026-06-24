import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function WelcomeModal({ user }) {
  const [show, setShow] = useState(false)
  const [cms, setCms] = useState({
    onboarding_title: { value: 'Bienvenue sur Naposolo !' },
    onboarding_subtitle: { value: 'Votre espace de gestion bien-être est prêt.' },
    onboarding_body: { value: 'Commencez par ajouter votre premier client, puis planifiez une séance. On s\'occupe du reste. 🌿' },
    onboarding_cta: { value: 'C\'est parti ! →' },
  })

  useEffect(() => {
    const key = `naposolo_welcomed_${user?.id}`
    if (!localStorage.getItem(key)) setShow(true)
    supabase.from('landing_content')
      .select('key, value, color, font_size, font_family')
      .in('key', ['onboarding_title','onboarding_subtitle','onboarding_body','onboarding_cta'])
      .then(({ data }) => {
        if (!data) return
        const map = {}
        data.forEach(r => { map[r.key] = r })
        setCms(prev => ({ ...prev, ...map }))
      })
  }, [user])

  function dismiss() {
    localStorage.setItem(`naposolo_welcomed_${user?.id}`, '1')
    setShow(false)
  }

  if (!show) return null

  const get = (key) => cms[key]?.value || ''
  const sty = (key) => ({ color: cms[key]?.color, fontSize: cms[key]?.font_size, fontFamily: cms[key]?.font_family })

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div style={{background:'#fff',borderRadius:'20px',padding:'2.5rem',maxWidth:'420px',width:'100%',textAlign:'center',boxShadow:'0 25px 60px rgba(0,0,0,0.3)'}}>
        <div style={{fontSize:'52px',marginBottom:'12px'}}>👋</div>
        <h2 style={{fontWeight:'800',margin:'0 0 8px',...sty('onboarding_title')}}>
          {get('onboarding_title')}
        </h2>
        <p style={{lineHeight:'1.6',marginBottom:'8px',...sty('onboarding_subtitle')}}>
          {get('onboarding_subtitle')}
        </p>
        <p style={{lineHeight:'1.6',marginBottom:'28px',...sty('onboarding_body')}}>
          {get('onboarding_body')}
        </p>
        <button onClick={dismiss} style={{background:'#6366f1',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 32px',cursor:'pointer',width:'100%',...sty('onboarding_cta')}}>
          {get('onboarding_cta')}
        </button>
        <p style={{marginTop:'16px',fontSize:'0.75rem',color:'#cbd5e1'}}>Fait avec ❤️ à Vandœuvre-lès-Nancy</p>
      </div>
    </div>
  )
}
