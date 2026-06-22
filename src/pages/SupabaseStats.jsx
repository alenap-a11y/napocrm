import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SupabaseStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase.rpc('get_admin_stats')
      if (!error && data) {
        setStats(data)
      } else {
        // Fallback — requêtes directes
        const { count: users } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        const { count: seances } = await supabase
          .from('seances')
          .select('*', { count: 'exact', head: true })

        const { count: clients } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })

        const { count: events } = await supabase
          .from('user_events')
          .select('*', { count: 'exact', head: true })

        const { count: sessions } = await supabase
          .from('user_sessions')
          .select('*', { count: 'exact', head: true })

        setStats({ users, seances, clients, events, sessions })
      }
      setLoading(false)
    }
    fetchStats()
  }, [])

  if (loading) return <div style={{padding:'2rem',fontSize:'13px',color:'var(--color-text-secondary)'}}>Chargement...</div>

  const cards = [
    { icon:'ti-users',          label:'Utilisateurs',  val: stats?.users ?? 0,    color:'#534AB7' },
    { icon:'ti-address-book',   label:'Clients',       val: stats?.clients ?? 0,  color:'#1D9E75' },
    { icon:'ti-calendar',       label:'Séances',       val: stats?.seances ?? 0,  color:'#854F0B' },
    { icon:'ti-pointer',        label:'Events loggés', val: stats?.events ?? 0,   color:'#185FA5' },
    { icon:'ti-login',          label:'Sessions',      val: stats?.sessions ?? 0, color:'#993556' },
  ]

  return (
    <div style={{padding:'1.5rem',maxWidth:'900px',margin:'0 auto'}}>

      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'1.5rem',paddingBottom:'1rem',borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
        <i className="ti ti-database" style={{fontSize:'20px',color:'#1D9E75'}} aria-hidden="true"/>
        <div style={{flex:1}}>
          <div style={{fontSize:'14px',fontWeight:500}}>Supabase — napoAlphav0.1</div>
          <div style={{fontSize:'11px',color:'var(--color-text-secondary)'}}>jzwwqngbgcdeyiqrvtle · eu-west-3</div>
        </div>
        <span style={{fontSize:'11px',padding:'3px 10px',borderRadius:'20px',fontWeight:500,background:'#EAF3DE',color:'#27500A'}}>
          En ligne
        </span>
      </div>

      {/* Métriques */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'1.25rem'}}>
        {cards.map(c => (
          <div key={c.label} style={{background:'var(--color-background-secondary)',borderRadius:'8px',padding:'14px 16px'}}>
            <div style={{fontSize:'10px',color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'6px',display:'flex',alignItems:'center',gap:'4px'}}>
              <i className={`ti ${c.icon}`} aria-hidden="true"/> {c.label}
            </div>
            <div style={{fontSize:'28px',fontWeight:500,lineHeight:1,color:c.color}}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Infos projet */}
      <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'12px',padding:'1rem 1.25rem'}}>
        <div style={{fontSize:'11px',color:'var(--color-text-secondary)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'12px'}}>
          Informations projet
        </div>
        {[
          { label:'Project Ref',   val:'jzwwqngbgcdeyiqrvtle' },
          { label:'Région',        val:'eu-west-3 (Paris)' },
          { label:'Plan',          val:'Free tier' },
          { label:'Stack',         val:'React + Vite + Supabase' },
          { label:'Déploiement',   val:'Vercel (auto on push)' },
        ].map(r => (
          <div key={r.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
            <span style={{fontSize:'12px',color:'var(--color-text-secondary)'}}>{r.label}</span>
            <span style={{fontSize:'12px',fontWeight:500}}>{r.val}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
