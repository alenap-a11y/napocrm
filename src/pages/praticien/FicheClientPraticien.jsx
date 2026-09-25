import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useClients } from '../../hooks/useClients'

function clientName(c) { return `${c.prenom || ''} ${c.nom || ''}`.trim() }

function fmtDate(d) {
  if (!d) return '—'
  const s = String(d).slice(0, 10).split('-')
  if (s.length !== 3) return d
  const MOIS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
  return `${parseInt(s[2])} ${MOIS[parseInt(s[1]) - 1]} ${s[0]}`
}

const card = { background: 'var(--color-background-secondary)', borderRadius: 10, padding: 16 }
const cardLabel = { fontSize: 12, color: 'var(--color-text-secondary)' }
const cardValue = { fontSize: 22, fontWeight: 600, marginTop: 4 }

export default function FicheClientPraticien() {
  const { clientId } = useParams()
  const { clients, loading } = useClients()
  const navigate = useNavigate()
  const client = clients.find(c => c.id === clientId)

  const [seances, setSeances] = useState([])
  const [loadingSeances, setLoadingSeances] = useState(true)

  useEffect(() => {
    if (!clientId) return
    setLoadingSeances(true)
    supabase.from('seances')
      .select('id, date_seance, heure_seance, duree_minutes, type_seance, prix_euros, statut')
      .eq('client_id', clientId)
      .order('date_seance', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setSeances(data || [])
        setLoadingSeances(false)
      })
  }, [clientId])

  const now = new Date().toISOString().slice(0, 10)
  const passees = seances.filter(s => s.date_seance && s.date_seance.slice(0, 10) < now)
  const avenir = seances.filter(s => s.date_seance && s.date_seance.slice(0, 10) >= now && s.statut === 'planifié')
    .sort((a, b) => a.date_seance.localeCompare(b.date_seance))

  const derniereSeance = passees[0]?.date_seance
  const prochaineSeance = avenir[0]?.date_seance

  if (loading) return <div style={{ padding: '1.6rem 2rem', color: 'var(--color-text-secondary)', fontSize: 13 }}>Chargement…</div>
  if (!client) return (
    <div style={{ padding: '1.6rem 2rem' }}>
      <button type="button" onClick={() => navigate('/praticien/clients')}
        style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 13, cursor: 'pointer', padding: 0 }}>
        ← Mes clients
      </button>
      <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 12 }}>Client introuvable.</div>
    </div>
  )

  return (
    <div style={{ padding: '1.6rem 2rem', maxWidth: 900 }}>
      <button type="button" onClick={() => navigate('/praticien/clients')}
        style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 13, cursor: 'pointer', marginBottom: 14, padding: 0 }}>
        ← Mes clients
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-background-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: 'var(--color-accent)', flexShrink: 0 }}>
          {(client.prenom?.[0] || '') + (client.nom?.[0] || '')}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>{clientName(client)}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Client depuis {client.created_at ? fmtDate(client.created_at) : client.date_creation ? fmtDate(client.date_creation) : '—'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button type="button" style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Nouvelle séance</button>
        <button type="button" style={{ padding: '7px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer' }}>Ajouter une note</button>
        <button type="button" style={{ padding: '7px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer' }}>Questionnaire</button>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Résumé</div>

      {loadingSeances ? (
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Chargement…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          <div style={card}><div style={cardLabel}>Nombre de séances</div><div style={cardValue}>{seances.length}</div></div>
          <div style={card}><div style={cardLabel}>Dernière séance</div><div style={cardValue}>{fmtDate(derniereSeance)}</div></div>
          <div style={card}><div style={cardLabel}>Prochaine séance</div><div style={cardValue}>{fmtDate(prochaineSeance)}</div></div>
          <div style={card}><div style={cardLabel}>Temps total d'accompagnement</div><div style={cardValue}>—</div></div>
          <div style={card}><div style={cardLabel}>Questionnaires réalisés</div><div style={cardValue}>—</div></div>
          <div style={card}><div style={cardLabel}>Objectifs actifs</div><div style={cardValue}>—</div></div>
          <div style={card}><div style={cardLabel}>Satisfaction moyenne</div><div style={cardValue}>—</div></div>
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8 }}>
        Ce résumé compte les séances de la table générique. Les séances Oracle, Énergie, Bach et les 12 modules métiers ne sont pas encore agrégées ici.
      </div>
    </div>
  )
}
