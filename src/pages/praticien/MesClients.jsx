import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClients } from '../../hooks/useClients'

function clientName(c) { return `${c.prenom || ''} ${c.nom || ''}`.trim() }

const STATUT_STYLE = {
  actif:    { bg: '#E1F5EE', color: '#0F6E56', label: 'Actif' },
  Actif:    { bg: '#E1F5EE', color: '#0F6E56', label: 'Actif' },
  inactif:  { bg: '#FAEEDA', color: '#854F0B', label: 'Inactif' },
  archivé:  { bg: '#F5F5F5', color: '#6B7280', label: 'Archivé' },
}

const inp = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }

export default function MesClients() {
  const { clients, loading } = useClients()
  const [search, setSearch] = useState('')
  const [filterSpec, setFilterSpec] = useState('Toutes')
  const [filterStatut, setFilterStatut] = useState('Tous')
  const navigate = useNavigate()

  const specialites = ['Toutes', ...new Set(clients.map(c => c.specialite).filter(Boolean))]
  const statuts = ['Tous', ...new Set(clients.map(c => c.statut).filter(Boolean))]

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const matchQ = !q || clientName(c).toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.tel || '').toLowerCase().includes(q)
    const matchS = filterSpec === 'Toutes' || c.specialite === filterSpec
    const matchSt = filterStatut === 'Tous' || c.statut === filterStatut
    return matchQ && matchS && matchSt
  })

  return (
    <div style={{ padding: '1.6rem 2rem' }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>Mes clients</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, marginBottom: 18 }}>
        Retrouvez rapidement les personnes que vous accompagnez.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔎 Rechercher un client (nom, email, tél.)"
          style={{ ...inp, flex: 2, minWidth: 220 }} />
        <select value={filterSpec} onChange={e => setFilterSpec(e.target.value)} style={{ ...inp, flex: 1, minWidth: 140 }}>
          {specialites.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={{ ...inp, flex: 1, minWidth: 140 }}>
          {statuts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>Chargement…</div>
      ) : clients.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          Vous n'avez encore aucun client.
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          Aucun client ne correspond à cette recherche.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {filtered.map(c => {
            const st = STATUT_STYLE[c.statut] || { bg: '#F5F5F5', color: '#6B7280', label: c.statut || '—' }
            return (
              <div key={c.id} onClick={() => navigate(`/praticien/clients/${c.id}`)}
                style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{clientName(c) || '(sans nom)'}</div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.color }}>{st.label}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {c.derniere_seance ? `Dernière séance : ${c.derniere_seance}` : 'Aucune séance enregistrée'}
                </div>
                {c.specialite && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{c.specialite}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
