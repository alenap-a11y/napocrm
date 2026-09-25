import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const MOIS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']

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

export default function Formation() {
  const navigate = useNavigate()
  const [seances, setSeances] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('liste')
  const [selection, setSelection] = useState([])
  const [creating, setCreating] = useState(false)
  const [themeNouvelle, setThemeNouvelle] = useState('')
  const [animeParNouvelle, setAnimeParNouvelle] = useState('')
  const [envoiStatut, setEnvoiStatut] = useState('')

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from('formation_seances').select('*, formation_participants(id, client_id, clients(prenom, nom))').eq('user_id', user.id).order('date_seance', { ascending: false }),
      supabase.from('clients').select('id, prenom, nom, email').eq('user_id', user.id).order('nom')
    ])
    setSeances(s || [])
    setClients(c || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = seances.filter(s => {
    const q = search.toLowerCase()
    const theme = (s.theme || '').toLowerCase()
    const noms = (s.formation_participants || []).map(p => `${p.clients?.prenom || ''} ${p.clients?.nom || ''}`.toLowerCase()).join(' ')
    return !q || theme.includes(q) || noms.includes(q)
  })

  const TABS = [
    { id:'liste', label:'Liste des séances', icon:'ti-list' },
    { id:'nouvelle', label:'Nouvelle séance', icon:'ti-plus' },
  ]

  function toggleSelection(clientId) {
    setSelection(prev => prev.includes(clientId) ? prev.filter(id => id !== clientId) : (prev.length >= 50 ? prev : [...prev, clientId]))
  }

  async function handleCreerSeance() {
    if (selection.length === 0) return
    setCreating(true)
    setEnvoiStatut('')
    const { data: { user } } = await supabase.auth.getUser()
    const { data: s, error } = await supabase.from('formation_seances').insert({
      user_id: user.id,
      date_seance: new Date().toISOString().slice(0,10),
      heure_seance: new Date().toTimeString().slice(0,5),
      numero_seance: seances.length + 1,
      theme: themeNouvelle || null,
      anime_par: animeParNouvelle || null,
    }).select().single()
    if (!error && s) {
      const rows = selection.map(clientId => ({ user_id: user.id, seance_id: s.id, client_id: clientId }))
      await supabase.from('formation_participants').insert(rows)

      const destinataires = clients.filter(c => selection.includes(c.id) && c.email)
      if (destinataires.length > 0) {
        setEnvoiStatut(`Envoi des invitations (${destinataires.length})…`)
        const MOIS_LONG = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
        const d = new Date(s.date_seance)
        const dateTxt = `${d.getDate()} ${MOIS_LONG[d.getMonth()]} ${d.getFullYear()}`
        const lienVisio = s.jitsi_room_id ? `https://meet.jit.si/${s.jitsi_room_id}` : null
        const texte = `Bonjour,

Vous êtes invité·e à la séance de formation « ${s.theme || 'Formation'} » le ${dateTxt}${s.heure_seance ? ` à ${s.heure_seance}` : ''}.
${s.anime_par ? `Animée par ${s.anime_par}.` : ''}
${lienVisio ? `\nLien de connexion : ${lienVisio}` : ''}

À bientôt !`
        let succes = 0, echecs = 0
        for (const c of destinataires) {
          const { error: mailError } = await supabase.functions.invoke('send-formation-invitation', {
            body: { to: c.email, subject: `Invitation — Formation : ${s.theme || 'Séance'}`, texte }
          })
          if (mailError) echecs++; else succes++
        }
        setEnvoiStatut(`${succes} invitation(s) envoyée(s)${echecs ? `, ${echecs} échec(s)` : ''}.`)
        await new Promise(r => setTimeout(r, 1200))
      }
      navigate(`/formation/${s.id}`)
    }
    setCreating(false)
  }

  const apprenantsFormes = [...new Set(seances.flatMap(s => (s.formation_participants || []).map(p => p.client_id)))].length
  const themesDistincts = [...new Set(seances.map(s => s.theme).filter(Boolean))].length

  return (
    <div style={{ padding:'1.6rem 2rem', fontFamily:'inherit' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.2rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <i className="ti ti-school" style={{ fontSize:24, color:'var(--color-accent)' }} />
          <div>
            <div style={{ fontSize:22, fontWeight:600, color:'var(--color-text-primary)' }}>Formation</div>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>{seances.length} séance(s) enregistrée(s)</div>
          </div>
        </div>
        <button onClick={() => setActiveTab('nouvelle')} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'none', background:'var(--color-accent)', color:'#fff', fontSize:13, fontWeight:500, cursor:'pointer' }}>
          <i className="ti ti-plus" style={{ fontSize:15 }} />Nouvelle séance
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
        <StatCard icon="ti-school"     iconBg="#EEEDFE" iconColor="#534AB7" label="Total séances"    value={seances.length} />
        <StatCard icon="ti-users"      iconBg="#E6F1FB" iconColor="#185FA5" label="Apprenants formés" value={apprenantsFormes} />
        <StatCard icon="ti-calendar"   iconBg="#E1F5EE" iconColor="#0F6E56" label="Ce mois"          value={seances.filter(s => s.date_seance?.slice(0,7) === new Date().toISOString().slice(0,7)).length} />
        <StatCard icon="ti-bulb"       iconBg="#FEF3E2" iconColor="#A05A00" label="Thèmes traités"   value={themesDistincts} />
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un apprenant ou un thème..."
              style={{ width:'100%', padding:'7px 10px 7px 32px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)', color:'var(--color-text-primary)', fontSize:13, boxSizing:'border-box' }} />
          </div>
          <div style={{ background:'var(--color-background-secondary)', borderRadius:12, overflow:'hidden', border:'0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1.8fr 1fr 80px 1.2fr 80px', padding:'8px 16px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
              {['Participants','Date','Séance N°','Thème',''].map((h,i) => (
                <div key={i} style={{ fontSize:10, fontWeight:600, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</div>
              ))}
            </div>
            {loading ? (
              <div style={{ padding:'40px', textAlign:'center', color:'var(--color-text-secondary)', fontSize:13 }}>Chargement…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:'40px', textAlign:'center', color:'var(--color-text-secondary)', fontSize:13 }}>
                <i className="ti ti-school" style={{ fontSize:28, display:'block', marginBottom:8 }} />
                Aucune séance de formation enregistrée
              </div>
            ) : filtered.map((s, idx) => {
              const parts = s.formation_participants || []
              return (
                <div key={s.id} onClick={() => navigate(`/formation/${s.id}`)}
                  style={{ display:'grid', gridTemplateColumns:'1.8fr 1fr 80px 1.2fr 80px', padding:'11px 16px', alignItems:'center', cursor:'pointer', borderBottom:idx < filtered.length-1 ? '0.5px solid var(--color-border-tertiary)' : 'none', transition:'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--color-background-primary)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <div style={{ display:'flex', alignItems:'center', gap:-6 }}>
                    <div style={{ display:'flex' }}>
                      {parts.slice(0,3).map((p, i) => (
                        <div key={p.id} style={{ width:28, height:28, borderRadius:'50%', background:'#EEEDFE', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft: i===0 ? 0 : -8, border:'2px solid var(--color-background-secondary)' }}>
                          <span style={{ fontSize:10, fontWeight:700, color:'#534AB7' }}>{(p.clients?.prenom||'?')[0]}{(p.clients?.nom||'?')[0]}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:12, color:'var(--color-text-primary)', marginLeft:10 }}>
                      {parts.length === 0 ? 'Aucun participant' : parts.length === 1 ? `${parts[0].clients?.prenom} ${parts[0].clients?.nom}` : `${parts.length} participants`}
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>{fmtDate(s.date_seance)}</div>
                  <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>#{s.numero_seance}</div>
                  <div style={{ fontSize:11, color:'var(--color-text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.theme || '—'}</div>
                  <div style={{ display:'flex', justifyContent:'flex-end' }}>
                    <i className="ti ti-chevron-right" style={{ fontSize:14, color:'var(--color-text-secondary)' }} />
                  </div>
                </div>
              )
            })}
          </div>
          {filtered.length > 0 && (
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10, fontSize:13, color:'var(--color-text-secondary)' }}>
              {filtered.length} séance(s) affichée(s)
            </div>
          )}
        </>
      )}

      {activeTab === 'nouvelle' && (
        <div style={{ maxWidth:560 }}>
          <div style={{ background:'var(--color-background-secondary)', borderRadius:14, border:'0.5px solid var(--color-border-tertiary)', padding:28 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--color-text-primary)' }}>Choisir les participants (1 à 50)</div>
              <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>{selection.length} sélectionné(s)</div>
            </div>
            {clients.length === 0 ? (
              <div style={{ fontSize:13, color:'var(--color-text-secondary)' }}>Aucun client enregistré.</div>
            ) : (
              <div style={{ maxHeight:360, overflowY:'auto', marginBottom:18 }}>
                {clients.map(c => {
                  const checked = selection.includes(c.id)
                  return (
                    <div key={c.id} onClick={() => toggleSelection(c.id)}
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, cursor:'pointer', marginBottom:8, border: checked ? '1px solid var(--color-accent)' : '0.5px solid var(--color-border-tertiary)', background: checked ? 'rgba(242,176,30,0.08)' : 'var(--color-background-primary)', transition:'background .1s' }}>
                      <div style={{ width:20, height:20, borderRadius:5, border: checked ? 'none' : '1.5px solid var(--color-border-secondary)', background: checked ? 'var(--color-accent)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {checked && <i className="ti ti-check" style={{ fontSize:13, color:'#fff' }} />}
                      </div>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'#EEEDFE', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:'#534AB7' }}>{c.prenom[0]}{c.nom[0]}</span>
                      </div>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>{c.prenom} {c.nom}</div>
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize:10, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6, fontWeight:600 }}>Thème</div>
                <input value={themeNouvelle} onChange={e => setThemeNouvelle(e.target.value)} placeholder="Ex : Communication non violente…"
                  style={{ width:'100%', padding:'7px 10px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:13, boxSizing:'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6, fontWeight:600 }}>Animé par</div>
                <input value={animeParNouvelle} onChange={e => setAnimeParNouvelle(e.target.value)} placeholder="Ton nom ou celui du formateur"
                  style={{ width:'100%', padding:'7px 10px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:13, boxSizing:'border-box' }} />
              </div>
            </div>
            {selection.length > 0 && (
              <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:10 }}>
                {clients.filter(c => selection.includes(c.id) && c.email).length} / {selection.length} participant(s) recevront l'invitation par email automatiquement.
              </div>
            )}
            <button onClick={handleCreerSeance} disabled={selection.length === 0 || creating}
              style={{ width:'100%', padding:'11px', borderRadius:8, border:'none', background: selection.length === 0 ? 'var(--color-border-secondary)' : '#F2B01E', color:'#fff', fontSize:13, fontWeight:600, cursor: selection.length === 0 ? 'default' : 'pointer', opacity: creating ? 0.7 : 1 }}>
              {creating ? (envoiStatut || 'Création…') : `Créer la séance (${selection.length})`}
            </button>
            {envoiStatut && (
              <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:8, textAlign:'center' }}>{envoiStatut}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
