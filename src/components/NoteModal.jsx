import { useState } from 'react'
import { createPortal } from 'react-dom'
import NoteForm from './NoteForm'

export default function NoteModal({ note, onUpdate, onDelete, onClose }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    titre:      note.titre      || '',
    client_nom: note.client_nom || '',
    categorie:  note.categorie  || 'Autre',
    date_note:  note.date_note  || '',
    contenu:    note.contenu    || '',
  })

  async function handleSave() {
    await onUpdate(note.id, { ...form })
    onClose()
  }

  async function handleDelete() {
    await onDelete(note.id)
    onClose()
  }

  return createPortal(
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
               display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: 16,
                    width: 520, maxWidth: '95vw', maxHeight: '90vh',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '16px 20px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {editing ? 'Modifier la note' : 'Détail de la note'}
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
                     fontSize: 22, color: 'var(--color-text-secondary)', lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {editing ? (
          <NoteForm value={form} onChange={setForm} onSave={handleSave} onCancel={() => setEditing(false)} />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                {note.categorie && (
                  <span style={{ fontSize: 11, fontWeight: 600, background: '#F5F5F5',
                                 color: '#6B7280', padding: '2px 8px', borderRadius: 20 }}>
                    {note.categorie}
                  </span>
                )}
                {note.date_note && (
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{note.date_note}</span>
                )}
              </div>
              {note.titre && (
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 12 }}>
                  {note.titre}
                </div>
              )}
              <div style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {note.contenu}
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '0.5px solid var(--color-border-tertiary)',
                          display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={handleDelete}
                style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid #FBEAF0',
                         background: 'transparent', color: '#993556', fontSize: 13, cursor: 'pointer' }}>
                Supprimer
              </button>
              <button onClick={() => setEditing(true)}
                style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: 'none',
                         background: 'var(--color-accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Modifier
              </button>
              <button onClick={onClose}
                style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)',
                         background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
