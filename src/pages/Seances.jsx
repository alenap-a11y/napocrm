import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'


// ── CSV helpers ────────────────────────────────────────────────────────────

function toCSV(seances) {
  const header = 'Prénom,Nom,Type,Date,Heure,Durée (min),Prix (€),Tags,Notes'
  const rows = seances.map(s =>
    `${s.prenom},${s.nom},${s.type_seance},${s.date_seance},${s.heure_seance},${s.duree_minutes},${s.prix_euros},"${(s.tags||[]).join('|')}","${(s.notes||'').replace(/"/g, "'").replace(/\n/g, ' ')}"`
  )
  return [header, ...rows].join('\n')
}

function downloadCSV(content, filename) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function parseCSV(text) {
  const lines = text.trim().split('\n').slice(1)
  return lines.map((line, i) => {
    const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g) || []
    const c = cols.map(x => x.replace(/^"|"$/g, '').trim())
    return {
      id: Date.now() + i,
      prenom:        c[0] || '',
      nom:           c[1] || '',
      type_seance:   c[2] || 'Autre',
      date_seance:   c[3] || '',
      heure_seance:  c[4] || '09:00',
      duree_minutes: parseInt(c[5]) || 60,
      prix_euros:    parseFloat(c[6]) || 0,
      tags:          c[7] ? c[7].split('|').filter(Boolean) : [],
      notes:         c[8] || '',
    }
  }).filter(s => s.prenom || s.nom)
}

// ── Utilitaires ────────────────────────────────────────────────────────────

const TYPES = ['Tous', 'Sophrologie', 'Coaching', 'Naturopathie', 'Énergie', 'Massage', 'Fleurs de Bach', 'Autre']
const MOIS  = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, j] = d.split('-')
  return `${j} ${MOIS[parseInt(m) - 1]} ${y}`
}

function clientName(s) { return `${s.prenom} ${s.nom}`.trim() }

const TYPE_COLOR = {
  'Sophrologie':    { bg: '#E6F1FB', color: '#185FA5' },
  'Coaching':       { bg: '#EEEDFE', color: '#534AB7' },
  'Naturopathie':   { bg: '#E1F5EE', color: '#0F6E56' },
  'Énergie':        { bg: '#FBEAF0', color: '#993556' },
  'Massage':        { bg: '#FAEEDA', color: '#854F0B' },
  'Fleurs de Bach': { bg: '#F0EBF8', color: '#7F3FBF' },
  'Autre':          { bg: '#F5F5F5', color: '#6B7280' },
}

// ── Composant principal ────────────────────────────────────────────────────

export default function Seances() {
  const navigate  = useNavigate()
  const importRef = useRef()

  const [seances,       setSeances]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [filterType,    setFilterType]    = useState('Tous')
  const [filterMois,    setFilterMois]    = useState('tous')
  const [detail,        setDetail]        = useState(null)
  const [editingDetail, setEditingDetail] = useState(false)
  const [editForm,      setEditForm]      = useState(null)
  const [activeTab,     setActiveTab]     = useState('historique')
  const [importMsg,     setImportMsg]     = useState('')
  const [saving,        setSaving]        = useState(false)
  const [saveMsg,       setSaveMsg]       = useState('')
  const [btnHover,      setBtnHover]      = useState(false)
  const [btnActive,     setBtnActive]     = useState(false)

  const EMPTY_FORM = {
    prenom: '', nom: '', email: '', type_seance: 'Sophrologie',
    date_seance:  new Date().toISOString().slice(0, 10),
    heure_seance: '10:00',
    duree_minutes: '60',
    prix_euros: '',
    tags: '',
    notes: '',
  }
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [formMsg, setFormMsg] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('seances')
        .select('*')
        .order('date_seance', { ascending: false })
      if (error) console.error('Erreur chargement séances:', error.message)
      else setSeances(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // ── Filtres ──────────────────────────────────────────────────────────────
  const moisDispos = [...new Set(
    seances.map(s => s.date_seance?.slice(0, 7)).filter(Boolean)
  )].sort().reverse()

  const filtered = seances.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      clientName(s).toLowerCase().includes(q) ||
      (s.type_seance || '').toLowerCase().includes(q) ||
      (s.notes || '').toLowerCase().includes(q)
    const matchType = filterType === 'Tous' || s.type_seance === filterType
    const matchMois = filterMois === 'tous' || (s.date_seance || '').startsWith(filterMois)
    return matchSearch && matchType && matchMois
  })

  // ── Stats ────────────────────────────────────────────────────────────────
  const currentMonth = new Date().toISOString().slice(0, 7)
  const seancesMois  = seances.filter(s => (s.date_seance || '').startsWith(currentMonth))
  const revenuMois   = seancesMois.reduce((acc, x) => acc + (parseFloat(x.prix_euros) || 0), 0)
  const dureeAvg     = seances.length
    ? Math.round(seances.reduce((acc, x) => acc + (parseInt(x.duree_minutes) || 0), 0) / seances.length)
    : 0

  // ── Sauvegarde manuelle vers Supabase ────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')
      const toUpsert = seances
        .filter(s => typeof s.id === 'string')
        .map(s => ({ ...s, user_id: user.id }))
      if (!toUpsert.length) { setSaveMsg('Aucune séance à synchroniser.'); setSaving(false); return }
      const { error } = await supabase.from('seances').upsert(toUpsert, { onConflict: 'id' })
      if (error) throw error
      setSaveMsg('✓ Synchronisation effectuée')
    } catch (e) {
      setSaveMsg(`✗ Erreur : ${e.message}`)
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  // ── Import CSV ────────────────────────────────────────────────────────────
  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const imported = parseCSV(ev.target.result)
      if (!imported.length) { setImportMsg('Fichier invalide ou vide.'); return }
      setSeances(prev => [...imported, ...prev])
      setImportMsg(`✓ ${imported.length} séance(s) importée(s).`)
      setTimeout(() => setImportMsg(''), 3000)
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  // ── Supprimer une séance ──────────────────────────────────────────────────
  async function deleteSeance(id) {
    if (typeof id === 'string') {
      await supabase.from('seances').delete().eq('id', id)
    }
    setSeances(prev => prev.filter(s => s.id !== id))
    setDetail(null)
  }

  // ── Modifier une séance ───────────────────────────────────────────────────
  function openEdit(s) {
    setEditForm({
      prenom:        s.prenom || '',
      nom:           s.nom || '',
      type_seance:   s.type_seance || 'Sophrologie',
      date_seance:   s.date_seance || '',
      heure_seance:  s.heure_seance || '',
      duree_minutes: s.duree_minutes || '60',
      prix_euros:    s.prix_euros || '',
      tags:          (s.tags || []).join(', '),
      notes:         s.notes || '',
    })
    setEditingDetail(true)
  }

  async function saveEditDetail() {
    const parsedTags = editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    const updated = {
      ...detail,
      ...editForm,
      prix_euros:    parseFloat(editForm.prix_euros) || 0,
      duree_minutes: parseInt(editForm.duree_minutes) || 60,
      tags:          parsedTags,
    }
    if (typeof detail.id === 'string') {
      await supabase.from('seances').update({
        prenom:        updated.prenom,
        nom:           updated.nom,
        type_seance:   updated.type_seance,
        date_seance:   updated.date_seance,
        heure_seance:  updated.heure_seance,
        duree_minutes: updated.duree_minutes,
        prix_euros:    updated.prix_euros,
        tags:          parsedTags,
        notes:         updated.notes,
      }).eq('id', detail.id)
    }
    setSeances(prev => prev.map(s => s.id === detail.id ? updated : s))
    setDetail(updated)
    setEditingDetail(false)
  }

  const fmt = n => `${(parseFloat(n) || 0).toFixed(0)} €`

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)', fontSize: 13 }}>
      <i className="ti ti-loader-2" style={{ fontSize: 22, marginRight: 8, animation: 'spin 1s linear infinite' }} />
      Chargement…
    </div>
  )

  return (
    <div style={{ padding: '1.6rem 2rem', fontFamily: 'inherit' }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* Bouton 3D — à gauche du titre */}
          <button
            onClick={() => navigate('/seances/nouvelle')}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => { setBtnHover(false); setBtnActive(false) }}
            onMouseDown={() => setBtnActive(true)}
            onMouseUp={() => setBtnActive(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 22px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              background: 'linear-gradient(145deg, #6b9e5e, #4a7a3d)',
              boxShadow: btnActive
                ? '0px 0px 0px #2d5a24'
                : btnHover
                  ? '2px 2px 0px #2d5a24'
                  : '4px 4px 0px #2d5a24, inset 0px 1px 0px rgba(255,255,255,0.2)',
              transform: btnActive ? 'translateY(4px)' : btnHover ? 'translateY(2px)' : 'none',
              transition: 'all 0.1s ease',
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: 15 }} />
            Nouvelle séance 3D
          </button>

          {/* Titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="ti ti-calendar-plus" style={{ fontSize: 24, color: 'var(--color-accent)' }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>Séances</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{seances.length} séances enregistrées</div>
            </div>
          </div>
        </div>

        {/* Actions secondaires */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
          <Btn icon="ti-upload"       label="Importer"                        onClick={() => importRef.current.click()} secondary />
          <Btn icon="ti-download"     label="Exporter"                        onClick={() => downloadCSV(toCSV(seances), 'seances-napocrm.csv')} secondary />
          <Btn icon="ti-cloud-upload" label={saving ? 'Sync…' : 'Synchroniser'} onClick={handleSave} secondary />
        </div>
      </div>

      {/* Messages flash */}
      {(importMsg || saveMsg) && (
        <div style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 8, background: (importMsg || saveMsg).startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: (importMsg || saveMsg).startsWith('✓') ? '#3B6D11' : '#993556', fontSize: 13 }}>
          {importMsg || saveMsg}
        </div>
      )}

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        <StatCard icon="ti-calendar-stats" iconBg="#E6F1FB" iconColor="#185FA5" label="Total séances"   value={seances.length} />
        <StatCard icon="ti-calendar-month" iconBg="#EEEDFE" iconColor="#534AB7" label="Ce mois"         value={seancesMois.length} />
        <StatCard icon="ti-coin"           iconBg="#E1F5EE" iconColor="#0F6E56" label="Revenus ce mois" value={fmt(revenuMois)} />
        <StatCard icon="ti-clock"          iconBg="#FAEEDA" iconColor="#854F0B" label="Durée moyenne"   value={`${dureeAvg} min`} />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--color-border-tertiary)', marginBottom: 16 }}>
        {[
          { id: 'historique', label: 'Historique',      icon: 'ti-history' },
          { id: 'nouvelle',   label: 'Nouvelle séance', icon: 'ti-plus' },
          { id: 'export',     label: 'Import / Export', icon: 'ti-arrows-transfer-down' },
        ].map(tab => (
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

      {/* ─────────────── ONGLET HISTORIQUE ─────────────── */}
      {activeTab === 'historique' && (
        <>
          {/* Filtres */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher client, type, notes…"
                style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <Sel value={filterType} onChange={setFilterType} options={TYPES.map(t => [t, t])} />
            <Sel value={filterMois} onChange={setFilterMois} options={[['tous','Tous les mois'], ...moisDispos.map(m => {
              const [y, mo] = m.split('-')
              return [m, `${MOIS[parseInt(mo)-1]} ${y}`]
            })]} />
          </div>

          {/* Tableau */}
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, overflow: 'hidden', border: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 90px 70px 80px 90px 36px', padding: '8px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              {['Client','Date','Type','Durée','Prix','Tags',''].map((h, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: i === 4 ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                <i className="ti ti-calendar-off" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />
                Aucune séance trouvée
              </div>
            ) : filtered.map((s, idx) => {
              const tc   = TYPE_COLOR[s.type_seance] || TYPE_COLOR['Autre']
              const tags = s.tags || []
              return (
                <div
                  key={s.id}
                  onClick={() => setDetail(s)}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 140px 90px 70px 80px 90px 36px', padding: '11px 16px', alignItems: 'center', cursor: 'pointer', borderBottom: idx < filtered.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-primary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{clientName(s)}</div>
                    {s.heure_seance && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{s.heure_seance}</div>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{fmtDate(s.date_seance)}</div>
                  <div><span style={{ fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.color, padding: '2px 8px', borderRadius: 20 }}>{s.type_seance}</span></div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{s.duree_minutes} min</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', textAlign: 'right' }}>{fmt(s.prix_euros)}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {tags.slice(0, 2).map(t => (
                      <span key={t} style={{ fontSize: 10, background: 'var(--color-background-primary)', color: 'var(--color-text-secondary)', padding: '1px 6px', borderRadius: 20, border: '0.5px solid var(--color-border-tertiary)' }}>{t}</span>
                    ))}
                    {tags.length > 2 && <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>+{tags.length - 2}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={e => { e.stopPropagation(); downloadCSV(toCSV([s]), `seance-${s.prenom}-${s.date_seance}.csv`) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4 }} title="Exporter">
                      <i className="ti ti-download" style={{ fontSize: 14 }} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, fontSize: 13, color: 'var(--color-text-secondary)', gap: 6 }}>
              <span>{filtered.length} séance(s)</span>·
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {fmt(filtered.reduce((acc, x) => acc + (parseFloat(x.prix_euros) || 0), 0))} encaissés
              </span>
            </div>
          )}
        </>
      )}

      {/* ─────────────── ONGLET NOUVELLE SÉANCE ─────────────── */}
      {activeTab === 'nouvelle' && (
        <div style={{ maxWidth: 600 }}>
          {formMsg && (
            <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: formMsg.startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: formMsg.startsWith('✓') ? '#3B6D11' : '#993556', fontSize: 13 }}>
              {formMsg}
            </div>
          )}
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 14, border: '0.5px solid var(--color-border-tertiary)', padding: '28px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 22 }}>Informations de la séance</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <Field label="Prénom du client">
                <input value={form.prenom} onChange={e => setForm(f => ({...f, prenom: e.target.value}))} placeholder="Marie" style={inputStyle} />
              </Field>
              <Field label="Nom du client">
                <input value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))} placeholder="Joubert" style={inputStyle} />
              </Field>
              <Field label="Date">
                <input type="date" value={form.date_seance} onChange={e => setForm(f => ({...f, date_seance: e.target.value}))} style={inputStyle} />
              </Field>
              <Field label="Heure">
                <input type="time" value={form.heure_seance} onChange={e => setForm(f => ({...f, heure_seance: e.target.value}))} style={inputStyle} />
              </Field>
              <Field label="Type de séance">
                <select value={form.type_seance} onChange={e => setForm(f => ({...f, type_seance: e.target.value}))} style={inputStyle}>
                  {TYPES.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Durée (min)">
                <input type="number" value={form.duree_minutes} onChange={e => setForm(f => ({...f, duree_minutes: e.target.value}))} placeholder="60" min="1" style={inputStyle} />
              </Field>
              <Field label="Prix (€)">
                <input type="number" value={form.prix_euros} onChange={e => setForm(f => ({...f, prix_euros: e.target.value}))} placeholder="60" min="0" style={inputStyle} />
              </Field>
              <Field label="Tags (séparés par ,)">
                <input value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="Stress, Sommeil…" style={inputStyle} />
              </Field>
            </div>

            <Field label="Email">
              <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="email@exemple.com" style={inputStyle} />
            </Field>

            <Field label="Notes">
              <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Observations, compte-rendu de séance…" rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </Field>

            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
              <button onClick={() => { setForm(EMPTY_FORM); setFormMsg('') }} style={{ padding: '9px 18px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 13 }}>
                Réinitialiser
              </button>
              <button onClick={async () => {
                if (!form.prenom.trim() || !form.nom.trim()) { setFormMsg('Prénom et nom requis.'); return }
                if (!form.date_seance) { setFormMsg('Date requise.'); return }
                const parsedTags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
                try {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) throw new Error('Non connecté')
                  const { data, error } = await supabase.from('seances').insert({
                    user_id:       user.id,
                    prenom:        form.prenom,
                    nom:           form.nom,
                    email:         form.email || null,
                    type_seance:   form.type_seance,
                    date_seance:   form.date_seance,
                    heure_seance:  form.heure_seance,
                    duree_minutes: parseInt(form.duree_minutes) || 60,
                    prix_euros:    parseFloat(form.prix_euros) || null,
                    tags:          parsedTags.length ? parsedTags : null,
                    notes:         form.notes || null,
                  }).select().single()
                  if (error) throw error
                  setSeances(prev => [data, ...prev])
                } catch {
                  const newSeance = {
                    ...form,
                    id:            Date.now(),
                    duree_minutes: parseInt(form.duree_minutes) || 60,
                    prix_euros:    parseFloat(form.prix_euros) || 0,
                    tags:          parsedTags,
                  }
                  setSeances(prev => [newSeance, ...prev])
                }
                setForm(EMPTY_FORM)
                setFormMsg('✓ Séance ajoutée avec succès.')
                setTimeout(() => { setFormMsg(''); setActiveTab('historique') }, 1500)
              }} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <i className="ti ti-check" style={{ marginRight: 6 }} />Enregistrer la séance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────── ONGLET IMPORT / EXPORT ─────────────── */}
      {activeTab === 'export' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 800 }}>
          <div style={{ padding: '22px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-download" style={{ fontSize: 20, color: '#0F6E56' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Exporter les séances</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Format CSV compatible Excel</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => downloadCSV(toCSV(seances), 'seances-napocrm.csv')} style={exportBtnStyle('#0F6E56', '#E1F5EE')}>
                <i className="ti ti-table-export" style={{ fontSize: 15 }} /> Exporter tout ({seances.length} séances)
              </button>
              <button onClick={() => { const m = seances.filter(s => (s.date_seance||'').startsWith(currentMonth)); downloadCSV(toCSV(m), `seances-${currentMonth}.csv`) }} style={exportBtnStyle('#185FA5', '#E6F1FB')}>
                <i className="ti ti-calendar-down" style={{ fontSize: 15 }} /> Exporter ce mois ({seancesMois.length} séances)
              </button>
            </div>
          </div>

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
            <button onClick={() => importRef.current.click()} style={exportBtnStyle('#534AB7', '#EEEDFE')}>
              <i className="ti ti-file-upload" style={{ fontSize: 15 }} /> Choisir un fichier CSV
            </button>
          </div>

          <div style={{ padding: '22px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Les séances créées depuis l'onglet "Nouvelle séance" sont sauvegardées directement en base. Ce bouton synchronise les données importées via CSV.
              </div>
              <button onClick={handleSave} disabled={saving} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: 'none', background: '#854F0B', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? .7 : 1 }}>
                <i className="ti ti-cloud-upload" style={{ fontSize: 16 }} />
                {saving ? 'Sync…' : 'Synchroniser CSV'}
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

      {/* ── Modal détail séance ── */}
      {detail && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && !editingDetail && setDetail(null)}
        >
          <div style={{ background: 'var(--color-background-primary)', borderRadius: 16, width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

            {/* En-tête */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              {editingDetail ? (
                <div style={{ display: 'flex', gap: 8, flex: 1, marginRight: 12 }}>
                  <input value={editForm.prenom} onChange={e => setEditForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Prénom" style={{ ...mInp, flex: 1, fontSize: 15, fontWeight: 600 }} />
                  <input value={editForm.nom}    onChange={e => setEditForm(f => ({ ...f, nom:    e.target.value }))} placeholder="Nom"    style={{ ...mInp, flex: 1, fontSize: 15, fontWeight: 600 }} />
                </div>
              ) : (
                <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-text-primary)' }}>{clientName(detail)}</div>
              )}
              <button onClick={() => { setDetail(null); setEditingDetail(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-secondary)' }}>×</button>
            </div>

            {/* Badge type */}
            {editingDetail ? (
              <select value={editForm.type_seance} onChange={e => setEditForm(f => ({ ...f, type_seance: e.target.value }))}
                style={{ ...mInp, fontSize: 11, fontWeight: 600, marginBottom: 18, width: 'auto' }}>
                {TYPES.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (() => {
              const tc = TYPE_COLOR[detail.type_seance] || TYPE_COLOR['Autre']
              return <span style={{ fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.color, padding: '4px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 18 }}>{detail.type_seance}</span>
            })()}

            {/* Champs séance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              {editingDetail ? (
                <>
                  <MField label="Date">        <input type="date"   value={editForm.date_seance}   onChange={e => setEditForm(f => ({ ...f, date_seance:   e.target.value }))} style={mInp} /></MField>
                  <MField label="Heure">       <input type="time"   value={editForm.heure_seance}  onChange={e => setEditForm(f => ({ ...f, heure_seance:  e.target.value }))} style={mInp} /></MField>
                  <MField label="Durée (min)"> <input type="number" value={editForm.duree_minutes} onChange={e => setEditForm(f => ({ ...f, duree_minutes: e.target.value }))} min={1} style={mInp} /></MField>
                  <MField label="Prix (€)">    <input type="number" value={editForm.prix_euros}    onChange={e => setEditForm(f => ({ ...f, prix_euros:    e.target.value }))} min={0} style={mInp} /></MField>
                </>
              ) : (
                <>
                  <InfoRow label="Date"  value={fmtDate(detail.date_seance)} />
                  <InfoRow label="Heure" value={detail.heure_seance || '—'} />
                  <InfoRow label="Durée" value={`${detail.duree_minutes} min`} />
                  <InfoRow label="Prix"  value={fmt(detail.prix_euros)} />
                </>
              )}
            </div>

            {/* Tags */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Tags</div>
              {editingDetail ? (
                <input value={editForm.tags} onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="Stress, Sommeil, Anxiété…" style={mInp} />
              ) : (
                (detail.tags || []).length > 0
                  ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {detail.tags.map(t => (
                        <span key={t} style={{ fontSize: 12, background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', padding: '3px 9px', borderRadius: 20, border: '0.5px solid var(--color-border-tertiary)' }}>{t}</span>
                      ))}
                    </div>
                  : <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>—</span>
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
                    style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <i className="ti ti-check" style={{ marginRight: 5 }} />Sauvegarder les modifications
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => deleteSeance(detail.id)}
                    style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid #FBEAF0', background: 'transparent', color: '#993556', cursor: 'pointer', fontSize: 13 }}>
                    <i className="ti ti-trash" style={{ marginRight: 5 }} />Supprimer
                  </button>
                  <button onClick={() => openEdit(detail)}
                    style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 13 }}>
                    <i className="ti ti-pencil" style={{ marginRight: 5 }} />Modifier
                  </button>
                  <button onClick={() => downloadCSV(toCSV([detail]), `seance-${detail.prenom}-${detail.date_seance}.csv`)}
                    style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 13 }}>
                    <i className="ti ti-download" />
                  </button>
                  <button onClick={() => setDetail(null)}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
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

// ── Composants utilitaires ─────────────────────────────────────────────────

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

function Sel({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, cursor: 'pointer' }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{value}</div>
    </div>
  )
}

function exportBtnStyle(color, bg) {
  return { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', borderRadius: 8, border: `0.5px solid ${color}44`, background: bg, color, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }

function MField({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}

const mInp = { width: '100%', padding: '6px 10px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }
