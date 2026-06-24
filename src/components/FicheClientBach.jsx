import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { insertNotif } from '../lib/notif'
import SeanceTimeline from './SeanceTimeline'

/* ─── Données ──────────────────────────────────────────────────────────── */

const FLEUR_SUGGESTIONS = {
  'Anxiété / peurs': ['Mimulus', 'Aspen', 'Rock Rose'],
  'Pensées en boucle': ['White Chestnut', 'Agrimony'],
  'Fatigue profonde': ['Olive', 'Hornbeam', 'Oak'],
  'Manque de confiance': ['Larch', 'Cerato'],
  'Tristesse': ['Mustard', 'Sweet Chestnut', 'Willow'],
  'Colère / impatience': ['Holly', 'Impatiens', 'Beech'],
  'Difficulté à dire non': ['Centaury', 'Walnut'],
  'Découragement': ['Gentian', 'Gorse'],
  'Transition de vie': ['Walnut', 'Wild Oat'],
  'Perfectionnisme': ['Rock Water', 'Vervain'],
  'Isolement': ['Water Violet', 'Heather'],
  'Choc émotionnel récent': ['Star of Bethlehem'],
}

const TOUS_ELIXIRS = {
  'Pour les peurs': ['Aspen', 'Cherry Plum', 'Mimulus', 'Red Chestnut', 'Rock Rose'],
  "Pour l'incertitude": ['Cerato', 'Gentian', 'Gorse', 'Hornbeam', 'Scleranthus', 'Wild Oat'],
  "Manque d'intérêt au présent": ['Chestnut Bud', 'Clematis', 'Honeysuckle', 'Mustard', 'Olive', 'White Chestnut', 'Wild Rose'],
  'Solitude': ['Heather', 'Impatiens', 'Water Violet'],
  'Hypersensibilité': ['Agrimony', 'Centaury', 'Holly', 'Walnut'],
  'Découragement / désespoir': ['Crab Apple', 'Elm', 'Larch', 'Oak', 'Pine', 'Star of Bethlehem', 'Sweet Chestnut', 'Willow'],
  'Surpréoccupation pour autrui': ['Beech', 'Chicory', 'Rock Water', 'Vervain', 'Vine'],
}

const ETATS = Object.keys(FLEUR_SUGGESTIONS)


/* ─── CSV helpers ─────────────────────────────────────────────────────── */

function toCSV(rows) {
  const header = 'Nom,Âge,Date,Motif,Score,Fleurs,Notes'
  const lines = rows.map(r =>
    `"${r.nom}",${r.age},"${r.date_tirage}",` +
    `"${(r.motif||'').replace(/"/g,"'")}",${r.score||0},` +
    `"${(r.fleurs||[]).join('|')}","${(r.notes||'').replace(/"/g,"'").replace(/\n/g,' ')}"`
  )
  return [header, ...lines].join('\n')
}

function downloadCSV(content, filename) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function parseCSV(text) {
  const lines = text.trim().split('\n').slice(1)
  return lines.map((line, i) => {
    const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g) || []
    const c    = cols.map(x => x.replace(/^"|"$/g, '').trim())
    return {
      id: Date.now() + i,
      nom:    c[0] || '',
      age:    c[1] || '',
      date_tirage: c[2] || '',
      motif:  c[3] || '',
      score:  parseInt(c[4]) || 0,
      fleurs: c[5] ? c[5].split('|').filter(Boolean) : [],
      notes:  c[6] || '',
    }
  }).filter(r => r.nom)
}

/* ─── Utilitaires ─────────────────────────────────────────────────────── */

const MOIS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, j] = d.split('-')
  return `${j} ${MOIS[parseInt(m) - 1]} ${y}`
}

const scoreColor = s => s >= 8 ? '#1A7A4A' : s >= 5 ? '#185FA5' : s >= 3 ? '#854F0B' : '#993556'

/* ─── Composant principal ─────────────────────────────────────────────── */

export default function FicheClientBach({ client }) {
  const [activeTab, setActiveTab] = useState('historique')
  const [hist, setHist]           = useState([])
  const [histLoading, setHistLoading] = useState(true)
  const [step, setStep]           = useState(1)
  const [detail,       setDetail]       = useState(null)
  const [editingDetail,setEditingDetail]= useState(false)
  const [editForm,     setEditForm]     = useState(null)
  const [search,       setSearch]       = useState('')
  const [saving, setSaving]       = useState(false)
  const [saveMsg, setSaveMsg]     = useState('')
  const [importMsg, setImportMsg] = useState('')
  const importRef                 = { current: null }

  const TOTAL = 6

  /* Formulaire nouvelle séance */
  const [nom,          setNom]          = useState(client?.nom || '')
  const [age,          setAge]          = useState(client?.age || '')
  const [motif,        setMotif]        = useState(client?.motif || '')
  const [typeSeance,   setTypeSeance]   = useState('1ère séance')
  const [etatsCoches,  setEtatsCoches]  = useState([])
  const [score,        setScore]        = useState(0)
  const [notes,        setNotes]        = useState('')
  const [fleursChoisies, setFleursChoisies] = useState([])

  useEffect(() => {
    async function fetchHist() {
      const { data, error } = await supabase
        .from('fleurs_bach')
        .select('*')
        .order('date_tirage', { ascending: false })
      if (error) console.error('Erreur chargement fleurs_bach:', error.message)
      else setHist(data || [])
      setHistLoading(false)
    }
    fetchHist()
  }, [])

  const togEtat  = (e) => setEtatsCoches(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])
  const togFleur = (f) => {
    if (fleursChoisies.includes(f)) setFleursChoisies(prev => prev.filter(x => x !== f))
    else if (fleursChoisies.length < 7) setFleursChoisies(prev => [...prev, f])
  }

  const suggestions = [...new Set(etatsCoches.flatMap(e => FLEUR_SUGGESTIONS[e] || []))].slice(0, 8)
  const today       = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const isoToday    = new Date().toISOString().slice(0, 10)
  const nextDate    = () => { const d = new Date(); d.setDate(d.getDate() + 21); return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) }
  const scoreLabels = ['', 'Très difficile', 'Difficile', 'Assez difficile', 'Plutôt difficile', 'Moyen', 'Correct', 'Assez bien', 'Bien', 'Très bien', 'Excellent']

  /* ─ Édition fiche historique ─ */
  function openEdit(r) {
    setEditForm({ nom: r.nom||'', age: r.age||'', date_tirage: r.date_tirage||isoToday, motif: r.motif||'', score: r.score||0, fleurs: [...(r.fleurs||[])], notes: r.notes||'' })
    setEditingDetail(true)
  }

  function toggleEditFleur(f) {
    setEditForm(prev => {
      const has = prev.fleurs.includes(f)
      if (has) return { ...prev, fleurs: prev.fleurs.filter(x => x !== f) }
      if (prev.fleurs.length >= 7) return prev
      return { ...prev, fleurs: [...prev.fleurs, f] }
    })
  }

  function saveEditDetail() {
    const updated = { ...detail, ...editForm }
    setHist(prev => prev.map(r => r.id === detail.id ? updated : r))
    setDetail(updated)
    setEditingDetail(false)
  }

  function terminer() {
    const record = {
      id: Date.now(), nom, age, date_tirage: isoToday, motif, score, fleurs: fleursChoisies, notes,
    }
    setHist(prev => [record, ...prev])
    setNom(''); setAge(''); setMotif(''); setEtatsCoches([]); setScore(0); setNotes(''); setFleursChoisies([])
    setStep(1)
    setActiveTab('historique')
  }

  async function handleSave() {
    setSaving(true); setSaveMsg('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')
      const rows = hist.map(r => ({ ...r, user_id: user.id }))
      const { error } = await supabase.from('fleurs_bach').upsert(rows, { onConflict: 'id' })
      if (error) throw error
      setSaveMsg('✓ Sauvegarde effectuée')
      insertNotif({ msg: `Fleurs de Bach — ${hist.length} séance${hist.length > 1 ? 's' : ''} sauvegardée${hist.length > 1 ? 's' : ''}`, icon: 'ti-leaf', iconColor: '#534AB7', bg: '#EEEDFE' })
    } catch (e) {
      setSaveMsg(`✗ Erreur : ${e.message}`)
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  function handleImport(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const imported = parseCSV(ev.target.result)
      if (!imported.length) { setImportMsg('Fichier invalide.'); return }
      setHist(prev => [...imported, ...prev])
      setImportMsg(`✓ ${imported.length} séance(s) importée(s).`)
      setTimeout(() => setImportMsg(''), 3000)
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  const filteredHist = hist.filter(r => {
    const q = search.toLowerCase()
    return !q || r.nom.toLowerCase().includes(q) || (r.motif||'').toLowerCase().includes(q) || (r.fleurs||[]).join(' ').toLowerCase().includes(q)
  })

  /* ─── Styles ─── */
  const card       = { background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 10 }
  const cardTeal   = { background: '#E1F5EE', border: '0.5px solid #5DCAA5', borderRadius: 12, padding: '0.875rem 1.125rem', marginBottom: 10 }
  const cardPurple = { background: '#EEEDFE', border: '0.5px solid #AFA9EC', borderRadius: 12, padding: '0.875rem 1.125rem', marginBottom: 10 }
  const label      = { fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: 8, display: 'block' }
  const tag        = (on) => ({ display: 'inline-block', fontSize: 12, padding: '3px 10px', borderRadius: 12, margin: 2, cursor: 'pointer', border: '0.5px solid', background: on ? '#E1F5EE' : 'var(--color-background-secondary)', color: on ? '#085041' : 'var(--color-text-secondary)', borderColor: on ? '#5DCAA5' : 'var(--color-border-tertiary)' })
  const fleurTag   = (on) => ({ display: 'inline-block', fontSize: 12, padding: '3px 10px', borderRadius: 12, margin: 2, cursor: 'pointer', border: '0.5px solid', background: on ? '#EEEDFE' : 'var(--color-background-secondary)', color: on ? '#3C3489' : 'var(--color-text-secondary)', borderColor: on ? '#7F77DD' : 'var(--color-border-tertiary)' })
  const row        = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)', fontSize: 13 }
  const btnNav     = { fontSize: 13, padding: '7px 18px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer' }
  const btnPrimary = { ...btnNav, background: '#E1F5EE', color: '#085041', borderColor: '#5DCAA5' }

  const TABS = [
    { id: 'historique', label: 'Historique',      icon: 'ti-history' },
    { id: 'nouvelle',   label: 'Nouvelle séance', icon: 'ti-plus' },
    { id: 'export',     label: 'Import / Export', icon: 'ti-arrows-transfer-down' },
  ]

  return (
    <div style={{ padding: '1rem 0', fontFamily: 'inherit' }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-leaf" style={{ fontSize: 22, color: '#0F6E56' }} />
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>Fleurs de Bach</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{hist.length} séances enregistrées</div>
        </div>
        {activeTab === 'historique' && (
          <button onClick={() => { setStep(1); setActiveTab('nouvelle') }} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <i className="ti ti-plus" style={{ fontSize: 14 }} />Nouvelle séance
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--color-border-tertiary)', marginBottom: 20, gap: 0 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'nouvelle') setStep(1) }} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13,
            fontWeight: activeTab === tab.id ? 600 : 400,
            color: activeTab === tab.id ? '#0F6E56' : 'var(--color-text-secondary)',
            borderBottom: activeTab === tab.id ? '2px solid #0F6E56' : '2px solid transparent',
            marginBottom: -1,
          }}>
            <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} />{tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ HISTORIQUE ═══════════════ */}
      {activeTab === 'historique' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
            {[
              { icon: 'ti-leaf',        bg: '#E1F5EE', col: '#0F6E56', label: 'Total séances',    val: hist.length },
              { icon: 'ti-calendar',    bg: '#EEEDFE', col: '#534AB7', label: 'Ce mois',           val: hist.filter(r => r.date_tirage?.startsWith(isoToday.slice(0,7))).length },
              { icon: 'ti-heart',       bg: '#FBEAF0', col: '#993556', label: 'Score moyen',        val: hist.length ? `${(hist.reduce((s,r) => s+(r.score||0),0)/hist.length).toFixed(1)}/10` : '—' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 18, color: s.col }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1 }}>{s.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recherche */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher client, motif, fleur…"
              style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
          </div>

          {/* Tableau */}
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, overflow: 'hidden', border: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 60px 1fr 80px', padding: '8px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              {['Client', 'Date', 'Score', 'Fleurs', ''].map((h, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</div>
              ))}
            </div>
            {histLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                <i className="ti ti-loader-2" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />Chargement…
              </div>
            ) : hist.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                <i className="ti ti-leaf" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />Aucune séance Bach enregistrée
              </div>
            ) : filteredHist.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                <i className="ti ti-leaf-off" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />Aucune séance trouvée
              </div>
            ) : filteredHist.map((r, idx) => (
              <div key={r.id} onClick={() => setDetail(r)}
                style={{ display: 'grid', gridTemplateColumns: '1fr 110px 60px 1fr 80px', padding: '11px 16px', alignItems: 'center', cursor: 'pointer', borderBottom: idx < filteredHist.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', transition: 'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-primary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{r.nom}</div>
                  {r.motif && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{r.motif}</div>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{fmtDate(r.date_tirage)}</div>
                <div>
                  {r.score > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor(r.score) }}>{r.score}/10</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {(r.fleurs||[]).slice(0,3).map(f => (
                    <span key={f} style={{ fontSize: 10, background: '#E1F5EE', color: '#0F6E56', padding: '1px 6px', borderRadius: 20, border: '0.5px solid #5DCAA5' }}>{f}</span>
                  ))}
                  {(r.fleurs||[]).length > 3 && <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>+{r.fleurs.length - 3}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                  <button onClick={e => { e.stopPropagation(); downloadCSV(toCSV([r]), `bach-${r.nom.replace(' ','-')}-${r.date_tirage}.csv`) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4 }} title="Exporter">
                    <i className="ti ti-download" style={{ fontSize: 14 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══════════════ NOUVELLE SÉANCE ═══════════════ */}
      {activeTab === 'nouvelle' && (
        <div>
          {/* Barre de progression */}
          <div style={{ height: 4, background: 'var(--color-border-tertiary)', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round((step / TOTAL) * 100)}%`, background: '#1D9E75', borderRadius: 2, transition: 'width .3s' }} />
          </div>

          {/* ── ÉTAPE 1 ── */}
          {step === 1 && (
            <div>
              <StepHeader n={1} title="Accueil & identité du client" sub="Vue praticien · Création du dossier" />
              <div style={card}>
                <span style={label}>Informations client</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Prénom &amp; nom</div>
                    <input value={nom} onChange={e => setNom(e.target.value)} placeholder="ex. Sophie Legrand" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Âge</div>
                    <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="ex. 38" style={{ width: '100%' }} />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Motif principal</div>
                  <input value={motif} onChange={e => setMotif(e.target.value)} placeholder="ex. Stress chronique, manque de confiance..." style={{ width: '100%' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Type de séance</div>
                  {['1ère séance', 'Suivi', 'Urgence / Rescue'].map(t => (
                    <span key={t} style={tag(typeSeance === t)} onClick={() => setTypeSeance(t)}>{t}</span>
                  ))}
                </div>
              </div>
              {client?.id && (
                <div style={card}>
                  <span style={label}>Historique des séances</span>
                  <SeanceTimeline clientId={client.id} />
                </div>
              )}
            </div>
          )}

          {/* ── ÉTAPE 2 ── */}
          {step === 2 && (
            <div>
              <StepHeader n={2} title="Entretien émotionnel" sub="Vue client · Exploration des états" />
              <div style={cardPurple}>
                <div style={{ fontSize: 13, color: '#3C3489', fontWeight: 500, marginBottom: 6 }}>Question d'ouverture</div>
                <div style={{ fontSize: 13, color: '#534AB7', fontStyle: 'italic' }}>"Comment vous sentez-vous en ce moment, dans votre quotidien ?"</div>
              </div>
              <div style={card}>
                <span style={label}>États émotionnels présents</span>
                {ETATS.map(e => <span key={e} style={tag(etatsCoches.includes(e))} onClick={() => togEtat(e)}>{e}</span>)}
              </div>
              <div style={card}>
                <span style={label}>Score bien-être (client)</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Très mal</span>
                  {[1,2,3,4,5,6,7,8,9,10].map(v => (
                    <button key={v} onClick={() => setScore(v)} style={{ width: 36, height: 36, borderRadius: 8, border: '0.5px solid', background: score === v ? '#E1F5EE' : 'transparent', color: score === v ? '#085041' : 'var(--color-text-secondary)', borderColor: score === v ? '#5DCAA5' : 'var(--color-border-secondary)', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>{v}</button>
                  ))}
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Très bien</span>
                </div>
                {score > 0 && <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 8 }}>Score {score}/10 — {scoreLabels[score]}</div>}
              </div>
              <div style={card}>
                <span style={label}>Notes praticien</span>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Événements déclencheurs, contexte familial/professionnel..." style={{ width: '100%', height: 72, fontSize: 13, resize: 'vertical', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, padding: 8, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)' }} />
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 ── */}
          {step === 3 && (
            <div>
              <StepHeader n={3} title="Sélection des fleurs" sub="Vue praticien · Max 7 élixirs" />
              {suggestions.length > 0 && (
                <div style={cardTeal}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#085041', marginBottom: 6 }}>✦ Suggestions basées sur l'entretien</div>
                  {suggestions.map(f => <span key={f} style={fleurTag(fleursChoisies.includes(f))} onClick={() => togFleur(f)}>+ {f}</span>)}
                </div>
              )}
              <div style={card}>
                <span style={label}>Les 38 élixirs</span>
                <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>Sélectionnés : <strong style={{ color: 'var(--color-text-primary)' }}>{fleursChoisies.length}</strong> / 7</div>
                {Object.entries(TOUS_ELIXIRS).map(([cat, fleurs]) => (
                  <div key={cat}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '8px 0 3px' }}>{cat}</div>
                    {fleurs.map(f => <span key={f} style={fleurTag(fleursChoisies.includes(f))} onClick={() => togFleur(f)}>{f}</span>)}
                  </div>
                ))}
              </div>
              {fleursChoisies.length >= 7 && (
                <div style={{ ...card, borderColor: '#EF9F27' }}>
                  <div style={{ fontSize: 13, color: '#633806' }}>⚠ Maximum 7 fleurs atteint. Désélectionnez-en une pour en choisir une autre.</div>
                </div>
              )}
            </div>
          )}

          {/* ── ÉTAPE 4 ── */}
          {step === 4 && (
            <div>
              <StepHeader n={4} title="Préparation du flacon" sub="Vue praticien · Protocole" />
              <div style={cardTeal}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#085041', marginBottom: 10 }}>Flacon personnalisé</div>
                {[
                  ['Contenant',       'Flacon 30 ml en verre ambré'],
                  ['Base',            'Eau de source (28 ml)'],
                  ['Conservateur',    'Brandy 1/4 ou vinaigre de cidre'],
                  ['Élixirs retenus', fleursChoisies.length ? fleursChoisies.join(', ') : '—'],
                  ['Doses par élixir','2 gouttes chacun'],
                  ['Conservation',    '3 semaines · hors chaleur'],
                ].map(([k, v]) => (
                  <div key={k} style={{ ...row, borderColor: '#9FE1CB' }}>
                    <span style={{ color: '#0F6E56' }}>{k}</span>
                    <span style={{ fontWeight: 500, color: '#085041', textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={card}>
                <span style={label}>Étiquette du flacon</span>
                <div style={{ border: '0.5px dashed var(--color-border-secondary)', borderRadius: 8, padding: 12, background: 'var(--color-background-secondary)' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{nom || 'Client'}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Préparé le {today}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Mélange : <span style={{ color: 'var(--color-text-primary)' }}>{fleursChoisies.join(', ') || '—'}</span></div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>4 gouttes · 4× par jour · sous la langue</div>
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 5 ── */}
          {step === 5 && (
            <div>
              <StepHeader n={5} title="Conseils remis au client" sub="Vue client · Mode d'emploi" />
              <div style={cardPurple}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#3C3489', marginBottom: 10 }}>Votre protocole personnalisé</div>
                {[
                  ['Posologie',    '4 gouttes · 4 fois par jour'],
                  ['Moment idéal', 'Matin, midi, goûter, soir'],
                  ['Comment',      "Sous la langue ou dans l'eau"],
                  ['À éviter',     'Café, menthe, tabac (30 min avant)'],
                  ['Durée',        'Minimum 3 semaines'],
                ].map(([k, v]) => (
                  <div key={k} style={{ ...row, borderColor: '#AFA9EC' }}>
                    <span style={{ color: '#534AB7' }}>{k}</span>
                    <span style={{ fontWeight: 500, color: '#3C3489' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ÉTAPE 6 ── */}
          {step === 6 && (
            <div>
              <StepHeader n={6} title="Clôture & récapitulatif" sub="Vue praticien · Bilan de séance" />
              <div style={card}>
                <span style={label}>Bilan de la séance</span>
                {[
                  ['Client',               `${nom || '—'}, ${age || '—'} ans`],
                  ['Motif',                motif || '—'],
                  ['Score bien-être initial', score ? `${score} / 10 — ${scoreLabels[score]}` : '—'],
                  ['Mélange',              fleursChoisies.length ? fleursChoisies.join(' · ') : '—'],
                  ['Prochaine séance',     `Vers le ${nextDate()} (J+21)`],
                ].map(([k, v]) => (
                  <div key={k} style={{ ...row }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{k}</span>
                    <span style={{ fontWeight: 500, maxWidth: '60%', textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={card}>
                <span style={label}>Automatisations NapoCRM</span>
                {[
                  { label: 'Email bienvenue + récap',         tag: 'Brevo · J+0' },
                  { label: 'Rappel observance flacon',         tag: 'n8n · J+14' },
                  { label: 'Invitation bilan & renouvellement',tag: 'n8n · J+21' },
                  { label: 'Enquête NPS satisfaction',         tag: 'Brevo · J+30' },
                ].map(item => (
                  <div key={item.label} style={{ ...row }}>
                    <span style={{ fontSize: 13 }}>{item.label}</span>
                    <span style={{ fontSize: 11, background: '#E1F5EE', color: '#085041', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>{item.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 14, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
            <button style={{ ...btnNav, visibility: step > 1 ? 'visible' : 'hidden' }} onClick={() => setStep(s => s - 1)}>← Précédent</button>
            <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Étape {step} / {TOTAL}</span>
            <button style={btnPrimary} onClick={() => step === TOTAL ? terminer() : setStep(s => s + 1)}>
              {step === TOTAL ? '✓ Enregistrer & terminer' : 'Suivant →'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════ IMPORT / EXPORT ═══════════════ */}
      {activeTab === 'export' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 800 }}>

          {saveMsg && (
            <div style={{ gridColumn: '1/-1', padding: '10px 14px', borderRadius: 8, background: saveMsg.startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: saveMsg.startsWith('✓') ? '#3B6D11' : '#993556', fontSize: 13 }}>
              {saveMsg}
            </div>
          )}
          {importMsg && (
            <div style={{ gridColumn: '1/-1', padding: '10px 14px', borderRadius: 8, background: importMsg.startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: importMsg.startsWith('✓') ? '#3B6D11' : '#993556', fontSize: 13 }}>
              {importMsg}
            </div>
          )}

          {/* Export */}
          <div style={{ padding: '22px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-download" style={{ fontSize: 20, color: '#0F6E56' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Exporter l'historique</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Format CSV compatible Excel</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Colonnes exportées : Nom, Âge, Date, Motif, Score, Fleurs, Notes.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => downloadCSV(toCSV(hist), 'bach-napocrm.csv')} style={xBtn('#0F6E56', '#E1F5EE')}>
                <i className="ti ti-table-export" style={{ fontSize: 15 }} /> Exporter tout ({hist.length} séances)
              </button>
              <button onClick={() => { const m = hist.filter(r => r.date_tirage?.startsWith(isoToday.slice(0,7))); downloadCSV(toCSV(m), `bach-${isoToday.slice(0,7)}.csv`) }} style={xBtn('#185FA5', '#E6F1FB')}>
                <i className="ti ti-calendar-down" style={{ fontSize: 15 }} /> Exporter ce mois
              </button>
            </div>
          </div>

          {/* Import */}
          <div style={{ padding: '22px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-upload" style={{ fontSize: 20, color: '#534AB7' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Importer des séances</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Fichier CSV (même format export)</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Format attendu : <code style={{ fontSize: 11, background: 'var(--color-background-primary)', padding: '1px 5px', borderRadius: 4 }}>Nom, Âge, Date, Motif, Score, Fleurs, Notes</code>
            </div>
            <input ref={el => importRef.current = el} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
            <button onClick={() => importRef.current?.click()} style={xBtn('#534AB7', '#EEEDFE')}>
              <i className="ti ti-file-upload" style={{ fontSize: 15 }} /> Choisir un fichier CSV
            </button>
          </div>

          {/* Sauvegarde Supabase */}
          <div style={{ padding: '22px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-device-floppy" style={{ fontSize: 20, color: '#854F0B' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Sauvegarde cloud</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Synchronisation avec votre base Supabase</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Les séances terminées sont ajoutées à l'historique local. Utilisez ce bouton pour synchroniser avec votre base cloud.
              </div>
              <button onClick={handleSave} disabled={saving} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: 'none', background: '#854F0B', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? .7 : 1 }}>
                <i className="ti ti-cloud-upload" style={{ fontSize: 16 }} />
                {saving ? 'Sauvegarde…' : 'Sauvegarder maintenant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal détail ── */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && !editingDetail && setDetail(null)}>
          <div style={{ background: 'var(--color-background-primary)', borderRadius: 16, width: 520, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              {editingDetail ? (
                <input value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Nom du client"
                  style={{ fontSize: 16, fontWeight: 600, flex: 1, padding: '5px 8px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', marginRight: 12 }} />
              ) : (
                <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-text-primary)' }}>{detail.nom}</div>
              )}
              <button onClick={() => { setEditingDetail(false); setDetail(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-secondary)' }}>×</button>
            </div>

            {/* Champs principaux */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              {editingDetail ? (
                <>
                  <MField label="Date">
                    <input type="date" value={editForm.date_tirage} onChange={e => setEditForm(f => ({ ...f, date_tirage: e.target.value }))} style={mInp} />
                  </MField>
                  <MField label="Âge">
                    <input type="number" value={editForm.age} onChange={e => setEditForm(f => ({ ...f, age: e.target.value }))} placeholder="38" style={mInp} />
                  </MField>
                  <MField label="Motif" style={{ gridColumn: '1/-1' }}>
                    <input value={editForm.motif} onChange={e => setEditForm(f => ({ ...f, motif: e.target.value }))} placeholder="Motif principal" style={{ ...mInp, width: '100%' }} />
                  </MField>
                  <MField label={`Score bien-être · ${editForm.score}/10`} style={{ gridColumn: '1/-1' }}>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {[1,2,3,4,5,6,7,8,9,10].map(v => (
                        <button key={v} onClick={() => setEditForm(f => ({ ...f, score: v }))}
                          style={{ width: 34, height: 34, borderRadius: 7, border: '0.5px solid', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: editForm.score === v ? '#E1F5EE' : 'transparent', color: editForm.score === v ? '#085041' : 'var(--color-text-secondary)', borderColor: editForm.score === v ? '#5DCAA5' : 'var(--color-border-secondary)' }}>{v}</button>
                      ))}
                    </div>
                  </MField>
                </>
              ) : (
                [['Date', fmtDate(detail.date_tirage)], ['Score', detail.score ? `${detail.score}/10` : '—'], ['Âge', detail.age || '—'], ['Motif', detail.motif || '—']].map(([k,v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 14, color: 'var(--color-text-primary)', fontWeight: k === 'Score' ? 600 : 400 }}>{v}</div>
                  </div>
                ))
              )}
            </div>

            {/* Fleurs */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                Fleurs sélectionnées{editingDetail ? ` (${editForm.fleurs.length}/7)` : ''}
              </div>
              {editingDetail ? (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    {editForm.fleurs.map(f => (
                      <span key={f} onClick={() => toggleEditFleur(f)}
                        style={{ fontSize: 12, background: '#E1F5EE', color: '#0F6E56', padding: '3px 9px', borderRadius: 20, border: '0.5px solid #5DCAA5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {f} <span style={{ fontSize: 14, lineHeight: 1 }}>×</span>
                      </span>
                    ))}
                    {editForm.fleurs.length === 0 && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Aucune fleur sélectionnée</span>}
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8, padding: '8px 10px' }}>
                    {Object.entries(TOUS_ELIXIRS).map(([cat, fleurs]) => (
                      <div key={cat}>
                        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', margin: '6px 0 3px', fontWeight: 600 }}>{cat}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {fleurs.map(f => {
                            const on = editForm.fleurs.includes(f)
                            return (
                              <span key={f} onClick={() => toggleEditFleur(f)}
                                style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, cursor: editForm.fleurs.length >= 7 && !on ? 'not-allowed' : 'pointer', border: '0.5px solid', background: on ? '#EEEDFE' : 'var(--color-background-secondary)', color: on ? '#3C3489' : 'var(--color-text-secondary)', borderColor: on ? '#7F77DD' : 'var(--color-border-tertiary)', opacity: editForm.fleurs.length >= 7 && !on ? 0.4 : 1 }}>
                                {f}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(detail.fleurs||[]).length > 0
                    ? detail.fleurs.map(f => <span key={f} style={{ fontSize: 12, background: '#E1F5EE', color: '#0F6E56', padding: '3px 9px', borderRadius: 20, border: '0.5px solid #5DCAA5' }}>{f}</span>)
                    : <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>—</span>
                  }
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Notes</div>
              {editingDetail ? (
                <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Observations, compte-rendu…" rows={3}
                  style={{ width: '100%', fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.7, border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, padding: '10px 12px', background: 'var(--color-background-secondary)', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              ) : (
                detail.notes
                  ? <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7, background: 'var(--color-background-secondary)', padding: '12px 14px', borderRadius: 8 }}>{detail.notes}</div>
                  : <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>—</div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              {editingDetail ? (
                <>
                  <button onClick={() => setEditingDetail(false)}
                    style={{ padding: '8px 16px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 13 }}>
                    Annuler
                  </button>
                  <button onClick={saveEditDetail}
                    style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <i className="ti ti-check" style={{ marginRight: 5 }} />Sauvegarder les modifications
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setHist(prev => prev.filter(r => r.id !== detail.id)); setDetail(null) }}
                    style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid #FBEAF0', background: 'transparent', color: '#993556', cursor: 'pointer', fontSize: 13 }}>
                    <i className="ti ti-trash" style={{ marginRight: 5 }} />Supprimer
                  </button>
                  <button onClick={() => openEdit(detail)}
                    style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 13 }}>
                    <i className="ti ti-pencil" style={{ marginRight: 5 }} />Modifier
                  </button>
                  <button onClick={() => downloadCSV(toCSV([detail]), `bach-${detail.nom.replace(' ','-')}-${detail.date_tirage}.csv`)}
                    style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 13 }}>
                    <i className="ti ti-download" />
                  </button>
                  <button onClick={() => setDetail(null)}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    Fermer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Composants utilitaires ─────────────────────────────────────────── */

function StepHeader({ n, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E1F5EE', color: '#085041', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{sub}</div>
      </div>
    </div>
  )
}

function xBtn(color, bg) {
  return { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', borderRadius: 8, border: `0.5px solid ${color}44`, background: bg, color, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
}

function MField({ label, children, style }) {
  return (
    <div style={style}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}

const mInp = { width: '100%', padding: '6px 10px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }

      {activeTab==='nouvelle' && (
        <div>
          <div style={{display:'flex',gap:3,marginBottom:20}}>
            {Array.from({length:TOTAL},(_,i)=>(
              <div key={i} onClick={()=>setStep(i+1)}
                style={{flex:1,height:4,borderRadius:2,background:step>i?'#1D9E75':'var(--color-border-tertiary)',cursor:'pointer',transition:'background .3s'}} />
            ))}
          </div>

          {step===1 && (
            <div>
              <StepHeader n={1} total={TOTAL} title="Bilan émotionnel" sub="Accueil et état du client" />
              <div style={S.card}>
                <span style={S.lbl}>Identité</span>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                  <div>
                    <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>Prénom et nom</div>
                    <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="ex. Sophie Legrand" style={S.inp} />
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>Âge</div>
                    <input type="number" value={age} onChange={e=>setAge(e.target.value)} placeholder="38" style={S.inp} />
                  </div>
                </div>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>Motif principal</div>
                  <input value={motif} onChange={e=>setMotif(e.target.value)} placeholder="ex. Stress chronique…" style={S.inp} />
                </div>
                <div>
                  <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:6}}>Type de séance</div>
                  {['1ère séance','Suivi','Urgence / Rescue'].map(t=><span key={t} style={S.tag(typeSeance===t)} onClick={()=>setTypeSeance(t)}>{t}</span>)}
                </div>
              </div>
              <div style={S.card}>
                <span style={S.lbl}>État émotionnel général</span>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
                  {[['Bien','#EAF3DE','#3B6D11'],['Moyen','#FAEEDA','#854F0B'],['Difficile','#FBEAF0','#993556'],['Épuisé·e','#FBEAF0','#993556'],['Anxieux·se','#FAEEDA','#854F0B'],['Triste','#E6F1FB','#185FA5'],['En colère','#FCEBEB','#A32D2D'],['Confus·e','#EEEDFE','#534AB7']].map(([h,bg,col])=>(
                    <span key={h} onClick={()=>setHumeur(h)} style={{padding:'5px 12px',borderRadius:100,fontSize:13,cursor:'pointer',background:humeur===h?bg:'var(--color-background-secondary)',color:humeur===h?col:'var(--color-text-secondary)',border:'0.5px solid '+(humeur===h?col+'44':'var(--color-border-tertiary)'),fontWeight:humeur===h?500:400}}>{h}</span>
                  ))}
                </div>
                <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:6}}>Thèmes identifiés</div>
                <div style={{marginBottom:12}}>
                  {['Peur','Incertitude','Solitude','Culpabilité','Découragement','Sur-sensibilité','Manque de confiance','Obsession','Indifférence','Surmenage'].map(t=>(
                    <span key={t} style={S.tag(themes.includes(t))} onClick={()=>togTheme(t)}>{t}</span>
                  ))}
                </div>
                <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>Description libre</div>
                <textarea value={bilanDesc} onChange={e=>setBilanDesc(e.target.value)} placeholder="Préoccupations, émotions, événements récents…" style={S.ta(72)} />
              </div>
              <div style={S.card}>
                <span style={S.lbl}>États émotionnels (suggestions fleurs)</span>
                {ETATS.map(e=><span key={e} style={S.tag(etatsCoches.includes(e))} onClick={()=>togEtat(e)}>{e}</span>)}
              </div>
              <div style={S.card}>
                <span style={S.lbl}>Score bien-être (auto-évaluation)</span>
                <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{fontSize:12,color:'var(--color-text-secondary)'}}>Très mal</span>
                  {[1,2,3,4,5,6,7,8,9,10].map(v=>(
                    <button key={v} onClick={()=>setScore(v)} style={{width:36,height:36,borderRadius:8,border:'0.5px solid',background:score===v?'#E1F5EE':'transparent',color:score===v?'#085041':'var(--color-text-secondary)',borderColor:score===v?'#5DCAA5':'var(--color-border-secondary)',cursor:'pointer',fontSize:14,fontWeight:500}}>{v}</button>
                  ))}
                  <span style={{fontSize:12,color:'var(--color-text-secondary)'}}>Très bien</span>
                </div>
                {score>0&&<div style={{fontSize:12,color:'var(--color-text-tertiary)',marginTop:8}}>Score {score}/10 — {SCORE_LABELS[score]}</div>}
              </div>
              {client?.id&&<div style={S.card}><span style={S.lbl}>Historique séances</span><SeanceTimeline clientId={client.id} /></div>}
            </div>
          )}

          {step===2 && (
            <div>
              <StepHeader n={2} total={TOTAL} title="Sélection des fleurs" sub={selectedFleurs.length+' sélectionnée(s) — cliquer pour toggle'} />
              {suggestions.length>0&&(
                <div style={S.cardTeal}>
                  <div style={{fontSize:12,fontWeight:500,color:'#085041',marginBottom:6}}>Suggestions basées sur l'entretien</div>
                  {suggestions.map(f=><span key={f} style={S.ftag(selectedFleurs.includes(f))} onClick={()=>togFleur(f)}>+ {f}</span>)}
                </div>
              )}
              <div style={S.card}>
                <div style={{display:'flex',gap:8,marginBottom:10}}>
                  <div style={{position:'relative',flex:1}}>
                    <i className="ti ti-search" style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'var(--color-text-secondary)',pointerEvents:'none'}} />
                    <input value={fleurSearch} onChange={e=>setFleurSearch(e.target.value)} placeholder="Rechercher…" style={{...S.inp,paddingLeft:28}} />
                  </div>
                  <input value={customInput} onChange={e=>setCustomInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCustomFleur()} placeholder="Ajouter une fleur…" style={{...S.inp,flex:1}} />
                  <button onClick={addCustomFleur} style={{padding:'7px 12px',borderRadius:8,border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-secondary)',color:'var(--color-text-primary)',cursor:'pointer',fontSize:13,whiteSpace:'nowrap'}}>
                    <i className="ti ti-plus" /> Ajouter
                  </button>
                </div>
                <div style={{marginBottom:10}}>
                  <span style={S.tag(!activeFamille)} onClick={()=>setActiveFamille(null)}>Toutes</span>
                  {[...FAMILLES,...(customFleurs.length?['Personnalisé']:[])].map(f=>(
                    <span key={f} style={S.tag(activeFamille===f)} onClick={()=>setActiveFamille(activeFamille===f?null:f)}>{f}</span>
                  ))}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(95px, 1fr))',gap:5,maxHeight:340,overflowY:'auto'}}>
                  {filteredFleurs().map(f=>{
                    const on=selectedFleurs.includes(f.nom)
                    return (
                      <div key={f.nom} onClick={()=>togFleur(f.nom)}
                        style={{padding:'7px 6px',border:'0.5px solid '+(on?'#5DCAA5':'var(--color-border-tertiary)'),borderRadius:8,cursor:'pointer',textAlign:'center',background:on?'#E1F5EE':'var(--color-background-secondary)',transition:'all .12s'}}>
                        <div style={{fontSize:11,fontWeight:500,color:on?'#085041':'var(--color-text-primary)',lineHeight:1.3,marginBottom:2}}>{f.nom}</div>
                        <div style={{fontSize:10,color:on?'#0F6E56':'var(--color-text-secondary)',lineHeight:1.2}}>{f.fr}</div>
                        {on&&<i className="ti ti-check" style={{fontSize:10,color:'#1D9E75',marginTop:3,display:'block'}} />}
                      </div>
                    )
                  })}
                </div>
              </div>
              {selectedFleurs.length>0&&(
                <div style={S.cardTeal}>
                  <div style={{fontSize:12,fontWeight:500,color:'#085041',marginBottom:6}}>Sélection ({selectedFleurs.length})</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {selectedFleurs.map(nom=>(
                      <span key={nom} onClick={()=>togFleur(nom)} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',background:'#fff',border:'0.5px solid #5DCAA5',borderRadius:100,fontSize:12,color:'#085041',cursor:'pointer'}}>
                        {nom} <i className="ti ti-x" style={{fontSize:10}} />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step===3 && (
            <div>
              <StepHeader n={3} total={TOTAL} title="Dosage et préparation du flacon" sub="Réglage manuel par fleur" />
              <div style={S.card}>
                <span style={S.lbl}>Flacon</span>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                  <div>
                    <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>Volume</div>
                    <select value={flaconVol} onChange={e=>setFlaconVol(e.target.value)} style={S.sel}><option>30 ml</option><option>50 ml</option><option>100 ml</option></select>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>Support</div>
                    <select value={support} onChange={e=>setSupport(e.target.value)} style={S.sel}><option>Eau minérale</option><option>Brandy 40°</option><option>Vinaigre de cidre</option><option>Glycérine végétale</option></select>
                  </div>
                </div>
                <span style={S.lbl}>Gouttes par fleur</span>
                {selectedFleurs.length===0
                  ?<div style={{fontSize:13,color:'var(--color-text-secondary)',fontStyle:'italic'}}>Aucune fleur sélectionnée à l'étape 2</div>
                  :selectedFleurs.map(nom=>(
                    <div key={nom} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 10px',background:'var(--color-background-secondary)',borderRadius:8,marginBottom:5,border:'0.5px solid var(--color-border-tertiary)'}}>
                      <div style={{flex:1,fontSize:13,fontWeight:500}}>{nom}</div>
                      <button onClick={()=>setDosages(d=>({...d,[nom]:Math.max(1,(d[nom]||2)-1)}))} style={{width:28,height:28,borderRadius:6,border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-primary)',cursor:'pointer',fontSize:16}}>−</button>
                      <span style={{minWidth:22,textAlign:'center',fontSize:14,fontWeight:600}}>{dosages[nom]||2}</span>
                      <button onClick={()=>setDosages(d=>({...d,[nom]:Math.min(10,(d[nom]||2)+1)}))} style={{width:28,height:28,borderRadius:6,border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-primary)',cursor:'pointer',fontSize:16}}>+</button>
                      <span style={{fontSize:11,color:'var(--color-text-secondary)',minWidth:40}}>gouttes</span>
                    </div>
                  ))
                }
                <div style={{marginTop:12}}>
                  <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>Notes de préparation</div>
                  <textarea value={dosageNotes} onChange={e=>setDosageNotes(e.target.value)} placeholder="Conservation, précautions…" style={S.ta(64)} />
                </div>
              </div>
              <div style={S.cardTeal}>
                <div style={{fontSize:12,fontWeight:500,color:'#085041',marginBottom:8}}>Aperçu du flacon</div>
                {[['Contenant','Flacon '+flaconVol+' en verre ambré'],['Base',support],['Élixirs',selectedFleurs.length?selectedFleurs.map(n=>n+' ('+( dosages[n]||2)+'gt)').join(', '):'—'],['Conservation','3 semaines · hors chaleur']].map(([k,v])=>(
                  <div key={k} style={{...S.row,borderColor:'#9FE1CB'}}>
                    <span style={{color:'#0F6E56',fontSize:12}}>{k}</span>
                    <span style={{fontWeight:500,color:'#085041',fontSize:12,textAlign:'right',maxWidth:'65%'}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step===4 && (
            <div>
              <StepHeader n={4} total={TOTAL} title="Protocole et durée de la cure" sub="Instructions pour le client" />
              <div style={S.card}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                  <div>
                    <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>Durée de la cure</div>
                    <select value={dureeCure} onChange={e=>setDureeCure(e.target.value)} style={S.sel}><option>3 semaines</option><option>4 semaines</option><option>6 semaines</option><option>8 semaines</option><option>3 mois</option></select>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>Prises par jour</div>
                    <select value={prisesJour} onChange={e=>setPrisesJour(e.target.value)} style={S.sel}><option>3 fois par jour</option><option>4 fois par jour</option><option>5 fois par jour</option><option>6 fois par jour</option></select>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>Gouttes par prise</div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <button onClick={()=>setGouttesPrise(v=>Math.max(1,v-1))} style={{width:32,height:32,borderRadius:6,border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-secondary)',cursor:'pointer',fontSize:18}}>−</button>
                      <span style={{minWidth:28,textAlign:'center',fontSize:16,fontWeight:600}}>{gouttesPrise}</span>
                      <button onClick={()=>setGouttesPrise(v=>Math.min(10,v+1))} style={{width:32,height:32,borderRadius:6,border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-secondary)',cursor:'pointer',fontSize:18}}>+</button>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>Date de suivi</div>
                    <input type="date" value={dateSuivi} onChange={e=>setDateSuivi(e.target.value)} style={S.inp} />
                  </div>
                  <div style={{gridColumn:'1/-1'}}>
                    <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>Mode de prise</div>
                    <select value={modePrise} onChange={e=>setModePrise(e.target.value)} style={S.sel}><option>Sublingual (sous la langue)</option><option>Dans un verre d'eau</option><option>Application cutanée</option></select>
                  </div>
                </div>
                <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>Conseils et recommandations</div>
                <textarea value={conseils} onChange={e=>setConseils(e.target.value)} placeholder="Moments de prise, rituels, hydratation…" style={S.ta(80)} />
              </div>
              <div style={S.cardPurple}>
                <div style={{fontSize:12,fontWeight:500,color:'#3C3489',marginBottom:8}}>Récap protocole</div>
                {[['Cure',dureeCure],['Prises',prisesJour+' · '+gouttesPrise+' gouttes'],['Mode',modePrise],['Suivi',dateSuivi?fmtDate(dateSuivi):'Vers le '+nextDate21()+' (J+21)']].map(([k,v])=>(
                  <div key={k} style={{...S.row,borderColor:'#AFA9EC'}}>
                    <span style={{color:'#534AB7',fontSize:12}}>{k}</span>
                    <span style={{fontWeight:500,color:'#3C3489',fontSize:12}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step===5 && (
            <div>
              <StepHeader n={5} total={TOTAL} title="Notes de séance" sub="Observations praticien" />
              {[
                ['Observations pendant la séance',notesSeance,setNotesSeance,'Réactions, insights, moments clés…'],
                ['Évolutions depuis la dernière séance',evolutions,setEvolutions,'Changements observés ou rapportés…'],
                ["Résistances / points d'attention",resistances,setResistances,'Blocages, thèmes récurrents, vigilances…'],
                ['Intuitions du praticien',intuitions,setIntuitions,'Ressentis, pistes à explorer…'],
              ].map(([lbl,val,setter,ph])=>(
                <div key={lbl} style={S.card}>
                  <span style={S.lbl}>{lbl}</span>
                  <textarea value={val} onChange={e=>setter(e.target.value)} placeholder={ph} style={S.ta(72)} />
                </div>
              ))}
            </div>
          )}

          {step===6 && (
            <div>
              <StepHeader n={6} total={TOTAL} title="Bilan de la séance" sub="Clôture et récapitulatif" />
              <div style={S.card}>
                <span style={S.lbl}>Récapitulatif</span>
                {[
                  ['Client',nom+(age?', '+age+' ans':'')],
                  ['Type',typeSeance],
                  ['Motif',motif||'—'],
                  ['État',humeur||'—'],
                  ['Score',score?score+'/10 — '+SCORE_LABELS[score]:'—'],
                  ['Fleurs',selectedFleurs.length?selectedFleurs.join(' · '):'—'],
                  ['Protocole',dureeCure+' · '+prisesJour+' · '+gouttesPrise+' gouttes'],
                  ['Suivi',dateSuivi?fmtDate(dateSuivi):'Vers le '+nextDate21()+' (J+21)'],
                ].map(([k,v])=>(
                  <div key={k} style={S.row}>
                    <span style={{color:'var(--color-text-secondary)',fontSize:12}}>{k}</span>
                    <span style={{fontWeight:500,maxWidth:'65%',textAlign:'right',fontSize:13}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <span style={S.lbl}>Conclusion du praticien</span>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes de clôture…" style={{...S.ta(64),marginBottom:10}} />
                <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>Orientation prochaine séance</div>
                <textarea value={conclusion} onChange={e=>setConclusion(e.target.value)} placeholder="Axes de travail, thèmes à approfondir…" style={S.ta(64)} />
              </div>
              <div style={S.card}>
                <span style={S.lbl}>Automatisations Naposolo</span>
                {[
                  {label:'Email bienvenue + récap',tag:'Brevo · J+0'},
                  {label:'Rappel observance flacon',tag:'n8n · J+14'},
                  {label:'Invitation bilan et renouvellement',tag:'n8n · J+21'},
                  {label:'Enquête NPS satisfaction',tag:'Brevo · J+30'},
                ].map(item=>(
                  <div key={item.label} style={S.row}>
                    <span style={{fontSize:13}}>{item.label}</span>
                    <span style={{fontSize:11,background:'#E1F5EE',color:'#085041',padding:'2px 8px',borderRadius:10,fontWeight:500}}>{item.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:20,paddingTop:14,borderTop:'0.5px solid var(--color-border-tertiary)'}}>
            <button style={{...S.btnNav,visibility:step>1?'visible':'hidden'}} onClick={()=>setStep(s=>s-1)}>← Précédent</button>
            <span style={{fontSize:12,color:'var(--color-text-tertiary)'}}>Étape {step} / {TOTAL}</span>
            <button style={S.btnPrimary} onClick={()=>step===TOTAL?terminer():setStep(s=>s+1)}>
              {step===TOTAL?'Enregistrer et terminer':'Suivant →'}
            </button>
          </div>
        </div>
      )}

      {activeTab==='export' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          {saveMsg&&<div style={{gridColumn:'1/-1',padding:'10px 14px',borderRadius:8,background:saveMsg.startsWith('S')||saveMsg.includes('effectuée')?'#EAF3DE':'#FBEAF0',color:saveMsg.includes('effectuée')?'#3B6D11':'#993556',fontSize:13}}>{saveMsg}</div>}
          {importMsg&&<div style={{gridColumn:'1/-1',padding:'10px 14px',borderRadius:8,background:'#EAF3DE',color:'#3B6D11',fontSize:13}}>{importMsg}</div>}
          {[
            {icon:'ti-download',bg:'#E1F5EE',col:'#0F6E56',title:'Exporter CSV',sub:'Compatible Excel',btns:[
              {label:'Tout exporter ('+hist.length+' séances)',icon:'ti-table-export',fn:()=>downloadCSV(toCSV(hist),'bach-naposolo.csv')},
              {label:'Ce mois uniquement',icon:'ti-calendar-down',fn:()=>{const m=hist.filter(r=>r.date_tirage?.startsWith(isoToday.slice(0,7)));downloadCSV(toCSV(m),'bach-'+isoToday.slice(0,7)+'.csv')}},
            ]},
            {icon:'ti-upload',bg:'#EEEDFE',col:'#534AB7',title:'Importer CSV',sub:'Même format export',btns:[
              {label:'Choisir un fichier CSV',icon:'ti-file-upload',fn:()=>importRef.current?.click()},
            ]},
            {icon:'ti-file-type-pdf',bg:'#FAEEDA',col:'#854F0B',title:'Export PDF',sub:'Compte-rendu complet',btns:hist.length?[
              {label:'PDF de la dernière séance',icon:'ti-file-type-pdf',fn:()=>exportPDF(hist[0],allFleurs())},
            ]:[]},
            {icon:'ti-device-floppy',bg:'#FAEEDA',col:'#854F0B',title:'Sauvegarde cloud',sub:'Synchronisation Supabase',btns:[
              {label:saving?'Sauvegarde…':'Sauvegarder maintenant',icon:'ti-cloud-upload',fn:handleSave},
            ]},
          ].map(card=>(
            <div key={card.title} style={{padding:22,borderRadius:12,background:'var(--color-background-secondary)',border:'0.5px solid var(--color-border-tertiary)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <div style={{width:40,height:40,borderRadius:10,background:card.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <i className={'ti '+card.icon} style={{fontSize:20,color:card.col}} />
                </div>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:'var(--color-text-primary)'}}>{card.title}</div>
                  <div style={{fontSize:12,color:'var(--color-text-secondary)'}}>{card.sub}</div>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {card.btns.map(btn=>(
                  <button key={btn.label} onClick={btn.fn} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'10px 16px',borderRadius:8,border:'0.5px solid '+card.col+'44',background:card.bg,color:card.col,fontSize:13,fontWeight:500,cursor:'pointer'}}>
                    <i className={'ti '+btn.icon} style={{fontSize:15}} />{btn.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <input ref={importRef} type="file" accept=".csv" style={{display:'none'}} onChange={handleImport} />
        </div>
      )}

      {detail && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}
          onClick={e=>e.target===e.currentTarget&&!editingDetail&&setDetail(null)}>
          <div style={{background:'var(--color-background-primary)',borderRadius:16,width:520,maxWidth:'95vw',maxHeight:'90vh',overflowY:'auto',padding:28}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              {editingDetail
                ?<input value={editForm.nom} onChange={e=>setEditForm(f=>({...f,nom:e.target.value}))} style={{...S.inp,fontSize:16,fontWeight:600,flex:1,marginRight:12}} />
                :<div style={{fontSize:17,fontWeight:600,color:'var(--color-text-primary)'}}>{detail.nom}</div>
              }
              <button onClick={()=>{setEditingDetail(false);setDetail(null)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'var(--color-text-secondary)'}}>×</button>
            </div>
            {!editingDetail&&(
              <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                  {[['Date',fmtDate(detail.date_tirage)],['Score',detail.score?detail.score+'/10':'—'],['Âge',detail.age||'—'],['Motif',detail.motif||'—'],['État',detail.humeur||'—'],['Flacon',(detail.flaconVol||'30 ml')+' · '+(detail.support||'—')]].map(([k,v])=>(
                    <div key={k}>
                      <div style={{fontSize:10,fontWeight:600,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>{k}</div>
                      <div style={{fontSize:13}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Fleurs</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {(detail.fleurs||[]).length>0
                      ?(detail.fleurs||[]).map(f=><span key={f} style={{fontSize:12,background:'#E1F5EE',color:'#0F6E56',padding:'3px 9px',borderRadius:20,border:'0.5px solid #5DCAA5'}}>{f}{detail.dosages?.[f]?' · '+detail.dosages[f]+'gt':''}</span>)
                      :<span style={{fontSize:12,color:'var(--color-text-secondary)'}}>—</span>}
                  </div>
                </div>
                {detail.notes&&<div style={{marginBottom:14}}>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Notes</div>
                  <div style={{fontSize:13,color:'var(--color-text-secondary)',lineHeight:1.7,background:'var(--color-background-secondary)',padding:'10px 12px',borderRadius:8}}>{detail.notes}</div>
                </div>}
              </>
            )}
            {editingDetail&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div><div style={{fontSize:10,fontWeight:600,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>Date</div><input type="date" value={editForm.date_tirage} onChange={e=>setEditForm(f=>({...f,date_tirage:e.target.value}))} style={S.inp} /></div>
                <div><div style={{fontSize:10,fontWeight:600,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>Âge</div><input type="number" value={editForm.age} onChange={e=>setEditForm(f=>({...f,age:e.target.value}))} style={S.inp} /></div>
                <div style={{gridColumn:'1/-1'}}><div style={{fontSize:10,fontWeight:600,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>Motif</div><input value={editForm.motif} onChange={e=>setEditForm(f=>({...f,motif:e.target.value}))} style={S.inp} /></div>
                <div style={{gridColumn:'1/-1'}}>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>Score · {editForm.score}/10</div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                    {[1,2,3,4,5,6,7,8,9,10].map(v=>(
                      <button key={v} onClick={()=>setEditForm(f=>({...f,score:v}))} style={{width:34,height:34,borderRadius:7,border:'0.5px solid',cursor:'pointer',fontSize:13,fontWeight:500,background:editForm.score===v?'#E1F5EE':'transparent',color:editForm.score===v?'#085041':'var(--color-text-secondary)',borderColor:editForm.score===v?'#5DCAA5':'var(--color-border-secondary)'}}>{v}</button>
                    ))}
                  </div>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>Fleurs ({editForm.fleurs.length}/7)</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>
                    {editForm.fleurs.map(f=><span key={f} onClick={()=>toggleEditFleur(f)} style={{fontSize:12,background:'#E1F5EE',color:'#0F6E56',padding:'3px 9px',borderRadius:20,border:'0.5px solid #5DCAA5',cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>{f} <span style={{fontSize:14}}>×</span></span>)}
                  </div>
                  <div style={{maxHeight:150,overflowY:'auto',border:'0.5px solid var(--color-border-tertiary)',borderRadius:8,padding:'8px 10px'}}>
                    {FLEURS_BACH.map(f=>{const on=editForm.fleurs.includes(f.nom);return<span key={f.nom} onClick={()=>toggleEditFleur(f.nom)} style={{fontSize:11,padding:'2px 8px',borderRadius:12,margin:2,cursor:editForm.fleurs.length>=7&&!on?'not-allowed':'pointer',display:'inline-block',border:'0.5px solid',background:on?'#E1F5EE':'var(--color-background-secondary)',color:on?'#085041':'var(--color-text-secondary)',borderColor:on?'#5DCAA5':'var(--color-border-tertiary)',opacity:editForm.fleurs.length>=7&&!on?0.4:1}}>{f.nom}</span>})}
                  </div>
                </div>
                <div style={{gridColumn:'1/-1'}}><div style={{fontSize:10,fontWeight:600,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>Notes</div><textarea value={editForm.notes} onChange={e=>setEditForm(f=>({...f,notes:e.target.value}))} rows={3} style={S.ta(64)} /></div>
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              {editingDetail?(
                <>
                  <button onClick={()=>setEditingDetail(false)} style={S.btnNav}>Annuler</button>
                  <button onClick={saveEditDetail} style={{...S.btnPrimary,flex:1}}>Sauvegarder</button>
                </>
              ):(
                <>
                  <button onClick={()=>{setHist(prev=>prev.filter(r=>r.id!==detail.id));setDetail(null)}} style={{...S.btnNav,color:'#993556',borderColor:'#F4C0D1'}}>Supprimer</button>
                  <button onClick={()=>openEdit(detail)} style={S.btnNav}>Modifier</button>
                  <button onClick={()=>exportPDF(detail,allFleurs())} style={{...S.btnNav,color:'#854F0B',borderColor:'#FAC775'}}>PDF</button>
                  <button onClick={()=>setDetail(null)} style={{...S.btnPrimary,flex:1}}>Fermer</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StepHeader({n,total,title,sub}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
      <div style={{width:30,height:30,borderRadius:'50%',background:'#E1F5EE',color:'#085041',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{n}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:16,fontWeight:500,color:'var(--color-text-primary)'}}>{title}</div>
        <div style={{fontSize:12,color:'var(--color-text-secondary)'}}>{sub}</div>
      </div>
      <div style={{fontSize:11,color:'var(--color-text-tertiary)'}}>{n} / {total}</div>
    </div>
  )
}
