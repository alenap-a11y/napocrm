import { useState } from 'react'
import { useNotes } from '../hooks/useNotes'
import NoteModal from './NoteModal'

export default function NotesDuJour({ date }) {
  const { notes, loading, updateNote, deleteNote } = useNotes({ date })
  const [selectedNote, setSelectedNote] = useState(null)

  if (loading || notes.length === 0) return null

  return (
    <>
      <div className="notes-du-jour">
        {notes.map(n => (
          <div key={n.id} className="note-chip" onClick={() => setSelectedNote(n)} style={{ cursor: 'pointer' }}>
            📝 {n.titre || n.contenu.slice(0, 40)}
          </div>
        ))}
      </div>
      {selectedNote && (
        <NoteModal
          note={selectedNote}
          onUpdate={updateNote}
          onDelete={deleteNote}
          onClose={() => setSelectedNote(null)}
        />
      )}
    </>
  )
}
