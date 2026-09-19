import { Link } from 'react-router-dom'

function IconUser() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" />
    </svg>
  )
}

function IconBriefcase() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  )
}

function IconUserPlus() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="4" />
      <path d="M2 20c0-3.5 3.5-6 8-6s8 2.5 8 6" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  )
}

function IconSparkle() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  )
}

function AccesCard({ to, dark, badge, icon, eyebrow, title }) {
  return (
    <Link
      to={to}
      className="flex flex-col justify-between rounded-2xl p-6 no-underline transition-transform duration-150 hover:-translate-y-0.5"
      style={{
        background: dark ? '#141413' : '#fff',
        border: dark ? 'none' : '1px solid #EAE2CD',
        minHeight: 168,
      }}
    >
      <div className="flex items-start justify-between">
        <div style={{ color: dark ? '#fff' : '#141413' }}>{icon}</div>
        {badge && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide"
            style={{ background: 'rgba(30,149,193,0.15)', color: '#1E95C1' }}
          >
            {badge}
          </span>
        )}
      </div>
      <div>
        <div
          className="font-clientSans text-xs font-medium mb-1 uppercase tracking-wide"
          style={{ color: dark ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}
        >
          {eyebrow}
        </div>
        <div
          className="font-clientSerif text-2xl font-semibold"
          style={{ color: dark ? '#fff' : '#141413' }}
        >
          {title}
        </div>
      </div>
    </Link>
  )
}

export default function AccesPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ background: '#F5F0E8' }}
    >
      <div className="text-center mb-10">
        <h1 className="font-clientSerif font-semibold" style={{ fontSize: 34, color: '#141413' }}>
          Qui êtes-vous ?
        </h1>
        <p className="font-clientSans text-sm mt-2" style={{ color: '#6b7280' }}>
          Choisissez votre espace pour continuer
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <AccesCard to="/client" icon={<IconUser />} eyebrow="Se connecter" title="Espace client" />
        <AccesCard to="/login" icon={<IconBriefcase />} eyebrow="Se connecter" title="Espace praticien" />
        <AccesCard to="/client/inscription" icon={<IconUserPlus />} eyebrow="Création de compte" title="Client" />
        <AccesCard
          to="/accueil?modal=alpha"
          dark
          badge="ALPHA"
          icon={<IconSparkle />}
          eyebrow="Création de compte"
          title="Praticien"
        />
      </div>
    </div>
  )
}
