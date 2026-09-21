// Pourquoi : un seul champ durée pour tous les modules. On stocke toujours des minutes entières
// (duree_minutes) : seul l'affichage change, donc agenda et stats ne bougent pas.
// `presets` (optionnel) : raccourcis en un clic pour les écrans de création de RDV/séance.
const MIN_TOTAL = 5      // 0 min serait remplacé par 60 dans les handleSave existants
const MAX_TOTAL = 24 * 60

function libelle(t) {
  const h = Math.floor(t / 60)
  const m = t % 60
  if (h === 0) return `${m} min`
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

export default function DureeInput({ value, onChange, style, presets }) {
  const total = Math.min(MAX_TOTAL, Math.max(0, parseInt(value, 10) || 0))
  const h = Math.floor(total / 60)
  const m = total % 60

  function set(nh, nm) {
    let t = nh * 60 + nm
    if (nh >= 24) t = MAX_TOTAL
    if (t < MIN_TOTAL) t = MIN_TOTAL
    onChange(t)
  }

  const heures = Array.from({ length: 25 }, (_, i) => i)
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5)
  if (!minutes.includes(m)) minutes.push(m)
  minutes.sort((a, b) => a - b)

  const sel = { padding:'4px 6px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'transparent', color:'var(--color-text-primary)', fontSize:12, fontFamily:'inherit', ...style }

  return (
    <span style={{ display:'inline-flex', flexDirection:'column', gap:6 }}>
      <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
        <select value={h} onChange={e => set(parseInt(e.target.value, 10), h >= 24 ? 0 : m)} style={sel} aria-label="Heures">
          {heures.map(x => <option key={x} value={x}>{x} h</option>)}
        </select>
        <select value={h >= 24 ? 0 : m} disabled={h >= 24} onChange={e => set(h, parseInt(e.target.value, 10))} style={sel} aria-label="Minutes">
          {minutes.map(x => <option key={x} value={x}>{String(x).padStart(2, '0')} min</option>)}
        </select>
      </span>
      {Array.isArray(presets) && presets.length > 0 && (
        <span style={{ display:'inline-flex', flexWrap:'wrap', gap:4 }}>
          {presets.map(p => (
            <button key={p} type="button" onClick={() => onChange(p)}
              style={{ fontSize:11, padding:'3px 8px', borderRadius:6, cursor:'pointer',
                border:'0.5px solid var(--color-border-secondary)',
                background: p === total ? 'var(--color-accent)' : 'var(--color-background-primary)',
                color: p === total ? '#fff' : 'var(--color-text-secondary)' }}>
              {libelle(p)}
            </button>
          ))}
        </span>
      )}
    </span>
  )
}
