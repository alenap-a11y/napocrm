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
  { id: 'magnetisme', table: 'fiches_magnetisme', label: 'Magnétisme', moduleTitle: 'Napo-Magnétiseur' },
  { id: 'mediumnite', table: 'fiches_mediumnite', label: 'Médium', moduleTitle: 'Napo-Médium' },
  { id: 'radiesthesie', table: 'fiches_radiesthesie', label: 'Radiesthésie', moduleTitle: 'Napo-Radiesthésie' },
  { id: 'yoga', table: 'fiches_yoga', label: 'Yoga', moduleTitle: 'Napo-Yoga' },
  { id: 'naturopathie', table: 'fiches_naturopathie', label: 'Naturopathie', moduleTitle: 'Napo-Naturopathie' },
  { id: 'aromatherapie', table: 'fiches_aromatherapie', label: 'Aromathérapie', moduleTitle: 'Napo-Aromathérapie' },
  { id: 'sonotherapie', table: 'fiches_sonotherapie', label: 'Sonothérapie', moduleTitle: 'Napo-Sonothérapie' },
  { id: 'massage', table: 'fiches_massage', label: 'Massage', moduleTitle: 'Napo-Massage' },
  { id: 'sophrologie', table: 'fiches_sophrologie', label: 'Sophrologie', moduleTitle: 'Napo-Sophrologie' },
  { id: 'hypnotherapie', table: 'fiches_hypnotherapie', label: 'Hypnothérapie', moduleTitle: 'Napo-Hypnothérapie' },
  { id: 'chamanisme', table: 'fiches_chamanisme', label: 'Chamanisme', moduleTitle: 'Napo-Chamanisme' },
  { id: 'astrologie', table: 'fiches_astrologie', label: 'Astrologie', moduleTitle: 'Napo-Astrologie' },
]

const ONGLETS_BASE = [
  ['resume', 'Résumé'], ['infos', 'Infos'], ['seances', 'Séances'], ['questionnaires', 'Questionnaires'],
  ['suivi', 'Suivi'], ['objectifs', 'Objectifs'], ['notes', 'Notes'],
  ['documents', 'Documents'], ['analyse', 'Analyse'],
]
const ONGLETS_METIERS_FIXES = [['bach', 'Bach'], ['energie', 'Énergie'], ['oracle', 'Oracle']]

const card = { background: 'var(--color-background-secondary)', borderRadius: 10, padding: 16 }
const cardLabel = { fontSize: 12, color: 'var(--color-text-secondary)' }
const cardValue = { fontSize: 22, fontWeight: 600, marginTop: 4 }
const S_field = { display: 'flex', flexDirection: 'column', gap: 4 }
const S_label = { fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.03em' }
const inp = { padding: '7px 10px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }

export default function FicheClientPraticien() {
  const { clientId, tab } = useParams()
  const activeTab = tab || 'resume'
  const { clients, loading } = useClients()
  const navigate = useNavigate()
  const client = clients.find(c => c.id === clientId)

  const [seances, setSeances] = useState([])
  const [noteText, setNoteText] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteMsg, setNoteMsg] = useState('')
  const [loadingSeances, setLoadingSeances] = useState(true)
  const [favori, setFavori] = useState(false)
  const [seancesTout, setSeancesTout] = useState([])
  const [modulesActifs, setModulesActifs] = useState(null)
  const [loadingTout, setLoadingTout] = useState(true)
  const [editingInfos, setEditingInfos] = useState(false)
  const [infosForm, setInfosForm] = useState({})
  const [infosSaving, setInfosSaving] = useState(false)
  const [infosMsg, setInfosMsg] = useState('')

  useEffect(() => {
    if (client) {
      setNoteText(client.notes || ''); setFavori(!!client.favori)
      setInfosForm({
        email: client.email || '', tel: client.tel || '',
        adresse_numero: client.adresse_numero || '', adresse_rue: client.adresse_rue || '',
        code_postal: client.code_postal || '', ville: client.ville || '',
        date_naissance: client.date_naissance || '', situation_familiale: client.situation_familiale || '',
        environnement: client.environnement || '', situation_professionnelle: client.situation_professionnelle || '',
        nombre_enfants: client.nombre_enfants ?? '', nom_naissance: client.nom_naissance || '',
        adresse_complement: client.adresse_complement || '',
      })
    }
  }, [client?.id])

  async function saveInfos() {
    setInfosSaving(true)
    const payload = { ...infosForm, nombre_enfants: infosForm.nombre_enfants === '' ? null : parseInt(infosForm.nombre_enfants, 10) }
    const { error } = await supabase.from('clients').update(payload).eq('id', clientId)
    setInfosMsg(error ? 'Erreur : ' + error.message : '✓ Enregistré')
    setInfosSaving(false)
    if (!error) setEditingInfos(false)
    setTimeout(() => setInfosMsg(''), 2500)
  }

  async function toggleFavori() {
    const next = !favori
    setFavori(next)
    const { error } = await supabase.from('clients').update({ favori: next }).eq('id', clientId)
    if (error) setFavori(!next)
  }

  async function saveNote() {
    setNoteSaving(true)
    const { error } = await supabase.from('clients').update({ notes: noteText }).eq('id', clientId)
    setNoteMsg(error ? 'Erreur : ' + error.message : '✓ Note enregistrée')
    setNoteSaving(false)
    setTimeout(() => setNoteMsg(''), 2500)
  }

  useEffect(() => {
    if (!clientId) return
    setLoadingSeances(true)
    supabase.from('seances')
      .select('id, date_seance, heure_seance, duree_minutes, type_seance, prix_euros, statut, ressenti_avant, ressenti_apres')
      .eq('client_id', clientId)
      .order('date_seance', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setSeances(data || [])
        setLoadingSeances(false)
      })
  }, [clientId])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('marketplace_modules').select('id, title').eq('category', 'Napo-Métiers').eq('status', 'available')
        .then(({ data: mods }) => {
          const ids = (mods || []).map(m => m.id)
          if (!ids.length) { setModulesActifs(new Set()); return }
          supabase.from('profil_modules_actifs').select('module_id').eq('user_id', user.id).in('module_id', ids)
            .then(({ data: actifs }) => {
              const idsActifs = new Set((actifs || []).map(a => a.module_id))
              const titresActifs = new Set((mods || []).filter(m => idsActifs.has(m.id)).map(m => m.title))
              setModulesActifs(titresActifs)
            })
        })
    })
  }, [])

  useEffect(() => {
    if (!clientId) return
    setLoadingTout(true)
    Promise.all([
      supabase.from('energie_seances').select('id, date_seance, heure_seance').eq('client_id', clientId),
      supabase.from('napo_oracle_seances').select('id, date_seance, heure_seance').eq('client_id', clientId),
      supabase.from('fiches_bach').select('id, created_at').eq('client_id', clientId),
      ...EXTRA_METIERS.map(m => supabase.from(m.table).select('id, date_seance, heure_seance').eq('client_id', clientId)),
    ]).then(results => {
      const [rEnergie, rOracle, rBach, ...rExtra] = results
      const norm = (rows, type) => (rows || []).map(s => ({ id: `${type}-${s.id}`, date_seance: s.date_seance, heure_seance: s.heure_seance || null, type_seance: type }))
      const tout = [
        ...seances.map(s => ({ ...s, type_seance: s.type_seance || 'Séance' })),
        ...norm(rEnergie.data, 'Énergie'),
        ...norm(rOracle.data, 'Oracle'),
        ...(rBach.data || []).map(s => ({ id: `bach-${s.id}`, date_seance: s.created_at ? s.created_at.slice(0,10) : null, heure_seance: null, type_seance: 'Bach' })),
        ...rExtra.flatMap((r, i) => norm(r.data, EXTRA_METIERS[i].label)),
      ].filter(s => s.date_seance)
      setSeancesTout(tout)
      setLoadingTout(false)
    })
  }, [clientId, seances])

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

  function calculerAge(dateNaissance) {
    if (!dateNaissance) return null
    const n = new Date(dateNaissance)
    const t = new Date()
    let age = t.getFullYear() - n.getFullYear()
    if (t.getMonth() < n.getMonth() || (t.getMonth() === n.getMonth() && t.getDate() < n.getDate())) age--
    return age
  }
  const SITUATION_FAMILIALE_LABEL = { marie: 'Marié(e)', divorce: 'Divorcé(e)', celibataire: 'Célibataire', veuf: 'Veuf', veuve: 'Veuve', separe: 'Séparé(e)' }
  const ENVIRONNEMENT_LABEL = { toxique: 'Toxique', non_toxique: 'Non toxique' }
  const SITUATION_PRO_LABEL = { actif: 'Actif', chomage: 'Chômage', retraite: 'Retraite', invalide_malade: 'Invalide / malade' }
  const age = calculerAge(client?.date_naissance)
  const caTotal = seances.reduce((sum, s) => sum + (parseFloat(s.prix_euros) || 0), 0)

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
    <div style={{ padding: '1.6rem 2rem', width: '100%', boxSizing: 'border-box' }}>
      <button type="button" onClick={() => navigate('/praticien/clients')}
        style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 13, cursor: 'pointer', marginBottom: 14, padding: 0 }}>
        ← Mes clients
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-background-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: 'var(--color-accent)', flexShrink: 0 }}>
          {(client.prenom?.[0] || '') + (client.nom?.[0] || '')}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>{clientName(client)}</div>
            <button type="button" onClick={toggleFavori} title={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
              <i className={favori ? 'ti ti-star-filled' : 'ti ti-star'} style={{ fontSize: 18, color: favori ? '#B8961E' : 'var(--color-text-secondary)' }} aria-hidden="true" />
            </button>
          </div>
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

      {(() => {
        const metiersActifs = modulesActifs === null
          ? EXTRA_METIERS.map(m => [m.id, m.label])
          : EXTRA_METIERS.filter(m => modulesActifs.has(m.moduleTitle)).map(m => [m.id, m.label])
        const ongletsMetiers = [...ONGLETS_METIERS_FIXES, ...metiersActifs]
        const isMetierActif = ongletsMetiers.some(([id]) => id === activeTab)
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: '0.5px solid var(--color-border-tertiary)', marginBottom: 20, flexWrap: 'wrap' }}>
            {ONGLETS_BASE.map(([id, label]) => (
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
            <select value={isMetierActif ? activeTab : ''} onChange={e => e.target.value && navigate(`/praticien/clients/${clientId}/${e.target.value}`)}
              style={{
                marginLeft: 8, padding: '6px 10px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)',
                background: isMetierActif ? 'var(--color-background-secondary)' : 'transparent',
                color: isMetierActif ? 'var(--color-accent)' : 'var(--color-text-secondary)', fontSize: 13, cursor: 'pointer',
              }}>
              <option value="">Modules métiers…</option>
              {ongletsMetiers.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
        )
      })()}

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
      ) : activeTab === 'infos' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Infos</div>
            {!editingInfos && (
              <button type="button" onClick={() => setEditingInfos(true)}
                style={{ padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                Modifier
              </button>
            )}
          </div>

          {!editingInfos ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={card}><div style={cardLabel}>Email</div><div style={{ fontSize: 14, marginTop: 4 }}>{client.email || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Téléphone</div><div style={{ fontSize: 14, marginTop: 4 }}>{client.tel || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Adresse</div><div style={{ fontSize: 14, marginTop: 4 }}>{[client.adresse_numero, client.adresse_rue].filter(Boolean).join(' ') || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Complément</div><div style={{ fontSize: 14, marginTop: 4 }}>{client.adresse_complement || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Ville</div><div style={{ fontSize: 14, marginTop: 4 }}>{[client.code_postal, client.ville].filter(Boolean).join(' ') || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Âge</div><div style={{ fontSize: 14, marginTop: 4 }}>{age != null ? `${age} ans` : '—'}</div></div>
                <div style={card}><div style={cardLabel}>Nom de naissance</div><div style={{ fontSize: 14, marginTop: 4 }}>{client.nom_naissance || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Situation familiale</div><div style={{ fontSize: 14, marginTop: 4 }}>{SITUATION_FAMILIALE_LABEL[client.situation_familiale] || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Situation pro.</div><div style={{ fontSize: 14, marginTop: 4 }}>{SITUATION_PRO_LABEL[client.situation_professionnelle] || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Environnement</div><div style={{ fontSize: 14, marginTop: 4 }}>{ENVIRONNEMENT_LABEL[client.environnement] || '—'}</div></div>
                <div style={card}><div style={cardLabel}>Nombre d'enfants</div><div style={{ fontSize: 14, marginTop: 4 }}>{client.nombre_enfants ?? '—'}</div></div>
                <div style={card}><div style={cardLabel}>Séances</div><div style={{ fontSize: 14, marginTop: 4 }}>{seances.length} séance(s)</div></div>
                <div style={card}><div style={cardLabel}>CA total</div><div style={{ fontSize: 14, marginTop: 4 }}>{caTotal.toFixed(2)} €</div></div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Séances et CA calculés sur la table de séances générique uniquement.</div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={S_field}><span style={S_label}>Email</span><input style={inp} value={infosForm.email} onChange={e => setInfosForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Téléphone</span><input style={inp} value={infosForm.tel} onChange={e => setInfosForm(f => ({ ...f, tel: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Numéro</span><input style={inp} value={infosForm.adresse_numero} onChange={e => setInfosForm(f => ({ ...f, adresse_numero: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Rue</span><input style={inp} value={infosForm.adresse_rue} onChange={e => setInfosForm(f => ({ ...f, adresse_rue: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Complément</span><input style={inp} value={infosForm.adresse_complement} onChange={e => setInfosForm(f => ({ ...f, adresse_complement: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Code postal</span><input style={inp} value={infosForm.code_postal} onChange={e => setInfosForm(f => ({ ...f, code_postal: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Ville</span><input style={inp} value={infosForm.ville} onChange={e => setInfosForm(f => ({ ...f, ville: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Date de naissance</span><input type="date" style={inp} value={infosForm.date_naissance} onChange={e => setInfosForm(f => ({ ...f, date_naissance: e.target.value }))} /></div>
                <div style={S_field}><span style={S_label}>Nom de naissance</span><input style={inp} value={infosForm.nom_naissance} onChange={e => setInfosForm(f => ({ ...f, nom_naissance: e.target.value }))} /></div>
                <div style={S_field}>
                  <span style={S_label}>Situation familiale</span>
                  <select style={inp} value={infosForm.situation_familiale} onChange={e => setInfosForm(f => ({ ...f, situation_familiale: e.target.value }))}>
                    <option value="">—</option>
                    {Object.entries(SITUATION_FAMILIALE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                <div style={S_field}>
                  <span style={S_label}>Situation pro.</span>
                  <select style={inp} value={infosForm.situation_professionnelle} onChange={e => setInfosForm(f => ({ ...f, situation_professionnelle: e.target.value }))}>
                    <option value="">—</option>
                    {Object.entries(SITUATION_PRO_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                <div style={S_field}>
                  <span style={S_label}>Environnement</span>
                  <select style={inp} value={infosForm.environnement} onChange={e => setInfosForm(f => ({ ...f, environnement: e.target.value }))}>
                    <option value="">—</option>
                    {Object.entries(ENVIRONNEMENT_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                <div style={S_field}><span style={S_label}>Nombre d'enfants</span><input type="number" min="0" style={inp} value={infosForm.nombre_enfants} onChange={e => setInfosForm(f => ({ ...f, nombre_enfants: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button type="button" onClick={saveInfos} disabled={infosSaving}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: infosSaving ? 'not-allowed' : 'pointer', opacity: infosSaving ? 0.7 : 1 }}>
                  {infosSaving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button type="button" onClick={() => setEditingInfos(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                  Annuler
                </button>
                {infosMsg && <span style={{ fontSize: 12, color: infosMsg.startsWith('✓') ? '#0F6E56' : '#B23A3A' }}>{infosMsg}</span>}
              </div>
            </>
          )}
        </>
      ) : activeTab === 'notes' ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Notes</div>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
            rows={10} placeholder="Informations importantes, contexte, suivi..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={saveNote} disabled={noteSaving}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: noteSaving ? 'not-allowed' : 'pointer', opacity: noteSaving ? 0.7 : 1 }}>
              {noteSaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            {noteMsg && <span style={{ fontSize: 12, color: noteMsg.startsWith('✓') ? '#0F6E56' : '#B23A3A' }}>{noteMsg}</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 10 }}>
            Cette note est privée, visible uniquement par vous.
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
            Séances de la table générique uniquement (type Sophrologie, Coaching, Naturopathie, etc.). Les modules Oracle, Énergie, Bach et les 12 métiers spécialisés ont leur propre historique.
          </div>
        </>
      )}
    </div>
  )
}
