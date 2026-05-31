import { useState, useRef } from 'react'

const CLIENTS = [
  'Marie Joubert', 'Pierre Laurent', 'Sophie Caron',
  'Anne Bernard', 'Jean Dupont', 'Lucie Martin', 'Thomas Renard', 'Camille Faure',
]

const INITIAL_FACTURES = [
  { id: 1, num: 'FAC-2026-042', client: 'Marie Joubert',  date: '2026-05-20', echeance: '2026-06-20', montant: 120, statut: 'payée',     desc: 'Séance sophrologie x2' },
  { id: 2, num: 'FAC-2026-041', client: 'Sophie Caron',   date: '2026-05-18', echeance: '2026-06-18', montant: 180, statut: 'en attente', desc: 'Séance naturopathie x3' },
  { id: 3, num: 'FAC-2026-040', client: 'Pierre Laurent', date: '2026-05-15', echeance: '2026-06-15', montant: 80,  statut: 'payée',     desc: 'Séance coaching x1' },
  { id: 4, num: 'FAC-2026-039', client: 'Anne Bernard',   date: '2026-05-10', echeance: '2026-05-25', montant: 240, statut: 'en retard',  desc: 'Programme soin 4 séances' },
  { id: 5, num: 'FAC-2026-038', client: 'Lucie Martin',   date: '2026-05-08', echeance: '2026-06-08', montant: 60,  statut: 'payée',     desc: 'Consultation initiale' },
  { id: 6, num: 'FAC-2026-037', client: 'Jean Dupont',    date: '2026-05-03', echeance: '2026-06-03', montant: 160, statut: 'en attente', desc: 'Séances Fleurs de Bach x2' },
  { id: 7, num: 'FAC-2026-036', client: 'Thomas Renard',  date: '2026-04-28', echeance: '2026-05-28', montant: 90,  statut: 'en retard',  desc: 'Bilan énergétique' },
  { id: 8, num: 'FAC-2026-035', client: 'Camille Faure',  date: '2026-04-22', echeance: '2026-05-22', montant: 120, statut: 'payée',     desc: 'Séance sophrologie x2' },
  { id: 9, num: 'FAC-2026-034', client: 'Marie Joubert',  date: '2026-04-15', echeance: '2026-05-15', montant: 60,  statut: 'payée',     desc: 'Consultation initiale' },
  { id: 10, num: 'FAC-2026-033', client: 'Sophie Caron',  date: '2026-04-10', echeance: '2026-05-10', montant: 200, statut: 'payée',     desc: 'Programme soin 4 séances' },
]

const STATUT_STYLE = {
  'payée':      { bg: '#EAF3DE', color: '#3B6D11', label: 'Payée' },
  'en attente': { bg: '#FAEEDA', color: '#854F0B', label: 'En attente' },
  'en retard':  { bg: '#FBEAF0', color: '#993556', label: 'En retard' },
}

function nextNum(factures) {
  const max = factures.reduce((m, f) => {
    const n = parseInt(f.num.split('-')[2]) || 0
    return n > m ? n : m
  }, 0)
  return `FAC-2026-${String(max + 1).padStart(3, '0')}`
}

function toCSV(factures) {
  const header = 'Numéro,Client,Date,Échéance,Montant (€),Statut,Description'
  const rows = factures.map(f =>
    `${f.num},"${f.client}",${f.date},${f.echeance},${f.montant},${f.statut},"${f.desc}"`
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
    const clean = cols.map(c => c.replace(/^"|"$/g, '').trim())
    return {
      id: Date.now() + i,
      num: clean[0] || '',
      client: clean[1] || '',
      date: clean[2] || '',
      echeance: clean[3] || '',
      montant: parseFloat(clean[4]) || 0,
      statut: clean[5] || 'en attente',
      desc: clean[6] || '',
    }
  }).filter(f => f.num)
}

const EMPTY_FORM = { client: CLIENTS[0], date: new Date().toISOString().slice(0, 10), echeance: '', montant: '', desc: '', statut: 'en attente' }

export default function Factures() {
  const [factures, setFactures] = useState(INITIAL_FACTURES)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [filterClient, setFilterClient] = useState('tous')
  const [modal, setModal] = useState(null) // null | 'new' | facture
  const [form, setForm] = useState(EMPTY_FORM)
  const [importMsg, setImportMsg] = useState('')
  const importRef = useRef()

  const filtered = factures.filter(f => {
    const q = search.toLowerCase()
    const matchSearch = !q || f.num.toLowerCase().includes(q) || f.client.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q)
    const matchStatut = filterStatut === 'tous' || f.statut === filterStatut
    const matchClient = filterClient === 'tous' || f.client === filterClient
    return matchSearch && matchStatut && matchClient
  })

  const totalPayee = factures.filter(f => f.statut === 'payée').reduce((s, f) => s + f.montant, 0)
  const totalAttente = factures.filter(f => f.statut === 'en attente').reduce((s, f) => s + f.montant, 0)
  const totalRetard = factures.filter(f => f.statut === 'en retard').reduce((s, f) => s + f.montant, 0)

  function openNew() {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) })
    setModal('new')
  }

  function saveNew() {
    if (!form.montant || !form.desc) return
    const echeance = form.echeance || new Date(new Date(form.date).getTime() + 30 * 86400000).toISOString().slice(0, 10)
    setFactures(prev => [{ id: Date.now(), num: nextNum(prev), ...form, echeance, montant: parseFloat(form.montant) }, ...prev])
    setModal(null)
  }

  function deleteFacture(id) {
    setFactures(prev => prev.filter(f => f.id !== id))
    setModal(null)
  }

  function toggleStatut(f) {
    const order = ['en attente', 'payée', 'en retard']
    const next = order[(order.indexOf(f.statut) + 1) % order.length]
    setFactures(prev => prev.map(x => x.id === f.id ? { ...x, statut: next } : x))
    if (modal && modal.id === f.id) setModal({ ...modal, statut: next })
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const imported = parseCSV(ev.target.result)
      if (imported.length === 0) { setImportMsg('Fichier invalide ou vide.'); return }
      setFactures(prev => [...imported, ...prev])
      setImportMsg(`${imported.length} facture(s) importée(s).`)
      setTimeout(() => setImportMsg(''), 3000)
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  const fmt = n => n.toFixed(2).replace('.', ',') + ' €'
  const fmtDate = d => d ? d.split('-').reverse().join('/') : '—'

  return (
    <div style={{ padding: '1.6rem 2rem', fontFamily: 'inherit' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="ti ti-file-invoice" style={{ fontSize: 24, color: 'var(--color-accent)' }} aria-hidden="true" />
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>Factures</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{factures.length} factures · exercice 2026</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
          <Btn icon="ti-upload" label="Importer" onClick={() => importRef.current.click()} secondary />
          <Btn icon="ti-download" label="Exporter CSV" onClick={() => downloadCSV(toCSV(factures), 'factures-napocrm.csv')} secondary />
          <Btn icon="ti-plus" label="Nouvelle facture" onClick={openNew} />
        </div>
      </div>

      {importMsg && (
        <div style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 8, background: '#EAF3DE', color: '#3B6D11', fontSize: 13 }}>
          <i className="ti ti-check" style={{ marginRight: 6 }} />{importMsg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
        <StatCard icon="ti-check" iconBg="#EAF3DE" iconColor="#3B6D11" label="Encaissé" value={fmt(totalPayee)} sub={`${factures.filter(f => f.statut === 'payée').length} factures`} />
        <StatCard icon="ti-clock" iconBg="#FAEEDA" iconColor="#854F0B" label="En attente" value={fmt(totalAttente)} sub={`${factures.filter(f => f.statut === 'en attente').length} factures`} />
        <StatCard icon="ti-alert-triangle" iconBg="#FBEAF0" iconColor="#993556" label="En retard" value={fmt(totalRetard)} sub={`${factures.filter(f => f.statut === 'en retard').length} factures`} />
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher n°, client, description…"
            style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>
        <Select value={filterStatut} onChange={setFilterStatut} options={[['tous','Tous les statuts'],['payée','Payée'],['en attente','En attente'],['en retard','En retard']]} />
        <Select value={filterClient} onChange={setFilterClient} options={[['tous','Tous les clients'], ...CLIENTS.map(c => [c,c])]} />
      </div>

      {/* Tableau */}
      <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, overflow: 'hidden', border: '0.5px solid var(--color-border-tertiary)' }}>
        {/* Header tableau */}
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 100px 100px 110px 120px 70px', gap: 0, borderBottom: '0.5px solid var(--color-border-tertiary)', padding: '8px 16px' }}>
          {['N° Facture','Client','Date','Échéance','Montant','Statut',''].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: i === 4 ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
            <i className="ti ti-file-off" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
            Aucune facture trouvée
          </div>
        ) : filtered.map((f, idx) => {
          const s = STATUT_STYLE[f.statut]
          return (
            <div
              key={f.id}
              onClick={() => setModal(f)}
              style={{
                display: 'grid', gridTemplateColumns: '140px 1fr 100px 100px 110px 120px 70px',
                gap: 0, padding: '11px 16px', alignItems: 'center', cursor: 'pointer',
                borderBottom: idx < filtered.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none',
                transition: 'background .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-primary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>{f.num}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{f.client}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>{f.desc}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{fmtDate(f.date)}</div>
              <div style={{ fontSize: 12, color: f.statut === 'en retard' ? '#993556' : 'var(--color-text-secondary)' }}>{fmtDate(f.echeance)}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', textAlign: 'right' }}>{fmt(f.montant)}</div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, padding: '3px 9px', borderRadius: 20 }}>{s.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={e => { e.stopPropagation(); downloadCSV(toCSV([f]), `${f.num}.csv`) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4, borderRadius: 6 }}
                  title="Exporter"
                >
                  <i className="ti ti-download" style={{ fontSize: 15 }} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total filtré */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, fontSize: 13, color: 'var(--color-text-secondary)', gap: 6 }}>
          <span>{filtered.length} facture(s)</span>
          <span>·</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Total : {fmt(filtered.reduce((s, f) => s + f.montant, 0))}
          </span>
        </div>
      )}

      {/* Modal détail / nouvelle facture */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && setModal(null)}
        >
          <div style={{ background: 'var(--color-background-primary)', borderRadius: 16, width: 480, maxWidth: '95vw', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

            {modal === 'new' ? (
              <>
                <ModalHead title="Nouvelle facture" onClose={() => setModal(null)} />
                <Field label="Client">
                  <Select value={form.client} onChange={v => setForm(f => ({ ...f, client: v }))} options={CLIENTS.map(c => [c, c])} full />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Date d'émission">
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                  </Field>
                  <Field label="Date d'échéance">
                    <input type="date" value={form.echeance} onChange={e => setForm(f => ({ ...f, echeance: e.target.value }))} style={inputStyle} />
                  </Field>
                </div>
                <Field label="Montant (€)">
                  <input type="number" min="0" step="0.01" placeholder="0,00" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} style={inputStyle} />
                </Field>
                <Field label="Description">
                  <input type="text" placeholder="ex : Séance sophrologie x2" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} style={inputStyle} />
                </Field>
                <Field label="Statut">
                  <Select value={form.statut} onChange={v => setForm(f => ({ ...f, statut: v }))} options={[['en attente','En attente'],['payée','Payée'],['en retard','En retard']]} full />
                </Field>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button onClick={() => setModal(null)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 13 }}>Annuler</button>
                  <button onClick={saveNew} style={{ flex: 2, padding: '9px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Créer la facture</button>
                </div>
              </>
            ) : (
              <>
                <ModalHead title={modal.num} onClose={() => setModal(null)} />
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, background: STATUT_STYLE[modal.statut].bg, color: STATUT_STYLE[modal.statut].color, padding: '4px 10px', borderRadius: 20 }}>
                    {STATUT_STYLE[modal.statut].label}
                  </span>
                </div>
                <InfoRow label="Client" value={modal.client} />
                <InfoRow label="Description" value={modal.desc} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <InfoRow label="Date d'émission" value={fmtDate(modal.date)} />
                  <InfoRow label="Échéance" value={fmtDate(modal.echeance)} />
                </div>
                <InfoRow label="Montant" value={<span style={{ fontSize: 22, fontWeight: 600 }}>{fmt(modal.montant)}</span>} />
                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                  <button onClick={() => deleteFacture(modal.id)} style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid #FBEAF0', background: 'transparent', color: '#993556', cursor: 'pointer', fontSize: 13 }}>
                    <i className="ti ti-trash" style={{ marginRight: 5 }} />Supprimer
                  </button>
                  <button onClick={() => toggleStatut(modal)} style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 13 }}>
                    Changer statut
                  </button>
                  <button onClick={() => downloadCSV(toCSV([modal]), `${modal.num}.csv`)} style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <i className="ti ti-download" style={{ marginRight: 5 }} />Exporter
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Composants utilitaires ─────────────────────────────────────── */

function Btn({ icon, label, onClick, secondary }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
      border: secondary ? '0.5px solid var(--color-border-secondary)' : 'none',
      background: secondary ? 'transparent' : 'var(--color-accent)',
      color: secondary ? 'var(--color-text-primary)' : '#fff',
    }}>
      <i className={`ti ${icon}`} style={{ fontSize: 15 }} />{label}
    </button>
  )
}

function StatCard({ icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 20, color: iconColor }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3 }}>{sub}</div>
      </div>
    </div>
  )
}

function Select({ value, onChange, options, full }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      padding: '7px 10px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)',
      background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)',
      fontSize: 13, cursor: 'pointer', width: full ? '100%' : 'auto',
    }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{value}</div>
    </div>
  )
}

function ModalHead({ title, onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 18 }}>
        <i className="ti ti-x" />
      </button>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: '0.5px solid var(--color-border-secondary)',
  background: 'var(--color-background-secondary)',
  color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box',
}
