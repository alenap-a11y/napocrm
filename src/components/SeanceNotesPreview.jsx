import { useNotes } from '../hooks/useNotes';

export default function SeanceNotesPreview({ seanceId }) {
  const { notes, loading } = useNotes({ seanceId });
  if (loading || notes.length === 0) return null;
  return (
    <div className="notes-preview">
      {notes.map(n => (
        <p key={n.id}>📝 {n.titre ? `${n.titre} — ` : ''}{n.contenu.slice(0, 60)}...</p>
      ))}
    </div>
  );
}
