import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ConsentRgpdGate({ user }) {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refuseMode, setRefuseMode] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').select('consent_rgpd').eq('id', user.id).single()
      .then(({ data }) => {
        if (data && !data.consent_rgpd) setShow(true)
      })
  }, [user])

  async function accept() {
    setLoading(true)
    await supabase.from('profiles').update({
      consent_rgpd: true,
      consent_rgpd_date: new Date().toISOString()
    }).eq('id', user.id)
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div style={{background:'#fff',borderRadius:'16px',padding:'2rem',maxWidth:'440px',width:'100%',boxShadow:'0 25px 60px rgba(0,0,0,0.35)'}}>
        {!refuseMode ? (
          <>
            <div style={{fontSize:'17px',fontWeight:700,marginBottom:'12px'}}>Mise a jour de notre politique de confidentialite</div>
            <div style={{fontSize:'13.5px',color:'#374151',lineHeight:1.6,marginBottom:'16px'}}>
              Pour continuer a utiliser Naposolo, nous avons besoin de votre consentement explicite au traitement de vos donnees (prenom, nom, email, metier), conformement au RGPD. Consultez la{' '}
              <a href="/politique-confidentialite" target="_blank" rel="noopener noreferrer" style={{color:'#0F6E56',textDecoration:'underline'}}>politique de confidentialite</a>{' '}pour le detail.
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={() => setRefuseMode(true)} style={{flex:1,padding:'10px',borderRadius:'8px',border:'0.5px solid #d1d5db',background:'transparent',color:'#6b7280',fontSize:'13px',cursor:'pointer'}}>
                Je refuse
              </button>
              <button onClick={accept} disabled={loading} style={{flex:2,padding:'10px',borderRadius:'8px',border:'none',background:'linear-gradient(135deg,#4BBFCE,#7C9A7E)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',minHeight:44}}>
                {loading ? 'Enregistrement...' : "J'accepte"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{fontSize:'17px',fontWeight:700,marginBottom:'12px'}}>Vous refusez le traitement de vos donnees ?</div>
            <div style={{fontSize:'13.5px',color:'#374151',lineHeight:1.6,marginBottom:'16px'}}>
              Sans ce consentement, nous ne pouvons pas maintenir votre compte actif. Contactez-nous a{' '}
              <a href="mailto:contact@naposolo.com" style={{color:'#0F6E56'}}>contact@naposolo.com</a>{' '}pour demander la suppression de vos donnees plutot que de continuer a utiliser le service.
            </div>
            <button onClick={() => setRefuseMode(false)} style={{width:'100%',padding:'10px',borderRadius:'8px',border:'0.5px solid #d1d5db',background:'transparent',color:'#6b7280',fontSize:'13px',cursor:'pointer'}}>
              Retour
            </button>
          </>
        )}
      </div>
    </div>
  )
}
