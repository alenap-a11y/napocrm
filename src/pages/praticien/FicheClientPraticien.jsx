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

const EXTRA_METIERS = [
  { id: 'magnetisme', table: 'fiches_magnetisme', label: 'Magnétisme' },
  { id: 'mediumnite', table: 'fiches_mediumnite', label: 'Médium' },
  { id: 'radiesthesie', table: 'fiches_radiesthesie', label: 'Radiesthésie' },
  { id: 'yoga', table: 'fiches_yoga', label: 'Yoga' },
  { id: 'naturopathie', table: 'fiches_naturopathie', label: 'Naturopathie' },
  { id: 'aromatherapie', table: 'fiches_aromatherapie', label: 'Aromathérapie' },
  { id: 'sonotherapie', table: 'fiches_sonotherapie', label: 'Sonothérapie' },
  { id: 'massage', table: 'fiches_massage', label: 'Massage' },
  { id: 'sophrologie', table: 'fiches_sophrologie', label: 'Sophrologie' },
  { id: 'hypnotherapie', table: 'fiches_hypnotherapie', label: 'Hypnothérapie' },
  { id: 'chamanisme', table: 'fiches_chamanisme', label: 'Chamanisme' },
  { id: 'astrologie', table: 'fiches_astrologie', label: 'Astrologie' },
]

const ONGLETS = [
  ['resume', 'Résumé'], ['seances', 'Séances'], ['questionnaires', 'Questionnaires'],
  ['suivi', 'Suivi'], ['objectifs', 'Objectifs'], ['notes', 'Notes'],
  ['documents', 'Documents'], ['analyse', 'Analyse'],
]

const card = { background: 'var(--color-background-secondary)', borderRadius: 10, padding: 16 }
const cardLabel = { fontSize: 12, color: 'var(--color-text-secondary)' }
const cardValue = { fontSize: 22, fontWeight: 600, marginTop: 4 }

export default function FicheClientPraticien() {
  const { clientId, tab } = useParams()
  const activeTab = tab || 'resume'
  const { clients, loading } = useClients()
  const navigate = useNavigate()
  const client = clients.find(c => c.id === clientId)

  const [seances, setSeances] = useState([])
  const [loadingSeances, setLoadingSeances] = useState(true)

  useEffect(() => {
    if (!clientId) return
    setLoadingSeances(true)
    Promise.all([
      supabase.from('seances')
        .select('id, date_seance, heure_seance, duree_minutes, type_seance, prix_euros, statut, ressenti_avant, ressenti_apres')
        .eq('client_id', clientId),
      supabase.from('energie_seances').select('id, date_seance, heure_seance').eq('client_id', clientId),
      supabase.from('napo_oracle_seances').select('id, date_seance, heure_seance').eq('client_id', clientId),
      supabase.from('fiches_bach').select('id, created_at').eq('client_id', clientId),
      ...EXTRA_METIERS.map(m => supabase.from(m.table).select('id, date_seance, heure_seance').eq('client_id', clientId)),
    ]).then(results => {
      const [rSeances, rEnergie, rOracle, rBach, ...rExtra] = results
      const norm = (rows, type) => (rows || []).map(s => ({
        id: `${type}-${s.id}`, date_seance: s.date_seance, heure_seance: s.heure_seance || null,
        duree_minutes: s.duree_minutes || null, type_seance: s.type_seance || type,
        prix_euros: s.prix_euros ?? null, statut: s.statut || null,
        ressenti_avant: s.ressenti_avant ?? null, ressenti_apres: s.ressenti_apres ?? null,
      }))
      const tout = [
        ...norm(rSeances.data, null),
        ...norm(rEnergie.data, 'Énergie'),
        ...norm(rOracle.data, 'Oracle'),
        ...(rBach.data || []).map(s => ({ id: `bach-${s.id}`, date_seance: s.created_at ? s.created_at.slice(0,10) : null, heure_seance: null, duree_minutes: null, type_seance: 'Fleurs de Bach', prix_euros: null, statut: null, ressenti_avant: null, ressenti_apres: null })),
        ...rExtra.flatMap((r, i) => norm(r.data, EXTRA_METIERS[i].label)),
      ].filter(s => s.date_seance)
      setSeances(tout)
      setLoadingSeances(false)
    })
  }, [clientId])

  const now = new Date().toISOString().slice(0, 10)
  const passees = seances.filter(s => s.date_seance && s.date_seance.slice(0, 10) < now)
  const avenir = seances.filter(s => s.date_seance && s.date_seance.slice(0, 10) >= now && s.statut === 'planifié')
    .sort((a, b) => a.date_seance.localeCompare(b.date_seance))
  const derniereSeance = passees[0]?.date_seance
  const prochaineSeance = avenir[0]?.date_seance
  const tempsTotal = seances.reduce((sum, s) => sum + (s.duree_minutes || 0), 0)
  const dureeMoyenne = seances.length ? Math.round(tempsTotal / seances.length) : null

  let frequence = '—'
  if (passees.length >= 2) {
    const dates = passees.map(s => new Date(s.date_seance)).sort((a, b) => a - b)
    const ecarts = []
    for (let i = 1; i < dates.length; i++) ecarts.push((dates[i] - dates[i-1]) / 86400000)
    const moy = Math.round(ecarts.reduce((a, b) => a + b, 0) / ecarts.length)
    frequence = `tous les ${moy} jours`
  }

  const historique = [...seances]
    .filter(s => s.date_seance)
    .sort((a, b) => b.date_seance.localeCompare(a.date_seance))
    .slice(0, 5)

  const parPratique = {}
  seances.forEach(s => { const t = s.type_seance || 'Non renseigné'; parPratique[t] = (parPratique[t] || 0) + 1 })

  const ressentisAvant = seances.filter(s => s.ressenti_avant != null).sort((a, b) => a.date_seance.localeCompare(b.date_seance))
  const ressentisApres = seances.filter(s => s.ressenti_apres != null).sort((a, b) => a.date_seance.localeCompare(b.date_seance))

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

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-background-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: 'var(--color-accent)', flexShrink: 0 }}>
          {(client.prenom?.[0] || '') + (client.nom?.[0] || '')}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>{clientName(client)}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Client depuis {fmtDate(client.created_at || client.date_creation)}
            {client.specialite && ` · ${client.specialite}`}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <button type="button" style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Nouvelle séance</button>
        <button type="button" style={{ padding: '7px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer' }}>Ajouter une note</button>
        <button type="button" style={{ padding: '7px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer' }}>Questionnaire</button>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '0.5px solid var(--color-border-tertiary)', marginBottom: 20, overflowX: 'auto' }}>
        {ONGLETS.map(([id, label]) => (
          <button key={id} type="button"
            onClick={() => navigate(id === 'resume' ? `/praticien/clients/${clientId}` : `/praticien/clients/${clientId}/${id}`)}
            style={{
              padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
              color: activeTab === id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === id ? '2px solid var(--color-accent)' : '2px solid transparent',
              fontWeight: activeTab === id ? 600 : 400,
            }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'analyse' ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Évolution des données</div>
          {seances.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Pas assez de données pour afficher cette évolution.</div>
          ) : (
            <div style={{ ...card, marginBottom: 24, fontSize: 13, lineHeight: 1.9 }}>
              <div>{seances.length} séance(s) enregistrée(s)</div>
              <div>{ressentisAvant.length} ressenti(s) « avant » renseigné(s)</div>
              <div>{ressentisApres.length} ressenti(s) « après » renseigné(s)</div>
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Ressenti déclaré (avant / après)</div>
          {ressentisAvant.length === 0 && ressentisApres.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Pas assez de données pour afficher cette évolution.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              {seances.filter(s => s.ressenti_avant != null || s.ressenti_apres != null).sort((a,b) => b.date_seance.localeCompare(a.date_seance)).map(s => (
                <div key={s.id} style={{ ...card, fontSize: 13 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{fmtDate(s.date_seance)}</div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>
                    Ressenti déclaré : {s.ressenti_avant ?? '—'}/10 → {s.ressenti_apres ?? '—'}/10
                    {s.ressenti_avant != null && s.ressenti_apres != null && (
                      <span style={{ color: s.ressenti_apres >= s.ressenti_avant ? '#0F6E56' : '#B23A3A', fontWeight: 600 }}>
                        {'  '}({s.ressenti_apres - s.ressenti_avant >= 0 ? '+' : ''}{s.ressenti_apres - s.ressenti_avant})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Répartition par pratique</div>
          <div style={{ fontSize: 13, ...card }}>
            {Object.entries(parPratique).map(([k, v]) => `${k} · ${v}`).join('   ')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 12 }}>
            Évolution observée dans les données enregistrées — pas un diagnostic médical.
          </div>
        </>
      ) : activeTab !== 'resume' ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          Bientôt disponible.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Résumé</div>
          {loadingSeances ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Chargement…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              <div style={card}><div style={cardLabel}>Nombre de séances</div><div style={cardValue}>{seances.length}</div></div>
              <div style={card}><div style={cardLabel}>Dernière séance</div><div style={cardValue}>{fmtDate(derniereSeance)}</div></div>
              <div style={card}><div style={cardLabel}>Prochaine séance</div><div style={cardValue}>{fmtDate(prochaineSeance)}</div></div>
              <div style={card}><div style={cardLabel}>Temps total d'accompagnement</div><div style={cardValue}>{seances.length ? `${Math.floor(tempsTotal / 60)}h${String(tempsTotal % 60).padStart(2, '0')}` : '—'}</div></div>
              <div style={card}><div style={cardLabel}>Questionnaires réalisés</div><div style={cardValue}>—</div></div>
              <div style={card}><div style={cardLabel}>Objectifs actifs</div><div style={cardValue}>—</div></div>
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>À retenir</div>
          <div style={{ ...card, marginBottom: 24, fontSize: 13, lineHeight: 1.9 }}>
            <div>Dernière séance : <strong>{fmtDate(derniereSeance)}</strong></div>
            <div>Prochaine séance : <strong>{fmtDate(prochaineSeance)}</strong></div>
            <div>Dernier questionnaire : <strong>—</strong></div>
            <div>Dernier ressenti déclaré : <strong>—</strong></div>
            <div>Suivi en cours : <strong>—</strong></div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Historique récent</div>
          {historique.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Aucune activité enregistrée.</div>
          ) : (
            <div style={{ marginBottom: 24 }}>
              {historique.map((s, idx) => (
                <div key={s.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: idx < historique.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', fontSize: 13 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{fmtDate(s.date_seance)}</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Séance{s.type_seance ? ` · ${s.type_seance}` : ''}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Statistiques</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            <div style={card}><div style={cardLabel}>Nombre de séances</div><div style={cardValue}>{seances.length}</div></div>
            <div style={card}><div style={cardLabel}>Temps total</div><div style={cardValue}>{seances.length ? `${Math.floor(tempsTotal / 60)}h${String(tempsTotal % 60).padStart(2, '0')}` : '—'}</div></div>
            <div style={card}><div style={cardLabel}>Durée moyenne</div><div style={cardValue}>{dureeMoyenne ? `${dureeMoyenne} min` : '—'}</div></div>
            <div style={card}><div style={cardLabel}>Fréquence</div><div style={cardValue}>{frequence}</div></div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 12 }}>
            Données calculées sur la table de séances générique. Oracle, Énergie, Bach et les 12 modules métiers pas encore agrégés.
          </div>
        </>
      )}
    </div>
  )
}
