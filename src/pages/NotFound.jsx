import { useNavigate } from 'react-router-dom'
export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#0f172a',color:'#fff',textAlign:'center',padding:'2rem'}}>
      <div style={{fontSize:'80px',marginBottom:'8px'}}>🧭</div>
      <h1 style={{fontSize:'6rem',fontWeight:'900',margin:'0',color:'#6366f1',lineHeight:1}}>404</h1>
      <p style={{fontSize:'1.4rem',fontWeight:'600',margin:'16px 0 8px'}}>Cette page n'existe pas (encore)</p>
      <p style={{color:'rgba(255,255,255,0.4)',marginBottom:'32px'}}>Même Naposolo ne peut pas tout prévoir. 🤷</p>
      <button onClick={() => navigate('/board')} style={{background:'#6366f1',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 28px',fontSize:'1rem',fontWeight:'600',cursor:'pointer'}}>
        Retour au dashboard →
      </button>
      <p style={{marginTop:'48px',fontSize:'0.75rem',color:'rgba(255,255,255,0.2)'}}>Fait avec ❤️ à Vandœuvre-lès-Nancy</p>
    </div>
  )
}
