import { useChakraProgression } from '../hooks/useChakras'

const CHAKRAS_META = [
  { id: 1, nom: 'Muladhara',    sous_nom: 'Racine',        couleur: '#C0392B' },
  { id: 2, nom: 'Svadhisthana', sous_nom: 'Sacré',         couleur: '#E67E22' },
  { id: 3, nom: 'Manipura',     sous_nom: 'Plexus',        couleur: '#F39C12' },
  { id: 4, nom: 'Anahata',      sous_nom: 'Cœur',          couleur: '#27AE60' },
  { id: 5, nom: 'Vishuddha',    sous_nom: 'Gorge',         couleur: '#1A8FAA' },
  { id: 6, nom: 'Ajna',         sous_nom: 'Troisième Œil', couleur: '#4A6FA5' },
  { id: 7, nom: 'Sahasrara',    sous_nom: 'Couronne',      couleur: '#9B59B6' },
]

const ETAT_BADGE = {
  'bloqué':    { bg: '#fbeaf0', color: '#993556', label: 'Bloqué' },
  'ouverture': { bg: '#fff3e0', color: '#b36200', label: 'Ouverture' },
  'ouvert':    { bg: '#eaf3de', color: '#3b6d11', label: 'Ouvert' },
}

export default function ChakraDashboard({ clientId, onGenerateBilan }) {
  const { progression, loading, error } = useChakraProgression(clientId)

  if (loading) return (
    <div style={S.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={S.spinner} />
        <span style={{ fontSize: 13, color: '#a07848' }}>Chargement chakras…</span>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ ...S.card, borderColor: 'rgba(153,53,86,0.3)' }}>
      <span style={{ fontSize: 12, color: '#993556' }}>
        Erreur lors du chargement des évaluations chakras.
      </span>
    </div>
  )

  if (!progression || progression.length === 0) return (
    <div style={S.card}>
      <div style={S.sectionTitle}>Progression chakras</div>
      <div style={{ fontSize: 13, color: '#a07848', padding: '8px 0' }}>
        Aucune évaluation chakras pour ce client.
      </div>
    </div>
  )

  /* Construire un index par chakra_id pour accès rapide */
  const byId = {}
  progression.forEach(p => { byId[p.chakra_id] = p })

  const sessionNumMax = Math.max(...progression.map(p => p.session_num ?? 0))
  const scoreGlobal = Math.round(
    CHAKRAS_META.reduce((sum, c) => sum + (byId[c.id]?.niveau_actuel ?? 0), 0) / CHAKRAS_META.length
  )

  return (
    <div style={S.card}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={S.sectionTitle}>Progression chakras</div>
        <div style={S.scoreBadge}>
          <span style={{ fontSize: 9, fontWeight: 600, color: '#a07848', letterSpacing: '.06em', textTransform: 'uppercase' }}>Score global</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#c17a3a', lineHeight: 1 }}>{scoreGlobal}</span>
          <span style={{ fontSize: 9, color: '#a07848' }}>/ 100</span>
        </div>
      </div>

      {/* Tableau chakras */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CHAKRAS_META.map(meta => {
          const row = byId[meta.id]
          if (!row) return (
            <div key={meta.id} style={S.row}>
              <div style={{ ...S.dot, background: meta.couleur }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: meta.couleur }}>{meta.nom}</span>
                {' '}
                <span style={{ fontSize: 10, color: '#a07848' }}>{meta.sous_nom}</span>
              </div>
              <span style={{ fontSize: 11, color: '#c8bdb4' }}>—</span>
            </div>
          )

          const niveauInitial = row.niveau_initial ?? 0
          const niveauActuel  = row.niveau_actuel  ?? 0
          const delta = niveauActuel - niveauInitial
          const etatStyle = ETAT_BADGE[row.etat] ?? ETAT_BADGE['ouverture']

          return (
            <div key={meta.id}>
              {/* Ligne principale */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <div style={{ ...S.dot, background: meta.couleur }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: meta.couleur }}>{meta.nom}</span>
                  {' '}
                  <span style={{ fontSize: 10, color: '#a07848' }}>{meta.sous_nom}</span>
                </div>
                {/* Badge état */}
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                  background: etatStyle.bg, color: etatStyle.color,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {etatStyle.label}
                </span>
              </div>

              {/* Barre de progression */}
              <div style={S.barTrack}>
                <div style={{
                  ...S.barFill,
                  width: `${niveauActuel}%`,
                  background: meta.couleur,
                }} />
              </div>

              {/* Chiffres */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: '#a07848' }}>
                  Initial&nbsp;<strong style={{ color: '#1a1208' }}>{niveauInitial}%</strong>
                  &nbsp;→&nbsp;
                  Actuel&nbsp;<strong style={{ color: meta.couleur }}>{niveauActuel}%</strong>
                </span>
                {delta !== 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: delta > 0 ? '#3b6d11' : '#993556',
                  }}>
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                )}
                {delta === 0 && (
                  <span style={{ fontSize: 10, color: '#c8bdb4' }}>=</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bouton bilan mi-parcours */}
      {sessionNumMax >= 4 && onGenerateBilan && (
        <button onClick={onGenerateBilan} style={S.bilanBtn}>
          ✦ Générer bilan mi-parcours
        </button>
      )}
    </div>
  )
}

const S = {
  card: {
    background: '#fff',
    borderRadius: 10,
    border: '0.5px solid rgba(193,122,58,0.18)',
    padding: '16px 18px',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 600, color: '#c17a3a',
    textTransform: 'uppercase', letterSpacing: '.06em',
    margin: 0,
  },
  scoreBadge: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    background: '#fdfaf6', borderRadius: 8,
    border: '0.5px solid rgba(193,122,58,0.2)',
    padding: '6px 14px', gap: 1,
  },
  dot: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  barTrack: {
    width: '100%', height: 6, borderRadius: 3,
    background: 'rgba(193,122,58,0.1)', overflow: 'hidden',
  },
  barFill: {
    height: '100%', borderRadius: 3,
    transition: 'width 0.4s ease',
  },
  bilanBtn: {
    marginTop: 16, width: '100%',
    padding: '10px', borderRadius: 8,
    border: 'none', cursor: 'pointer',
    background: '#c17a3a', color: '#fff',
    fontSize: 12, fontWeight: 700,
    letterSpacing: '.03em',
    transition: 'background .2s',
  },
  spinner: {
    width: 16, height: 16,
    border: '2px solid rgba(193,122,58,0.2)',
    borderTop: '2px solid #c17a3a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}
