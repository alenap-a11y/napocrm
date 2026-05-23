const LS_KEY = 'napo_font_size'
const MIN = 80
const MAX = 150
const STEP = 10

export default function Reglages({ fs, setFs, accent }) {
  function change(next) {
    const val = Math.min(MAX, Math.max(MIN, next))
    setFs(val)
    document.documentElement.style.fontSize = `${val}%`
    localStorage.setItem(LS_KEY, String(val))
  }

  function reset() {
    change(100)
  }

  return (
    <div className="simple-page">
      <div className="sp-title">
        <i className="ti ti-settings" style={{ color: accent }} aria-hidden="true" />
        Réglages
      </div>

      <div className="recent-block">
        <div className="rb-title">Accessibilité</div>

        <div className="prow" style={{ paddingTop: 10, paddingBottom: 10 }}>
          <div className="pico" style={{ background: '#E6F1FB' }}>
            <i className="ti ti-typography" style={{ color: '#185FA5' }} aria-hidden="true" />
          </div>
          <div className="ptxt">
            <div className="plbl">Taille de police</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              De {MIN}% à {MAX}%, par pas de {STEP}%
            </div>
          </div>
          <div className="fsc">
            <button
              className="fsb"
              onClick={() => change(fs - STEP)}
              disabled={fs <= MIN}
              aria-label="Réduire la police"
            >−</button>
            <span className="fsv" style={{ minWidth: 36, textAlign: 'center', fontWeight: 500 }}>
              {fs}%
            </span>
            <button
              className="fsb"
              onClick={() => change(fs + STEP)}
              disabled={fs >= MAX}
              aria-label="Agrandir la police"
            >+</button>
          </div>
        </div>

        <div className="prow" style={{ paddingTop: 10, paddingBottom: 10 }}>
          <div className="pico" style={{ background: '#f1efe8' }}>
            <i className="ti ti-refresh" style={{ color: '#5F5E5A' }} aria-hidden="true" />
          </div>
          <div className="ptxt">
            <div className="plbl">Réinitialiser</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Remet la taille à 100%
            </div>
          </div>
          <button className="rst-btn" onClick={reset}>Reset</button>
        </div>
      </div>
    </div>
  )
}
