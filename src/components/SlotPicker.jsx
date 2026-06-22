import { useMemo } from 'react'

// "HH:MM" ou "HH:MM:SS" → minutes depuis minuit
function toMin(hhmm) {
  if (!hhmm) return 0
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

/*
 * Props :
 *   value       — créneau sélectionné "HH:MM"
 *   onChange(v) — appelé avec le nouveau créneau
 *   duree       — durée en minutes (int ou string) de la séance à placer
 *   seancesJour — [{id, heure_seance, duree_minutes}] du même jour
 *   loading     — true pendant le fetch
 *   excludeId   — uuid à exclure du calcul de conflit (édition d'une séance existante)
 */
export default function SlotPicker({
  value, onChange, duree, seancesJour = [], loading = false, excludeId = null,
}) {
  const dureeMins = parseInt(duree, 10) || 60

  const slots = useMemo(() => {
    const out = []
    for (let min = 8 * 60; min + dureeMins <= 20 * 60; min += 15) {
      const label = `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
      const busy = seancesJour.some(s => {
        if (excludeId && s.id === excludeId) return false
        const sStart = toMin(s.heure_seance)
        const sEnd   = sStart + (s.duree_minutes || 60)
        return min < sEnd && min + dureeMins > sStart
      })
      out.push({ label, busy })
    }
    return out
  }, [dureeMins, seancesJour, excludeId])

  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 3, background: '#fff',
      padding: 4, maxHeight: 164, overflowY: 'auto',
      opacity: loading ? 0.5 : 1, transition: 'opacity .15s',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
        {slots.map(({ label, busy }) => {
          const sel = value === label
          return (
            <button
              key={label}
              type="button"
              disabled={busy}
              onClick={() => onChange(label)}
              style={{
                padding: '4px 0', fontSize: 11, borderRadius: 3, fontFamily: 'inherit',
                border: sel ? '1.5px solid #1a2744' : '1px solid #e5e7eb',
                background: busy ? '#f9fafb' : sel ? '#1a2744' : '#fff',
                color: busy ? '#d1d5db' : sel ? '#fff' : '#374151',
                cursor: busy ? 'not-allowed' : 'pointer',
                fontWeight: sel ? 700 : 400,
                textDecoration: busy ? 'line-through' : 'none',
                transition: 'background .1s, color .1s',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
