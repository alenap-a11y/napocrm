import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Landing.css';
import dashboardImg from '../assets/dashboard.png';
import napoOracleImg from '../assets/napo-oracle.png';
import napoLiveImg from '../assets/napo-live.png';
// Chemins confirmés : Landing.jsx dans src/pages/, images dans src/assets/ (déjà en place)

// ⚠️ À adapter avant merge :
// - Les <a href="#"> de navigation/CTA vers /login, /register etc. sont à remplacer par <Link to="...">
//   selon ton routing réel (hybride react-router-dom + pathname check dans App.jsx)
// - Le bloc "Stats" original (+500 praticiens, 25k séances, 97%, 4.8/5) et le témoignage
//   "Camille Lemoine" ont été supprimés : chiffres fictifs = risque pratique commerciale trompeuse
//   (art. L121-2 Code conso), sans lien avec le fait d'avoir ou non un SIRET.

const DEFAULT_MODULES = [
  { emoji: '⚡', title: 'NapoÉnergie', description: 'Magnétisme & soins énergétiques' },
  { emoji: '🌸', title: 'Fleurs de Bach', description: 'Élixirs floraux & suivi' },
  { emoji: '🔮', title: 'NapoOracle', description: 'Cartomancie & tirages' },
  { emoji: '📹', title: 'Napo-live', description: 'Séances en visio intégrées' },
  { emoji: '🌐', title: 'Napo-landing', description: 'Page pro & présentation', badge: 'En cours' },
  { emoji: '📇', title: 'Napo-annuaire', description: 'Trouvez un praticien', badge: 'En cours' },
  { emoji: '📅', title: 'Napo-Événement', description: 'Ateliers & formations', badge: 'En cours' },
  { emoji: '🌍', title: 'Napo-live traduction', description: 'Traduction en temps réel', badge: 'En création' },
]

const DEFAULT_FEATURES = [
  { icon: 'ti-users', title: 'Fiches clients', description: 'Coordonnées, historique, notes et documents centralisés.' },
  { icon: 'ti-calendar-stats', title: 'Suivi des séances', description: 'Contenu, durée, tarif et progression de chaque client.' },
  { icon: 'ti-notebook', title: 'Notes', description: 'Notes libres ou structurées après chaque séance.' },
  { icon: 'ti-calendar', title: 'Agenda', description: 'Visualisez vos RDV, évitez les conflits, planifiez sereinement.' },
  { icon: 'ti-bell', title: 'Relances automatiques', description: 'Rappels et relances personnalisés sans effort.', optional: true },
  { icon: 'ti-shield-check', title: 'RGPD natif', description: 'Hébergement européen, consentements gérés, export.' },
  { icon: 'ti-world', title: 'Agenda en ligne', description: 'Réservation 24h/24 par vos clients.' },
  { icon: 'ti-messages', title: 'Email de confirmation', description: 'Confirmation automatique avec lien calendrier.' },
]

export default function Landing() {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [betaPrenom,   setBetaPrenom]   = useState('');
  const [betaNom,      setBetaNom]      = useState('');
  const [betaEmail,    setBetaEmail]    = useState('');
  const [betaMetier,   setBetaMetier]   = useState('');
  const [betaLoading,  setBetaLoading]  = useState(false);
  const [betaSent,     setBetaSent]     = useState(false);
  const [betaError,    setBetaError]    = useState('');
  const [betaPassword, setBetaPassword] = useState('');
  const [betaConsent,  setBetaConsent]  = useState(false);
  const [alphaOpen,    setAlphaOpen]    = useState(true);
  const [cms,          setCms]          = useState({});
  const [dynFeatures,  setDynFeatures]  = useState([]);
  const [dynModules,   setDynModules]   = useState([]);

  useEffect(() => {
    supabase.from('app_config').select('value').eq('key', 'alpha_open').single()
      .then(({ data }) => { if (data) setAlphaOpen(data.value === 'true') })
    supabase.from('landing_content').select('key, value, color, font_size, font_family')
      .then(({ data }) => {
        if (!data) return
        const map = {}
        data.forEach(r => { map[r.key] = r })
        setCms(map)
      })
    supabase.from('landing_features').select('*').order('ordre')
      .then(({ data }) => { if (data && data.length) setDynFeatures(data) })
    supabase.from('landing_modules').select('*').order('ordre')
      .then(({ data }) => { if (data && data.length) setDynModules(data) })
  }, []);

  const cmsText = (key, fallback) => cms[key]?.value || fallback;
  const cmsStyle = (key) => {
    const row = cms[key]
    if (!row) return {}
    const style = {}
    if (row.color) style.color = row.color
    if (row.font_size) style.fontSize = row.font_size
    if (row.font_family && row.font_family !== 'inherit') style.fontFamily = row.font_family
    return style
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

  function closeRegisterModal() {
    setShowRegisterModal(false)
    setBetaPrenom(''); setBetaNom(''); setBetaEmail(''); setBetaMetier('')
    setBetaPassword(''); setBetaConsent(false); setBetaSent(false); setBetaError('')
  }

  return (
    <div className="bg-bg text-navy antialiased overflow-x-hidden">

      {/* BANDEAU HEADER (CMS) — masqué si vide */}
      {cmsText('header_tagline', '') && (
        <div className="bg-pale text-center py-2 px-6 text-sm" style={cmsStyle('header_tagline')}>
          {cmsText('header_tagline', '')}
        </div>
      )}

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link to="/" className="text-2xl font-extrabold text-navy tracking-tight flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-mystic rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-mystic/30 transition-all duration-300 group-hover:scale-105">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <span className="bg-gradient-to-r from-navy to-navy/80 bg-clip-text">Naposolo</span>
              {cmsText('header_badge', '') && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mystic/10 text-mystic normal-case tracking-normal">{cmsText('header_badge', '')}</span>
              )}
            </Link>
            <div className="hidden lg:flex items-center gap-8 font-medium text-gray-600 text-sm">
              <Link to="/" className="hover:text-primary transition-colors duration-200">Accueil</Link>
              <a href="#features" className="hover:text-primary transition-colors duration-200">Fonctionnalités</a>
              <a href="#securite" className="hover:text-primary transition-colors duration-200">Sécurité</a>
              <a href="#tarifs" className="hover:text-primary transition-colors duration-200">Tarifs</a>
              <a href="#a-propos" className="hover:text-primary transition-colors duration-200">À Propos</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/client/connexion" className="block font-medium text-mystic hover:text-primary transition-colors duration-200 text-sm px-3 py-1.5 rounded-lg border border-mystic/20 hover:border-primary/30">Espace client</Link>
            <Link to="/login" className="block font-medium text-navy/80 hover:text-primary transition-colors duration-200 text-sm">Se connecter</Link>
            <button type="button" onClick={() => setShowRegisterModal(true)} className="bg-gradient-to-r from-navy to-[#1a2d4a] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-navy/15 hover:shadow-xl hover:shadow-navy/25 hover:scale-[1.03] transition-all duration-300">
              Rejoindre l'alpha
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative pt-16 pb-28 px-6 overflow-hidden">
        <div className="hero-glow"></div>
        <div className="orb w-72 h-72 bg-mystic/15 top-20 right-1/4"></div>
        <div className="orb w-48 h-48 bg-warm/10 bottom-40 left-1/3"></div>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose text-mystic rounded-full text-sm font-semibold mb-8 border border-mystic/15" style={cmsStyle('hero_badge')}>
              <span className="w-2 h-2 bg-mystic rounded-full animate-pulse-soft"></span>
              {cmsText('hero_badge', 'Alpha ouverte • Accès anticipé')}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[54px] font-extrabold text-navy leading-[1.08] tracking-tight mb-6" style={cmsStyle('hero_title')}>
              {cmsText('hero_title', "Le bon outil pour chaque pratique, enfin réuni.")}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-4 max-w-lg" style={cmsStyle('hero_subtitle')}>
              {cmsText('hero_subtitle', "Énergéticien, praticien Reiki, thérapeute en fleurs de Bach, cartomancien… Naposolo s'adapte à votre métier avec des modules pensés spécifiquement pour vous.")}
            </p>
            <p className="text-base text-gray-500 mb-10 max-w-md italic" style={cmsStyle('hero_tagline')}>
              "{cmsText('hero_tagline', 'Fait pour les indépendants qui pensent en grand — et qui savent que les petits font les grands.')}"
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button type="button" onClick={() => setShowRegisterModal(true)} className="inline-flex justify-center items-center gap-2 bg-gradient-to-r from-primary to-mystic text-white px-8 py-4 rounded-xl font-semibold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-mystic/30 hover:scale-[1.02] transition-all duration-300">
                <span style={cmsStyle('hero_cta')}>{cmsText('hero_cta', "Rejoindre l'alpha")}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </button>
              <a href="#modules" className="inline-flex justify-center items-center gap-2 bg-white border border-gray-200 text-navy px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm">
                <svg className="w-5 h-5 text-mystic" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                Découvrir les modules
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-tr from-mystic/25 via-primary/15 to-accent/20 rounded-3xl blur-3xl opacity-70 animate-pulse-soft" style={{ animationDuration: '4s' }}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-navy/8 p-3 border border-gray-100">
              <img src={dashboardImg} className="w-full rounded-xl" alt="Aperçu du dashboard Naposolo" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3 animate-float z-20" style={{ animationDelay: '0s' }}>
              <div className="w-10 h-10 bg-mystic/10 text-mystic rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <div>
                <div className="text-sm font-bold text-navy">Séance confirmée</div>
                <div className="text-xs text-gray-500">Sophie L. • 15h30</div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-white p-3 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2.5 animate-float z-20" style={{ animationDelay: '2s', animationDuration: '7s' }}>
              <div className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center text-xs font-bold">🔮</div>
              <div>
                <div className="text-xs font-semibold text-navy">NapoOracle actif</div>
                <div className="text-[10px] text-gray-400">Module cartomancie</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* BANDEAU CONFIANCE — remplace l'ancien bloc "communauté grandissante" (chiffre non vérifiable) */}
      <section className="py-10 border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Pensé pour ces pratiques</p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4 opacity-50 grayscale">
            <span className="text-lg font-bold text-gray-300">✨ Magnétiseurs</span>
            <span className="text-lg font-bold text-gray-300">🌸 Fleurs de Bach</span>
            <span className="text-lg font-bold text-gray-300">🔮 Cartomanciens</span>
            <span className="text-lg font-bold text-gray-300">🧘 Yogis</span>
            <span className="text-lg font-bold text-gray-300">🌿 Naturopathes</span>
          </div>
        </div>
      </section>

      {/* MARQUEE PROFESSIONS */}
      <section className="py-16 px-0 bg-white overflow-hidden">
        <div className="marquee-container mb-6">
          <div className="marquee-track animate-marquee gap-5">
            {['Magnétiseur','Sophrologue','Cartomancienne','Médium','Naturopathe','Coach yoga','Praticien massage','Aromathérapeute','Astrologue','Reiki','Énergéticien','Hypnothérapeute'].concat(
              ['Magnétiseur','Sophrologue','Cartomancienne','Médium','Naturopathe','Coach yoga','Praticien massage','Aromathérapeute']
            ).map((label, i) => (
              <span key={i} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm ${i % 2 === 0 ? 'bg-pale text-primary' : 'bg-rose text-mystic'}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* TITRE MODULES */}
      <section id="modules" className="pt-20 pb-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight" style={cmsStyle('modules_title')}>{cmsText('modules_title', 'Un module pour chaque pratique')}</h2>
          <p className="text-lg text-gray-600 mb-6" style={cmsStyle('modules_sub')}>{cmsText('modules_sub', "Choisissez les modules adaptés à votre métier — magnétisme, yoga, sophrologie, astrologie et bien d'autres. Activez uniquement ce dont vous avez besoin.")}</p>
        </div>
      </section>

      {/* MODULES GRID */}
      <section className="pb-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {(dynModules.length ? dynModules : DEFAULT_MODULES).map((m, i) => {
            const palette = ['bg-warm/10 text-warm', 'bg-pink-50 text-pink-400', 'bg-mystic/10 text-mystic', 'bg-accent/10 text-accent', 'bg-primary/10 text-primary']
            const [bg, color] = palette[i % palette.length].split(' ')
            return (
              <div key={m.id || i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover cursor-pointer group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-20 h-20 ${bg} rounded-bl-3xl -mr-4 -mt-4 group-hover:scale-150 transition-transform duration-500`}></div>
                <div className={`w-11 h-11 ${bg} ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 relative z-10 text-xl`}>{m.emoji}</div>
                <h3 className="font-bold text-navy mb-1.5 relative z-10">{m.title}</h3>
                <p className="text-sm text-gray-500 relative z-10">{m.description}</p>
                {m.badge && <span className="absolute top-3 right-3 bg-warm/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20">{m.badge}</span>}
              </div>
            )
          })}
        </div>
      </section>

      {/* CE QUE NAPOSOLO FAIT POUR VOUS */}
      <section id="features" className="py-20 px-6 bg-white border-y border-gray-100 relative overflow-hidden">
        <div className="glow-center"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            {cmsText('features_badge', '') && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pale text-primary rounded-full text-sm font-semibold mb-6" style={cmsStyle('features_badge')}>
                {cmsText('features_badge', '')}
              </div>
            )}
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight" style={cmsStyle('features_title')}>{cmsText('features_title', 'Ce que Naposolo fait pour vous')}</h2>
            <p className="text-lg text-gray-600" style={cmsStyle('features_sub')}>{cmsText('features_sub', 'Tout ce dont vous avez besoin, rien de superflu.')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {(dynFeatures.length ? dynFeatures : DEFAULT_FEATURES).map((f, i) => {
              const palette = ['bg-primary/10 text-primary', 'bg-accent/10 text-accent', 'bg-warm/10 text-warm', 'bg-mystic/10 text-mystic']
              const [bg, color] = palette[i % palette.length].split(' ')
              return (
                <div key={f.id || i} id={f.title === 'RGPD natif' ? 'securite' : undefined} className="bg-bg rounded-2xl p-6 border border-gray-100/80 card-hover text-center group">
                  <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`ti ${f.icon || 'ti-star'} text-xl`}></i>
                  </div>
                  <h3 className="font-bold text-navy mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                  {f.optional && <span className="text-[10px] text-warm font-semibold">Optionnel</span>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* BIG INTERFACE SHOWCASE (DARK) */}
      <section className="py-28 px-6 bg-navy relative overflow-hidden">
        <div className="glow-bottom"></div>
        <div className="orb w-96 h-96 bg-mystic/10 top-10 right-1/3"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">La puissance de Naposolo,<br className="hidden md:block" /> en un coup d'œil.</h2>
          <p className="text-lg text-gray-300 mb-16 max-w-2xl mx-auto">Une vue d'ensemble complète de votre activité, pensée pour vous offrir la clarté dont vous avez besoin.</p>
          <div className="relative max-w-5xl mx-auto group">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary via-mystic to-accent rounded-3xl blur-2xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white rounded-2xl p-3 shadow-2xl border border-gray-200">
              <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <div className="h-10 bg-gray-100 flex items-center px-4 gap-2 border-b border-gray-200">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <div className="flex-1 mx-auto text-center text-xs text-gray-400 font-medium">app.naposolo.com/napo-oracle</div>
                </div>
                <img src={napoOracleImg} className="w-full" alt="Séance NapoOracle dans Naposolo" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NAPO-LIVE HIGHLIGHT */}
      <section className="py-20 px-6 bg-white relative overflow-hidden">
        <div className="orb w-64 h-64 bg-accent/8 top-0 left-1/4"></div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pale text-accent rounded-full text-sm font-semibold mb-6">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
              Napo-live
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Recevez vos clients à distance,<br />sans quitter votre espace.</h3>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">Démarrez une séance live en visio directement depuis Naposolo. Plus besoin d'outil externe — tout est intégré à votre flux de travail.</p>
            <div className="bg-rose/50 rounded-xl p-5 border border-mystic/15">
              <p className="text-sm font-semibold text-mystic mb-1">✨ Bientôt : Napo-live Traduction</p>
              <p className="text-sm text-gray-600">Traduction en temps réel pour communiquer avec des clients du monde entier, sans barrière de langue.</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-tl from-accent/20 to-mystic/15 rounded-3xl blur-2xl"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-200/40 p-2 border border-gray-100">
              <img src={napoLiveImg} className="w-full rounded-xl" alt="Séance Napo-live en visio" />
            </div>
            <div className="absolute -bottom-5 -right-5 bg-mystic text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-mystic/30 z-20">
              🌍 Traduction live
            </div>
          </div>
        </div>
      </section>

      {/* NAPO-LANDING & NAPO-ANNUAIRE */}
      <section className="py-20 px-6 bg-bg relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 relative z-10">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm card-hover relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-3xl -mr-8 -mt-8"></div>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-5 relative z-10 text-xl">🌐</div>
            <h3 className="text-xl font-bold mb-3 relative z-10">Napo-landing page</h3>
            <p className="text-gray-600 mb-4 leading-relaxed relative z-10">Présentation de votre activité, horaires, avis, images, métiers, adresse, langues parlées : disponible en ligne et en cabinet.</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm bg-warm/10 px-3 py-1 rounded-full relative z-10">
              <span className="w-1.5 h-1.5 bg-warm rounded-full"></span> En cours de déploiement
            </span>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm card-hover relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-mystic/5 rounded-bl-3xl -mr-8 -mt-8"></div>
            <div className="w-12 h-12 bg-mystic/10 text-mystic rounded-xl flex items-center justify-center mb-5 relative z-10 text-xl">📇</div>
            <h3 className="text-xl font-bold mb-3 relative z-10">Napo-annuaire</h3>
            <p className="text-gray-600 mb-4 leading-relaxed relative z-10">Trouvez un praticien près de chez vous, en France, en Europe ou dans le monde entier. Votre profil y apparaît automatiquement dès qu'il est actif — une visibilité en plus, sans démarche supplémentaire.</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm bg-warm/10 px-3 py-1 rounded-full relative z-10">
              <span className="w-1.5 h-1.5 bg-warm rounded-full"></span> En cours de déploiement
            </span>
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" className="py-20 px-6 bg-bg">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Des tarifs pensés pour les indépendants</h2>
            <p className="text-lg text-gray-600">Trois paliers, sans engagement.</p>
          </div>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose text-mystic rounded-full text-sm font-semibold border border-mystic/15">
              ✨ Gratuit pendant toute la période alpha — tarifs ci-dessous applicables après le lancement officiel
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Napo-Réflexion', price: '19,99€', desc: 'Pour démarrer sereinement.' },
              { name: 'Napo-Bâtisseur', price: '29,99€', desc: 'Pour structurer votre activité au quotidien.', highlight: true },
              { name: 'Napo-Visionnaire', price: '39,99€', desc: 'Pour aller plus loin, sans limite.' },
            ].map((tier, i) => (
              <div key={i} className={`rounded-2xl p-8 border card-hover relative ${tier.highlight ? 'bg-navy text-white border-navy shadow-xl scale-105' : 'bg-white border-gray-100'}`}>
                {tier.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-mystic text-white text-xs font-bold px-4 py-1 rounded-full">Le plus choisi</span>}
                <h3 className={`text-xl font-bold mb-2 ${tier.highlight ? 'text-white' : 'text-navy'}`}>{tier.name}</h3>
                <p className={`text-3xl font-extrabold mb-1 ${tier.highlight ? 'text-white' : 'text-navy'}`}>{tier.price}<span className="text-sm font-medium opacity-60">/mois</span></p>
                <p className={`text-sm mb-6 ${tier.highlight ? 'text-gray-300' : 'text-gray-500'}`}>{tier.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">Addons à la carte disponibles : NapoOracle +5€, Fleurs de Bach +3€, Export PDF +3€.</p>
        </div>
      </section>

      {/* À PROPOS */}
      <section id="a-propos" className="py-20 px-6 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">À propos de Naposolo</h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-4">
            Naposolo est développé en solo, à {cmsText('footer_city', 'Vandœuvre-lès-Nancy')}, par un fondateur qui construit
            l'outil directement avec les retours des praticiens qui l'utilisent au quotidien.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            "Les petits font les grands" — l'idée n'est pas de tout faire d'un coup, mais
            d'avancer avec les praticiens, un module à la fois.
          </p>
        </div>
      </section>

      {/* NAPO-ÉVÉNEMENT */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-rose/40 to-pale/60 rounded-3xl p-10 border border-mystic/10 relative overflow-hidden">
          <div className="orb w-40 h-40 bg-warm/10 top-0 right-0"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-warm/15 text-warm rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl">📅</div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3">Napo-Événement</h3>
            <p className="text-gray-600 mb-4 max-w-lg mx-auto leading-relaxed">Organisez formations, ateliers et événements collectifs, en ligne ou en présentiel. Un espace dédié pour sortir du rendez-vous individuel et proposer des sessions à plusieurs participants.</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm bg-warm/10 px-3 py-1 rounded-full">En cours</span>
          </div>
        </div>
      </section>

      {/* FINAL CTA — remplace la section stats/testimonial supprimée */}
      <section className="py-28 px-6 bg-gradient-to-b from-white to-pale/50 relative overflow-hidden">
        <div className="orb w-80 h-80 bg-mystic/8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Prêt à rejoindre l'aventure Naposolo ?</h2>
          <p className="text-xl text-gray-600 mb-4">Les premiers praticiens testeurs façonnent l'outil avec nous.</p>
          <p className="text-sm text-gray-400 mb-10">Accès anticipé — participez à l'évolution de l'outil.</p>
          <button type="button" onClick={() => setShowRegisterModal(true)} className="inline-flex justify-center items-center gap-2 bg-gradient-to-r from-navy to-[#1a2d4a] text-white px-10 py-5 rounded-xl font-semibold text-lg shadow-xl shadow-navy/20 hover:shadow-2xl hover:shadow-mystic/30 hover:scale-[1.03] transition-all duration-300">
            Rejoindre l'alpha
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
          </button>
          <p className="text-sm text-gray-400 mt-6">Gratuit pendant l'alpha · Sans engagement</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-navy text-white pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="text-2xl font-bold mb-6 flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-primary to-mystic rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                </div>
                Naposolo
              </div>
              <p className="text-gray-400 max-w-sm leading-relaxed mb-6">Le CRM pensé pour les praticiens indépendants du bien-être. Gérez clients, séances et notes, sans complexité inutile.</p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white">Produit</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-white transition">Tarifs</a></li>
                <li><a href="#modules" className="hover:text-white transition">Modules métiers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white">Entreprise</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><a href="mailto:contact@naposolo.com" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">À propos</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white">Légal</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><a href="/politique-confidentialite" className="hover:text-white transition">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition">CGU / CGV</a></li>
                <li><a href="#" className="hover:text-white transition">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>&copy; 2026 Naposolo. Fait avec <span className="text-red-400">❤️</span> à {cmsText('footer_city', 'Vandœuvre-lès-Nancy')}.</p>
            <p>naposolo.com</p>
          </div>
        </div>
      </footer>

      {/* MODAL INSCRIPTION */}
      {showRegisterModal && (
        <div
          onClick={e => e.target === e.currentTarget && closeRegisterModal()}
          className="fixed inset-0 z-[500] bg-black/45 flex items-center justify-center px-4"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-[420px]">
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="text-lg font-bold text-navy mb-1">🚀 Rejoindre l'alpha</div>
                <div className="text-sm text-gray-400">Accès gratuit · Places limitées</div>
              </div>
              <button type="button" onClick={closeRegisterModal} className="bg-transparent border-none cursor-pointer text-xl text-gray-400 hover:text-navy leading-none p-0 transition-colors">×</button>
            </div>

            {!alphaOpen ? (
              <div className="p-4 rounded-lg bg-warm/10 border border-warm/30 text-center">
                <div className="text-sm font-semibold text-warm mb-1.5">Inscriptions alpha temporairement fermées</div>
                <div className="text-xs text-gray-500 leading-relaxed mb-2.5">Les places sont limitées. Contactez-nous pour rejoindre la liste d'attente.</div>
                <a href="mailto:contact@naposolo.com" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy text-white text-xs font-semibold no-underline">
                  <i className="ti ti-mail text-sm" />contact@naposolo.com
                </a>
              </div>
            ) : betaSent ? (
              <div className="p-5 rounded-xl bg-accent/10 text-accent text-sm leading-relaxed text-center">
                <i className="ti ti-mail-check text-2xl block mb-2" />
                <strong>Compte créé !</strong><br />
                Un email de confirmation vous a été envoyé à <strong>{betaEmail}</strong>.<br />
                Cliquez sur le lien pour activer votre compte.<br />
                <em className="text-xs text-accent/80">"Les petits font les grands !"</em>
                <button type="button" onClick={closeRegisterModal} className="mt-3 block mx-auto bg-transparent border-none cursor-pointer text-navy text-xs underline">Fermer</button>
              </div>
            ) : (
              <>
                {betaError && <div className="px-3 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm mb-3.5">{betaError}</div>}
                <div className="flex flex-col gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Prénom *</label>
                    <input type="text" autoFocus value={betaPrenom} onChange={e => setBetaPrenom(e.target.value)} placeholder="Votre prénom"
                      className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-primary transition-colors box-border" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nom *</label>
                    <input type="text" value={betaNom} onChange={e => setBetaNom(e.target.value)} placeholder="Votre nom"
                      className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-primary transition-colors box-border" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email *</label>
                    <input type="email" value={betaEmail} onChange={e => setBetaEmail(e.target.value)} placeholder="vous@exemple.com"
                      className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-primary transition-colors box-border" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mot de passe *</label>
                    <div className="flex gap-1.5">
                      <input type="text" value={betaPassword} onChange={e => setBetaPassword(e.target.value)} placeholder="Minimum 8 caractères"
                        className="flex-1 px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-primary transition-colors box-border" />
                      <button
                        type="button"
                        onClick={() => setBetaPassword(Math.random().toString(36).slice(2, 10).toUpperCase() + Math.random().toString(36).slice(2, 5) + '!9')}
                        className="px-2.5 rounded-lg border border-primary/30 bg-pale text-primary text-xs whitespace-nowrap shrink-0"
                      >
                        🎲 Générer
                      </button>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">Notez ce mot de passe — il vous servira pour vous connecter.</div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Votre métier</label>
                    <select value={betaMetier} onChange={e => setBetaMetier(e.target.value)}
                      className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-primary transition-colors box-border cursor-pointer">
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
                  <label className="flex gap-2 items-start text-[11.5px] text-gray-500 leading-snug cursor-pointer mt-0.5">
                    <input type="checkbox" checked={betaConsent} onChange={e => setBetaConsent(e.target.checked)} className="mt-0.5 shrink-0" />
                    <span>J'accepte le traitement de mes données conformément à la <a href="/politique-confidentialite" target="_blank" rel="noopener noreferrer" className="text-primary underline" onClick={e => e.stopPropagation()}>politique de confidentialité</a>. *</span>
                  </label>
                  <div className="flex gap-2.5 mt-1">
                    <button type="button" onClick={closeRegisterModal} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors">Annuler</button>
                    <button
                      type="button"
                      onClick={handleBeta}
                      disabled={betaLoading || !betaConsent}
                      className="flex-[2] py-2.5 min-h-[44px] rounded-lg text-white text-sm font-semibold transition-all bg-gradient-to-r from-primary to-mystic disabled:opacity-50 disabled:cursor-not-allowed"
                    >
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
  );
}
