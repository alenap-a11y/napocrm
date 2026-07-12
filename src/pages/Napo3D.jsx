import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeancesSync } from '../hooks/useSeancesSync'

const MOIS_COURT = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']

const AVATAR_COLORS = ['#534AB7', '#185FA5', '#0F6E56', '#854F0B', '#993556', '#7F3FBF']
function avatarColor(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, j] = d.slice(0, 10).split('-')
  return `${parseInt(j)} ${MOIS_COURT[parseInt(m) - 1]} ${y}`
}

function clientName(s) {
  return `${s.prenom || ''} ${s.nom || ''}`.trim() || 'Client non renseigné'
}

function initials(s) {
  return `${(s.prenom || '?')[0]}${(s.nom || '?')[0]}`.toLowerCase()
}

export default function Napo3D() {
  const navigate = useNavigate()
  const { seances, loading } = useSeancesSync()

  const [activeTab, setActiveTab] = useState('liste')
  const [search, setSearch]       = useState('')

  const seances3D = (seances || []).filter(s => s.type_seance === '3D Humain')
    .sort((a, b) => (b.date_seance || '').localeCompare(a.date_seance || ''))

  const numeroParClient = {}
  const withNumero = [...seances3D].reverse().map(s => {
    const key = s.client_id || `${s.prenom}-${s.nom}`
    numeroParClient[key] = (numeroParClient[key] || 0) + 1
    return { ...s, numero: numeroParClient[key] }
  }).reverse()

  const now = new Date()
  const isThisMonth = d => {
    if (!d) return false
    const [y, m] = d.slice(0, 10).split('-')
    return parseInt(y) === now.getFullYear() && parseInt(m) - 1 === now.getMonth()
  }

  const clientsUniques = new Set(seances3D.map(s => s.client_id || `${s.prenom}-${s.nom}`)).size
  const ceMois          = seances3D.filter(s => isThisMonth(s.date_seance)).length
  const dureeMoyenne     = seances3D.length
    ? Math.round(seances3D.reduce((sum, s) => sum + (parseInt(s.duree_minutes) || 0), 0) / seances3D.length)
    : 0

  const filtered = withNumero.filter(s => {
    const q = search.toLowerCase()
    return !q || clientName(s).toLowerCase().includes(q)
  })

  return (
    <div style={{ padding: '1.6rem 2rem', fontFamily: 'inherit' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="ti ti-3d-cube-sphere" style={{ fontSize: 24, color: 'var(--color-accent)' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>Napo-3D</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{seances3D.length} séance(s) enregistrée(s)</div>
          </div>
        </div>
        <button
          onClick={() => navigate('/napo-3d/nouvelle?type=3D%20Humain')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff', background: 'var(--color-accent)' }}
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} />Nouvelle séance
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        <StatCard icon="ti-3d-cube-sphere" iconBg="#EEEDFE" iconColor="#534AB7" label="Total séances"   value={seances3D.length} />
        <StatCard icon="ti-users"          iconBg="#E6F1FB" iconColor="#185FA5" label="Clients suivis"   value={clientsUniques} />
        <StatCard icon="ti-calendar-stats" iconBg="#E1F5EE" iconColor="#0F6E56" label="Ce mois"          value={ceMois} />
        <StatCard icon="ti-clock"          iconBg="#FAEEDA" iconColor="#854F0B" label="Durée moyenne"    value={`${dureeMoyenne} min`} />
      </div>

      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--color-border-tertiary)', marginBottom: 16 }}>
        {[['liste', 'Liste des séances', 'ti-list'], ['nouvelle', 'Nouvelle séance', 'ti-plus']].map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => id === 'nouvelle' ? navigate('/napo-3d/nouvelle?type=3D%20Humain') : setActiveTab(id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === id ? 600 : 400, color: activeTab === id ? 'var(--color-accent)' : 'var(--color-text-secondary)', borderBottom: activeTab === id ? '2px solid var(--color-accent)' : '2px solid transparent', marginBottom: -1 }}
          >
            <i className={`ti ${icon}`} style={{ fontSize: 14 }} />{label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: 14 }}>
        <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un client…"
          style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, overflow: 'hidden', border: '0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px 90px 36px', padding: '8px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          {['Client', 'Date', 'Séance N°', 'Durée', ''].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</div>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
            <i className="ti ti-3d-cube-sphere" style={{ fontSize: 28, display: 'block', marginBottom: 8, opacity: 0.4 }} />
            Aucune séance 3D trouvée
          </div>
        ) : filtered.map((s, idx) => {
          const name = clientName(s)
          const col  = avatarColor(name)
          return (
            <div
              key={s.id}
              onClick={() => navigate(`/napo-3d/seance/${s.id}`)}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px 90px 36px', padding: '11px 16px', alignItems: 'center', cursor: 'pointer', borderBottom: idx < filtered.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-primary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${col}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: col }}>{initials(s)}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{name}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{fmtDate(s.date_seance)}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>#{s.numero}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{s.duree_minutes ? `${s.duree_minutes} min` : '—'}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <i className="ti ti-chevron-right" style={{ fontSize: 14, color: 'var(--color-text-secondary)' }} />
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {filtered.length} séance(s) affichée(s)
        </div>
      )}
    </div>
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
