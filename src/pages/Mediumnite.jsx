import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const MOIS = ['jan','éfv','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']

function fmtDate(d) {
  if (!d) return '—'
  const [y,m,j] = d.slice(0,10).split('-')
  return `${parseInt(j)} ${MOIS[parseInt(m)-1]} ${y}`
}

function StatCard({ icon, iconBg, iconColor, label, value }) {
  return (
    <div style={{ background:'var(--color-background-secondary)', borderRadius:12, padding:'16px 18px', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ width:42, height:42, borderRadius:10, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <i className={`ti ${icon}`} style={{ fontSize:20, color:iconColor }} />
      </div>
      <div>
        <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>{label}</div>
        <div style={{ fontSize:22, fontWeight:600, color:'var(--color-text-primary)', lineHeight:1 }}>{value}</div>
      </div>
    </div>
  )
}

export default function Mediumnite() {
  const navigate = useNavigate()
  const [seances, setSeances] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('liste')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const [{ data: s }, { data: c }] = await Promise.all([
        supabase.from('fiches_mediumnite').select('*, clients(prenom, nom)').eq('user_id', user.id).order('date_seance', { ascending: false }),
        supabase.from('clients').select('id, prenom, nom').eq('user_id', user.id).order('nom')
      ])
      setSeances(s || [])
      setClients(c || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = seances.filter(s => {
    const q = search.toLowerCase()
    const nom = `${s.clients?.prenom || ''} ${s.clients?.nom || ''}`.toLowerCase()
    return !q || nom.includes(q)
  })

  const TABS = [
    { id:'liste', label:'Liste des séances', icon:'ti-list' },
    { id:'nouvelle', label:'Nouvelle séance', icon:'ti-plus' },
  ]

  async function handleNouvelle(clientId) {
    const { data: { user } } = await supabase.auth.getUser()
    const nbSeances = seances.filter(s => s.client_id === clientId).length
    const { data, error } = await supabase.from('fiches_mediumnite').insert({
      user_id: user.id,
      client_id: clientId,
      date_seance: new Date().toISOString().slice(0,10),
      heure_seance: new Date().toTimeString().slice(0,5),
      numero_seance: nbSeances + 1
    }).select().single()
    if (!error && data) navigate(`/mediumnite/${data.id}`)
  }

  return (
    <div style={{ padding:'1.6rem 2rem', fontFamily:'inherit' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.2rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <i className="ti ti-ghost" style={{ fontSize:24, color:'var(--color-accent)' }} />
          <div>
            <div style={{ fontSize:22, fontWeight:600, color:'var(--color-text-primary)' }}>Napo-Médium</div>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>{seances.length} séance(s) enregistrée(s)</div>
          </div>
        </div>
        <button onClick={() => setActiveTab('nouvelle')} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:13, fontWeight:500, cursor:'pointer' }}>
          <i className="ti ti-plus" style={{ fontSize:15 }} />Nouvelle séance
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:18 }}>
        <StatCard icon="ti-ghost"    iconBg="#EEEDFE" iconColor="#534AB7" label="Total séances"  value={seances.length} />
        <StatCard icon="ti-users"    iconBg="#E6F1FB" iconColor="#185FA5" label="Clients suivis" value={[...new Set(seances.map(s => s.client_id))].length} />
        <StatCard icon="ti-calendar" iconBg="#E1F5EE" iconColor="#0F6E56" label="Ce mois"         value={seances.filter(s => s.date_seance?.slice(0,7) === new Date().toISOString().slice(0,7)).length} />
      </div>

      <div style={{ display:'flex', borderBottom:'0.5px solid var(--color-border-tertiary)', marginBottom:16 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', border:'none', background:'none', cursor:'pointer', fontSize:13, fontWeight:activeTab===tab.id ? 600 : 400, color:activeTab===tab.id ? 'var(--color-accent)' : 'var(--color-text-secondary)', borderBottom:activeTab===tab.id ? '2px solid var(--color-accent)' : '2px solid transparent', marginBottom:-1 }}>
            <i className={`ti ${tab.icon}`} style={{ fontSize:14 }} />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'liste' && (
        <>
          <div style={{ position:'relative', marginBottom:14 }}>
            <i className="ti ti-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'var(--color-text-secondary)', pointerEvents:'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un client..."
              style={{ width:'100%', padding:'7px 10px 7px 32px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', fontSize:13, boxSizing:'border-box' }} />
          </div>
          <div style={{ background:'var(--color-background-secondary)', borderRadius:12, overflow:'hidden', border:'0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 80px 1fr 80px', padding:'8px 16px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
              {['Client','Date','Séance N°','Bilan',''].map((h,i) => (
                <div key={i} style={{ fontSize:10, fontWeight:600, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</div>
              ))}
            </div>
            {loading ? (
              <div style={{ padding:'40px', textAlign:'center', color:'var(--color-text-secondary)', fontSize:13 }}>Chargement…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:'40px', textAlign:'center', color:'var(--color-text-secondary)', fontSize:13 }}>
                <i className="ti ti-ghost" style={{ fontSize:28, display:'block', marginBottom:8 }} />
                Aucune séance médiumnité enregistrée
              </div>
            ) : filtered.map((s, idx) => (
              <div key={s.id} onClick={() => navigate(`/mediumnite/${s.id}`)}
                style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 80px 1fr 80px', padding:'11px 16px', alignItems:'center', cursor:'pointer', borderBottom:idx < filtered.length-1 ? '0.5px solid var(--color-border-tertiary)' : 'none', transition:'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--color-background-primary)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'#EEEDFE', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#534AB7' }}>
                      {(s.clients?.prenom||'?')[0]}{(s.clients?.nom||'?')[0]}
                    </span>
                  </div>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>
                    {s.clients?.prenom} {s.clients?.nom}
                  </div>
                </div>
                <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>{fmtDate(s.date_seance)}</div>
                <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>#{s.numero_seance}</div>
                <div style={{ fontSize:11, color:'var(--color-text-secondary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.bilan || '—'}</div>
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <i className="ti ti-chevron-right" style={{ fontSize:14, color:'var(--color-text-secondary)' }} />
                </div>
              </div>
            ))}
          </div>
          {filtered.length > 0 && (
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10, fontSize:13, color:'var(--color-text-secondary)' }}>
              {filtered.length} séance(s) affichée(s)
            </div>
          )}
        </>
      )}

      {activeTab === 'nouvelle' && (
        <div style={{ maxWidth:500 }}>
          <div style={{ background:'var(--color-background-secondary)', borderRadius:14, border:'0.5px solid var(--color-border-tertiary)', padding:28 }}>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--color-text-primary)', marginBottom:20 }}>Choisir un client</div>
            {clients.length === 0 ? (
              <div style={{ fontSize:13, color:'var(--color-text-secondary)' }}>Aucun client enregistré.</div>
            ) : clients.map(c => (
              <div key={c.id} onClick={() => handleNouvelle(c.id)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, cursor:'pointer', marginBottom:8, border:'0.5px solid var(--color-border-tertiary)', background:'var(--color-background-primary)', transition:'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--color-background-secondary)'}
                onMouseLeave={e => e.currentTarget.style.background='var(--color-background-primary)'}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#EEEDFE', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#534AB7' }}>{c.prenom[0]}{c.nom[0]}</span>
                </div>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>{c.prenom} {c.nom}</div>
                <i className="ti ti-arrow-right" style={{ fontSize:14, color:'var(--color-text-secondary)', marginLeft:'auto' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
