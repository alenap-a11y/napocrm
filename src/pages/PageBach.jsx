import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const P = {
  vert: '#3D5A3E', sable: '#FBF8F4', sableF: '#EDE8E0',
  texte: '#2C1F0E', gris: '#9B8B7A', ambre: '#A0622A',
  vertClair: '#EAF0EA',
}

export default function PageBach() {
  const [clients, setClients] = useState([])
  const [fiches, setFiches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: cls }, { data: fis }] = await Promise.all([
        supabase.from('clients').select('*').eq('user_id', user.id).order('nom'),
        supabase.from('fiches_bach').select('*').order('created_at', { ascending: false }),
      ])
      setClients(cls || [])
      setFiches(fis || [])
      setLoading(false)
    }
    load()
  }, [])

  const fichesParClient = (clientId) => fiches.filter(f => f.client_id === clientId)
  const clientsAvecBach = clients.filter(c => fichesParClient(c.id).length > 0)
  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    return !q || `${c.prenom} ${c.nom}`.toLowerCase().includes(q)
  })

  if (loading) return <div style={{ padding: 40, color: P.gris }}>Chargement...</div>

  return (
    <div style={{ padding: '28px 32px', background: P.sable, minHeight: '100vh', fontFamily: `'Georgia', serif` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: P.texte, margin: 0 }}>🌿 Fleurs de Bach</h1>
          <div style={{ fontSize: 13, color: P.gris, marginTop: 4 }}>{clients.length} client(s) enregistré(s)</div>
        </div>
        <button onClick={() => window.location.href = '/fleurs-de-bach'} style={{ padding: '10px 22px', background: P.vert, color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          + Nouvelle séance Bach
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total clients', val: clients.length, icon: '👥' },
          { label: 'Clients avec Bach', val: clientsAvecBach.length, icon: '🌿' },
          { label: 'Total fiches Bach', val: fiches.length, icon: '📋' },
          { label: 'Moy. fiches/client', val: clients.length ? (fiches.length / clients.length).toFixed(1) : '0.0', icon: '📊' },
        ].map(({ label, val, icon }) => (
          <div key={label} style={{ background: 'white', borderRadius: 14, padding: '18px 22px', border: `1.5px solid ${P.sableF}` }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: P.texte }}>{val}</div>
            <div style={{ fontSize: 12, color: P.gris, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un client..." style={{ width: '100%', padding: '10px 16px', border: `1.5px solid ${P.sableF}`, borderRadius: 10, fontSize: 14, background: 'white', color: P.texte, outline: 'none', fontFamily: 'inherit' }} />
      </div>
      <div style={{ background: 'white', borderRadius: 14, border: `1.5px solid ${P.sableF}`, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 160px', padding: '10px 20px', background: P.sableF, fontSize: 11, fontWeight: 700, color: P.gris, textTransform: 'uppercase', letterSpacing: 1 }}>
          <span>Client</span><span>Fiches Bach</span><span>Dernière fiche</span><span></span>
        </div>
        {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: P.gris, fontSize: 14 }}>Aucun client trouvé</div>}
        {filtered.map((c, i) => {
          const fClient = fichesParClient(c.id)
          const derniere = fClient[0]?.created_at
          const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
          return (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 160px', padding: '14px 20px', alignItems: 'center', borderTop: i === 0 ? 'none' : `1px solid ${P.sableF}` }}
              onMouseEnter={e => e.currentTarget.style.background = P.sable}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: P.vertClair, color: P.vert, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                  {(c.prenom?.[0] || '').toUpperCase()}{(c.nom?.[0] || '').toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: P.texte }}>{c.prenom} {c.nom}</div>
                  <div style={{ fontSize: 12, color: P.gris }}>{c.specialite || 'Non renseigné'}</div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: fClient.length > 0 ? P.vert : P.gris, fontWeight: fClient.length > 0 ? 700 : 400 }}>
                {fClient.length > 0 ? `${fClient.length} fiche(s)` : 'Aucune'}
              </div>
              <div style={{ fontSize: 13, color: P.gris }}>{fmtDate(derniere)}</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => window.location.href = `/fleurs-de-bach/${c.id}`} style={{ padding: '7px 14px', background: P.vert, color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {fClient.length > 0 ? 'Nouvelle fiche' : 'Démarrer'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ textAlign: 'right', fontSize: 12, color: P.gris, marginTop: 10 }}>{filtered.length} client(s) affiché(s)</div>
    </div>
  )
}
