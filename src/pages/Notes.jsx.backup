import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/* ─── Mock data ────────────────────────────────────────────────────────── */

const MOCK = [
  { id: 1, client_nom: 'Sophie Legrand', categorie: 'Séance',        date_note: '2026-05-27', titre: 'Séance sophrologie – retour positif',   contenu: 'Sophie a bien progressé sur la gestion du stress. Les exercices de respiration sont désormais automatiques. Elle signale une amélioration notable du sommeil depuis 2 semaines. Prochaine séance dans 3 semaines.' },
  { id: 2, client_nom: 'Pierre Dumont',  categorie: 'Suivi',         date_note: '2026-05-26', titre: 'Appel téléphonique de suivi',            contenu: "Pierre a appelé pour signaler une rechute de stress liée à une restructuration dans son entreprise. Nous avons convenu d'un rendez-vous en urgence la semaine prochaine." },
  { id: 3, client_nom: 'Marie Caron',    categorie: 'Bilan',         date_note: '2026-05-24', titre: 'Bilan naturopathie mois 2',              contenu: 'Les résultats sanguins confirment une amélioration du taux de magnésium. Fatigue toujours présente mais moins intense. Continuer le protocole 1 mois. Ajouter Vitamine D3 5000 UI.' },
  { id: 4, client_nom: 'Lucie Bernard',  categorie: 'Fleurs de Bach', date_note: '2026-05-22', titre: 'Formule Bach renouvellement',            contenu: 'Formule renouvelée : Star of Bethlehem, Walnut, Olive. Score bien-être passé de 3/10 à 6/10 en 21 jours. Excellent résultat. Continuer avec formule allégée.' },
  { id: 5, client_nom: '',              categorie: 'Perso',          date_note: '2026-05-20', titre: 'Idées formations 2026',                  contenu: 'Formations à prévoir :\n- Hypnose Eriksonienne (octobre)\n- Cohérence cardiaque avancée (septembre)\nBudget estimé : 2 400 €' },
  { id: 6, client_nom: 'Paul Renard',    categorie: 'Séance',        date_note: '2026-05-18', titre: 'Séance énergie lombaires',               contenu: 'Libération du blocage L4-L5. Paul signale 70% de diminution de la douleur après la séance. Exercices posturaux donnés à faire quotidiennement. Revoir dans 2 semaines.' },
  { id: 7, client_nom: 'Anna Leblanc',   categorie: 'Suivi',         date_note: '2026-05-15', titre: 'Protocole anxiété – J+14',               contenu: 'Anna pratique les exercices matin et soir comme convenu. Les crises de panique sont passées de 4/semaine à 1/semaine. Progression encourageante.' },
  { id: 8, client_nom: '',              categorie: 'Perso',          date_note: '2026-05-10', titre: 'Organisation cabinet – mai',             contenu: 'Tâches en cours :\n✓ Renouveler assurance RC Pro\n✓ Commander flacons Bach\n→ Mettre à jour CGV\n→ Créer modèle de consentement RGPD' },
]

const CATEGORIES = ['Toutes', 'Séance', 'Suivi', 'Bilan', 'Fleurs de Bach', 'Perso', 'Autre']

const CAT_COLOR = {
  'Séance':        { bg: '#E6F1FB', color: '#185FA5' },
  'Suivi':         { bg: '#EEEDFE', color: '#534AB7' },
  'Bilan':         { bg: '#E1F5EE', color: '#0F6E56' },
  'Fleurs de Bach':{ bg: '#F0EBF8', color: '#7F3FBF' },
  'Perso':         { bg: '#FAEEDA', color: '#854F0B' },
  'Autre':         { bg: '#F5F5F5', color: '#6B7280' },
}

/* ─── CSV helpers ─────────────────────────────────────────────────────── */

function toCSV(rows) {
  const header = 'Titre,Client,Catégorie,Date,Contenu'
  const lines  = rows.map(r =>
    `"${(r.titre||'').replace(/"/g,"'")}","${r.client_nom||''}","${r.categorie||''}","${r.date_note||''}","${(r.contenu||'').replace(/"/g,"'").replace(/\n/g,' ')}"`
  )
  return [header, ...lines].join('\n')
}

function downloadCSV(content, filename) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function parseCSV(text) {
  const lines = text.trim().split('\n').slice(1)
  return lines.map((line, i) => {
    const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g) || []
    const c    = cols.map(x => x.replace(/^"|"$/g, '').trim())
    return { id: Date.now() + i, titre: c[0]||'', client_nom: c[1]||'', categorie: c[2]||'Autre', date_note: c[3]||new Date().toISOString().slice(0,10), contenu: c[4]||'' }
  }).filter(r => r.titre || r.contenu)
}

/* ─── Utilitaires ─────────────────────────────────────────────────────── */

const MOIS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
function fmtDate(d) {
  if (!d) return '—'
  const [y, m, j] = d.split('-')
  return `${j} ${MOIS[parseInt(m)-1]} ${y}`
}

function fmtDatetime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const p = n => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const isoToday = new Date().toISOString().slice(0, 10)

/* ─── Composant principal ─────────────────────────────────────────────── */

export default function Notes() {
  const importRef = useRef()

  const [notes,      setNotes]      = useState(MOCK)
  const [activeTab,  setActiveTab]  = useState('liste')
  const [search,     setSearch]     = useState('')
  const [filterCat,  setFilterCat]  = useState('Toutes')
  const [selected,   setSelected]   = useState(null)
  const [editing,    setEditing]    = useState(false)
  const [editForm,   setEditForm]   = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [saveMsg,    setSaveMsg]    = useState('')
  const [importMsg,  setImportMsg]  = useState('')

  /* Formulaire nouvelle note */
  const EMPTY = { titre: '', client_nom: '', categorie: 'Séance', date_note: isoToday, contenu: '' }
  const [form,    setForm]    = useState(EMPTY)
  const [formMsg, setFormMsg] = useState('')
  const f = k => e => setForm(prev => ({ ...prev, [k]: e.target.value }))

  /* Chargement initial depuis Supabase */
  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('id, titre, categorie, client_nom, date_note, contenu')
          .order('date_note', { ascending: false })
        if (!error && data?.length) setNotes(data)
      } catch { /* garde le mock */ }
    }
    load()
  }, [])

  /* Recherche full-text via Supabase (≥ 3 caractères) */
  const [ftsResults, setFtsResults] = useState(null)
  const [ftsLoading, setFtsLoading] = useState(false)

  const runFts = useCallback(async (q) => {
    if (!q || q.length < 3) { setFtsResults(null); return }
    setFtsLoading(true)
    const { data } = await supabase
      .from('notes')
      .select('id, titre, categorie, client_nom, date_note, contenu')
      .textSearch('fts', q, { type: 'plain', config: 'french' })
      .order('date_note', { ascending: false })
      .limit(50)
    setFtsResults(data || [])
    setFtsLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => runFts(search), 300)
    return () => clearTimeout(t)
  }, [search, runFts])

  /* Filtres (appliqués sur fts ou notes locales) */
  const base     = ftsResults ?? notes
  const filtered = base.filter(n => {
    const matchCat = filterCat === 'Toutes' || n.categorie === filterCat
    if (ftsResults) return matchCat
    const q = search.toLowerCase()
    const matchQ = !q ||
      (n.titre||'').toLowerCase().includes(q) ||
      (n.contenu||'').toLowerCase().includes(q) ||
      (n.client_nom||'').toLowerCase().includes(q)
    return matchQ && matchCat
  })

  /* Stats */
  const ceMois = notes.filter(n => (n.date_note||'').startsWith(isoToday.slice(0,7))).length

  /* Sauvegarde Supabase */
  async function handleSave() {
    setSaving(true); setSaveMsg('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')
      const rows = notes
        .filter(n => typeof n.id === 'string')
        .map(n => ({ ...n, user_id: user.id }))
      if (!rows.length) { setSaveMsg('Aucune note à synchroniser.'); setSaving(false); return }
      const { error } = await supabase.from('notes').upsert(rows, { onConflict: 'id' })
      if (error) throw error
      setSaveMsg('✓ Synchronisation effectuée')
    } catch (e) {
      setSaveMsg(`✗ Erreur : ${e.message}`)
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  /* Import CSV */
  function handleImport(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const imported = parseCSV(ev.target.result)
      if (!imported.length) { setImportMsg('Fichier invalide.'); return }
      setNotes(prev => [...imported, ...prev])
      setImportMsg(`✓ ${imported.length} note(s) importée(s).`)
      setTimeout(() => setImportMsg(''), 3000)
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  /* Édition d'une note */
  function startEdit(note) {
    setEditForm({ titre: note.titre || '', client_nom: note.client_nom || '', categorie: note.categorie || 'Autre', date_note: note.date_note || isoToday, contenu: note.contenu || '' })
    setEditing(true)
  }

  async function saveEdit() {
    if (!editForm.titre.trim() && !editForm.contenu.trim()) return
    const date_modification = new Date().toISOString()
    if (typeof selected.id === 'string') {
      await supabase.from('notes')
        .update({
          titre:             editForm.titre,
          client_nom:        editForm.client_nom || null,
          categorie:         editForm.categorie,
          date_note:         editForm.date_note,
          contenu:           editForm.contenu,
          date_modification,
        })
        .eq('id', selected.id)
    }
    const updated = { ...selected, ...editForm, date_modification }
    setNotes(prev => prev.map(n => n.id === selected.id ? updated : n))
    setSelected(updated)
    setEditing(false)
  }

  function cancelEdit() {
    setEditing(false)
    setEditForm(null)
  }

  /* Nouvelle note */
  async function handleAdd() {
    if (!form.titre.trim() && !form.contenu.trim()) { setFormMsg('Titre ou contenu requis.'); return }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error()
      const { data, error } = await supabase.from('notes').insert({
        user_id:       user.id,
        titre:         form.titre || null,
        client_nom:    form.client_nom || null,
        categorie:     form.categorie,
        date_note:     form.date_note,
        contenu:       form.contenu,
        date_creation: new Date().toISOString(),
      }).select('id, titre, categorie, client_nom, date_note, contenu, date_creation').single()
      if (error) throw error
      setNotes(prev => [data, ...prev])
    } catch {
      setNotes(prev => [{ ...form, id: Date.now() }, ...prev])
    }
    setForm(EMPTY)
    setFormMsg('✓ Note ajoutée.')
    setTimeout(() => { setFormMsg(''); setActiveTab('liste') }, 1200)
  }

  const TABS = [
    { id: 'liste',   label: 'Mes notes',      icon: 'ti-notes' },
    { id: 'nouveau', label: 'Nouvelle note',   icon: 'ti-plus' },
    { id: 'export',  label: 'Import / Export', icon: 'ti-arrows-transfer-down' },
  ]

  return (
    <div style={{ padding: '1.6rem 2rem', fontFamily: 'inherit' }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="ti ti-notes" style={{ fontSize: 24, color: 'var(--color-accent)' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>Notes</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{notes.length} notes enregistrées</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
          <Btn icon="ti-upload"        label="Importer"      onClick={() => importRef.current.click()} secondary />
          <Btn icon="ti-download"      label="Exporter"      onClick={() => downloadCSV(toCSV(notes), 'notes-napocrm.csv')} secondary />
          <Btn icon="ti-device-floppy" label={saving ? 'Sauvegarde…' : 'Sauvegarder'} onClick={handleSave} secondary />
          <Btn icon="ti-plus"          label="Nouvelle note" onClick={() => setActiveTab('nouveau')} />
        </div>
      </div>

      {/* Messages flash */}
      {(importMsg || saveMsg) && (
        <div style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 8, background: (importMsg||saveMsg).startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: (importMsg||saveMsg).startsWith('✓') ? '#3B6D11' : '#993556', fontSize: 13 }}>
          {importMsg || saveMsg}
        </div>
      )}

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        <StatCard icon="ti-notes"        iconBg="#E6F1FB" iconColor="#185FA5" label="Total notes"    value={notes.length} />
        <StatCard icon="ti-calendar"     iconBg="#EEEDFE" iconColor="#534AB7" label="Ce mois"        value={ceMois} />
        <StatCard icon="ti-user"         iconBg="#E1F5EE" iconColor="#0F6E56" label="Avec client"    value={notes.filter(n => n.client_nom).length} />
        <StatCard icon="ti-bookmark"     iconBg="#FAEEDA" iconColor="#854F0B" label="Perso"          value={notes.filter(n => n.categorie === 'Perso').length} />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--color-border-tertiary)', marginBottom: 16 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13,
            fontWeight: activeTab === tab.id ? 600 : 400,
            color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
            marginBottom: -1,
          }}>
            <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} />{tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════ LISTE NOTES ═══════════ */}
      {activeTab === 'liste' && (
        <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 340px)', minHeight: 400 }}>

          {/* Panneau gauche — liste */}
          <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-background-secondary)', borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden' }}>

            {/* Filtres */}
            <div style={{ padding: '12px 12px 10px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <i className={`ti ${ftsLoading ? 'ti-loader-2' : 'ti-search'}`} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--color-text-secondary)', pointerEvents: 'none', animation: ftsLoading ? 'spin 1s linear infinite' : 'none' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher… (full-text dès 3 car.)"
                  style={{ width: '100%', padding: '6px 8px 6px 28px', borderRadius: 7, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 12, boxSizing: 'border-box' }} />
              </div>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', borderRadius: 7, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 12, cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Liste */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                  <i className="ti ti-notebook-off" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />Aucune note
                </div>
              ) : filtered.map((n, idx) => {
                const cat = CAT_COLOR[n.categorie] || CAT_COLOR['Autre']
                const isActive = selected?.id === n.id
                return (
                  <div key={n.id}
                    style={{ padding: '11px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)', cursor: 'pointer', borderLeft: `3px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`, background: isActive ? 'var(--color-background-primary)' : 'transparent', transition: 'background .1s' }}
                    onClick={() => { setSelected(n); setEditing(false); setEditForm(null) }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-background-primary)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3, gap: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {n.titre || n.contenu.split('\n')[0].slice(0, 40) || '(sans titre)'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, background: cat.bg, color: cat.color, padding: '1px 6px', borderRadius: 10, whiteSpace: 'nowrap' }}>{n.categorie}</span>
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(n); startEdit(n) }}
                          title="Modifier"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '2px 3px', borderRadius: 4, lineHeight: 1 }}
                        >
                          <i className="ti ti-pencil" style={{ fontSize: 11 }} />
                        </button>
                      </div>
                    </div>
                    {n.client_nom && <div style={{ fontSize: 11, color: 'var(--color-accent)', marginBottom: 2 }}>{n.client_nom}</div>}
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(n.contenu||'').replace(/\n/g, ' ').slice(0, 55)}…
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 4 }}>{fmtDate(n.date_note)}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Panneau droit — détail */}
          <div style={{ flex: 1, background: 'var(--color-background-secondary)', borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {selected ? (
              <>
                {/* ── Header détail ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 22px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
                  <div style={{ flex: 1 }}>
                    {editing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input value={editForm.titre} onChange={e => setEditForm(f => ({ ...f, titre: e.target.value }))}
                          placeholder="Titre"
                          style={{ fontSize: 15, fontWeight: 600, width: '100%', padding: '5px 8px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', boxSizing: 'border-box' }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input value={editForm.client_nom} onChange={e => setEditForm(f => ({ ...f, client_nom: e.target.value }))}
                            placeholder="Client"
                            style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 12 }} />
                          <select value={editForm.categorie} onChange={e => setEditForm(f => ({ ...f, categorie: e.target.value }))}
                            style={{ padding: '5px 8px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 12, cursor: 'pointer' }}>
                            {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <input type="date" value={editForm.date_note} onChange={e => setEditForm(f => ({ ...f, date_note: e.target.value }))}
                            style={{ padding: '5px 8px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 12 }} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>{selected.titre || '(sans titre)'}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          {(() => { const cat = CAT_COLOR[selected.categorie] || CAT_COLOR['Autre']; return (
                            <span style={{ fontSize: 11, fontWeight: 600, background: cat.bg, color: cat.color, padding: '2px 8px', borderRadius: 20 }}>{selected.categorie}</span>
                          )})()}
                          {selected.client_nom && <span style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 500 }}>{selected.client_nom}</span>}
                          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{fmtDate(selected.date_note)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                    {editing ? (
                      <>
                        <button onClick={cancelEdit}
                          style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 12 }}>
                          Annuler
                        </button>
                        <button onClick={saveEdit}
                          style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          <i className="ti ti-check" style={{ marginRight: 4 }} />Sauvegarder
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(selected)}
                          style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <i className="ti ti-pencil" style={{ fontSize: 13 }} />Modifier
                        </button>
                        <button onClick={() => downloadCSV(toCSV([selected]), `note-${selected.id}.csv`)}
                          style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 12 }}>
                          <i className="ti ti-download" />
                        </button>
                        <button onClick={() => { setNotes(prev => prev.filter(n => n.id !== selected.id)); setSelected(null) }}
                          style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid #FBEAF0', background: 'transparent', color: '#993556', cursor: 'pointer', fontSize: 12 }}>
                          <i className="ti ti-trash" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* ── Corps de la note ── */}
                {editing ? (
                  <textarea value={editForm.contenu} onChange={e => setEditForm(f => ({ ...f, contenu: e.target.value }))}
                    onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') saveEdit() }}
                    placeholder="Contenu de la note…"
                    style={{ flex: 1, padding: '20px 22px', fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.9, fontFamily: 'inherit', border: 'none', outline: 'none', resize: 'none', background: 'var(--color-background-primary)' }}
                    autoFocus
                  />
                ) : (
                  <>
                    <div style={{ flex: 1, padding: '20px 22px', overflowY: 'auto', fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                      {selected.contenu}
                    </div>
                    {(selected.date_creation || selected.date_modification) && (
                      <div style={{ padding: '8px 22px 12px', borderTop: '0.5px solid var(--color-border-tertiary)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {selected.date_creation && (
                          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                            Créé le {fmtDatetime(selected.date_creation)}
                          </div>
                        )}
                        {selected.date_modification && (
                          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                            Modifié le {fmtDatetime(selected.date_modification)}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {editing && (
                  <div style={{ padding: '4px 22px 10px', fontSize: 10, color: 'var(--color-text-secondary)', textAlign: 'right', flexShrink: 0 }}>
                    Ctrl+Entrée pour sauvegarder
                  </div>
                )}
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--color-text-secondary)' }}>
                <i className="ti ti-notebook" style={{ fontSize: 40, color: 'var(--color-border-secondary)' }} />
                <div style={{ fontSize: 14, fontWeight: 500 }}>Sélectionnez une note</div>
                <div style={{ fontSize: 12 }}>ou créez-en une nouvelle</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ NOUVELLE NOTE ═══════════ */}
      {activeTab === 'nouveau' && (
        <div style={{ maxWidth: 660 }}>
          {formMsg && (
            <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: formMsg.startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: formMsg.startsWith('✓') ? '#3B6D11' : '#993556', fontSize: 13 }}>
              {formMsg}
            </div>
          )}
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 14, border: '0.5px solid var(--color-border-tertiary)', padding: '28px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 22 }}>Nouvelle note</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <Field label="Titre">
                <input value={form.titre} onChange={f('titre')} placeholder="Titre de la note" style={inp} />
              </Field>
              <Field label="Catégorie">
                <select value={form.categorie} onChange={f('categorie')} style={inp}>
                  {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Client (optionnel)">
                <input value={form.client_nom} onChange={f('client_nom')} placeholder="Nom du client" style={inp} />
              </Field>
              <Field label="Date">
                <input type="date" value={form.date_note} onChange={f('date_note')} style={inp} />
              </Field>
            </div>

            <Field label="Contenu">
              <textarea value={form.contenu} onChange={f('contenu')}
                placeholder="Écrivez votre note ici… (observations, compte-rendu, idées, tâches…)"
                rows={8} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }} />
            </Field>

            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
              <button onClick={() => { setForm(EMPTY); setFormMsg('') }}
                style={{ padding: '9px 18px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 13 }}>
                Réinitialiser
              </button>
              <button onClick={handleAdd}
                style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <i className="ti ti-check" style={{ marginRight: 6 }} />Enregistrer la note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ IMPORT / EXPORT ═══════════ */}
      {activeTab === 'export' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 800 }}>

          {/* Export */}
          <div style={{ padding: '22px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-download" style={{ fontSize: 20, color: '#0F6E56' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Exporter les notes</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Format CSV compatible Excel</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Colonnes : Titre, Client, Catégorie, Date, Contenu.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => downloadCSV(toCSV(notes), 'notes-napocrm.csv')} style={xBtn('#0F6E56', '#E1F5EE')}>
                <i className="ti ti-table-export" style={{ fontSize: 15 }} /> Exporter tout ({notes.length} notes)
              </button>
              <button onClick={() => { const m = notes.filter(n => (n.date_note||'').startsWith(isoToday.slice(0,7))); downloadCSV(toCSV(m), `notes-${isoToday.slice(0,7)}.csv`) }} style={xBtn('#185FA5', '#E6F1FB')}>
                <i className="ti ti-calendar-down" style={{ fontSize: 15 }} /> Exporter ce mois ({ceMois} notes)
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
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Importer des notes</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Fichier CSV (même format export)</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Format attendu : <code style={{ fontSize: 11, background: 'var(--color-background-primary)', padding: '1px 5px', borderRadius: 4 }}>Titre, Client, Catégorie, Date, Contenu</code>
            </div>
            <button onClick={() => importRef.current.click()} style={xBtn('#534AB7', '#EEEDFE')}>
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
                Sauvegardez toutes vos notes dans la base cloud. Les notes créées localement ne sont pas automatiquement synchronisées.
              </div>
              <button onClick={handleSave} disabled={saving} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: 'none', background: '#854F0B', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? .7 : 1 }}>
                <i className="ti ti-cloud-upload" style={{ fontSize: 16 }} />
                {saving ? 'Sauvegarde…' : 'Sauvegarder maintenant'}
              </button>
            </div>
            {saveMsg && (
              <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: saveMsg.startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: saveMsg.startsWith('✓') ? '#3B6D11' : '#993556', fontSize: 13 }}>
                {saveMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Composants utilitaires ─────────────────────────────────────────── */

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

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}

const inp = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }

function xBtn(color, bg) {
  return { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', borderRadius: 8, border: `0.5px solid ${color}44`, background: bg, color, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
}
