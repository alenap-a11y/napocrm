import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/* ── Helpers ── */
const CHAKRA_NOM = {
  1: 'Muladhara / Racine',
  2: 'Svadhisthana / Sacré',
  3: 'Manipura / Plexus',
  4: 'Anahata / Cœur',
  5: 'Vishuddha / Gorge',
  6: 'Ajna / Troisième Œil',
  7: 'Sahasrara / Couronne',
}

const ETAT_STYLE = {
  'bloqué':    { bg: '#FBEAF0', color: '#993556', label: 'Bloqué'    },
  'ouverture': { bg: '#FFF3E0', color: '#854F0B', label: 'Ouverture' },
  'ouvert':    { bg: '#EAF3DE', color: '#3B6D11', label: 'Ouvert'    },
}

function scoreColor(s) {
  if (s >= 70) return '#0F6E56'
  if (s >= 40) return '#854F0B'
  return '#993556'
}

function getInitiales(prenom, nom) {
  return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase() || '?'
}

function toCSV(evals, clientMap) {
  const header = 'Client,Chakra,Niveau,État,Session,Date'
  const lines = evals.map(e => {
    const c    = clientMap[e.client_id]
    const nom  = c ? `${c.prenom} ${c.nom}`.trim() : e.client_id
    const cha  = CHAKRA_NOM[e.chakra_id] || `Chakra ${e.chakra_id}`
    const date = e.created_at ? e.created_at.slice(0, 10) : ''
    return `"${nom}","${cha}",${e.niveau ?? ''},"${e.etat ?? ''}",${e.session_num ?? ''},"${date}"`
  })
  return [header, ...lines].join('\n')
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

/* ── Composant principal ── */
export default function Chakras() {
  const navigate = useNavigate()

  const [rows,      setRows]      = useState([])   // une ligne par client
  const [allEvals,  setAllEvals]  = useState([])   // toutes les évals brutes (pour CSV)
  const [clientMap, setClientMap] = useState({})   // id → {prenom, nom}
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [search,    setSearch]    = useState('')
  const [btnHover,  setBtnHover]  = useState(false)
  const [btnActive, setBtnActive] = useState(false)

  const currentMonth = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      /* 1. Toutes les évals */
      const { data: evals, error: evalErr } = await supabase
        .from('chakra_evaluations')
        .select('client_id, chakra_id, session_num, niveau, etat, created_at')

      if (evalErr) {
        if (!cancelled) { setError(evalErr.message); setLoading(false) }
        return
      }
      if (!evals || evals.length === 0) {
        if (!cancelled) { setRows([]); setAllEvals([]); setLoading(false) }
        return
      }

      /* 2. Grouper par client_id */
      const grouped = {}
      for (const e of evals) {
        ;(grouped[e.client_id] ??= []).push(e)
      }
      const clientIds = Object.keys(grouped)

      /* 3. Noms + date de création des clients */
      const { data: clients, error: clientErr } = await supabase
        .from('clients')
        .select('id, prenom, nom, created_at')
        .in('id', clientIds)

      if (clientErr) {
        if (!cancelled) { setError(clientErr.message); setLoading(false) }
        return
      }

      const byId = Object.fromEntries((clients ?? []).map(c => [c.id, c]))

      /* 4. Calculs par client */
      const result = clientIds.map(clientId => {
        const client = byId[clientId]
        if (!client) return null
        const bucket = grouped[clientId]

        const score = Math.round(
          bucket.reduce((s, e) => s + (e.niveau ?? 0), 0) / bucket.length
        )
        const nbSeances = Math.max(...bucket.map(e => e.session_num ?? 0))

        const counts = {}
        for (const e of bucket) if (e.etat) counts[e.etat] = (counts[e.etat] || 0) + 1
        const etatDominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'ouverture'

        const isMois = (client.created_at ?? '').startsWith(currentMonth)

        return { id: clientId, prenom: client.prenom, nom: client.nom, score, nbSeances, etatDominant, isMois }
      }).filter(Boolean).sort((a, b) => b.score - a.score)

      if (!cancelled) {
        setRows(result)
        setAllEvals(evals)
        setClientMap(byId)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  /* ── KPIs ── */
  const totalClients      = rows.length
  const clientsMois       = rows.filter(r => r.isMois).length
  const scoreMoyenGlobal  = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length)
    : 0
  const nbBloques         = allEvals.filter(e => e.etat === 'bloqué').length

  /* ── Filtrage recherche ── */
  const filtered = search
    ? rows.filter(r => `${r.prenom} ${r.nom}`.toLowerCase().includes(search.toLowerCase()))
    : rows

  /* ── Loading ── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)', fontSize: 13 }}>
      <i className="ti ti-loader-2" style={{ fontSize: 22, marginRight: 8 }} />Chargement…
    </div>
  )

  return (
    <div style={{ padding: '1.6rem 2rem', fontFamily: 'inherit' }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/seances/nouvelle')}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => { setBtnHover(false); setBtnActive(false) }}
            onMouseDown={() => setBtnActive(true)}
            onMouseUp={() => setBtnActive(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff', background: 'linear-gradient(145deg,#6b9e5e,#4a7a3d)', boxShadow: btnActive ? '0px 0px 0px #2d5a24' : btnHover ? '2px 2px 0px #2d5a24' : '4px 4px 0px #2d5a24', transform: btnActive ? 'translateY(4px)' : btnHover ? 'translateY(2px)' : 'none', transition: 'all 0.1s ease' }}
          >
            <i className="ti ti-plus" style={{ fontSize: 15 }} />Nouvelle séance
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="ti ti-yin-yang" style={{ fontSize: 24, color: 'var(--color-accent)' }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>Suivi énergétique</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                {rows.length} client{rows.length !== 1 ? 's' : ''} suivi{rows.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn icon="ti-upload"   label="Importer" onClick={() => alert('Bientôt disponible')} secondary />
          <Btn icon="ti-download" label="Exporter" onClick={() => downloadCSV(toCSV(allEvals, clientMap), 'chakras-napocrm.csv')} secondary />
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        <StatCard icon="ti-yin-yang"       iconBg="#FFF3E0" iconColor="#b36200" label="Clients suivis"      value={totalClients} />
        <StatCard icon="ti-calendar-month" iconBg="#EEEDFE" iconColor="#534AB7" label="Clients ce mois"     value={clientsMois} />
        <StatCard icon="ti-chart-line"     iconBg="#E1F5EE" iconColor="#0F6E56" label="Score moyen global"  value={scoreMoyenGlobal} />
        <StatCard icon="ti-circle-x"       iconBg="#FBEAF0" iconColor="#993556" label="Chakras bloqués"     value={nbBloques} />
      </div>

      {/* ── Erreur ── */}
      {error && (
        <div style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 8, background: '#FBEAF0', color: '#993556', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* ── Vide ── */}
      {!error && rows.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          <i className="ti ti-yin-yang" style={{ fontSize: 32, display: 'block', marginBottom: 10, opacity: 0.3 }} />
          Aucun suivi chakras commencé.<br />
          Ouvre une fiche séance pour évaluer un client.
        </div>
      )}

      {/* ── Liste ── */}
      {!error && rows.length > 0 && (
        <>
          {/* Recherche */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un client…"
                style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Tableau */}
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, overflow: 'hidden', border: '0.5px solid var(--color-border-tertiary)' }}>

            {/* En-tête colonnes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 100px 120px 110px', padding: '8px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              {['Client', 'Score global', 'Séances', 'État dominant', ''].map((h, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</div>
              ))}
            </div>

            {/* Aucun résultat recherche */}
            {filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                <i className="ti ti-user-off" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />
                Aucun client ne correspond à « {search} »
              </div>
            ) : filtered.map((row, idx) => {
              const etat   = ETAT_STYLE[row.etatDominant] ?? ETAT_STYLE['ouverture']
              const sColor = scoreColor(row.score)
              return (
                <div
                  key={row.id}
                  style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 100px 120px 110px', padding: '11px 16px', alignItems: 'center', borderBottom: idx < filtered.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-primary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Avatar + nom */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#854F0B' }}>{getInitiales(row.prenom, row.nom)}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {row.prenom} {row.nom}
                    </div>
                  </div>

                  {/* Score + barre */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--color-border-tertiary)', overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ width: `${row.score}%`, height: '100%', borderRadius: 3, background: sColor, transition: 'width .4s' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: sColor }}>{row.score}</span>
                  </div>

                  {/* Séances */}
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {row.nbSeances} séance{row.nbSeances !== 1 ? 's' : ''}
                  </div>

                  {/* Badge état */}
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: etat.bg, color: etat.color }}>
                      {etat.label}
                    </span>
                  </div>

                  {/* Bouton */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => navigate(`/clients/${row.id}/bilan`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 7, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Voir bilan <i className="ti ti-arrow-right" style={{ fontSize: 12 }} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {filtered.length} client{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Sous-composants (même style que Seances.jsx) ── */

function Btn({ icon, label, onClick, secondary }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, border: secondary ? '0.5px solid var(--color-border-secondary)' : 'none', background: secondary ? 'transparent' : 'var(--color-accent)', color: secondary ? 'var(--color-text-primary)' : '#fff' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 15 }} />{label}
    </button>
  )
}

function StatCard({ icon, iconBg, iconColor, label, value }) {
  return (
    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 20, color: iconColor }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  )
}
