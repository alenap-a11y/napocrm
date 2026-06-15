const CATEGORIES = ['Séance', 'Suivi', 'Bilan', 'Fleurs de Bach', 'Perso', 'Autre']

export default function NoteForm({ value, onChange, onSave, onCancel }) {
  const f = k => e => onChange(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        <input value={value.titre} onChange={f('titre')} placeholder="Titre"
          style={{ fontSize: 15, fontWeight: 600, width: '100%', padding: '5px 8px', borderRadius: 6,
                   border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)',
                   color: 'var(--color-text-primary)', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={value.client_nom} onChange={f('client_nom')} placeholder="Client"
            style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)',
                     background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 12 }} />
          <select value={value.categorie} onChange={f('categorie')}
            style={{ padding: '5px 8px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)',
                     background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 12, cursor: 'pointer' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" value={value.date_note} onChange={f('date_note')}
            style={{ padding: '5px 8px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)',
                     background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 12 }} />
        </div>
      </div>

      <textarea value={value.contenu} onChange={f('contenu')}
        onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onSave() }}
        onFocus={e => { const end = e.target.value.length; e.target.setSelectionRange(end, end) }}
        placeholder="Contenu de la note…" autoFocus
        style={{ flex: 1, padding: '20px 22px', fontSize: 13, color: 'var(--color-text-primary)',
                 lineHeight: 1.9, fontFamily: 'inherit', border: 'none', outline: 'none',
                 resize: 'none', background: 'var(--color-background-primary)' }} />

      <div style={{ padding: '10px 22px', borderTop: '0.5px solid var(--color-border-tertiary)',
                    display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', flex: 1 }}>
          Ctrl+Entrée pour sauvegarder
        </span>
        <button onClick={onCancel}
          style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)',
                   background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 12 }}>
          Annuler
        </button>
        <button onClick={onSave}
          style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--color-accent)',
                   color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          <i className="ti ti-check" style={{ marginRight: 4 }} />Sauvegarder
        </button>
      </div>
    </div>
  )
}
