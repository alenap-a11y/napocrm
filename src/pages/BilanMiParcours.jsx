import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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

export default function BilanMiParcours() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { progression, loading, error } = useChakraProgression(clientId)
  const [client, setClient] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'ok' | 'error' | null

  useEffect(() => {
    if (!clientId) return
    supabase.from('clients').select('prenom, nom').eq('id', clientId).single()
      .then(({ data }) => { if (data) setClient(data) })
  }, [clientId])

  /* ── États loading / erreur ── */
  if (loading) return (
    <div style={S.center}>
      <div style={S.spinner} />
      <p style={{ color: '#888', marginTop: 16 }}>Chargement du bilan…</p>
    </div>
  )

  if (error) return (
    <div style={S.center}>
      <p style={{ color: '#993556', fontWeight: 600 }}>Erreur lors du chargement des données chakras.</p>
      <button onClick={() => navigate(-1)} style={S.btnSecondary}>← Retour</button>
    </div>
  )

  /* ── Filtrer sur session_num <= 4 ── */
  const data = progression.filter(p => p.session_num <= 4)

  if (data.length === 0) return (
    <div style={S.center}>
      <p style={{ color: '#a07848', fontSize: 15, marginBottom: 16 }}>
        Aucune évaluation chakras disponible pour ce client (sessions 1–4).
      </p>
      <button onClick={() => navigate(-1)} style={S.btnSecondary}>← Retour</button>
    </div>
  )

  /* ── Calculs par chakra ── */
  const chakraStats = CHAKRAS_META.map(meta => {
    const row = data.find(p => p.chakra_id === meta.id)
    if (!row) return { ...meta, hasData: false }
    const niveauInitial = row.niveau_initial ?? 0
    const niveauActuel  = row.niveau_actuel  ?? 0
    return {
      ...meta,
      hasData: true,
      niveauInitial,
      niveauActuel,
      delta: niveauActuel - niveauInitial,
      etat: row.etat ?? 'ouverture',
      sessionNum: row.session_num ?? 1,
    }
  })

  const withData = chakraStats.filter(c => c.hasData)

  const scoreGlobal       = withData.length
    ? Math.round(withData.reduce((s, c) => s + c.niveauActuel, 0) / withData.length)
    : 0
  const seancesCompletes  = Math.max(...withData.map(c => c.sessionNum), 0)
  const chakrasBloques    = withData.filter(c => c.etat === 'bloqué').length
  const chakrasEnProgres  = withData.filter(c => c.delta > 0).length

  /* ── Signaux automatiques ── */
  const meilleurProgression = withData.reduce(
    (best, c) => (!best || c.delta > best.delta) ? c : best, null
  )
  const chakrasReactionnels = withData.filter(c => c.delta < 0)
  const chakrasResistants   = withData.filter(c => c.delta < 5 && c.sessionNum >= 2)

  /* ── Sauvegarde bilan ── */
  async function saveBilan() {
    setSaving(true)
    setSaveStatus(null)
    const snapshot_json = withData.map(c => ({
      chakra_id:      c.id,
      nom:            c.nom,
      niveau_initial: c.niveauInitial,
      niveau_actuel:  c.niveauActuel,
      delta:          c.delta,
      etat:           c.etat,
    }))
    const { error: insertErr } = await supabase.from('suivi_bilans').insert({
      client_id:    clientId,
      type_bilan:   'mi_parcours',
      session_debut: 1,
      session_fin:   4,
      snapshot_json,
      created_at:   new Date().toISOString(),
    })
    setSaving(false)
    setSaveStatus(insertErr ? 'error' : 'ok')
    if (!insertErr) setTimeout(() => setSaveStatus(null), 3500)
  }

  const clientNom = client ? `${client.prenom} ${client.nom}` : '…'
  const dateStr   = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={S.header}>
        <button onClick={() => navigate(-1)} style={S.btnRetour}>← Retour</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={S.headerTitre}>Bilan mi-parcours</h1>
            <span style={S.badgeMiParcours}>Mi-parcours S4</span>
          </div>
          <p style={S.headerSous}>
            {clientNom} · {dateStr}
          </p>
        </div>
      </div>

      <div style={S.body}>

        {/* ── KPIs ── */}
        <div style={S.kpiGrid}>
          <KpiCard
            label="Score global"
            value={`${scoreGlobal} / 100`}
            icon="✦"
            accent="#c17a3a"
            bg="#fff9f0"
          />
          <KpiCard
            label="Séances complétées"
            value={seancesCompletes}
            icon="◎"
            accent="#1A8FAA"
            bg="#f0f8fb"
          />
          <KpiCard
            label="Chakras bloqués"
            value={chakrasBloques}
            icon="▼"
            accent="#993556"
            bg="#fdf0f4"
          />
          <KpiCard
            label="En progression"
            value={chakrasEnProgres}
            icon="▲"
            accent="#27AE60"
            bg="#f0faf4"
          />
        </div>

        {/* ── Scan 7 chakras ── */}
        <div style={S.card}>
          <h2 style={S.cardTitre}>Scan des 7 chakras</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {chakraStats.map(c => {
              if (!c.hasData) return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.4 }}>
                  <div style={{ ...S.dot, background: c.couleur }} />
                  <span style={{ fontSize: 13, color: '#a07848' }}>{c.nom}</span>
                  <span style={{ fontSize: 11, color: '#c8bdb4' }}>— pas de données</span>
                </div>
              )

              const etatStyle = ETAT_BADGE[c.etat] ?? ETAT_BADGE['ouverture']
              return (
                <div key={c.id}>
                  {/* Ligne info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <div style={{ ...S.dot, background: c.couleur }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: c.couleur }}>{c.nom}</span>
                      {' '}
                      <span style={{ fontSize: 11, color: '#a07848' }}>{c.sous_nom}</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: etatStyle.bg, color: etatStyle.color, flexShrink: 0 }}>
                      {etatStyle.label}
                    </span>
                  </div>
                  {/* Barre */}
                  <div style={S.barTrack}>
                    <div style={{ ...S.barFill, width: `${c.niveauActuel}%`, background: c.couleur }} />
                  </div>
                  {/* Chiffres */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#a07848' }}>
                      Initial <strong style={{ color: '#555' }}>{c.niveauInitial}%</strong>
                      {' → '}
                      Actuel <strong style={{ color: c.couleur }}>{c.niveauActuel}%</strong>
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: c.delta > 0 ? '#27AE60' : c.delta < 0 ? '#993556' : '#a07848',
                    }}>
                      {c.delta > 0 ? '+' : ''}{c.delta}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Signaux ── */}
        <div style={S.card}>
          <h2 style={S.cardTitre}>Signaux énergétiques</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {meilleurProgression && meilleurProgression.delta > 0 && (
              <Signal
                couleur="#27AE60"
                bg="#f0faf4"
                icone="▲"
                titre={`Meilleure progression : ${meilleurProgression.nom}`}
                desc={`+${meilleurProgression.delta} points sur les ${seancesCompletes} premières séances. Ce chakra répond bien au travail énergétique.`}
              />
            )}

            {chakrasReactionnels.map(c => (
              <Signal
                key={c.id}
                couleur="#993556"
                bg="#fdf0f4"
                icone="▼"
                titre={`Chakra réactionnel : ${c.nom}`}
                desc={`${c.delta} points. Ce chakra présente une résistance ou une réaction inverse — à explorer lors de la prochaine séance.`}
              />
            ))}

            {chakrasResistants
              .filter(c => !chakrasReactionnels.find(r => r.id === c.id))
              .map(c => (
                <Signal
                  key={c.id}
                  couleur="#b36200"
                  bg="#fff8f0"
                  icone="◈"
                  titre={`Chakra résistant : ${c.nom}`}
                  desc={`Progression de ${c.delta > 0 ? '+' : ''}${c.delta} point${Math.abs(c.delta) !== 1 ? 's' : ''} sur ${c.sessionNum} séances. Travail spécifique recommandé.`}
                />
              ))
            }

            {chakrasReactionnels.length === 0 && chakrasResistants.filter(c => !chakrasReactionnels.find(r => r.id === c.id)).length === 0 && (!meilleurProgression || meilleurProgression.delta <= 0) && (
              <div style={{ fontSize: 13, color: '#a07848', padding: '8px 0' }}>
                Pas encore assez de données pour identifier des signaux.
              </div>
            )}
          </div>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => navigate(-1)} style={S.btnSecondary}>
            ← Retour
          </button>
          <button
            onClick={saveBilan}
            disabled={saving || saveStatus === 'ok'}
            style={{
              ...S.btnPrimary,
              background:
                saveStatus === 'ok'    ? '#27AE60' :
                saveStatus === 'error' ? '#993556' : '#c17a3a',
              opacity: (saving || saveStatus === 'ok') ? 0.85 : 1,
              cursor: (saving || saveStatus === 'ok') ? 'not-allowed' : 'pointer',
            }}
          >
            {saving          ? 'Enregistrement…' :
             saveStatus === 'ok'    ? '✓ Bilan enregistré' :
             saveStatus === 'error' ? '✗ Erreur, réessayer' :
             '💾 Enregistrer ce bilan'}
          </button>
        </div>

      </div>
    </div>
  )
}

/* ── Sous-composants ── */

function KpiCard({ label, value, icon, accent, bg }) {
  return (
    <div style={{ background: bg, borderRadius: 10, border: `1px solid ${accent}22`, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 20, color: accent }}>{icon}</span>
      <span style={{ fontSize: 24, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, color: '#a07848', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{label}</span>
    </div>
  )
}

function Signal({ couleur, bg, icone, titre, desc }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', background: bg, borderRadius: 8, border: `1px solid ${couleur}33` }}>
      <span style={{ fontSize: 16, color: couleur, flexShrink: 0, marginTop: 1 }}>{icone}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: couleur, marginBottom: 3 }}>{titre}</div>
        <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  )
}

/* ── Styles ── */
const S = {
  page:    { minHeight: '100vh', background: '#f5f0ea', fontFamily: "'DM Sans', sans-serif" },
  header:  { background: '#2C1A0E', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 18 },
  headerTitre: { margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' },
  headerSous:  { margin: '4px 0 0', fontSize: 13, color: '#c8b090' },
  badgeMiParcours: { fontSize: 11, fontWeight: 700, background: '#c17a3a', color: '#fff', padding: '3px 10px', borderRadius: 20 },
  btnRetour: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, flexShrink: 0 },
  body:    { maxWidth: 760, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  card:    { background: '#fff', borderRadius: 12, padding: '24px 28px', border: '0.5px solid rgba(193,122,58,0.18)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  cardTitre: { margin: '0 0 18px', fontSize: 13, fontWeight: 700, color: '#c17a3a', textTransform: 'uppercase', letterSpacing: '.06em' },
  dot:     { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  barTrack: { width: '100%', height: 7, borderRadius: 4, background: 'rgba(193,122,58,0.1)', overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 4, transition: 'width 0.5s ease' },
  btnPrimary:  { padding: '11px 24px', borderRadius: 8, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, transition: 'background .25s', flexShrink: 0 },
  btnSecondary:{ padding: '11px 20px', borderRadius: 8, border: '1px solid rgba(193,122,58,0.35)', background: '#fff', color: '#c17a3a', fontSize: 14, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  center:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, fontFamily: "'DM Sans', sans-serif" },
  spinner: { width: 36, height: 36, border: '3px solid rgba(193,122,58,0.2)', borderTop: '3px solid #c17a3a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}
