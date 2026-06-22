import { useAdminStats } from '../hooks/useAdminStats'
import { useState } from 'react'

export default function AdminDashboard() {
  const { stats, isAdmin, loading } = useAdminStats()
  const [selected, setSelected] = useState(0)

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--color-text-secondary)',fontSize:'13px'}}>
      Chargement...
    </div>
  )
  if (!isAdmin) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'red',fontSize:'13px'}}>
      Accès refusé.
    </div>
  )
  if (!stats?.length) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--color-text-secondary)',fontSize:'13px'}}>
      Aucun utilisateur.
    </div>
  )

  const u = stats[selected]
  const totalActions = Object.values(u.eventsByType).reduce((a,b)=>a+b,0)
  const maxBar = Math.max(...Object.values(u.eventsByType), 1)

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'var(--color-background-tertiary)'}}>

      {/* Sidebar */}
      <div style={{width:'200px',flexShrink:0,borderRight:'0.5px solid var(--color-border-tertiary)',background:'var(--color-background-primary)',display:'flex',flexDirection:'column',padding:'1.25rem 0'}}>
        <div style={{padding:'0 1rem 1rem',borderBottom:'0.5px solid var(--color-border-tertiary)',marginBottom:'0.75rem'}}>
          <div style={{fontSize:'13px',fontWeight:500}}>Admin</div>
          <div style={{fontSize:'11px',color:'var(--color-text-secondary)',marginTop:'2px'}}>{stats.length} testeurs</div>
        </div>
        {stats.map((s,i) => (
          <div key={s.id} onClick={()=>setSelected(i)}
            style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 1rem',cursor:'pointer',
              background: selected===i ? 'var(--color-background-secondary)' : 'transparent',
              borderLeft: selected===i ? '2px solid #534AB7' : '2px solid transparent'}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'#EEEDFE',color:'#3C3489',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:500,flexShrink:0}}>
              {s.prenom[0].toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:'12px',fontWeight:selected===i?500:400}}>{s.prenom}</div>
              <div style={{fontSize:'10px',color:'var(--color-text-secondary)'}}>{s.totalSessions} sessions</div>
            </div>
          </div>
        ))}
      </div>

      {/* Contenu */}
      <div style={{flex:1,overflow:'auto',padding:'1.5rem'}}>

        {/* Nom + statut */}
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'1.5rem'}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:'#EEEDFE',color:'#3C3489',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:500}}>
            {u.prenom[0].toUpperCase()}
          </div>
          <div>
            <div style={{fontSize:'15px',fontWeight:500}}>{u.prenom}</div>
            <div style={{fontSize:'11px',color:'var(--color-text-secondary)'}}>
              {u.lastSeen ? `Vu le ${new Date(u.lastSeen).toLocaleDateString('fr-FR')}` : 'Jamais connecté'}
            </div>
          </div>
          <span style={{marginLeft:'auto',fontSize:'10px',padding:'3px 9px',borderRadius:'20px',fontWeight:500,
            background: u.totalSessions>0 ? '#EAF3DE' : '#FAEEDA',
            color: u.totalSessions>0 ? '#27500A' : '#633806'}}>
            {u.totalSessions>0 ? 'Actif' : 'Silencieux'}
          </span>
        </div>

        {/* 4 métriques */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'1.25rem'}}>
          {[
            {icon:'ti-login',    label:'Sessions',   val:u.totalSessions},
            {icon:'ti-clock',    label:'Durée moy.', val:u.avgDuration+'mn'},
            {icon:'ti-pointer',  label:'Actions',    val:totalActions},
            {icon:'ti-calendar', label:'Séances',    val:u.eventsByType['seance_created']??0},
          ].map(m => (
            <div key={m.label} style={{background:'var(--color-background-secondary)',borderRadius:'8px',padding:'12px 14px'}}>
              <div style={{fontSize:'10px',color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'5px',display:'flex',alignItems:'center',gap:'4px'}}>
                <i className={`ti ${m.icon}`} aria-hidden="true"/> {m.label}
              </div>
              <div style={{fontSize:'22px',fontWeight:500}}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Répartition actions */}
        <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'12px',padding:'1rem 1.25rem',marginBottom:'12px'}}>
          <div style={{fontSize:'11px',color:'var(--color-text-secondary)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'12px'}}>
            Actions
          </div>
          {Object.keys(u.eventsByType).length === 0
            ? <div style={{fontSize:'13px',color:'var(--color-text-secondary)'}}>Aucune action encore</div>
            : Object.entries(u.eventsByType).sort((a,b)=>b[1]-a[1]).map(([type,count]) => (
              <div key={type} style={{marginBottom:'10px'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                  <span style={{color:'var(--color-text-secondary)'}}>{type.replace(/_/g,' ')}</span>
                  <span style={{fontWeight:500}}>{count}x</span>
                </div>
                <div style={{height:'4px',background:'var(--color-border-tertiary)',borderRadius:'2px'}}>
                  <div style={{height:'4px',borderRadius:'2px',background:'#534AB7',width:`${Math.round(count/maxBar*100)}%`}}/>
                </div>
              </div>
            ))
          }
        </div>

        {/* Pages visitées */}
        <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'12px',padding:'1rem 1.25rem'}}>
          <div style={{fontSize:'11px',color:'var(--color-text-secondary)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'10px'}}>
            Pages visitées
          </div>
          {Object.keys(u.pageViews).length === 0
            ? <div style={{fontSize:'13px',color:'var(--color-text-secondary)'}}>Aucune visite encore</div>
            : <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                {Object.entries(u.pageViews).sort((a,b)=>b[1]-a[1]).map(([page,count]) => (
                  <span key={page} style={{fontSize:'12px',padding:'4px 10px',background:'var(--color-background-secondary)',borderRadius:'20px',border:'0.5px solid var(--color-border-tertiary)'}}>
                    {page} · {count}x
                  </span>
                ))}
              </div>
          }
        </div>

      </div>
    </div>
  )
}
