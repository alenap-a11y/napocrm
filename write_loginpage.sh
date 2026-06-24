#!/bin/bash
cat > ~/napocrm/src/pages/LoginPage.jsx << 'ENDOFFILE'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const C = {
  navy: '#071a2e',
  navyDeep: '#040d1a',
  blue: '#0EA5E9',
  blueLight: '#38bdf8',
  bluePale: '#e0f2fe',
  blueBg: '#f0f9ff',
  gold: '#D4A853',
  goldBg: '#fffbeb',
  goldText: '#92400e',
  white: '#ffffff',
  muted: '#64748b',
  mutedDark: '#4a6a8a',
  border: '#e0f2fe',
  green: '#10b981',
  greenBg: '#ecfdf5',
  red: '#ef4444',
  redBg: '#fff5f5',
}

const PRATICIENS_ROW1 = [
  { label: 'Sophrologue', icon: 'ti-moon-stars' },
  { label: 'Cartomancienne', icon: 'ti-cards' },
  { label: 'Médium', icon: 'ti-eye' },
  { label: 'Naturopathe', icon: 'ti-flower' },
  { label: 'Coach yoga', icon: 'ti-run' },
  { label: 'Magnétiseur', icon: 'ti-hand-stop' },
  { label: 'Hypnothérapeute', icon: 'ti-brain' },
  { label: 'Praticien massage', icon: 'ti-heart-handshake' },
  { label: 'Énergéticien', icon: 'ti-bolt' },
]
const PRATICIENS_ROW2 = [
  { label: 'Aromathérapeute', icon: 'ti-leaf' },
  { label: 'Astrologue', icon: 'ti-star' },
  { label: 'Reiki', icon: 'ti-flame' },
  { label: 'Réflexologue', icon: 'ti-footprint' },
  { label: 'Acupuncteur', icon: 'ti-needle' },
  { label: 'Sophrologue', icon: 'ti-moon-stars' },
  { label: 'Coach bien-être', icon: 'ti-heart' },
  { label: 'Naturopathe', icon: 'ti-flower' },
]

const R1 = [...PRATICIENS_ROW1, ...PRATICIENS_ROW1]
const R2 = [...PRATICIENS_ROW2, ...PRATICIENS_ROW2]

const DEFAULT_CMS = {
  header_badge: 'Alpha',
  header_tagline: 'Fait pour les indépendants qui pensent en grand.',
  hero_subtitle: "Le CRM tout-en-un des praticiens du bien-être indépendants. Clients, séances, agenda — un seul endroit, zéro friction.",
  problem_title: "Le quotidien d'un praticien indépendant ?",
  problem_subtitle: "Un patchwork d'outils qui vous épuise au lieu de vous servir.",
  problem_solution: 'Naposolo centralise tout. Un outil. Une minute. Zéro friction.',
  how_title: 'Comment ça marche',
  how_subtitle: 'Trois étapes. Zéro complexité.',
  features_title: "Tout ce qu'il vous faut. Rien de superflu.",
  features_subtitle: 'Conçu avec des praticiens, pas pour des commerciaux.',
  testimonials_title: 'Ils ont repris le contrôle',
  pricing_title: 'Un prix juste. Une vraie liberté.',
  pricing_subtitle: 'Choisissez votre socle. Ajoutez ce que vous voulez. Payez ce que vous utilisez.',
  cta_title: 'Prêt à reprendre le contrôle de votre activité ?',
  carousel_title: 'Pour tous les praticiens du bien-être',
  carousel_subtitle: "Quelle que soit votre discipline, Naposolo s'adapte à votre pratique.",
}

const DEFAULT_FEATURES = [
  { id: 1, ordre: 1, icone: 'ti-users', titre: 'Fiches clients complètes', description: 'Coordonnées, historique, notes privées, documents. Une vue 360° en un clic.' },
  { id: 2, ordre: 2, icone: 'ti-calendar-event', titre: 'Agenda intelligent', description: 'Lien public de réservation. Vos clients réservent seuls. Vous gardez la main.' },
  { id: 3, ordre: 3, icone: 'ti-notes', titre: 'Notes de séance', description: 'Structurez vos observations. Retrouvez tout en un instant. Confidentiel.' },
  { id: 4, ordre: 4, icone: 'ti-mail', titre: 'Relances automatiques', description: 'Confirmations, rappels, suivis. Vos clients ne vous oublient plus.' },
  { id: 5, ordre: 5, icone: 'ti-file-export', titre: 'Exports & rapports', description: 'PDF, CSV, statistiques. Votre activité au clair, quand vous voulez.' },
  { id: 6, ordre: 6, icone: 'ti-shield-lock', titre: 'Données 100% françaises', description: 'Hébergement FR, conformité RGPD. Votre cabinet, votre coffre-fort.' },
]

export default function LoginPage() {
  const [cms, setCms] = useState(DEFAULT_CMS)
  const [features, setFeatures] = useState(DEFAULT_FEATURES)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    const loadCMS = async () => {
      try {
        const { data } = await supabase.from('landing_content').select('key, value')
        if (data?.length) {
          const map = { ...DEFAULT_CMS }
          data.forEach(r => { if (r.value) map[r.key] = r.value })
          setCms(map)
        }
      } catch (e) {}
      try {
        const { data } = await supabase.from('landing_features').select('*').order('ordre')
        if (data?.length) setFeatures(data)
      } catch (e) {}
    }
    loadCMS()
  }, [])

  const handleLogin = async (e) => {
    e?.preventDefault(); setLoading(true); setMsg(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (err) { setMsg({ type: 'err', text: err.message || 'Erreur de connexion.' }) }
    finally { setLoading(false) }
  }

  const handleMagicLink = async (e) => {
    e?.preventDefault(); setLoading(true); setMsg(null)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      setMsg({ type: 'ok', text: 'Lien magique envoyé. Vérifiez votre boîte mail.' })
    } catch (err) { setMsg({ type: 'err', text: err.message || 'Erreur envoi lien.' }) }
    finally { setLoading(false) }
  }

  const handleReset = async (e) => {
    e?.preventDefault(); setLoading(true); setMsg(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      setMsg({ type: 'ok', text: 'Email de réinitialisation envoyé.' })
    } catch (err) { setMsg({ type: 'err', text: err.message || 'Erreur réinitialisation.' }) }
    finally { setLoading(false) }
  }

  const handleSubmit = mode === 'login' ? handleLogin : mode === 'magic' ? handleMagicLink : handleReset

  const InputWrap = ({ icon, children }) => (
    <div style={{ display:'flex', alignItems:'center', border:`1.5px solid ${C.bluePale}`, borderRadius:11, background:C.blueBg, marginBottom:12, transition:'border-color .2s' }}
      onFocus={e => e.currentTarget.style.borderColor = C.blue}
      onBlur={e => e.currentTarget.style.borderColor = C.bluePale}>
      <span style={{ width:38, display:'flex', alignItems:'center', justifyContent:'center', color:'#7dd3fc', fontSize:16, flexShrink:0 }}>
        <i className={`ti ${icon}`}></i>
      </span>
      {children}
    </div>
  )

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/tabler-icons.min.css" />
      <style>{`
        @keyframes scrollL { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes scrollR { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        .trk-l { display:flex; gap:16px; width:max-content; animation:scrollL 32s linear infinite; }
        .trk-r { display:flex; gap:16px; width:max-content; animation:scrollR 26s linear infinite; }
        .trk-l:hover,.trk-r:hover { animation-play-state:paused; }
        .ppill { display:flex; flex-direction:column; align-items:center; justify-content:center; width:110px; height:110px; border-radius:50%; background:#fff; border:1.5px solid #bae6fd; flex-shrink:0; gap:7px; cursor:default; transition:border-color .2s,background .2s; }
        .ppill:hover { border-color:#0EA5E9; background:#f0f9ff; }
        .ppill i { font-size:26px; color:#0EA5E9; }
        .ppill span { font-size:11px; font-weight:600; color:#0c4a6e; text-align:center; line-height:1.2; padding:0 6px; }
        .navl:hover { color:#0EA5E9 !important; }
        .inp { flex:1; border:none; outline:none; background:transparent; font-size:13px; color:#071a2e; padding:11px 12px 11px 0; font-family:inherit; }
      `}</style>

      <div style={{ fontFamily:'system-ui,-apple-system,sans-serif', background:C.blueBg, color:C.navy, minHeight:'100vh' }}>

        {/* HEADER */}
        <header style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:'12px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, background:C.navy, color:C.gold, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:10, fontSize:18 }}>
              <i className="ti ti-feather"></i>
            </div>
            <span style={{ fontWeight:800, fontSize:16, color:C.navy, letterSpacing:'-.3px' }}>Naposolo</span>
            <span style={{ fontSize:9, background:C.bluePale, color:'#0369a1', padding:'2px 8px', borderRadius:20, fontWeight:700, letterSpacing:'.5px' }}>{cms.header_badge.toUpperCase()}</span>
          </div>
          <nav style={{ display:'flex', alignItems:'center', gap:22 }}>
            <a href="#fonctionnalites" className="navl" style={{ color:C.muted, fontSize:13, fontWeight:500, textDecoration:'none', transition:'color .2s' }}>Fonctionnalités</a>
            <a href="#tarifs" className="navl" style={{ color:C.muted, fontSize:13, fontWeight:500, textDecoration:'none', transition:'color .2s' }}>Tarifs</a>
            <a href="#temoignages" className="navl" style={{ color:C.muted, fontSize:13, fontWeight:500, textDecoration:'none', transition:'color .2s' }}>Témoignages</a>
            <a href="#connexion" style={{ background:C.blue, color:C.white, padding:'9px 18px', borderRadius:9, fontSize:13, fontWeight:700, textDecoration:'none' }}>Connexion</a>
          </nav>
        </header>
        <div style={{ background:C.blueBg, borderBottom:`1px solid ${C.border}`, textAlign:'center', padding:'7px', fontSize:12, fontStyle:'italic', color:C.muted }}>
          {cms.header_tagline}
        </div>

        {/* HERO SPLIT */}
        <section style={{ display:'grid', gridTemplateColumns:'1.15fr 1fr', minHeight:460 }}>
          <div style={{ background:C.navy, padding:'48px 44px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-80, right:-80, width:240, height:240, background:C.blue, borderRadius:'50%', opacity:.28 }}></div>
            <div style={{ position:'absolute', bottom:-60, left:-40, width:170, height:170, background:C.blueLight, borderRadius:'50%', opacity:.2 }}></div>
            <div style={{ position:'absolute', top:'42%', left:'38%', width:110, height:110, background:C.gold, borderRadius:'50%', opacity:.16 }}></div>
            <div style={{ position:'relative', zIndex:2 }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(14,165,233,.15)', border:'1px solid rgba(14,165,233,.35)', color:'#7dd3fc', fontSize:10, fontWeight:700, padding:'4px 14px', borderRadius:20, marginBottom:22, letterSpacing:'.5px' }}>
                <i className="ti ti-sparkles"></i>100% pensé pour les praticiens
              </span>
              <h1 style={{ fontSize:'clamp(30px,3.5vw,44px)', fontWeight:900, lineHeight:1.1, color:C.white, marginBottom:18, letterSpacing:'-.5px' }}>
                Arrêtez<br />de <span style={{ color:C.blueLight }}>gérer.</span><br />Commencez à<br /><span style={{ color:C.gold }}>pratiquer.</span>
              </h1>
              <p style={{ fontSize:13, color:C.mutedDark, lineHeight:1.7, marginBottom:28, maxWidth:400 }}>
                {cms.hero_subtitle}
              </p>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <a href="#connexion" style={{ background:C.blue, color:C.white, padding:'11px 22px', borderRadius:10, fontSize:13, fontWeight:700, textDecoration:'none' }}>Essai gratuit 14j</a>
                <a href="#fonctionnalites" style={{ background:'transparent', color:C.white, border:'1.5px solid rgba(255,255,255,.25)', padding:'11px 22px', borderRadius:10, fontSize:13, fontWeight:600, textDecoration:'none' }}>Fonctionnalités</a>
              </div>
            </div>
            <div style={{ position:'relative', zIndex:2, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:28 }}>
              {[{v:'500+',l:'praticiens'},{v:'14j',l:'gratuit'},{v:'FR',l:'données'}].map((s,i)=>(
                <div key={i} style={{ background:'rgba(14,165,233,.08)', border:'1px solid rgba(14,165,233,.18)', borderRadius:12, padding:'10px 8px', textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:900, color:C.blueLight }}>{s.v}</div>
                  <div style={{ fontSize:9, color:C.mutedDark, textTransform:'uppercase', letterSpacing:'.3px', marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* FORM */}
          <div id="connexion" style={{ background:C.white, padding:'44px 36px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <h2 style={{ fontSize:20, fontWeight:800, color:C.navy, marginBottom:4, letterSpacing:'-.3px' }}>
              {mode==='login'?'Bon retour 👋':mode==='magic'?'Lien magique ✨':'Réinitialisation 🔑'}
            </h2>
            <p style={{ fontSize:12, color:C.muted, marginBottom:22 }}>
              {mode==='login'?'Votre cabinet vous attend.':mode==='magic'?'Recevez un lien sans mot de passe.':'On vous envoie un lien de réinitialisation.'}
            </p>
            <form onSubmit={handleSubmit}>
              <label style={{ fontSize:10, fontWeight:700, color:C.blue, letterSpacing:'.5px', textTransform:'uppercase', marginBottom:4, display:'block' }}>Adresse e-mail</label>
              <InputWrap icon="ti-mail">
                <input className="inp" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@cabinet.fr" required />
              </InputWrap>
              {mode==='login' && (
                <>
                  <label style={{ fontSize:10, fontWeight:700, color:C.blue, letterSpacing:'.5px', textTransform:'uppercase', marginBottom:4, display:'block' }}>Mot de passe</label>
                  <div style={{ display:'flex', alignItems:'center', border:`1.5px solid ${C.bluePale}`, borderRadius:11, background:C.blueBg, marginBottom:12 }}>
                    <span style={{ width:38, display:'flex', alignItems:'center', justifyContent:'center', color:'#7dd3fc', fontSize:16, flexShrink:0 }}><i className="ti ti-lock"></i></span>
                    <input className="inp" type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
                    <span onClick={()=>setShowPass(!showPass)} style={{ width:38, display:'flex', alignItems:'center', justifyContent:'center', color:'#7dd3fc', fontSize:16, cursor:'pointer', flexShrink:0 }}>
                      <i className={showPass?'ti ti-eye-off':'ti ti-eye'}></i>
                    </span>
                  </div>
                </>
              )}
              <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', border:'none', borderRadius:11, fontSize:14, fontWeight:800, cursor:loading?'not-allowed':'pointer', background:C.blue, color:C.white, opacity:loading?.6:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit', marginBottom:14 }}>
                <i className="ti ti-login"></i>
                {loading?'...':mode==='login'?'Se connecter':mode==='magic'?'Envoyer le lien':'Réinitialiser'}
              </button>
            </form>

            {mode==='login' && (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <div style={{ flex:1, height:1, background:C.bluePale }}></div>
                  <span style={{ fontSize:10, color:'#7dd3fc', fontWeight:600 }}>ou accès rapide</span>
                  <div style={{ flex:1, height:1, background:C.bluePale }}></div>
                </div>
                <button onClick={handleMagicLink} disabled={loading} style={{ width:'100%', padding:'11px', border:`1.5px solid ${C.gold}`, borderRadius:11, fontSize:12, fontWeight:700, cursor:'pointer', background:C.goldBg, color:C.goldText, display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontFamily:'inherit', marginBottom:16 }}>
                  <i className="ti ti-wand"></i>Lien magique — sans mot de passe
                </button>
              </>
            )}

            {msg && (
              <div style={{ padding:'10px 14px', fontSize:12, borderRadius:8, background:msg.type==='ok'?C.greenBg:C.redBg, color:msg.type==='ok'?C.green:C.red, marginBottom:14, textAlign:'center' }}>
                {msg.text}
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <button onClick={()=>{setMode(mode==='login'?'reset':'login');setMsg(null)}} style={{ background:'none', border:'none', color:C.blue, cursor:'pointer', fontSize:11, fontWeight:600, padding:0, fontFamily:'inherit' }}>
                {mode==='login'?'Mot de passe oublié ?':'← Retour connexion'}
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:C.muted }}>
                <i className="ti ti-shield-check" style={{ fontSize:12, color:C.green }}></i>Données FR sécurisées
              </div>
            </div>
          </div>
        </section>

        {/* CARROUSEL */}
        <section style={{ background:C.white, padding:'52px 0', overflow:'hidden' }}>
          <div style={{ maxWidth:700, margin:'0 auto', textAlign:'center', padding:'0 24px', marginBottom:36 }}>
            <h2 style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:800, color:C.navy, marginBottom:8, letterSpacing:'-.3px' }}>{cms.carousel_title}</h2>
            <p style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>{cms.carousel_subtitle}</p>
          </div>
          <div style={{ overflow:'hidden', marginBottom:16 }}>
            <div className="trk-l">
              {R1.map((p,i)=>(
                <div key={i} className="ppill"><i className={`ti ${p.icon}`}></i><span>{p.label}</span></div>
              ))}
            </div>
          </div>
          <div style={{ overflow:'hidden' }}>
            <div className="trk-r">
              {R2.map((p,i)=>(
                <div key={i} className="ppill"><i className={`ti ${p.icon}`}></i><span>{p.label}</span></div>
              ))}
            </div>
          </div>
        </section>

        {/* PROBLÈME */}
        <section style={{ background:C.blueBg, padding:'56px clamp(24px,4vw,48px)' }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:800, textAlign:'center', color:C.navy, marginBottom:8, letterSpacing:'-.3px' }}>{cms.problem_title}</h2>
            <p style={{ fontSize:13, color:C.muted, textAlign:'center', marginBottom:32, maxWidth:500, margin:'0 auto 32px' }}>{cms.problem_subtitle}</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:14, marginBottom:16 }}>
              {[
                {i:'ti-files-off',t:'Fichiers éparpillés',d:'Excel, Notes, papier, mémoire. Vous perdez vos clients dans le chaos.'},
                {i:'ti-clock-x',t:'Temps gaspillé',d:'Confirmations, relances, planning. 2h par semaine en pure perte.'},
                {i:'ti-battery-1',t:'Énergie perdue',d:"Vous êtes praticien, pas administratif. Ça ne devrait pas peser."},
              ].map((c,i)=>(
                <div key={i} style={{ padding:22, background:'#fff5f5', border:'1px solid #fecaca33', borderRadius:12 }}>
                  <i className={`ti ${c.i}`} style={{ fontSize:24, color:'#ef4444', display:'block', marginBottom:10 }}></i>
                  <h3 style={{ fontSize:15, fontWeight:700, color:'#991b1b', marginBottom:5 }}>{c.t}</h3>
                  <p style={{ color:'#7f1d1d', fontSize:13, lineHeight:1.55, opacity:.75 }}>{c.d}</p>
                </div>
              ))}
            </div>
            <div style={{ padding:'20px 28px', background:'#f0fdf4', border:`1.5px solid ${C.green}33`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', gap:14 }}>
              <i className="ti ti-circle-check" style={{ fontSize:26, color:C.green, flexShrink:0 }}></i>
              <p style={{ fontSize:15, fontWeight:700, color:C.navy }}>{cms.problem_solution}</p>
            </div>
          </div>
        </section>

        {/* COMMENT ÇA MARCHE */}
        <section style={{ background:C.bluePale, padding:'56px clamp(24px,4vw,48px)' }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:800, textAlign:'center', color:C.navy, marginBottom:8, letterSpacing:'-.3px' }}>{cms.how_title}</h2>
            <p style={{ fontSize:13, color:C.muted, textAlign:'center', marginBottom:32 }}>{cms.how_subtitle}</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16 }}>
              {[
                {n:'01',t:'Créez votre compte',d:'2 min, sans CB, données FR. Pas de questionnaire interminable.'},
                {n:'02',t:'Ajoutez vos clients',d:'Import CSV ou saisie. Fiches complètes, historique, notes privées.'},
                {n:'03',t:'Activez votre agenda',d:'Lien public, réservation autonome, notifications email automatiques.'},
              ].map((s,i)=>(
                <div key={i} style={{ background:C.white, padding:26, borderRadius:14, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:34, fontWeight:900, color:C.blue, lineHeight:1, marginBottom:10 }}>{s.n}</div>
                  <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, marginBottom:5 }}>{s.t}</h3>
                  <p style={{ color:C.muted, fontSize:13, lineHeight:1.6 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FONCTIONNALITÉS */}
        <section id="fonctionnalites" style={{ background:C.white, padding:'56px clamp(24px,4vw,48px)' }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:800, textAlign:'center', color:C.navy, marginBottom:8, letterSpacing:'-.3px' }}>{cms.features_title}</h2>
            <p style={{ fontSize:13, color:C.muted, textAlign:'center', marginBottom:32 }}>{cms.features_subtitle}</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:14 }}>
              {features.map(f=>(
                <div key={f.id} style={{ padding:22, background:'#f8fcff', borderRadius:12, border:`1px solid ${C.border}` }}>
                  <div style={{ width:42, height:42, background:`${C.blue}15`, color:C.blue, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12, fontSize:21 }}>
                    <i className={`ti ${f.icone||'ti-check'}`}></i>
                  </div>
                  <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, marginBottom:5 }}>{f.titre}</h3>
                  <p style={{ color:C.muted, fontSize:13, lineHeight:1.6 }}>{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TÉMOIGNAGES */}
        <section id="temoignages" style={{ background:C.navy, padding:'56px clamp(24px,4vw,48px)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-80, right:-80, width:220, height:220, background:C.blue, borderRadius:'50%', opacity:.15 }}></div>
          <div style={{ position:'absolute', bottom:-60, left:-50, width:160, height:160, background:C.gold, borderRadius:'50%', opacity:.12 }}></div>
          <div style={{ maxWidth:1100, margin:'0 auto', position:'relative', zIndex:2 }}>
            <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:800, textAlign:'center', color:C.white, marginBottom:32, letterSpacing:'-.3px' }}>{cms.testimonials_title}</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:18 }}>
              {[
                {n:'Sophie M.',m:'Sophrologue · Lyon',q:'En 10 minutes mon agenda était en ligne. Mes clients réservent seuls. Je gagne 3h par semaine.'},
                {n:'Nathalie B.',m:'Naturopathe · Nancy',q:'Enfin un outil qui pense comme un praticien, pas comme un commercial.'},
              ].map((t,i)=>(
                <div key={i} style={{ background:'rgba(14,165,233,.08)', border:'1px solid rgba(14,165,233,.2)', borderRadius:16, padding:26 }}>
                  <i className="ti ti-quote" style={{ fontSize:26, color:C.gold, display:'block', marginBottom:12 }}></i>
                  <p style={{ fontSize:14, lineHeight:1.65, color:'#e2e8f0', marginBottom:18 }}>« {t.q} »</p>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:C.blue, color:C.white, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14 }}>{t.n[0]}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:C.white }}>{t.n}</div>
                      <div style={{ fontSize:11, color:C.mutedDark }}>{t.m}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TARIFS */}
        <section id="tarifs" style={{ background:C.bluePale, padding:'56px clamp(24px,4vw,48px)' }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:800, textAlign:'center', color:C.navy, marginBottom:8, letterSpacing:'-.3px' }}>{cms.pricing_title}</h2>
            <p style={{ fontSize:13, color:C.muted, textAlign:'center', marginBottom:32 }}>{cms.pricing_subtitle}</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16, marginBottom:16 }}>
              {[
                {name:'Napo-Réflexion',price:'9,95',popular:false,feats:['Fiches clients','Séances & notes','Agenda public','Support email']},
                {name:'Napo-Bâtisseur',price:'19,95',popular:true,feats:['Tout Réflexion','Relances auto','Exports CSV/PDF','Statistiques']},
                {name:'Napo-Visionnaire',price:'29,95',popular:false,feats:['Tout Bâtisseur','Accès prioritaire','Support prioritaire','Onboarding perso']},
              ].map((p,i)=>(
                <div key={i} style={{ position:'relative', padding:26, background:C.white, borderRadius:16, border:p.popular?`2px solid ${C.blue}`:`1px solid ${C.border}` }}>
                  {p.popular&&<span style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)', background:C.blue, color:C.white, fontSize:9, fontWeight:800, padding:'3px 14px', borderRadius:20, letterSpacing:'.5px', whiteSpace:'nowrap' }}>POPULAIRE</span>}
                  <h3 style={{ fontSize:15, fontWeight:800, color:C.navy, marginBottom:10 }}>{p.name}</h3>
                  <div style={{ marginBottom:16 }}>
                    <span style={{ fontSize:30, fontWeight:900, color:C.navy }}>{p.price}€</span>
                    <span style={{ color:C.muted, fontSize:13 }}>/mois</span>
                  </div>
                  <ul style={{ listStyle:'none', padding:0, margin:'0 0 20px' }}>
                    {p.feats.map((f,j)=>(
                      <li key={j} style={{ padding:'5px 0', fontSize:13, display:'flex', alignItems:'center', gap:8, color:'#475569' }}>
                        <i className="ti ti-check" style={{ color:C.blue }}></i>{f}
                      </li>
                    ))}
                  </ul>
                  <a href="#connexion" style={{ display:'block', textAlign:'center', padding:'11px', borderRadius:10, fontSize:13, fontWeight:700, textDecoration:'none', background:p.popular?C.blue:C.navy, color:C.white }}>Commencer</a>
                </div>
              ))}
            </div>
            <p style={{ textAlign:'center', fontSize:12, color:C.muted, marginBottom:36 }}>14 jours d'essai gratuit · Sans CB · Résiliable à tout moment</p>
            <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:16, padding:28 }}>
              <h3 style={{ fontSize:18, fontWeight:800, textAlign:'center', color:C.navy, marginBottom:5 }}>Addons à la carte</h3>
              <p style={{ textAlign:'center', color:C.muted, fontSize:13, marginBottom:24, fontStyle:'italic' }}>Construisez votre Naposolo. Payez ce que vous utilisez vraiment.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
                {[
                  {i:'ti-crystal-ball',n:'NapoOracle',p:'+5€/mois',d:'Consultation oracle/tarot'},
                  {i:'ti-flower',n:'Fleurs de Bach',p:'+3€/mois',d:'Bilan et suivi floral'},
                  {i:'ti-file-type-pdf',n:'Export PDF',p:'+3€/mois',d:'Dossiers clients en PDF'},
                  {i:'ti-message-2',n:'SMS',p:"à l'usage",d:'Crédits à la carte'},
                ].map((a,i)=>(
                  <div key={i} style={{ background:C.blueBg, padding:18, borderRadius:12, border:`1px solid ${C.border}` }}>
                    <i className={`ti ${a.i}`} style={{ color:C.gold, fontSize:22, display:'block', marginBottom:8 }}></i>
                    <div style={{ fontWeight:700, fontSize:14, color:C.navy, marginBottom:3 }}>{a.n}</div>
                    <div style={{ color:C.blue, fontWeight:700, fontSize:12, marginBottom:3 }}>{a.p}</div>
                    <div style={{ color:C.muted, fontSize:12 }}>{a.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background:C.navy, padding:'72px clamp(24px,4vw,48px)', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-100, right:-100, width:280, height:280, background:C.blue, borderRadius:'50%', opacity:.2 }}></div>
          <div style={{ position:'absolute', bottom:-80, left:-60, width:200, height:200, background:C.gold, borderRadius:'50%', opacity:.15 }}></div>
          <div style={{ position:'relative', zIndex:2, maxWidth:600, margin:'0 auto' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6, background:`${C.gold}22`, border:`1px solid ${C.gold}44`, color:C.gold, fontSize:10, fontWeight:700, padding:'4px 14px', borderRadius:20, marginBottom:20, letterSpacing:'.5px' }}>
              <i className="ti ti-flame"></i>Rejoignez les pionniers
            </span>
            <h2 style={{ fontSize:'clamp(24px,3.5vw,36px)', fontWeight:900, color:C.white, marginBottom:12, letterSpacing:'-.4px' }}>{cms.cta_title}</h2>
            <p style={{ fontSize:14, color:C.mutedDark, marginBottom:28, lineHeight:1.6 }}>Fait avec ❤️ à Vandœuvre-lès-Nancy</p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <a href="#connexion" style={{ background:C.blue, color:C.white, padding:'13px 28px', borderRadius:11, fontSize:14, fontWeight:700, textDecoration:'none' }}>Essai gratuit 14j — sans CB</a>
              <a href="#connexion" style={{ background:'transparent', color:C.white, border:'1.5px solid rgba(255,255,255,.25)', padding:'13px 28px', borderRadius:11, fontSize:14, fontWeight:600, textDecoration:'none' }}>Connexion</a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background:C.navyDeep, color:'#94a3b8', padding:'28px 32px', borderTop:'1px solid #0f2233' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:30, height:30, background:C.blue, color:C.white, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, fontSize:16 }}>
                <i className="ti ti-feather"></i>
              </div>
              <div>
                <div style={{ fontWeight:700, color:C.white, fontSize:13 }}>Naposolo — naposolo.com</div>
                <div style={{ fontSize:11, color:'#334155', marginTop:2 }}>Fait avec ❤️ à Vandœuvre-lès-Nancy</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:20, fontSize:12 }}>
              <a href="/cgu" style={{ color:'#334155', textDecoration:'none' }}>CGU</a>
              <a href="/mentions-legales" style={{ color:'#334155', textDecoration:'none' }}>Mentions légales</a>
              <a href="/rgpd" style={{ color:'#334155', textDecoration:'none' }}>RGPD</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
ENDOFFILE
echo "✅ LoginPage.jsx écrit — $(wc -l < ~/napocrm/src/pages/LoginPage.jsx) lignes"
