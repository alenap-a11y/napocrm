import { useAdminStats } from '../hooks/useAdminStats'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminDashboard() {
  const { stats, isAdmin, loading } = useAdminStats()
  const [selected, setSelected] = useState(0)
  const [tab, setTab] = useState('users') // 'users' | 'stats'
  const [periode, setPeriode] = useState('semaine')
  const [alphaOpen, setAlphaOpen] = useState(null)
  const [alphaLoading, setAlphaLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingValue, setPendingValue] = useState(null)

  useEffect(() => {
    supabase.from('app_config').select('value').eq('key','alpha_open').single()
      .then(({ data }) => {
        if (data) setAlphaOpen(data.value === 'true')
        setAlphaLoading(false)
      })
  }, [])

  const handleToggleClick = (val) => {
    setPendingValue(val)
    setShowConfirm(true)
  }

  const confirmToggle = async () => {
    const val = pendingValue
    await supabase.from('app_config').update({ value: String(val), updated_at: new Date().toISOString() }).eq('key','alpha_open')
    setAlphaOpen(val)
    setShowConfirm(false)
    setPendingValue(null)
  }

  if (loading || alphaOpen === null) return <div style={{padding:'2rem',color:'var(--color-text-secondary)',fontSize:'13px'}}>Chargement...</div>
  if (!isAdmin) return <div style={{padding:'2rem',color:'red',fontSize:'13px'}}>Accès refusé.</div>
  if (!stats?.length) return <div style={{padding:'2rem',color:'var(--color-text-secondary)',fontSize:'13px'}}>Aucun utilisateur.</div>

  const now = new Date()
  function isInPeriode(dateStr) {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const diff = (now - d) / (1000 * 60 * 60 * 24)
    if (periode === 'jour') return diff < 1
    if (periode === 'semaine') return diff < 7
    if (periode === 'mois') return diff < 30
    if (periode === 'annee') return diff < 365
    return false
  }

  const connectes = stats.filter(u => u.lastSeen && (now - new Date(u.lastSeen)) < 1000 * 60 * 30).length
  const nonConnectes = stats.length - connectes

  const totalSessions = stats.reduce((a,u) => a + u.totalSessions, 0)
  const totalActions  = stats.reduce((a,u) => a + Object.values(u.eventsByType).reduce((x,y)=>x+y,0), 0)
  const totalSeances  = stats.reduce((a,u) => a + (u.eventsByType['seance_created']??0), 0)
  const totalClients  = stats.reduce((a,u) => a + (u.eventsByType['client_added']??0), 0)

  const u = stats[selected]
  const totalActionsU = Object.values(u.eventsByType).reduce((a,b)=>a+b,0)
  const maxBar = Math.max(...Object.values(u.eventsByType), 1)

  const features = [
    { key:'page_view',      label:'Agenda',         icon:'ti-calendar',       color:'#534AB7', bg:'#EEEDFE' },
    { key:'client_added',   label:'Clients',        icon:'ti-users',          color:'#0F6E56', bg:'#E1F5EE' },
    { key:'seance_created', label:'Séances',        icon:'ti-clipboard-list', color:'#854F0B', bg:'#FAEEDA' },
    { key:'tache_created',  label:'Tâches',         icon:'ti-checklist',      color:'#888',    bg:'#F1EFE8' },
    { key:'bach_used',      label:'Fleurs de Bach', icon:'ti-flower',         color:'#993556', bg:'#FBEAF0' },
    { key:'feedback_sent',  label:'Feedback',       icon:'ti-message-2',      color:'#993C1D', bg:'#FAECE7' },
  ]

  const card = (icon, label, val, sub, color='#534AB7') => (
    <div key={label} style={{background:'var(--color-background-secondary)',borderRadius:'8px',padding:'14px 16px'}}>
      <div style={{fontSize:'10px',color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'6px',display:'flex',alignItems:'center',gap:'4px'}}>
        <i className={`ti ${icon}`} aria-hidden="true"/> {label}
      </div>
      <div style={{fontSize:'24px',fontWeight:500,lineHeight:1,color}}>{val}</div>
      <div style={{fontSize:'10px',color:'var(--color-text-secondary)',marginTop:'4px'}}>{sub}</div>
    </div>
  )

  return (
    <div style={{padding:'1.5rem',maxWidth:'940px',margin:'0 auto'}}>

      {/* Modal confirmation */}
      {showConfirm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--color-background-primary)',borderRadius:'14px',padding:'2rem',maxWidth:'380px',width:'90%',boxShadow:'0 8px 40px rgba(0,0,0,0.18)'}}>
            <div style={{fontSize:'18px',fontWeight:600,marginBottom:'10px'}}>
              {pendingValue ? '🟢 Ouvrir les inscriptions ?' : '🔴 Fermer les inscriptions ?'}
            </div>
            <div style={{fontSize:'13px',color:'var(--color-text-secondary)',marginBottom:'1.5rem',lineHeight:1.6}}>
              {pendingValue
                ? 'Les nouvelles inscriptions seront à nouveau acceptées sur naposolo.com.'
                : 'Les inscriptions alpha seront fermées. Les visiteurs verront un message et pourront contacter contact@naposolo.com.'
              }
            </div>
            <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
              <button onClick={()=>setShowConfirm(false)} style={{padding:'8px 18px',borderRadius:'8px',border:'0.5px solid var(--color-border-tertiary)',background:'transparent',cursor:'pointer',fontSize:'13px'}}>
                Annuler
              </button>
              <button onClick={confirmToggle} style={{padding:'8px 18px',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:500,
                background: pendingValue ? '#1D9E75' : '#C0392B', color:'#fff'}}>
                {pendingValue ? 'Ouvrir' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bloc Alpha Toggle */}
      <div style={{background: alphaOpen ? '#EAF3DE' : '#FDECEA', border: `0.5px solid ${alphaOpen ? '#A8D58A' : '#F5C6C6'}`, borderRadius:'10px', padding:'12px 16px', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'12px'}}>
        <i className={`ti ${alphaOpen ? 'ti-door-enter' : 'ti-door-off'}`} style={{fontSize:'18px', color: alphaOpen ? '#27500A' : '#C0392B'}} aria-hidden="true"/>
        <div style={{flex:1}}>
          <div style={{fontSize:'13px', fontWeight:600, color: alphaOpen ? '#27500A' : '#C0392B'}}>
            {alphaOpen ? 'Inscriptions alpha ouvertes' : 'Inscriptions alpha fermées'}
          </div>
          <div style={{fontSize:'11px', color:'var(--color-text-secondary)', marginTop:'2px'}}>
            {alphaOpen
              ? 'Les nouveaux testeurs peuvent s’inscrire librement.'
              : 'Les visiteurs voient un message de liste d’attente et peuvent écrire à contact@naposolo.com.'
            }
          </div>
        </div>
        {alphaLoading ? (
          <div style={{fontSize:'11px',color:'var(--color-text-secondary)'}}>...</div>
        ) : (
          <div
            onClick={() => handleToggleClick(!alphaOpen)}
            style={{
              width:'48px', height:'26px', borderRadius:'13px', cursor:'pointer', position:'relative',
              background: alphaOpen ? '#1D9E75' : '#B4B2A9',
              transition:'background 0.2s', flexShrink:0
            }}
          >
            <div style={{
              position:'absolute', top:'3px',
              left: alphaOpen ? '25px' : '3px',
              width:'20px', height:'20px', borderRadius:'50%', background:'#fff',
              transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.18)'
            }}/>
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'1.5rem',paddingBottom:'1rem',borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
        <i className="ti ti-shield-check" style={{fontSize:'18px',color:'var(--color-text-secondary)'}} aria-hidden="true"/>
        <div style={{flex:1}}>
          <div style={{fontSize:'14px',fontWeight:500}}>Admin Naposolo</div>
          <div style={{fontSize:'11px',color:'var(--color-text-secondary)'}}>{stats.length} testeur{stats.length>1?'s':''} alpha</div>
        </div>
        {/* En ligne / hors ligne */}
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'12px'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#1D9E75'}}/>
            <span style={{color:'var(--color-text-secondary)'}}>{connectes} en ligne</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'12px'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#B4B2A9'}}/>
            <span style={{color:'var(--color-text-secondary)'}}>{nonConnectes} hors ligne</span>
          </div>
        </div>
        <span style={{fontSize:'10px',padding:'3px 9px',borderRadius:'20px',background:'#FAEEDA',color:'#633806',fontWeight:500}}>
          <i className="ti ti-flask" style={{fontSize:'9px'}} aria-hidden="true"/> Alpha
        </span>
      </div>

      {/* Onglets principaux */}
      <div style={{display:'flex',gap:0,borderBottom:'0.5px solid var(--color-border-tertiary)',marginBottom:'1.5rem'}}>
        {[
          {id:'users', label:'Utilisateurs', icon:'ti-users'},
          {id:'stats', label:'Statistiques générales', icon:'ti-chart-bar'},
        ].map(t => (
          <div key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'10px 20px',fontSize:'13px',fontWeight:500,cursor:'pointer',
            borderBottom: tab===t.id ? '2px solid #534AB7' : '2px solid transparent',
            color: tab===t.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            display:'flex',alignItems:'center',gap:'7px'}}>
            <i className={`ti ${t.icon}`} style={{fontSize:'14px'}} aria-hidden="true"/>
            {t.label}
          </div>
        ))}
      </div>

      {/* TAB USERS */}
      {tab === 'users' && (
        <>
          {/* Onglets users */}
          <div style={{display:'flex',gap:0,borderBottom:'0.5px solid var(--color-border-tertiary)',marginBottom:'1.5rem'}}>
            {stats.map((s,i) => {
              const online = s.lastSeen && (now - new Date(s.lastSeen)) < 1000*60*30
              return (
                <div key={s.id} onClick={()=>setSelected(i)} style={{
                  padding:'10px 20px',fontSize:'13px',fontWeight:500,cursor:'pointer',
                  borderBottom: selected===i ? '2px solid #534AB7' : '2px solid transparent',
                  color: selected===i ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  display:'flex',alignItems:'center',gap:'8px'}}>
                  <div style={{position:'relative'}}>
                    <div style={{width:24,height:24,borderRadius:'50%',background:'#EEEDFE',color:'#3C3489',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:500}}>
                      {s.prenom[0].toUpperCase()}
                    </div>
                    <div style={{position:'absolute',bottom:0,right:0,width:7,height:7,borderRadius:'50%',
                      background: online ? '#1D9E75' : '#B4B2A9',
                      border:'1.5px solid var(--color-background-primary)'}}/>
                  </div>
                  {s.prenom}
                </div>
              )
            })}
          </div>

          {/* User hero */}
          <div style={{display:'flex',alignItems:'center',gap:'14px',padding:'1rem 0 1.25rem',borderBottom:'0.5px solid var(--color-border-tertiary)',marginBottom:'1.25rem'}}>
            <div style={{position:'relative'}}>
              <div style={{width:42,height:42,borderRadius:'50%',background:'#EEEDFE',color:'#3C3489',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',fontWeight:500}}>
                {u.prenom[0].toUpperCase()}
              </div>
              <div style={{position:'absolute',bottom:1,right:1,width:10,height:10,borderRadius:'50%',
                background: u.lastSeen && (now-new Date(u.lastSeen))<1000*60*30 ? '#1D9E75' : '#B4B2A9',
                border:'2px solid var(--color-background-primary)'}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:'16px',fontWeight:500}}>{u.prenom}</div>
              <div style={{fontSize:'12px',color:'var(--color-text-secondary)',marginTop:'2px'}}>
                {u.lastSeen ? `Vu le ${new Date(u.lastSeen).toLocaleDateString('fr-FR')} à ${new Date(u.lastSeen).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}` : 'Jamais connecté'}
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
            {card('ti-login','Sessions',u.totalSessions,'connexions')}
            {card('ti-clock','Durée moy.',u.avgDuration+'mn','par session')}
            {card('ti-pointer','Actions',totalActionsU,'total')}
            {card('ti-calendar','Séances',u.eventsByType['seance_created']??0,'créées')}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
            <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'12px',padding:'1rem 1.25rem'}}>
              <div style={{fontSize:'11px',color:'var(--color-text-secondary)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'12px'}}>
                Features utilisées
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
              <div style={{fontSize:'11px',color:'var(--color-text-secondary)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'12px'}}>
                Répartition des actions
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

          <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'12px',padding:'1rem 1.25rem',marginBottom:'12px'}}>
            <div style={{fontSize:'11px',color:'var(--color-text-secondary)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'10px'}}>
              Pages visitées
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
        </>
      )}

      {/* TAB STATS GÉNÉRALES */}
      {tab === 'stats' && (
        <>
          {/* Filtre période */}
          <div style={{display:'flex',gap:'6px',marginBottom:'1.25rem'}}>
            {['jour','semaine','mois','annee'].map(p => (
              <button key={p} onClick={()=>setPeriode(p)} style={{
                padding:'5px 14px',borderRadius:'20px',fontSize:'12px',cursor:'pointer',fontWeight:500,
                background: periode===p ? '#534AB7' : 'var(--color-background-secondary)',
                color: periode===p ? '#fff' : 'var(--color-text-secondary)',
                border: periode===p ? 'none' : '0.5px solid var(--color-border-tertiary)'}}>
                {p === 'annee' ? 'Année' : p.charAt(0).toUpperCase()+p.slice(1)}
              </button>
            ))}
          </div>

          {/* Métriques globales */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'1.25rem'}}>
            {card('ti-users','Testeurs',stats.length,'total','#534AB7')}
            {card('ti-login','Sessions',totalSessions,'toutes périodes','#1D9E75')}
            {card('ti-pointer','Actions',totalActions,'toutes périodes','#854F0B')}
            {card('ti-calendar','Séances',totalSeances,'créées','#185FA5')}
          </div>

          {/* En ligne / hors ligne */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
            <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'12px',padding:'1rem 1.25rem'}}>
              <div style={{fontSize:'11px',color:'var(--color-text-secondary)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'12px'}}>
                Présence
              </div>
              {stats.map(s => {
                const online = s.lastSeen && (now-new Date(s.lastSeen)) < 1000*60*30
                return (
                  <div key={s.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'7px 0',borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background: online ? '#1D9E75' : '#B4B2A9',flexShrink:0}}/>
                    <div style={{flex:1,fontSize:'13px',fontWeight:500}}>{s.prenom}</div>
                    <div style={{fontSize:'11px',color:'var(--color-text-secondary)'}}>
                      {online ? 'En ligne' : s.lastSeen ? new Date(s.lastSeen).toLocaleDateString('fr-FR') : 'Jamais'}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'12px',padding:'1rem 1.25rem'}}>
              <div style={{fontSize:'11px',color:'var(--color-text-secondary)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'12px'}}>
                Activité par user
              </div>
              {stats.map(s => {
                const actions = Object.values(s.eventsByType).reduce((a,b)=>a+b,0)
                const maxA = Math.max(...stats.map(x => Object.values(x.eventsByType).reduce((a,b)=>a+b,0)), 1)
                return (
                  <div key={s.id} style={{marginBottom:'10px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'3px'}}>
                      <span>{s.prenom}</span>
                      <span style={{fontWeight:500}}>{actions} actions</span>
                    </div>
                    <div style={{height:'4px',background:'var(--color-border-tertiary)',borderRadius:'2px'}}>
                      <div style={{height:'4px',borderRadius:'2px',background:'#534AB7',width:`${Math.round(actions/maxA*100)}%`}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Clients créés */}
          <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'12px',padding:'1rem 1.25rem'}}>
            <div style={{fontSize:'11px',color:'var(--color-text-secondary)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'12px'}}>
              Clients ajoutés par user
            </div>
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
              {stats.map(s => (
                <div key={s.id} style={{background:'var(--color-background-secondary)',borderRadius:'8px',padding:'10px 14px',minWidth:'100px'}}>
                  <div style={{fontSize:'11px',color:'var(--color-text-secondary)',marginBottom:'4px'}}>{s.prenom}</div>
                  <div style={{fontSize:'20px',fontWeight:500}}>{s.eventsByType['client_added']??0}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div style={{fontSize:'11px',color:'var(--color-text-secondary)',display:'flex',alignItems:'center',gap:'5px',
        padding:'8px 10px',background:'var(--color-background-secondary)',borderRadius:'8px',marginTop:'12px'}}>
        <i className="ti ti-lock" aria-hidden="true"/> Données anonymisées — aucune info personnelle cliente
      </div>
    </div>
  )
}
