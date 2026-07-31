import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import napopetit from '../assets/napopetitv1.png'
import dashboardHero from '../assets/dashboard_hero.png'
import MetiersCarousel from '../components/MetiersCarousel'
import '../components/MetiersCarousel.css'

const DEFAULT_CMS = {
  header_tagline:  'Fait pour les indépendants qui pensent en grand — et qui savent que les petits font les grands.',
  hero_badge:      'Conçu pour les praticiens du bien-être',
  hero_title:      'Le CRM qui pense comme vous, en plus organisé.',
  hero_subtitle:   'Gérez vos clients, séances et notes dans un espace pensé pour les thérapeutes, coachs et praticiens indépendants.',
  hero_cta:        'Rejoindre l\'alpha',
  hero_tagline:    'Les petits font les grands !',
  features_badge:  'Ce que Naposolo fait pour vous',
  features_title:  'Tout ce dont vous avez besoin, rien de superflu.',
  features_sub:    'Fait pour les indépendants qui pensent en grand — et qui savent que les petits font les grands.',
  footer_city:     'Vandœuvre-lès-Nancy',
}

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function Landing() {
  const navigate = useNavigate()
  const [cms,          setCms]          = useState(DEFAULT_CMS)
  const [features,     setFeatures]     = useState([])
  const [betaOpen,     setBetaOpen]     = useState(false)
  const [betaPrenom,   setBetaPrenom]   = useState('')
  const [betaNom,      setBetaNom]      = useState('')
  const [betaEmail,    setBetaEmail]    = useState('')
  const [betaMetier,   setBetaMetier]   = useState('')
  const [betaLoading,  setBetaLoading]  = useState(false)
  const [betaSent,     setBetaSent]     = useState(false)
  const [betaError,    setBetaError]    = useState('')
  const [betaPassword, setBetaPassword] = useState('')
  const [betaConsent,  setBetaConsent]  = useState(false)
  const [alphaOpen, setAlphaOpen] = useState(true)

  useEffect(() => {
    supabase.from('landing_content').select('key, value, color, font_size, font_family').then(({ data }) => {
      if (data) {
        const map = {}
        data.forEach(r => { map[r.key] = r })
        setCms(c => {
          const merged = { ...c }
          Object.keys(map).forEach(k => { merged[k] = map[k].value })
          merged._styles = map
          return merged
        })
      }
    })
    supabase.from('landing_features').select('*').order('ordre').then(({ data }) => {
      if (data) setFeatures(data)
    })
    supabase.from('app_config').select('value').eq('key','alpha_open').single()
      .then(({ data }) => { if (data) setAlphaOpen(data.value === 'true') })
  }, [])

  function cs(key) {
    const s = cms._styles?.[key]
    if (!s) return {}
    return { color: s.color || undefined, fontSize: s.font_size || undefined, fontFamily: s.font_family || undefined }
  }

  async function handleBeta() {
    if (!betaPrenom.trim() || !betaNom.trim() || !betaEmail.trim()) { setBetaError('Nom, prénom et email requis.'); return }
    if (!betaPassword || betaPassword.length < 8) { setBetaError('Mot de passe minimum 8 caractères.'); return }
    if (!betaConsent) { setBetaError('Merci de cocher la case de consentement RGPD.'); return }
    setBetaLoading(true); setBetaError('')
    try {
      const { error } = await supabase.auth.signUp({
        email: betaEmail.trim(),
        password: betaPassword,
        options: {
          data: { prenom: betaPrenom.trim(), nom: betaNom.trim(), metier: betaMetier.trim() || null },
          emailRedirectTo: 'https://naposolo.com'
        }
      })
      if (error) {
        if (error.message.includes('already registered')) setBetaError('Cet email est déjà inscrit.')
        else throw error
      } else {
        const { error: insertError } = await supabase.from('beta_inscriptions').insert({
          prenom: betaPrenom.trim(),
          nom: betaNom.trim(),
          email: betaEmail.trim(),
          metier: betaMetier.trim() || null,
          consent_rgpd: true,
          consent_rgpd_date: new Date().toISOString()
        })
        if (insertError) {
          if (insertError.code === '23505') setBetaError('Un compte existe deja avec cet email.')
          else setBetaError('Erreur: ' + insertError.message)
        } else {
          supabase.from('system_email_stats').insert({ event_type: 'signup' }).then(({ error }) => { if (error) console.error('stats insert failed:', error) })
          setBetaSent(true)
        }
      }
    } catch(e) { setBetaError('Erreur: ' + e.message) }
    setBetaLoading(false)
  }

  function closeBeta() { setBetaOpen(false); setBetaPrenom(''); setBetaEmail(''); setBetaMetier(''); setBetaPassword(''); setBetaSent(false); setBetaError('') }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#111827', background: '#f0f9ff', minHeight: '100vh' }}>

      {/* HEADER */}
      <header className="landing-header" style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, background: 'rgba(253,248,242,0.92)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid rgba(14,165,233,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={napopetit} alt="Naposolo" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: '#111827' }}>Naposolo</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#E0F2FE', color: '#0369A1', letterSpacing: '.04em' }}>{cms.header_badge || 'Alpha v0.2'}</span>
          <span className="landing-tagline" style={{ fontSize: 11, fontStyle: 'italic', color: '#7dd3fc', fontWeight: 500, ...cs('header_tagline') }}>{cms.header_tagline}</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={navLinkStyle}>Accueil</button>
          <button className="landing-nav-features" onClick={() => scrollTo('fonctionnalites')} style={navLinkStyle}>Fonctionnalités</button>
          <span style={navDisabledStyle} title="Bientôt disponible">Sécurité</span>
          <span style={navDisabledStyle} title="Tarification pas encore publique">Tarifs</span>
          <span style={navDisabledStyle} title="Bientôt disponible">À Propos</span>
          <button onClick={() => navigate('/login')} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 600 }}>Connexion</button>
        </nav>
      </header>

      {/* HERO */}
      <section className="landing-hero">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#0EA5E9', background: '#E0F2FE', padding: '4px 12px', borderRadius: 20, marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', display: 'inline-block' }} />
            <span style={cs('hero_badge')}>{cms.hero_badge}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, lineHeight: 1.15, color: '#111827', marginBottom: 20, letterSpacing: '-0.02em' }}>
            Le CRM qui <span style={{ color: '#0EA5E9' }}>pense comme vous</span>, en plus organisé.
          </h1>
          <p style={{ fontSize: 17, color: '#6b7280', lineHeight: 1.7, marginBottom: 36, maxWidth: 480, ...cs('hero_subtitle') }}>{cms.hero_subtitle}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setBetaOpen(true)} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#111827', color: '#fff', fontSize: 15, fontWeight: 600 }}>
              Rejoindre l'alpha
            </button>
            <button type="button" onClick={() => navigate('/login')} style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid #d1d5db', cursor: 'pointer', background: 'transparent', color: '#111827', fontSize: 15, fontWeight: 600 }}>
              Se connecter
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img src={dashboardHero} alt="Aperçu du tableau de bord Naposolo" style={{ width: '100%', maxWidth: 560, borderRadius: 16, boxShadow: '0 12px 48px rgba(0,0,0,0.12)', border: '0.5px solid rgba(14,165,233,0.15)' }} />
        </div>
      </section>

      <MetiersCarousel />

      {/* FONCTIONNALITÉS */}
      <section id="fonctionnalites" className="landing-features-section" style={{ background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, color: '#0EA5E9', background: '#E0F2FE', padding: '4px 12px', borderRadius: 20, marginBottom: 16, ...cs('features_badge') }}>{cms.features_badge}</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#111827', margin: '0 0 12px', letterSpacing: '-0.02em', ...cs('features_title') }}>{cms.features_title}</h2>
            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 520, margin: '0 auto', ...cs('features_sub') }}>{cms.features_sub}</p>
          </div>
          <div className="landing-features-grid">
            {features.map(f => (
              <div key={f.id} style={{ padding: '24px', borderRadius: 14, border: '0.5px solid #e5e7eb', background: '#f0f9ff' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <i className={'ti ' + f.icon} style={{ fontSize: 22, color: '#0EA5E9' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{f.title}</div>
                  {f.optional && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#EEEDFE', color: '#534AB7' }}>Optionnel</span>}
                </div>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.65, margin: 0 }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '0.5px solid rgba(14,165,233,0.15)', background: '#f0f9ff', padding: '48px 40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 32, marginBottom: 32 }}>
          <div style={{ maxWidth: 320 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <img src={napopetit} alt="Naposolo" style={{ height: 26 }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Naposolo</span>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
              Le CRM pensé pour les praticiens indépendants du bien-être. Gérez clients, séances et notes, sans complexité inutile.
            </p>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0EA5E9', letterSpacing: '.05em', marginBottom: 14 }}>PRODUIT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => scrollTo('fonctionnalites')} style={footerLinkStyle}>Fonctionnalités</button>
              <span style={{ ...footerLinkStyle, cursor: 'default', color: '#c1c9d2' }} title="Tarification pas encore publique">Tarifs</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0EA5E9', letterSpacing: '.05em', marginBottom: 14 }}>ENTREPRISE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="mailto:contact@naposolo.com" style={footerLinkStyle}>Contact</a>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0EA5E9', letterSpacing: '.05em', marginBottom: 14 }}>LÉGAL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="/politique-confidentialite" style={footerLinkStyle}>Politique de confidentialité</a>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', borderTop: '0.5px solid rgba(14,165,233,0.15)', paddingTop: 20, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>© 2026 Naposolo. Fait avec ❤️ à {cms.footer_city}.</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>naposolo.com</span>
        </div>
      </footer>

      {/* MODAL BETA */}
      {betaOpen && (
        <div onClick={e => e.target === e.currentTarget && closeBeta()} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 4 }}>🚀 Rejoindre l'alpha</div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>Accès gratuit · Places limitées</div>
              </div>
              <button onClick={closeBeta} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af', lineHeight: 1, padding: 0 }}>×</button>
            </div>
            {!alphaOpen ? (
              <div style={{ padding: '16px', borderRadius: 9, background: '#FEF3C7', border: '0.5px solid #FCD34D', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>Inscriptions alpha temporairement fermées</div>
                <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.5, marginBottom: 10 }}>Les places sont limitées. Contactez-nous pour rejoindre la liste d'attente.</div>
                <a href="mailto:contact@naposolo.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#111827', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  <i className="ti ti-mail" style={{ fontSize: 13 }} />contact@naposolo.com
                </a>
              </div>
            ) : betaSent ? (
              <div style={{ padding: '20px', borderRadius: 10, background: '#EAF3DE', color: '#3B6D11', fontSize: 14, lineHeight: 1.6, textAlign: 'center' }}>
                <i className="ti ti-mail-check" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
                <strong>Compte créé !</strong><br/>
                Un email de confirmation vous a été envoyé à <strong>{betaEmail}</strong>.<br/>
                Cliquez sur le lien pour activer votre compte.<br/>
                <em style={{ fontSize: 12, color: '#5a8a3a' }}>"Les petits font les grands !"</em>
                <button onClick={closeBeta} style={{ marginTop: 12, display: 'block', margin: '12px auto 0', background: 'none', border: 'none', cursor: 'pointer', color: '#0F6E56', fontSize: 12, textDecoration: 'underline' }}>Fermer</button>
              </div>
            ) : (
              <>
                {betaError && <div style={{ padding: '10px 12px', borderRadius: 8, background: '#FCEBEB', color: '#A32D2D', fontSize: 13, marginBottom: 14 }}>{betaError}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Prénom *</label>
                    <input type="text" autoFocus value={betaPrenom} onChange={e => setBetaPrenom(e.target.value)} placeholder="Votre prénom" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Nom *</label>
                    <input type="text" value={betaNom} onChange={e => setBetaNom(e.target.value)} placeholder="Votre nom" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Email *</label>
                    <input type="email" value={betaEmail} onChange={e => setBetaEmail(e.target.value)} placeholder="vous@exemple.com" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Mot de passe *</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input type="text" value={betaPassword} onChange={e => setBetaPassword(e.target.value)} placeholder="Minimum 8 caractères" style={{ ...inputStyle, flex: 1 }} />
                      <button type="button" onClick={() => setBetaPassword(Math.random().toString(36).slice(2,10).toUpperCase() + Math.random().toString(36).slice(2,5) + '!9')}
                        style={{ padding: '0 10px', borderRadius: 8, border: '0.5px solid #4BBFCE', background: '#f0f9ff', color: '#0369A1', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        🎲 Générer
                      </button>
                    </div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>Notez ce mot de passe — il vous servira pour vous connecter.</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Votre métier</label>
                    <select value={betaMetier} onChange={e => setBetaMetier(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">Sélectionnez...</option>
                      <option>Aromathérapeute</option>
                      <option>Astrologue</option>
                      <option>Cartomancienne</option>
                      <option>Coach bien-être</option>
                      <option>Coach yoga</option>
                      <option>Energéticien</option>
                      <option>Hypnothérapeute</option>
                      <option>Magnétiseur</option>
                      <option>Médium</option>
                      <option>Naturopathe</option>
                      <option>Ostéopathe</option>
                      <option>Praticien massage</option>
                      <option>Psychologue</option>
                      <option>Réflexologue</option>
                      <option>Reiki</option>
                      <option>Sophrologue</option>
                      <option>Autre praticien</option>
                    </select>
                  </div>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11.5, color: '#6b7280', lineHeight: 1.5, cursor: 'pointer', marginTop: 2 }}>
                    <input type="checkbox" checked={betaConsent} onChange={e => setBetaConsent(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>J'accepte le traitement de mes données conformément à la <a href="/politique-confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: '#0F6E56', textDecoration: 'underline' }} onClick={e => e.stopPropagation()}>politique de confidentialité</a>. *</span>
                  </label>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button onClick={closeBeta} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '0.5px solid #d1d5db', background: 'transparent', color: '#6b7280', fontSize: 14, cursor: 'pointer' }}>Annuler</button>
                    <button onClick={handleBeta} disabled={betaLoading || !betaConsent} style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: (betaLoading || !betaConsent) ? '#7dd3fc' : 'linear-gradient(135deg,#4BBFCE,#7C9A7E)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: (betaLoading || !betaConsent) ? 'not-allowed' : 'pointer', minHeight: 44 }}>
                      {betaLoading ? 'Inscription...' : "Je rejoins l'alpha 🚀"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const navLinkStyle = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#6b7280', fontWeight: 500, fontFamily: 'inherit', padding: 0 }
const navDisabledStyle = { fontSize: 14, color: '#c1c9d2', fontWeight: 500, cursor: 'default' }
const footerLinkStyle = { fontSize: 13, color: '#6b7280', textDecoration: 'none', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8, minHeight: 44,
  border: '0.5px solid #d1d5db', background: '#f9fafb',
  color: '#111827', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color .15s',
}
