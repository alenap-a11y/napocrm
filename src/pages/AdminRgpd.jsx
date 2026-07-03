export default function AdminRgpd() {
  return (
    <div style={{padding:'1.5rem',maxWidth:'700px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'1rem'}}>
        <i className="ti ti-shield-lock" style={{fontSize:'18px',color:'var(--color-text-secondary)'}} aria-hidden="true"/>
        <div style={{fontSize:'14px',fontWeight:500}}>RGPD</div>
        <span style={{fontSize:'10px',padding:'3px 9px',borderRadius:'20px',background:'#FDECEA',color:'#C0392B',fontWeight:500}}>
          Bloque - SIRET requis
        </span>
      </div>

      <div style={{background:'var(--color-background-secondary)',borderRadius:'10px',padding:'1rem 1.25rem',fontSize:'13px',color:'var(--color-text-secondary)',lineHeight:1.6}}>
        Page interne (non publiee). Bloquee tant que le SIRET / micro-entreprise n'est pas enregistre.
        <br/><br/>
        A couvrir avant publication :
        <ul style={{marginTop:'8px',paddingLeft:'1.2rem'}}>
          <li>Sous-traitants actifs : Supabase, Vercel, Resend, Anthropic</li>
          <li>Finalites du traitement des donnees testeurs/clients</li>
          <li>Duree de conservation</li>
          <li>Droits d'acces / suppression / export</li>
          <li>Coherence avec la charte testeur (clause tiers a corriger)</li>
        </ul>
      </div>
    </div>
  )
}
