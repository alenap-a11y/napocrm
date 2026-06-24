import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function WelcomeModal({ user }) {
  const [show, setShow] = useState(false)
  const [items, setItems] = useState([])
  const [cms, setCms] = useState({
    onboarding_title: { value: 'Bienvenue sur Naposolo !' },
    onboarding_subtitle: { value: 'Votre espace de gestion bien-etre est pret.' },
    onboarding_body: { value: 'Commencez par ajouter votre premier client. On s occupe du reste.' },
    onboarding_cta: { value: "C'est parti ! →" },
  })

  useEffect(() => {
    const key = "naposolo_welcomed"
    if (localStorage.getItem(key)) return

    supabase.from('landing_content')
      .select('published, days_active')
      .eq('key', 'onboarding_settings')
      .single()
      .then(({ data: settings }) => {
        const DAYS = ['dim','lun','mar','mer','jeu','ven','sam']
        const today = DAYS[new Date().getDay()]
        const active = !settings || (settings.published && (settings.days_active ?? []).includes(today))
        if (active) setShow(true)
      })

    supabase.from('landing_content')
      .select('key, value, color, font_size, font_family')
      .in('key', ['onboarding_title','onboarding_subtitle','onboarding_body','onboarding_cta'])
      .then(({ data }) => {
        if (!data) return
        const map = {}
        data.forEach(r => { map[r.key] = r })
        setCms(prev => ({ ...prev, ...map }))
      })

    supabase.from('onboarding_items')
      .select('*')
      .order('ordre')
      .then(({ data }) => { if (data) setItems(data) })
  }, [user])

  function dismiss() {
    localStorage.setItem("naposolo_welcomed", "1")
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
        <p style={{lineHeight:'1.6',marginBottom:'16px',...sty('onboarding_body')}}>
          {get('onboarding_body')}
        </p>
        {items.length > 0 && (
          <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'20px',textAlign:'left'}}>
            {items.map(item => (
              <div key={item.id} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <i className={`ti ${item.icon}`} style={{fontSize:'16px',color:item.color,flexShrink:0}} />
                {item.type === 'icon' && <span style={{color:item.color,fontSize:'0.9rem'}}>{item.label}</span>}
                {item.type === 'link' && <a href={item.value} target="_blank" rel="noreferrer" style={{color:item.color,fontSize:'0.9rem',textDecoration:'underline'}}>{item.label}</a>}
                {item.type === 'button' && <a href={item.value} target="_blank" rel="noreferrer" style={{background:item.color,color:'#fff',borderRadius:'7px',padding:'4px 14px',fontSize:'0.85rem',textDecoration:'none',fontWeight:600}}>{item.label}</a>}
              </div>
            ))}
          </div>
        )}
        <button onClick={dismiss} style={{background:'#6366f1',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 32px',cursor:'pointer',width:'100%',...sty('onboarding_cta')}}>
          {get('onboarding_cta')}
        </button>
        <p style={{marginTop:'16px',fontSize:'0.75rem',color:'#cbd5e1'}}>Fait avec coeur a Vandoeuvre-les-Nancy</p>
      </div>
    </div>
  )
}
