import { useEffect, useState } from 'react'

const TOKEN = import.meta.env.VITE_SUPABASE_ADMIN_TOKEN
const PROJECT_REF = 'jzwwqngbgcdeyiqrvtle'

export default function SupabaseStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchAll() {
      try {
        const headers = {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }

        const [projectRes, dbRes] = await Promise.all([
          fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}`, { headers }),
          fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query: `
              SELECT
                pg_size_pretty(pg_database_size(current_database())) as db_size,
                (SELECT count(*) FROM auth.users) as total_users,
                (SELECT count(*) FROM auth.users WHERE last_sign_in_at > now() - interval '7 days') as active_users,
                (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables
            `})
          })
        ])

        const project = await projectRes.json()
        const dbData = await dbRes.json()
        const row = dbData?.[0] ?? {}

        setStats({
          name: project.name,
          region: project.region,
          status: project.status,
          db_size: row.db_size ?? '—',
          total_users: row.total_users ?? '—',
          active_users: row.active_users ?? '—',
          total_tables: row.total_tables ?? '—',
          created_at: project.created_at,
        })
      } catch(e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) return <div style={{padding:'2rem',fontSize:'13px',color:'var(--color-text-secondary)'}}>Chargement Supabase...</div>
  if (error) return <div style={{padding:'2rem',fontSize:'13px',color:'red'}}>Erreur : {error}</div>

  const cards = [
    { icon:'ti-database',     label:'Taille DB',       val: stats.db_size,      color:'#534AB7' },
    { icon:'ti-users',        label:'Total users',      val: stats.total_users,  color:'#1D9E75' },
    { icon:'ti-user-check',   label:'Actifs 7 jours',  val: stats.active_users, color:'#854F0B' },
    { icon:'ti-table',        label:'Tables',           val: stats.total_tables, color:'#185FA5' },
  ]

  return (
    <div style={{padding:'1.5rem',maxWidth:'900px',margin:'0 auto'}}>

      {/* Header projet */}
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'1.5rem',paddingBottom:'1rem',borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
        <i className="ti ti-brand-supabase" style={{fontSize:'20px',color:'#1D9E75'}} aria-hidden="true"/>
        <div style={{flex:1}}>
          <div style={{fontSize:'14px',fontWeight:500}}>{stats.name}</div>
          <div style={{fontSize:'11px',color:'var(--color-text-secondary)'}}>
            {stats.region} · Créé le {new Date(stats.created_at).toLocaleDateString('fr-FR')}
          </div>
        </div>
        <span style={{fontSize:'11px',padding:'3px 10px',borderRadius:'20px',fontWeight:500,
          background: stats.status === 'ACTIVE_HEALTHY' ? '#EAF3DE' : '#FAEEDA',
          color: stats.status === 'ACTIVE_HEALTHY' ? '#27500A' : '#633806'}}>
          {stats.status === 'ACTIVE_HEALTHY' ? 'En ligne' : stats.status}
        </span>
      </div>

      {/* 4 métriques */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'1.25rem'}}>
        {cards.map(c => (
          <div key={c.label} style={{background:'var(--color-background-secondary)',borderRadius:'8px',padding:'14px 16px'}}>
            <div style={{fontSize:'10px',color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'6px',display:'flex',alignItems:'center',gap:'4px'}}>
              <i className={`ti ${c.icon}`} aria-hidden="true"/> {c.label}
            </div>
            <div style={{fontSize:'24px',fontWeight:500,lineHeight:1,color:c.color}}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Infos projet */}
      <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'12px',padding:'1rem 1.25rem',marginBottom:'12px'}}>
        <div style={{fontSize:'11px',color:'var(--color-text-secondary)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'12px'}}>
          Informations projet
        </div>
        {[
          { label:'Project Ref',  val: PROJECT_REF },
          { label:'Région',       val: stats.region },
          { label:'Statut',       val: stats.status },
          { label:'Créé le',      val: new Date(stats.created_at).toLocaleDateString('fr-FR') },
        ].map(r => (
          <div key={r.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
            <span style={{fontSize:'12px',color:'var(--color-text-secondary)'}}>{r.label}</span>
            <span style={{fontSize:'12px',fontWeight:500,fontFamily:'var(--font-mono)'}}>{r.val}</span>
          </div>
        ))}
      </div>

      <div style={{fontSize:'11px',color:'var(--color-text-secondary)',display:'flex',alignItems:'center',gap:'5px',
        padding:'8px 10px',background:'var(--color-background-secondary)',borderRadius:'8px'}}>
        <i className="ti ti-refresh" aria-hidden="true"/> Données en temps réel via Supabase Management API
      </div>
    </div>
  )
}
