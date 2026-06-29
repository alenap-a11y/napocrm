import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ETAT_STYLE = {
  'bloqué':    { bg: '#fbeaf0', color: '#993556', label: 'Bloqué'    },
  'ouverture': { bg: '#fff3e0', color: '#b36200', label: 'Ouverture' },
  'ouvert':    { bg: '#eaf3de', color: '#3b6d11', label: 'Ouvert'    },
}

function scoreColor(score) {
  if (score >= 70) return '#27AE60'
  if (score >= 40) return '#b36200'
  return '#993556'
}

function getInitiales(prenom, nom) {
  return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase() || '?'
}

export default function Chakras() {
  const navigate = useNavigate()
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      /* 1. Toutes les évaluations */
      const { data: evals, error: evalErr } = await supabase
        .from('chakra_evaluations')
        .select('client_id, session_num, niveau, etat')

      if (evalErr) {
        if (!cancelled) { setError(evalErr.message); setLoading(false) }
        return
      }

      if (!evals || evals.length === 0) {
        if (!cancelled) { setRows([]); setLoading(false) }
        return
      }

      /* 2. Grouper par client_id */
      const grouped = {}
      for (const e of evals) {
        if (!grouped[e.client_id]) grouped[e.client_id] = []
        grouped[e.client_id].push(e)
      }
      const clientIds = Object.keys(grouped)

      /* 3. Noms clients */
      const { data: clients, error: clientErr } = await supabase
        .from('clients')
        .select('id, prenom, nom')
        .in('id', clientIds)

      if (clientErr) {
        if (!cancelled) { setError(clientErr.message); setLoading(false) }
        return
      }

      const byId = Object.fromEntries((clients ?? []).map(c => [c.id, c]))

      /* 4. Calculs par client */
      const result = clientIds
        .map(clientId => {
          const client = byId[clientId]
          if (!client) return null
          const bucket = grouped[clientId]

          const score = Math.round(
            bucket.reduce((s, e) => s + (e.niveau ?? 0), 0) / bucket.length
          )
          const nbSeances = Math.max(...bucket.map(e => e.session_num ?? 0))

          const counts = {}
          for (const e of bucket) {
            if (e.etat) counts[e.etat] = (counts[e.etat] || 0) + 1
          }
          const etatDominant = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'ouverture'

          return { id: clientId, prenom: client.prenom, nom: client.nom, score, nbSeances, etatDominant }
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)

      if (!cancelled) { setRows(result); setLoading(false) }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const filtered = search
    ? rows.filter(r => `${r.prenom} ${r.nom}`.toLowerCase().includes(search.toLowerCase()))
    : rows

  return (
    <div style={{ padding: '1.6rem 2rem', fontFamily: 'inherit' }}>

      {/* ── Titre ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="ti ti-yin-yang" style={{ fontSize: 26, color: 'var(--color-accent)' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Suivi énergétique
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {loading ? '…' : `${rows.length} client${rows.length !== 1 ? 's' : ''} suivi${rows.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        {/* Barre recherche */}
        {!loading && rows.length > 0 && (
          <div style={{ position: 'relative' }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              style={{ padding: '7px 10px 7px 30px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, width: 200, outline: 'none' }}
            />
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '48px 0', color: 'var(--color-text-secondary)', fontSize: 14 }}>
          <div style={ST.spinner} />
          Chargement des suivis…
        </div>
      )}

      {/* ── Erreur ── */}
      {!loading && error && (
        <div style={{ padding: '14px 18px', borderRadius: 10, background: '#fbeaf0', color: '#993556', fontSize: 13 }}>
          <i className="ti ti-alert-circle" style={{ marginRight: 7 }} />
          {error}
        </div>
      )}

      {/* ── Vide ── */}
      {!loading && !error && rows.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
          <i className="ti ti-yin-yang" style={{ fontSize: 44, opacity: 0.2 }} />
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            Aucun suivi chakras commencé.
          </div>
          <div style={{ fontSize: 13, maxWidth: 320, lineHeight: 1.6 }}>
            Ouvre une fiche séance pour évaluer un client.
          </div>
        </div>
      )}

      {/* ── Tableau ── */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, overflow: 'hidden', border: '0.5px solid var(--color-border-tertiary)' }}>

          {/* En-tête colonnes */}
          <div style={ST.head}>
            {['Client', 'Score global', 'Séances', 'État dominant', ''].map((h, i) => (
              <div key={i} style={ST.headCell}>{h}</div>
            ))}
          </div>

          {/* Lignes clients */}
          {filtered.map((row, idx) => {
            const etat   = ETAT_STYLE[row.etatDominant] ?? ETAT_STYLE['ouverture']
            const sColor = scoreColor(row.score)
            return (
              <div
                key={row.id}
                style={{ ...ST.row, borderBottom: idx < filtered.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-primary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Avatar + nom */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#b36200' }}>
                      {getInitiales(row.prenom, row.nom)}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {row.prenom} {row.nom}
                  </span>
                </div>

                {/* Score + barre */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--color-border-tertiary)', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ width: `${row.score}%`, height: '100%', borderRadius: 3, background: sColor, transition: 'width .4s' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: sColor }}>{row.score}</span>
                </div>

                {/* Séances */}
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {row.nbSeances} séance{row.nbSeances !== 1 ? 's' : ''}
                </div>

                {/* Badge état */}
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: etat.bg, color: etat.color }}>
                    {etat.label}
                  </span>
                </div>

                {/* Bouton */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => navigate(`/clients/${row.id}/bilan`)}
                    style={ST.btnBilan}
                  >
                    Voir bilan <i className="ti ti-arrow-right" style={{ fontSize: 12 }} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pas de résultat pour la recherche */}
      {!loading && !error && rows.length > 0 && filtered.length === 0 && (
        <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          Aucun client ne correspond à « {search} »
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ marginTop: 10, textAlign: 'right', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {filtered.length} client{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

/* ── Styles ── */
const ST = {
  head: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 0.7fr 0.9fr 110px',
    padding: '8px 16px',
    borderBottom: '0.5px solid var(--color-border-tertiary)',
  },
  headCell: {
    fontSize: 10, fontWeight: 600,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase', letterSpacing: '.06em',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 0.7fr 0.9fr 110px',
    padding: '11px 16px',
    alignItems: 'center',
    transition: 'background .1s',
  },
  btnBilan: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 13px', borderRadius: 7,
    border: 'none', background: 'var(--color-accent)',
    color: '#fff', fontSize: 12, fontWeight: 600,
    cursor: 'pointer',
  },
  spinner: {
    width: 20, height: 20,
    border: '2px solid var(--color-border-tertiary)',
    borderTop: '2px solid var(--color-accent)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0,
  },
}
