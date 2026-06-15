import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useClients } from '../hooks/useClients'
import { insertNotif } from '../lib/notif'


const SPECIALITES = ['Toutes', 'Sophrologie', 'Coaching', 'Naturopathie', 'Fleurs de Bach', 'Énergie', 'Massage', 'Autre']
const STATUTS     = ['Tous', 'actif', 'inactif', 'archivé']

const STATUT_STYLE = {
  actif:    { bg: '#E1F5EE', color: '#0F6E56', label: 'Actif' },
  inactif:  { bg: '#FAEEDA', color: '#854F0B', label: 'Inactif' },
  archivé:  { bg: '#F5F5F5', color: '#6B7280', label: 'Archivé' },
}

const SPEC_COLOR = {
  'Sophrologie':    { bg: '#E6F1FB', color: '#185FA5' },
  'Coaching':       { bg: '#EEEDFE', color: '#534AB7' },
  'Naturopathie':   { bg: '#E1F5EE', color: '#0F6E56' },
  'Fleurs de Bach': { bg: '#F0EBF8', color: '#7F3FBF' },
  'Énergie':        { bg: '#FBEAF0', color: '#993556' },
  'Massage':        { bg: '#FAEEDA', color: '#854F0B' },
  'Autre':          { bg: '#F5F5F5', color: '#6B7280' },
}

/* ─── CSV helpers ─────────────────────────────────────────────────────── */

function toCSV(rows) {
  const header = 'Prénom,Nom,Email,Téléphone,Naissance,Spécialité,Ville,Statut,Séances,Notes'
  const lines  = rows.map(r =>
    `${r.prenom},${r.nom},"${r.email}","${r.tel}","${r.date_naissance}","${r.specialite}","${r.ville}","${r.statut}","${(r.notes||'').replace(/"/g,"'").replace(/\n/g,' ')}"`
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
      prenom:     c[0] || '',
      nom:        c[1] || '',
      email:      c[2] || '',
      tel:        c[3] || '',
      date_naissance: c[4] || '',
      specialite: c[5] || 'Autre',
      ville:      c[6] || '',
      statut:     c[7] || 'actif',
      notes:      c[8] || '',
    }
  }).filter(r => r.prenom || r.nom)
}

/* ─── Utilitaires ─────────────────────────────────────────────────────── */

function age(naissance) {
  if (!naissance) return '—'
  const d = new Date(naissance)
  return Math.floor((Date.now() - d) / 31557600000) + ' ans'
}

function clientName(c) { return `${c.prenom} ${c.nom}`.trim() }

const isoToday = new Date().toISOString().slice(0, 10)

/* ─── Composant principal ─────────────────────────────────────────────── */

export default function Clients() {
  const importRef = useRef()

  const { clients, loading, addClient, updateClient, deleteClient, refresh: refreshClients } = useClients()
  const [activeTab,    setActiveTab]   = useState('liste')
  const [search,       setSearch]      = useState('')
  const [filterSpec,   setFilterSpec]  = useState('Toutes')
  const [filterStatut, setFilterStatut]= useState('Tous')
  const [detail,         setDetail]        = useState(null)
  const [editingDetail,  setEditingDetail]  = useState(false)
  const [editForm,       setEditForm]       = useState(null)
  const [saving,         setSaving]         = useState(false)
  const [saveMsg,        setSaveMsg]        = useState('')
  const [importMsg,      setImportMsg]      = useState('')

  /* Formulaire nouveau client */
  const EMPTY = { prenom: '', nom: '', email: '', tel: '', date_naissance: '', specialite: 'Sophrologie', ville: '', statut: 'actif', nb_seances: 0, notes: '' }
  const [form,    setForm]    = useState(EMPTY)
  const [formMsg, setFormMsg] = useState('')
  const f  = (k) => e => setForm(prev => ({ ...prev, [k]: e.target.value }))
  const ef = (k) => e => setEditForm(prev => ({ ...prev, [k]: e.target.value }))

  /* Filtres */
  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const matchQ = !q || clientName(c).toLowerCase().includes(q) ||
      (c.email||'').toLowerCase().includes(q) || (c.ville||'').toLowerCase().includes(q) ||
      (c.specialite||'').toLowerCase().includes(q)
    const matchS  = filterSpec   === 'Toutes' || c.specialite === filterSpec
    const matchSt = filterStatut === 'Tous'   || c.statut     === filterStatut
    return matchQ && matchS && matchSt
  })

  /* Stats */
  const actifs   = clients.filter(c => c.statut === 'actif').length
  const totalSeances = clients.reduce((s, c) => s + (c.nb_seances || 0), 0)

  /* Sauvegarde Supabase */
  function handleSave() {
    setSaveMsg('✓ Les données sont synchronisées automatiquement.')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  /* Import CSV */
  function handleImport(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const imported = parseCSV(ev.target.result)
      if (!imported.length) { setImportMsg('Fichier invalide.'); return }
      const { data: { user } } = await supabase.auth.getUser()
      const rows = imported.map(({ id, ...r }) => ({ ...r, user_id: user?.id || null }))
      const { error } = await supabase.from('clients').insert(rows)
      if (error) { setImportMsg(`✗ Erreur : ${error.message}`); return }
      await refreshClients()
      setImportMsg(`✓ ${imported.length} client(s) importé(s).`)
      setTimeout(() => setImportMsg(''), 3000)
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  /* Modifier client (modal) */
  function openEdit(c) {
    setEditForm({ prenom: c.prenom||'', nom: c.nom||'', email: c.email||'', tel: c.tel||'', date_naissance: c.date_naissance||'', ville: c.ville||'', specialite: c.specialite||'Sophrologie', statut: c.statut||'actif', nb_seances: c.nb_seances||0, notes: c.notes||'' })
    setEditingDetail(true)
  }

  async function saveEditDetail() {
    const { nb_seances, ...rest } = editForm
    const fields = { ...rest }
    await updateClient(detail.id, fields)
    setDetail(prev => ({ ...prev, ...fields }))
    setEditingDetail(false)
  }

  /* Enregistrer nouveau client */
  async function handleAddClient() {
    if (!form.prenom.trim() || !form.nom.trim()) { setFormMsg('Prénom et nom requis.'); return }
    const { nb_seances, ...clientFields } = form
    await addClient(clientFields)
    insertNotif({ msg: `Nouveau client — ${form.prenom} ${form.nom}`, icon: 'ti-user-plus', iconColor: '#185FA5', bg: '#E6F1FB' })
    setForm(EMPTY)
    setFormMsg('✓ Client ajouté.')
    setTimeout(() => { setFormMsg(''); setActiveTab('liste') }, 1200)
  }

  const TABS = [
    { id: 'liste',    label: 'Liste clients',   icon: 'ti-users' },
    { id: 'nouveau',  label: 'Nouveau client',  icon: 'ti-user-plus' },
    { id: 'export',   label: 'Import / Export', icon: 'ti-arrows-transfer-down' },
  ]

  return (
    <div style={{ padding: '1.6rem 2rem', fontFamily: 'inherit' }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="ti ti-users" style={{ fontSize: 24, color: 'var(--color-accent)' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>Clients</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{clients.length} clients enregistrés</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
          <Btn icon="ti-upload"       label="Importer"       onClick={() => importRef.current.click()} secondary />
          <Btn icon="ti-download"     label="Exporter"       onClick={() => downloadCSV(toCSV(clients), 'clients-napocrm.csv')} secondary />
          <Btn icon="ti-device-floppy" label={saving ? 'Sauvegarde…' : 'Sauvegarder'} onClick={handleSave} secondary />
          <Btn icon="ti-user-plus"    label="Nouveau client" onClick={() => setActiveTab('nouveau')} />
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
        <StatCard icon="ti-users"        iconBg="#E6F1FB" iconColor="#185FA5" label="Total clients"    value={clients.length} />
        <StatCard icon="ti-user-check"   iconBg="#E1F5EE" iconColor="#0F6E56" label="Clients actifs"   value={actifs} />
        <StatCard icon="ti-calendar-stats" iconBg="#EEEDFE" iconColor="#534AB7" label="Total séances" value={totalSeances} />
        <StatCard icon="ti-chart-line"   iconBg="#FAEEDA" iconColor="#854F0B" label="Moy. séances/client" value={clients.length ? (totalSeances / clients.length).toFixed(1) : '0'} />
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

      {/* ═══════════ LISTE CLIENTS ═══════════ */}
      {activeTab === 'liste' && (
        <>
          {/* Filtres */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher nom, email, ville…"
                style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <Sel value={filterSpec}   onChange={setFilterSpec}   options={SPECIALITES.map(s => [s, s])} />
            <Sel value={filterStatut} onChange={setFilterStatut} options={STATUTS.map(s => [s, s === 'Tous' ? 'Tous statuts' : STATUT_STYLE[s]?.label || s])} />
          </div>

          {/* Tableau */}
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, overflow: 'hidden', border: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 140px 120px 70px 80px 80px 36px', padding: '8px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              {['Client', 'Email', 'Spécialité', 'Âge', 'Séances', 'Statut', ''].map((h, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                <i className="ti ti-loader-2" style={{ fontSize: 28, display: 'block', marginBottom: 10, animation: 'spin 1s linear infinite' }} />Chargement…
              </div>
            ) : clients.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                <i className="ti ti-users" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />Aucun client pour le moment
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                <i className="ti ti-users-off" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />Aucun client trouvé
              </div>
            ) : filtered.map((c, idx) => {
              const spec = SPEC_COLOR[c.specialite] || SPEC_COLOR['Autre']
              const stat = STATUT_STYLE[c.statut]   || STATUT_STYLE['inactif']
              return (
                <div key={c.id} onClick={() => setDetail(c)}
                  style={{ display: 'grid', gridTemplateColumns: '1.2fr 140px 120px 70px 80px 80px 36px', padding: '11px 16px', alignItems: 'center', cursor: 'pointer', borderBottom: idx < filtered.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-primary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: spec.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: spec.color }}>{c.prenom[0]}{c.nom[0]}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{clientName(c)}</div>
                      {c.ville && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{c.ville}</div>}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                  <div><span style={{ fontSize: 11, fontWeight: 600, background: spec.bg, color: spec.color, padding: '2px 8px', borderRadius: 20 }}>{c.specialite}</span></div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{age(c.date_naissance)}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.nb_seances}</div>
                  <div><span style={{ fontSize: 11, fontWeight: 600, background: stat.bg, color: stat.color, padding: '2px 8px', borderRadius: 20 }}>{stat.label}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={ev => { ev.stopPropagation(); downloadCSV(toCSV([c]), `client-${c.nom}-${c.prenom}.csv`) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4 }} title="Exporter">
                      <i className="ti ti-download" style={{ fontSize: 14 }} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {filtered.length} client(s) affiché(s)
            </div>
          )}
        </>
      )}

      {/* ═══════════ NOUVEAU CLIENT ═══════════ */}
      {activeTab === 'nouveau' && (
        <div style={{ maxWidth: 600 }}>
          {formMsg && (
            <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: formMsg.startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: formMsg.startsWith('✓') ? '#3B6D11' : '#993556', fontSize: 13 }}>
              {formMsg}
            </div>
          )}
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 14, border: '0.5px solid var(--color-border-tertiary)', padding: '28px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 22 }}>Informations du client</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <Field label="Prénom"><input value={form.prenom} onChange={f('prenom')} placeholder="Sophie" style={inp} /></Field>
              <Field label="Nom"><input value={form.nom} onChange={f('nom')} placeholder="Legrand" style={inp} /></Field>
              <Field label="Email"><input type="email" value={form.email} onChange={f('email')} placeholder="email@exemple.com" style={inp} /></Field>
              <Field label="Téléphone"><input type="tel" value={form.tel} onChange={f('tel')} placeholder="06 00 00 00 00" style={inp} /></Field>
              <Field label="Date de naissance"><input type="date" value={form.date_naissance} onChange={f('date_naissance')} style={inp} /></Field>
              <Field label="Ville"><input value={form.ville} onChange={f('ville')} placeholder="Paris" style={inp} /></Field>
              <Field label="Spécialité suivie">
                <select value={form.specialite} onChange={f('specialite')} style={inp}>
                  {SPECIALITES.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Statut">
                <select value={form.statut} onChange={f('statut')} style={inp}>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="archivé">Archivé</option>
                </select>
              </Field>
            </div>

            <Field label="Notes">
              <textarea value={form.notes} onChange={f('notes')} placeholder="Motif de consultation, antécédents…" rows={3} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
            </Field>

            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
              <button onClick={() => { setForm(EMPTY); setFormMsg('') }} style={{ padding: '9px 18px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 13 }}>
                Réinitialiser
              </button>
              <button onClick={handleAddClient} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <i className="ti ti-user-plus" style={{ marginRight: 6 }} />Enregistrer le client
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
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Exporter les clients</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Format CSV compatible Excel</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Colonnes : Prénom, Nom, Email, Téléphone, Naissance, Spécialité, Ville, Statut, Séances, Notes.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => downloadCSV(toCSV(clients), 'clients-napocrm.csv')} style={xBtn('#0F6E56', '#E1F5EE')}>
                <i className="ti ti-table-export" style={{ fontSize: 15 }} /> Exporter tout ({clients.length} clients)
              </button>
              <button onClick={() => downloadCSV(toCSV(clients.filter(c => c.statut === 'actif')), 'clients-actifs.csv')} style={xBtn('#185FA5', '#E6F1FB')}>
                <i className="ti ti-user-check" style={{ fontSize: 15 }} /> Exporter actifs seulement ({actifs})
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
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Importer des clients</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Fichier CSV (même format export)</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Format attendu : <code style={{ fontSize: 11, background: 'var(--color-background-primary)', padding: '1px 5px', borderRadius: 4 }}>Prénom, Nom, Email, Tél, Naissance, Spécialité, Ville, Statut, Séances, Notes</code>
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
                Sauvegardez tous vos clients dans la base Supabase. Utile après un import CSV ou un ajout manuel.
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

      {/* ── Modal détail client ── */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && !editingDetail && setDetail(null)}>
          <div style={{ background: 'var(--color-background-primary)', borderRadius: 16, width: 520, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

            {/* En-tête */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
              {(() => { const src = editingDetail ? editForm : detail; const sp = SPEC_COLOR[src.specialite] || SPEC_COLOR['Autre']; return (
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: sp.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: sp.color }}>
                    {(src.prenom||'?')[0]}{(src.nom||'?')[0]}
                  </span>
                </div>
              )})()}
              <div style={{ flex: 1 }}>
                {editingDetail ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={editForm.prenom} onChange={ef('prenom')} placeholder="Prénom" style={{ ...mInp, flex: 1, fontSize: 15, fontWeight: 600 }} />
                    <input value={editForm.nom}    onChange={ef('nom')}    placeholder="Nom"    style={{ ...mInp, flex: 1, fontSize: 15, fontWeight: 600 }} />
                  </div>
                ) : (
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)' }}>{clientName(detail)}</div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {editingDetail ? (
                    <>
                      <select value={editForm.specialite} onChange={ef('specialite')} style={{ ...mInp, fontSize: 11, fontWeight: 600, padding: '2px 8px' }}>
                        {SPECIALITES.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select value={editForm.statut} onChange={ef('statut')} style={{ ...mInp, fontSize: 11, fontWeight: 600, padding: '2px 8px' }}>
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                        <option value="archivé">Archivé</option>
                      </select>
                    </>
                  ) : (
                    <>
                      {(() => { const sp = SPEC_COLOR[detail.specialite] || SPEC_COLOR['Autre']; return (
                        <span style={{ fontSize: 11, fontWeight: 600, background: sp.bg, color: sp.color, padding: '2px 8px', borderRadius: 20 }}>{detail.specialite}</span>
                      )})()}
                      {(() => { const st = STATUT_STYLE[detail.statut] || STATUT_STYLE['inactif']; return (
                        <span style={{ fontSize: 11, fontWeight: 600, background: st.bg, color: st.color, padding: '2px 8px', borderRadius: 20 }}>{st.label}</span>
                      )})()}
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => { setDetail(null); setEditingDetail(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-secondary)' }}>×</button>
            </div>

            {/* Infos */}
            {editingDetail ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <MField label="Email">      <input type="email" value={editForm.email}      onChange={ef('email')}      style={mInp} /></MField>
                <MField label="Téléphone">  <input type="tel"   value={editForm.tel}        onChange={ef('tel')}        style={mInp} /></MField>
                <MField label="Naissance">  <input type="date"  value={editForm.date_naissance}  onChange={ef('date_naissance')}  style={mInp} /></MField>
                <MField label="Ville">      <input              value={editForm.ville}      onChange={ef('ville')}      style={mInp} /></MField>
                <MField label="Nb séances"> <input type="number" value={editForm.nb_seances} onChange={ef('nb_seances')} style={mInp} min={0} /></MField>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                {[
                  ['Âge',       age(detail.date_naissance)],
                  ['Séances',   `${detail.nb_seances} séance(s)`],
                  ['Email',     detail.email || '—'],
                  ['Téléphone', detail.tel   || '—'],
                  ['Ville',     detail.ville || '—'],
                  ['Naissance', detail.date_naissance || '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{v}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Notes</div>
              {editingDetail ? (
                <textarea value={editForm.notes} onChange={ef('notes')} placeholder="Observations, antécédents…" rows={3}
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
                  <button onClick={async () => { await deleteClient(detail.id); setDetail(null) }}
                    style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid #FBEAF0', background: 'transparent', color: '#993556', cursor: 'pointer', fontSize: 13 }}>
                    <i className="ti ti-trash" style={{ marginRight: 5 }} />Supprimer
                  </button>
                  <button onClick={() => openEdit(detail)}
                    style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 13 }}>
                    <i className="ti ti-pencil" style={{ marginRight: 5 }} />Modifier
                  </button>
                  <button onClick={() => downloadCSV(toCSV([detail]), `client-${detail.nom}-${detail.prenom}.csv`)}
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

function Sel({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, cursor: 'pointer' }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
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

function MField({ label, children, style }) {
  return (
    <div style={style}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}

const mInp = { width: '100%', padding: '6px 10px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }
