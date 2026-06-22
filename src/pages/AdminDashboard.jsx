import { useAdminStats } from '../hooks/useAdminStats'
import { useState } from 'react'

export default function AdminDashboard() {
  const { stats, isAdmin, loading } = useAdminStats()
  const [selected, setSelected] = useState(0)

  if (loading) return <div style={{padding:'2rem',color:'var(--color-text-secondary)',fontSize:'13px'}}>Chargement...</div>
  if (!isAdmin) return <div style={{padding:'2rem',color:'red',fontSize:'13px'}}>Accès refusé.</div>
  if (!stats?.length) return <div style={{padding:'2rem',color:'var(--color-text-secondary)',fontSize:'13px'}}>Aucun utilisateur.</div>

  const u = stats[selected]
  const totalActions = Object.values(u.eventsByType).reduce((a,b)=>a+b,0)
  const maxBar = Math.max(...Object.values(u.eventsByType), 1)

  const features = [
    { key:'page_view',      label:'Agenda',         icon:'ti-calendar',       color:'#534AB7', bg:'#EEEDFE' },
    { key:'client_added',   label:'Clients',        icon:'ti-users',          color:'#0F6E56', bg:'#E1F5EE' },
    { key:'seance_created', label:'Séances',        icon:'ti-clipboard-list', color:'#854F0B', bg:'#FAEEDA' },
    { key:'tache_created',  label:'Tâches',         icon:'ti-checklist',      color:'#888',    bg:'#F1EFE8' },
    { key:'bach_used',      label:'Fleurs de Bach', icon:'ti-flower',         color:'#993556', bg:'#FBEAF0' },
    { key:'feedback_sent',  label:'Feedback',       icon:'ti-message-2',      color:'#993C1D', bg:'#FAECE7' },
  ]

  return (
    <div style={{padding:'1.5rem',maxWidth:'900px',margin:'0 auto'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'1.5rem',paddingBottom:'1rem',borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
        <i className="ti ti-shield-check" style={{fontSize:'18px',color:'var(--color-text-secondary)'}} aria-hidden="true"/>
        <div style={{flex:1}}>
          <div style={{fontSize:'14px',fontWeight:500}}>Admin Naposolo</div>
          <div style={{fontSize:'11px',color:'var(--color-text-secondary)'}}>{stats.length} testeur{stats.length>1?'s':''} alpha</div>
        </div>
        <span style={{fontSize:'10px',padding:'3px 9px',borderRadius:'20px',background:'#FAEEDA',color:'#633806',fontWeight:500}}>
          <i className="ti ti-flask" style={{fontSize:'9px'}} aria-hidden="true"/> Alpha
        </span>
      </div>

      {/* Onglets */}
      <div style={{display:'flex',gap:0,borderBottom:'0.5px solid var(--color-border-tertiary)',marginBottom:'1.5rem'}}>
        {stats.map((s,i) => (
          <div key={s.id} onClick={()=>setSelected(i)} style={{
            padding:'10px 20px',fontSize:'13px',fontWeight:500,cursor:'pointer',
            borderBottom: selected===i ? '2px solid #534AB7' : '2px solid transparent',
            color: selected===i ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{width:24,height:24,borderRadius:'50%',background:'#EEEDFE',color:'#3C3489',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:500}}>
              {s.prenom[0].toUpperCase()}
            </div>
            {s.prenom}
          </div>
        ))}
      </div>

      {/* User hero */}
      <div style={{display:'flex',alignItems:'center',gap:'14px',padding:'1rem 0 1.25rem',borderBottom:'0.5px solid var(--color-border-tertiary)',marginBottom:'1.25rem'}}>
        <div style={{width:42,height:42,borderRadius:'50%',background:'#EEEDFE',color:'#3C3489',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',fontWeight:500}}>
          {u.prenom[0].toUpperCase()}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:'16px',fontWeight:500}}>{u.prenom}</div>
          <div style={{fontSize:'12px',color:'var(--color-text-secondary)',marginTop:'2px'}}>
            {u.lastSeen ? `Vu le ${new Date(u.lastSeen).toLocaleDateString('fr-FR')}` : 'Jamais connecté'}
          </div>
        </div>
        <span style={{fontSize:'11px',padding:'4px 10px',borderRadius:'20px',fontWeight:500,
          background: u.totalSessions>0 ? '#EAF3DE' : '#FAEEDA',
          color: u.totalSessions>0 ? '#27500A' : '#633806'}}>
          {u.totalSessions>0 ? 'Actif' : 'Silencieux'}
        </span>
      </div>

      {/* 4 métriques */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'1.25rem'}}>
        {[
          {icon:'ti-login',    label:'Sessions',   val:u.totalSessions,     sub:'connexions'},
          {icon:'ti-clock',    label:'Durée moy.', val:u.avgDuration+'mn',  sub:'par session'},
          {icon:'ti-pointer',  label:'Actions',    val:totalActions,         sub:'total'},
          {icon:'ti-calendar', label:'Séances',    val:u.eventsByType['seance_created']??0, sub:'créées'},
        ].map(m => (
          <div key={m.label} style={{background:'var(--color-background-secondary)',borderRadius:'8px',padding:'14px 16px'}}>
            <div style={{fontSize:'10px',color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'6px',display:'flex',alignItems:'center',gap:'4px'}}>
              <i className={`ti ${m.icon}`} aria-hidden="true"/> {m.label}
            </div>
            <div style={{fontSize:'24px',fontWeight:500,lineHeight:1}}>{m.val}</div>
            <div style={{fontSize:'10px',color:'var(--color-text-secondary)',marginTop:'4px'}}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Features + Répartition */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>

        <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'12px',padding:'1rem 1.25rem'}}>
          <div style={{fontSize:'11px',color:'var(--color-text-secondary)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'12px',display:'flex',alignItems:'center',gap:'6px'}}>
            <i className="ti ti-puzzle" aria-hidden="true"/> Features utilisées
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            {features.map(f => {
              const count = u.eventsByType[f.key] ?? 0
              return (
                <div key={f.key} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',
                  borderRadius:'8px',border:'0.5px solid var(--color-border-tertiary)',opacity:count===0?0.4:1}}>
                  <div style={{width:28,height:28,borderRadius:'6px',background:f.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <i className={`ti ${f.icon}`} style={{fontSize:'14px',color:f.color}} aria-hidden="true"/>
                  </div>
                  <div>
                    <div style={{fontSize:'11px',fontWeight:500}}>{f.label}</div>
                    <div style={{fontSize:'10px',color:'var(--color-text-secondary)'}}>{count} action{count>1?'s':''}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'12px',padding:'1rem 1.25rem'}}>
          <div style={{fontSize:'11px',color:'var(--color-text-secondary)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'12px',display:'flex',alignItems:'center',gap:'6px'}}>
            <i className="ti ti-chart-bar" aria-hidden="true"/> Répartition des actions
          </div>
          {Object.keys(u.eventsByType).length === 0
            ? <div style={{fontSize:'13px',color:'var(--color-text-secondary)'}}>Aucune action encore</div>
            : Object.entries(u.eventsByType).sort((a,b)=>b[1]-a[1]).map(([type,count]) => (
              <div key={type} style={{marginBottom:'10px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'12px',marginBottom:'4px'}}>
                  <span style={{color:'var(--color-text-secondary)'}}>{type.replace(/_/g,' ')}</span>
                  <span style={{fontWeight:500}}>{count} fois</span>
                </div>
                <div style={{height:'4px',background:'var(--color-border-tertiary)',borderRadius:'2px'}}>
                  <div style={{height:'4px',borderRadius:'2px',background:'#534AB7',width:`${Math.round(count/maxBar*100)}%`}}/>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Pages visitées */}
      <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'12px',padding:'1rem 1.25rem',marginBottom:'12px'}}>
        <div style={{fontSize:'11px',color:'var(--color-text-secondary)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'10px',display:'flex',alignItems:'center',gap:'6px'}}>
          <i className="ti ti-map-pin" aria-hidden="true"/> Pages visitées
        </div>
        {Object.keys(u.pageViews).length === 0
          ? <div style={{fontSize:'13px',color:'var(--color-text-secondary)'}}>Aucune visite encore</div>
          : <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
              {Object.entries(u.pageViews).sort((a,b)=>b[1]-a[1]).map(([page,count]) => (
                <span key={page} style={{fontSize:'12px',padding:'4px 12px',background:'var(--color-background-secondary)',
                  borderRadius:'20px',border:'0.5px solid var(--color-border-tertiary)'}}>
                  {page} · {count}x
                </span>
              ))}
            </div>
        }
      </div>

      {/* Note */}
      <div style={{fontSize:'11px',color:'var(--color-text-secondary)',display:'flex',alignItems:'center',gap:'5px',
        padding:'8px 10px',background:'var(--color-background-secondary)',borderRadius:'8px'}}>
        <i className="ti ti-lock" aria-hidden="true"/> Aucune donnée personnelle cliente visible — comptages anonymisés uniquement
      </div>

    </div>
  )
}
