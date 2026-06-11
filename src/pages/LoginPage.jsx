import { useState } from 'react'
import { supabase } from '../lib/supabase'
import napopetit from '../assets/napopetitv1.png'

const FEATURES = [
  {
    icon: 'ti-users',
    title: 'Fiches clients',
    desc: 'Centralisez toutes les informations de vos clients : coordonnées, historique, notes et documents.',
  },
  {
    icon: 'ti-calendar-stats',
    title: 'Suivi des séances',
    desc: 'Enregistrez chaque séance, son contenu, sa durée et son tarif. Suivez la progression de chaque client.',
  },
  {
    icon: 'ti-notebook',
    title: 'Notes',
    desc: 'Prenez des notes libres ou structurées après chaque séance, accessibles en un clic.',
  },
  {
    icon: 'ti-calendar',
    title: 'Agenda',
    desc: 'Visualisez vos rendez-vous à venir, évitez les conflits et planifiez sereinement.',
  },
  {
    icon: 'ti-bell',
    title: 'Relances automatiques',
    desc: 'Envoyez des rappels et relances personnalisés à vos clients sans effort.',
    optional: true,
  },
  {
    icon: 'ti-shield-check',
    title: 'RGPD natif',
    desc: 'Vos données restent les vôtres. Hébergement européen, consentements gérés, export à la demande.',
  },
]

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function LoginPage() {
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [remember,   setRemember]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [magicSent,  setMagicSent]  = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleMagicLink() {
    if (!email.trim()) { setError('Entrez votre email pour recevoir un lien magique.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setError(error.message)
    else setMagicSent(true)
    setLoading(false)
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#111827', background: '#f0f9ff', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 56,
        background: 'rgba(253,248,242,0.92)', backdropFilter: 'blur(8px)',
        borderBottom: '0.5px solid rgba(14,165,233,0.15)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={napopetit} alt="Naposolo" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: '#111827' }}>Naposolo</span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
            background: '#E0F2FE', color: '#0369A1', letterSpacing: '.04em',
          }}>Alpha v0.2</span>
          <span style={{
            fontSize: 11, fontStyle: 'italic', color: '#7dd3fc', fontWeight: 500,
          }}>Les petits font les grands !</span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button
            onClick={() => scrollTo('fonctionnalites')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#6b7280', fontWeight: 500 }}
          >
            Fonctionnalités
          </button>
          <button
            onClick={() => scrollTo('connexion')}
            style={{
              padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 600,
            }}
          >
            Connexion
          </button>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section style={{
        display: 'grid', gridTemplateColumns: '1fr 420px', gap: 60,
        alignItems: 'center', padding: '80px 40px 80px',
        maxWidth: 1100, margin: '0 auto',
      }}>
        {/* Texte */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, color: '#0EA5E9',
            background: '#E0F2FE', padding: '4px 12px', borderRadius: 20, marginBottom: 24,
          }}>
            <i className="ti ti-feather" style={{ fontSize: 13 }} aria-hidden="true" />
            Conçu pour les praticiens du bien-être
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, lineHeight: 1.15,
            color: '#111827', marginBottom: 20, letterSpacing: '-0.02em',
          }}>
            Le CRM qui pense<br />comme vous,<br />
            <span style={{ color: '#0EA5E9' }}>en plus organisé.</span>
          </h1>

          <p style={{ fontSize: 17, color: '#6b7280', lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
            Gérez vos clients, séances et notes dans un espace pensé pour les thérapeutes, coachs et praticiens indépendants.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => scrollTo('fonctionnalites')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: '#111827', color: '#fff', fontSize: 15, fontWeight: 600,
              }}
            >
              Découvrir Naposolo
              <i className="ti ti-arrow-down" style={{ fontSize: 15 }} aria-hidden="true" />
            </button>
            <span style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
              Les petits font les grands !
            </span>
          </div>
        </div>

        {/* ── CARTE CONNEXION ── */}
        <div id="connexion" style={{
          background: '#fff', borderRadius: 16, padding: 32,
          border: '0.5px solid rgba(14,165,233,0.2)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.07)',
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Connexion</div>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>Accédez à votre espace Naposolo</div>
          </div>

          {magicSent ? (
            <div style={{
              padding: '16px', borderRadius: 10, background: '#EAF3DE', color: '#3B6D11',
              fontSize: 14, lineHeight: 1.6, textAlign: 'center',
            }}>
              <i className="ti ti-mail-check" style={{ fontSize: 22, display: 'block', marginBottom: 8 }} aria-hidden="true" />
              Lien magique envoyé à <strong>{email}</strong>.<br />Vérifiez votre boîte mail.
              <button
                onClick={() => setMagicSent(false)}
                style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#0F6E56', fontSize: 12, textDecoration: 'underline' }}
              >
                Réessayer
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '10px 12px', borderRadius: 8,
                  background: '#FCEBEB', color: '#A32D2D', fontSize: 13, lineHeight: 1.4,
                }}>
                  <i className="ti ti-alert-circle" style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Email
                </label>
                <input
                  type="email" required autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Mot de passe
                </label>
                <input
                  type="password" required autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: '#6b7280' }}>
                  <input
                    type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                    style={{ accentColor: '#0EA5E9', width: 14, height: 14, cursor: 'pointer' }}
                  />
                  Se souvenir de moi
                </label>
                <button
                  type="button"
                  onClick={() => scrollTo('connexion')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#0EA5E9', fontWeight: 500 }}
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '11px', borderRadius: 9, border: 'none',
                  background: loading ? '#7dd3fc' : '#0EA5E9', color: '#fff',
                  fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background .15s',
                }}
              >
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: '0.5px', background: '#e5e7eb' }} />
                <span style={{ fontSize: 11, color: '#9ca3af' }}>ou</span>
                <div style={{ flex: 1, height: '0.5px', background: '#e5e7eb' }} />
              </div>

              <button
                type="button" disabled={loading} onClick={handleMagicLink}
                style={{
                  width: '100%', padding: '10px', borderRadius: 9,
                  border: '0.5px solid rgba(14,165,233,0.4)', background: '#f0f9ff',
                  color: '#0369A1', fontSize: 14, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer', transition: 'background .15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}
              >
                <i className="ti ti-wand" style={{ fontSize: 15 }} aria-hidden="true" />
                Lien magique
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ── */}
      <section id="fonctionnalites" style={{ background: '#fff', padding: '80px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              display: 'inline-block', fontSize: 12, fontWeight: 600, color: '#0EA5E9',
              background: '#E0F2FE', padding: '4px 12px', borderRadius: 20, marginBottom: 16,
            }}>
              Ce que Naposolo fait pour vous
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#111827', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              Tout ce dont vous avez besoin,<br />rien de superflu.
            </h2>
            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 520, margin: '0 auto' }}>
              Un outil pensé pour les indépendants du bien-être, pas pour les grandes entreprises.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20,
          }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                padding: '24px', borderRadius: 14,
                border: '0.5px solid #e5e7eb', background: '#f0f9ff',
                transition: 'box-shadow .15s',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <i className={`ti ${f.icon}`} style={{ fontSize: 22, color: '#0EA5E9' }} aria-hidden="true" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{f.title}</div>
                  {f.optional && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                      background: '#EEEDFE', color: '#534AB7',
                    }}>Optionnel</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '0.5px solid rgba(14,165,233,0.15)',
        padding: '28px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#f0f9ff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={napopetit} alt="Naposolo" style={{ height: 20, opacity: 0.7 }} />
          <span style={{ fontSize: 13, color: '#9ca3af' }}>Naposolo — naposolo.com</span>
        </div>
        <span style={{ fontSize: 13, color: '#9ca3af' }}>Fait avec ❤️ à Vandœuvre-lès-Nancy</span>
      </footer>

    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '0.5px solid #d1d5db', background: '#f9fafb',
  color: '#111827', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color .15s',
}
