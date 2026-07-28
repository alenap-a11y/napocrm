import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TABS = ['Tous', 'Intelligence Artificielle', 'Experts', 'Outils', 'Modules & Addons']

/* ── IA ─────────────────────────────────────────────────────────── */
const IA_ITEMS = [
  {
    id: 'assistant',
    icon: 'ti-robot',
    iconBg: '#EEEDFE',
    iconColor: '#534AB7',
    title: 'Assistant Napo IA',
    description: 'Posez vos questions business, bien-être ou admin. L\'IA répond en contexte NapoCRM avec votre activité comme référence.',
    badge: 'Bientôt',
    badgeBg: '#E6F4EE',
    badgeColor: '#1A7A4A',
    price: null,
    cta: 'Bientôt disponible',
    status: 'active',
  },
  {
    id: 'documents',
    icon: 'ti-file-text-ai',
    iconBg: '#FEF3E2',
    iconColor: '#A05A00',
    title: 'Générateur de documents',
    description: 'CGV, contrats de séance, formulaires de consentement, modèles de factures — générés et personnalisés par IA en 30 secondes.',
    badge: 'Bientôt',
    badgeBg: '#EEEDFE',
    badgeColor: '#534AB7',
    price: '3,99 €/mois',
    cta: 'Bientôt disponible',
    status: 'available',
  },
  {
    id: 'analyse',
    icon: 'ti-chart-dots',
    iconBg: '#E8F4FB',
    iconColor: '#1565A8',
    title: 'Analyse client IA',
    description: 'L\'IA identifie les tendances dans vos séances, prédit les risques de désengagement et suggère des actions de suivi personnalisées.',
    badge: 'Bientôt',
    badgeBg: '#EEEDFE',
    badgeColor: '#534AB7',
    price: '4,99 €/mois',
    cta: 'Bientôt disponible',
    status: 'available',
  },
  {
    id: 'notes',
    icon: 'ti-notes',
    iconBg: '#E6F6F5',
    iconColor: '#0F7070',
    title: 'Notes intelligentes',
    description: 'Dictez vos notes de séance, l\'IA les structure automatiquement, extrait les points clés et complète la fiche client.',
    badge: 'Bientôt',
    badgeBg: '#F5F5F5',
    badgeColor: '#6B7280',
    price: null,
    cta: 'Bientôt',
    status: 'soon',
  },
  {
    id: 'contenu',
    icon: 'ti-pencil-spark',
    iconBg: '#FDF0F6',
    iconColor: '#9B2166',
    title: 'Création de contenu',
    description: 'Posts Instagram, newsletters, articles de blog — l\'IA génère du contenu aligné avec votre pratique et votre ton.',
    badge: 'Bientôt',
    badgeBg: '#F5F5F5',
    badgeColor: '#6B7280',
    price: null,
    cta: 'Bientôt',
    status: 'soon',
  },
  {
    id: 'tarification',
    icon: 'ti-coin',
    iconBg: '#FEF3E2',
    iconColor: '#7A4500',
    title: 'Optimisation tarifaire',
    description: 'L\'IA analyse votre marché local, votre taux de remplissage et vos charges pour vous recommander une grille tarifaire optimale.',
    badge: 'Bientôt',
    badgeBg: '#EEEDFE',
    badgeColor: '#534AB7',
    price: '2,99 €/mois',
    cta: 'Bientôt disponible',
    status: 'available',
  },
]

/* ── EXPERTS ────────────────────────────────────────────────────── */
const EXPERTS = [
  {
    id: 'juridique',
    icon: 'ti-gavel',
    iconBg: '#EEEDFE',
    iconColor: '#3C3489',
    initials: 'AT',
    name: 'Antoine',
    role: 'Juriste d\'entreprise',
    sub: 'CGV · Contrats · RGPD · Micro-entreprise · 20 ans d\'exp.',
  },
  {
    id: 'fiscalite',
    icon: 'ti-receipt-tax',
    iconBg: '#FAEEDA',
    iconColor: '#633806',
    initials: 'MR',
    name: 'Marie',
    role: 'Experte fiscalité',
    sub: 'TVA · Cotisations · Déclarations · Optimisation · 15 ans d\'exp.',
  },
  {
    id: 'finance',
    icon: 'ti-chart-line',
    iconBg: '#E1F5EE',
    iconColor: '#085041',
    initials: 'TL',
    name: 'Thomas',
    role: 'Conseiller financier',
    sub: 'Trésorerie · Prévisionnel · Financement · Épargne · 18 ans d\'exp.',
  },
  {
    id: 'marketing',
    icon: 'ti-speakerphone',
    iconBg: '#FAECE7',
    iconColor: '#712B13',
    initials: 'SB',
    name: 'Sophie',
    role: 'Stratège marketing',
    sub: 'Positionnement · Offre · Acquisition · Tunnel de vente · 12 ans d\'exp.',
  },
  {
    id: 'web',
    icon: 'ti-world',
    iconBg: '#E6F1FB',
    iconColor: '#0C447C',
    initials: 'KD',
    name: 'Kevin',
    role: 'Développeur web freelance',
    sub: 'Site vitrine · SEO · No-code · Performance · 10 ans d\'exp.',
  },
  {
    id: 'reseaux',
    icon: 'ti-brand-instagram',
    iconBg: '#FBEAF0',
    iconColor: '#72243E',
    initials: 'LM',
    name: 'Léa',
    role: 'Community manager',
    sub: 'Instagram · LinkedIn · TikTok · Contenu · Croissance · 8 ans d\'exp.',
  },
  {
    id: 'boutique',
    icon: 'ti-shopping-bag',
    iconBg: '#FAEEDA',
    iconColor: '#412402',
    initials: 'PV',
    name: 'Pierre',
    role: 'Expert e-commerce',
    sub: 'Shopify · Produits · Pricing · Conversions · 14 ans d\'exp.',
  },
  {
    id: 'formation',
    icon: 'ti-school',
    iconBg: '#EAF3DE',
    iconColor: '#27500A',
    initials: 'NC',
    name: 'Nadia',
    role: 'Formatrice & coach pédagogique',
    sub: 'Création de formations · Qualiopi · Vente · Plateformes · 16 ans d\'exp.',
  },
]

const FORMULES = [
  {
    key: 'ia',
    chips: ['IA seule'],
    name: 'Accès limité',
    price: '5€',
    period: '/mois',
    features: () => ['5 questions/mois', 'Réponse instantanée', 'Historique 30 jours'],
    featured: false,
  },
  {
    key: 'ia-full',
    chips: ['IA seule'],
    name: 'Accès illimité',
    price: '12€',
    period: '/mois',
    features: () => ['Questions illimitées', 'Réponses détaillées', 'Historique complet'],
    featured: false,
  },
  {
    key: 'starter',
    chips: ['IA', '+ Expert'],
    name: 'Starter',
    price: '49€',
    period: '/mois',
    features: (e) => [
      `${e.name} illimité(e)`,
      '4 emails expert/mois',
      '1 document rédigé',
      '30 min visio ou appel',
    ],
    featured: true,
  },
  {
    key: 'mensuel',
    chips: ['IA', '+ Expert'],
    name: 'Accompagnement',
    price: '—',
    period: 'sur devis',
    features: (e) => [
      `${e.name} illimité(e)`,
      '1 document/mois',
      '1h/mois avec l\'expert',
    ],
    featured: false,
  },
]

/* ── OUTILS ────────────────────────────────────────────────────── */
const OUTILS = [
  {
    id: 'rappels',
    icon: 'ti-message-2',
    iconBg: '#E6F6F5',
    iconColor: '#0F7070',
    title: 'Rappels automatiques',
    description: 'SMS et emails de rappel de séance, réduction des no-shows, messages post-séance automatisés.',
    price: '2,99 €/mois + SMS',
    status: 'available',
  },
  {
    id: 'gcal',
    icon: 'ti-brand-google',
    iconBg: '#FEE8E8',
    iconColor: '#B5221B',
    title: 'Synchro Google Calendar',
    description: 'Synchronisez vos séances NapoCRM avec Google Calendar en temps réel.',
    price: '3,99 €/mois',
    status: 'available',
  },
  {
    id: 'formulaires',
    icon: 'ti-clipboard-list',
    iconBg: '#FDF0F6',
    iconColor: '#9B2166',
    title: 'Formulaires d\'intake',
    description: 'Questionnaires pré-séance envoyés automatiquement, réponses intégrées à la fiche client.',
    price: '3,99 €/mois',
    status: 'available',
  },
  {
    id: 'stats',
    icon: 'ti-chart-bar',
    iconBg: '#E8F4FB',
    iconColor: '#1565A8',
    title: 'Statistiques avancées',
    description: 'Graphiques détaillés : revenus, fréquence des séances, fidélisation clients et tendances.',
    price: '3,99 €/mois',
    status: 'available',
  },
  {
    id: 'facturation',
    icon: 'ti-file-invoice',
    iconBg: '#FEF3E2',
    iconColor: '#A05A00',
    title: 'Facturation Pro',
    description: 'Factures PDF personnalisées, suivi des paiements, relances automatiques, export comptable.',
    price: '4,99 €/mois',
    status: 'available',
  },
  {
    id: 'programmes',
    icon: 'ti-route',
    iconBg: '#E6F4EE',
    iconColor: '#1A7A4A',
    title: 'Programmes de soin',
    description: 'Parcours multi-séances structurés, assignés à vos clients avec suivi de progression.',
    price: '6,99 €/mois',
    status: 'available',
  },
]

const chipStyle = (label) => ({
  fontSize: 10,
  fontWeight: 500,
  padding: '2px 7px',
  borderRadius: 20,
  background: label === '+ Expert' ? '#E1F5EE' : '#EEEDFE',
  color: label === '+ Expert' ? '#0F6E56' : '#534AB7',
})

export default function NapoMarketplace() {
  const [activeTab, setActiveTab] = useState('Tous')
  const [activeExpert, setActiveExpert] = useState('juridique')
  const [suggModal, setSuggModal] = useState(false)
  const [suggText, setSuggText] = useState('')
  const [modules, setModules] = useState([])
  useEffect(() => {
    supabase.from('marketplace_modules').select('*').eq('visible', true).order('position').then(({ data }) => {
      if (data) setModules(data)
    })
  }, [])
  const modulesByCategory = modules.reduce((acc, m) => {
    (acc[m.category] = acc[m.category] || []).push(m)
    return acc
  }, {})

  function sendSuggestion() {
    if (!suggText.trim()) return
    const subject = encodeURIComponent('Suggestion Napo Marketplace')
    const body = encodeURIComponent(suggText.trim())
    window.location.href = `mailto:alessandrelli.fr@gmail.com?subject=${subject}&body=${body}`
    setSuggModal(false)
    setSuggText('')
  }

  const expert = EXPERTS.find(e => e.id === activeExpert)

  const showIA = activeTab === 'Tous' || activeTab === 'Intelligence Artificielle'
  const showExperts = activeTab === 'Tous' || activeTab === 'Experts'
  const showOutils = activeTab === 'Tous' || activeTab === 'Outils'
  const showModules = activeTab === 'Tous' || activeTab === 'Modules & Addons'

  return (
    <div style={{ fontFamily: 'inherit', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0F1A2E 0%, #1B2D4F 50%, #243B67 100%)',
        padding: '36px 32px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: '35%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-building-store" style={{ fontSize: 20, color: '#fff' }} aria-hidden="true" />
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
              Napo <span style={{ color: '#7BA7E8' }}>Marketplace</span>
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, background: '#7BA7E8', color: '#0F1A2E', padding: '2px 8px', borderRadius: 20 }}>
              BÊTA
            </span>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0, maxWidth: 520, lineHeight: 1.6 }}>
            IA, experts humains et outils métier — tout ce dont un praticien du bien-être a besoin, au même endroit.
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 22 }}>
            {[
              { icon: 'ti-robot', label: 'IA intégrée' },
              { icon: 'ti-users', label: '8 experts disponibles' },
              { icon: 'ti-puzzle', label: '6 outils métier' },
              { icon: 'ti-shield-check', label: 'Sans engagement' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 13, color: '#7BA7E8' }} aria-hidden="true" />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 32px', borderBottom: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', display: 'flex', gap: 0 }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '12px 16px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: activeTab === tab ? 600 : 400,
            color: activeTab === tab ? '#185FA5' : 'var(--color-text-secondary)',
            borderBottom: activeTab === tab ? '2px solid #185FA5' : '2px solid transparent',
            marginBottom: -1,
            transition: 'color 0.12s',
            whiteSpace: 'nowrap',
          }}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ── SECTION IA ─────────────────────────────────────────── */}
        {showIA && (
          <section>
            <SectionHeader icon="ti-robot" color="#534AB7" bg="#EEEDFE" label="Intelligence Artificielle" sub="Des outils IA pensés pour les praticiens du bien-être" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginTop: 18 }}>
              {IA_ITEMS.map(item => (
                <IACard key={item.id} item={item} onNavigate={(path) => { window.location.hash = path }} />
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION EXPERTS ────────────────────────────────────── */}
        {showExperts && (
          <section>
            <SectionHeader icon="ti-users" color="#0F6E56" bg="#E1F5EE" label="Experts humains" sub="Questions complexes, réponses d'experts — IA + humain selon votre formule" />

            {/* Grille experts */}
            <div style={{
              marginTop: 18,
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 12,
              background: 'var(--color-background-primary)',
              overflow: 'hidden',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                {EXPERTS.map((e, i) => {
                  const isActive = activeExpert === e.id
                  const borderRight = (i + 1) % 4 !== 0
                  const borderBottom = i < 4
                  return (
                    <button key={e.id} onClick={() => setActiveExpert(e.id)} style={{
                      padding: '11px 6px',
                      fontSize: 12,
                      border: 'none',
                      borderRight: borderRight ? '0.5px solid var(--color-border-tertiary)' : 'none',
                      borderBottom: borderBottom ? '0.5px solid var(--color-border-tertiary)' : 'none',
                      borderTop: 'none', borderLeft: 'none',
                      background: isActive ? 'var(--color-background-secondary)' : 'transparent',
                      color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      fontWeight: isActive ? 500 : 400,
                      cursor: 'pointer',
                      boxShadow: isActive ? 'inset 0 -2px 0 #185FA5' : 'none',
                      transition: 'background 0.12s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                      <i className={`ti ${e.icon}`} style={{ fontSize: 16 }} aria-hidden="true" />
                      {e.name}
                    </button>
                  )
                })}
              </div>

              {/* Détail expert sélectionné */}
              <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: expert.iconBg, color: expert.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, flexShrink: 0 }}>
                  {expert.initials}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: 'var(--color-text-primary)' }}>{expert.name} — {expert.role}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>{expert.sub}</p>
                </div>
              </div>

              {/* Formules */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: 20 }}>
                {FORMULES.map(plan => (
                  <div key={plan.key} style={{
                    border: plan.featured ? '1.5px solid #AFA9EC' : '0.5px solid var(--color-border-tertiary)',
                    borderRadius: 12,
                    padding: '14px 14px 12px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                    background: 'var(--color-background-primary)',
                  }}>
                    {plan.featured && (
                      <span style={{ fontSize: 10, fontWeight: 500, background: '#EEEDFE', color: '#534AB7', padding: '2px 8px', borderRadius: 20, width: 'fit-content' }}>
                        Recommandé
                      </span>
                    )}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {plan.chips.map(c => <span key={c} style={chipStyle(c)}>{c}</span>)}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: 'var(--color-text-primary)' }}>{plan.name}</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1 }}>{plan.price}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{plan.period}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
                      {plan.features(expert).map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                          <i className="ti ti-check" style={{ fontSize: 12, color: '#1D9E75', flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                          {f}
                        </div>
                      ))}
                    </div>
                    <button style={{ marginTop: 4, padding: '7px 0', fontSize: 12, cursor: 'pointer', borderRadius: 8, width: '100%', border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)' }}>
                      {plan.key === 'mensuel' ? 'Contacter' : 'Bientôt disponible'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION MODULES & ADDONS ────────────────────────────── */}
        {showModules && (
          <section>
            <SectionHeader icon="ti-apps" color="#185FA5" bg="#E8F1FB" label="Modules & Addons" sub="Vos metiers et outils Naposolo, activables a la carte" />
            {Object.entries(modulesByCategory).map(([cat, items]) => (
              <div key={cat} style={{ marginTop: 18 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>{cat}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {items.map(m => (
                    <div key={m.id} style={{
                      border: '0.5px solid var(--color-border-tertiary)',
                      borderRadius: 12,
                      padding: 16,
                      display: 'flex', flexDirection: 'column', gap: 8,
                      background: 'var(--color-background-primary)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: m.icon_bg || '#EEEDFE', color: m.icon_color || '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={`ti ${m.icon}`} style={{ fontSize: 18 }} aria-hidden="true" />
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: 'var(--color-text-primary)' }}>{m.title}</p>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, flex: 1 }}>{m.description}</p>
                      <button
                        disabled={m.status !== 'available'}
                        style={{
                          marginTop: 4, padding: '7px 0', fontSize: 12,
                          cursor: m.status === 'available' ? 'pointer' : 'default',
                          borderRadius: 8, width: '100%',
                          border: m.status === 'available' ? 'none' : '0.5px solid var(--color-border-secondary)',
                          background: m.status === 'available' ? '#185FA5' : 'transparent',
                          color: m.status === 'available' ? '#fff' : 'var(--color-text-secondary)',
                        }}
                        onClick={() => { if (m.status === 'available' && m.path) window.location.hash = m.path }}
                      >
                        {m.cta}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── SECTION OUTILS ─────────────────────────────────────── */}
        {showOutils && (
          <section>
            <SectionHeader icon="ti-puzzle" color="#A05A00" bg="#FEF3E2" label="Outils métier" sub="Automatisation, facturation, statistiques — tout ce qui fait gagner du temps" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginTop: 18 }}>
              {OUTILS.map(outil => (
                <OutilCard key={outil.id} outil={outil} />
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Footer suggestion */}
      <div style={{ margin: '0 32px 32px', padding: '20px 24px', borderRadius: 12, background: '#EEF3FB', border: '0.5px solid #7BA7E8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1A2E', marginBottom: 3 }}>Une idée pour la Marketplace ?</div>
          <div style={{ fontSize: 12, color: '#185FA5' }}>Dites-nous ce qui vous ferait gagner du temps — nous construisons avec vos retours.</div>
        </div>
        <button onClick={() => setSuggModal(true)} style={{ flexShrink: 0, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Faire une suggestion
        </button>
      </div>

      {/* Modal suggestion */}
      {suggModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={e => e.target === e.currentTarget && setSuggModal(false)}>
          <div style={{ background: 'var(--color-background-primary)', borderRadius: 16, width: 460, maxWidth: '95vw', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Faire une suggestion</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Votre idée sera envoyée directement à l'équipe Napo.</div>
              </div>
              <button onClick={() => setSuggModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--color-text-secondary)', lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <textarea
              autoFocus
              value={suggText}
              onChange={e => setSuggText(e.target.value)}
              placeholder="Décrivez votre idée ou ce qui vous ferait gagner du temps…"
              rows={5}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setSuggModal(false)}
                style={{ padding: '8px 18px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={sendSuggestion} disabled={!suggText.trim()}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: suggText.trim() ? '#185FA5' : 'var(--color-border-secondary)', color: suggText.trim() ? '#fff' : 'var(--color-text-secondary)', fontSize: 13, fontWeight: 600, cursor: suggText.trim() ? 'pointer' : 'default' }}>
                <i className="ti ti-send" style={{ marginRight: 6 }} />Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ icon, color, bg, label, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 18, color }} aria-hidden="true" />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{sub}</div>
      </div>
    </div>
  )
}

function IACard({ item, onNavigate }) {
  const [hovered, setHovered] = useState(false)
  const isSoon = item.status === 'soon'
  const isActive = item.status === 'active'
  return (
    <div
      style={{
        background: 'var(--color-background-primary)',
        border: `0.5px solid ${hovered && !isSoon ? '#7BA7E8' : 'var(--color-border-tertiary)'}`,
        borderRadius: 12, padding: '18px 20px',
        display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: hovered && !isSoon ? '0 2px 12px rgba(24,95,165,0.1)' : 'none',
        opacity: isSoon ? 0.7 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ${item.icon}`} style={{ fontSize: 20, color: item.iconColor }} aria-hidden="true" />
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, background: item.badgeBg, color: item.badgeColor, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
          {item.badge}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 5 }}>{item.title}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.description}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#1A7A4A' : 'var(--color-text-primary)' }}>
          
        </div>
        <button
          disabled={isSoon}
          style={{ padding: '6px 14px', borderRadius: 7, border: isActive ? '0.5px solid #1A7A4A' : 'none', background: isSoon ? '#F5F5F5' : isActive ? 'transparent' : '#534AB7', color: isSoon ? '#9CA3AF' : isActive ? '#1A7A4A' : '#fff', fontSize: 12, fontWeight: 600, cursor: isSoon ? 'default' : 'pointer' }}>
          {item.cta}
        </button>
      </div>
    </div>
  )
}

function OutilCard({ outil }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        background: 'var(--color-background-primary)',
        border: `0.5px solid ${hovered ? '#7BA7E8' : 'var(--color-border-tertiary)'}`,
        borderRadius: 12, padding: '18px 20px',
        display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: hovered ? '0 2px 12px rgba(24,95,165,0.08)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: outil.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ${outil.icon}`} style={{ fontSize: 20, color: outil.iconColor }} aria-hidden="true" />
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, background: '#EEEDFE', color: '#534AB7', padding: '3px 8px', borderRadius: 20 }}>
          Bientôt
        </span>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 5 }}>{outil.title}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{outil.description}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}></div>
        <button style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#534AB7', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Bientôt disponible
        </button>
      </div>
    </div>
  )
}
