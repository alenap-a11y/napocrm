import { useState } from 'react'

const CHANGELOG = [
  {
    version: 'Alpha v1.2',
    date: '28 mai 2026',
    tag: 'latest',
    tagLabel: 'Actuelle',
    tagBg: '#E6F4EE', tagColor: '#1A7A4A',
    items: [
      { type: 'new', label: 'Nouveau', text: 'Page Factures complète : création, import/export CSV, filtres, détail par facture.' },
      { type: 'new', label: 'Nouveau', text: 'Dashboard agrandi avec calendrier interactif, RDV du jour, anniversaires clients.' },
      { type: 'new', label: 'Nouveau', text: 'NapoMarketplace : modules IA, experts humains et outils métier.' },
      { type: 'new', label: 'Nouveau', text: 'Pages FAQ, Aide et NewsNapo accessibles depuis la topbar.' },
      { type: 'maj', label: 'Amélioration', text: 'Dashboard en 2 colonnes avec horloge 56px, métriques agrandies.' },
      { type: 'maj', label: 'Amélioration', text: 'Napo+ et Marketplace ajoutés à la sidebar.' },
      { type: 'fix', label: 'Correction', text: 'Clé localStorage versionnée (v2) pour éviter les conflits de sidebar.' },
    ],
  },
  {
    version: 'Alpha v1.1',
    date: '20 mai 2026',
    tag: null,
    items: [
      { type: 'new', label: 'Nouveau', text: 'SimulateurFiscal : calcul charges sociales micro-entrepreneur en temps réel.' },
      { type: 'new', label: 'Nouveau', text: 'Route /fiscal ajoutée à la sidebar avec icône calculatrice.' },
      { type: 'new', label: 'Nouveau', text: 'Napo+ (modules) : Fleurs de Bach, Oracle, Programmes, Facturation Pro, Stats, Rappels, Google Calendar, Formulaires.' },
      { type: 'maj', label: 'Amélioration', text: 'Sidebar : drag & drop pour réordonner les items, panel Perso pour masquer/afficher.' },
      { type: 'maj', label: 'Amélioration', text: 'Topbar : drag & drop, icône œil pour masquer les éléments.' },
      { type: 'fix', label: 'Correction', text: 'Correction du flux Fleurs de Bach et de la SeanceTimeline.' },
    ],
  },
  {
    version: 'Alpha v1.0',
    date: '5 mai 2026',
    tag: 'alpha',
    tagLabel: 'Alpha',
    tagBg: '#FAEEDA', tagColor: '#854F0B',
    items: [
      { type: 'new', label: 'Nouveau', text: 'Première version publique de NapoCRM.' },
      { type: 'new', label: 'Nouveau', text: 'Authentification Supabase : inscription, connexion, déconnexion sécurisée.' },
      { type: 'new', label: 'Nouveau', text: 'Dashboard : horloge, météo, phase de lune, fête du jour, mantra, métriques, clients récents.' },
      { type: 'new', label: 'Nouveau', text: 'Sidebar configurable avec thèmes de couleurs (6 thèmes prédéfinis + couleurs libres).' },
      { type: 'new', label: 'Nouveau', text: 'Section Clients : fiche client, historique de séances.' },
      { type: 'new', label: 'Nouveau', text: 'Section Séances : création, suivi, timeline.' },
      { type: 'new', label: 'Nouveau', text: 'Section Agenda : calendrier mensuel.' },
      { type: 'new', label: 'Nouveau', text: 'Section Notes : prise de notes libre.' },
      { type: 'new', label: 'Nouveau', text: 'Fleurs de Bach : flow complet avec formules personnalisées.' },
      { type: 'new', label: 'Nouveau', text: 'Profil praticien : informations, accessibilité (taille police, modes daltoniens).' },
      { type: 'new', label: 'Nouveau', text: 'Déploiement continu Netlify sur push main.' },
    ],
  },
  {
    version: 'Prototype',
    date: 'Avril 2026',
    tag: 'proto',
    tagLabel: 'Proto',
    tagBg: '#F5F5F5', tagColor: '#6B7280',
    items: [
      { type: 'new', label: 'Nouveau', text: 'Initialisation du projet React + Vite.' },
      { type: 'new', label: 'Nouveau', text: 'Connexion Supabase et structure de base de données.' },
      { type: 'new', label: 'Nouveau', text: 'Design system : variables CSS, thème sombre, typographie, composants de base.' },
      { type: 'new', label: 'Nouveau', text: 'Maquettes et choix de la palette NapoCRM (Navy gold, Violet, Zen sauge…).' },
    ],
  },
]

const ROADMAP = [
  { icon: 'ti-file-invoice', color: '#A05A00', bg: '#FEF3E2', title: 'Facturation PDF', desc: 'Génération de factures PDF avec logo, mentions légales et mise en page personnalisée.', eta: 'Juin 2026' },
  { icon: 'ti-brand-google', color: '#B5221B', bg: '#FEE8E8', title: 'Synchro Google Calendar', desc: 'Synchronisation bidirectionnelle des séances NapoCRM avec Google Calendar.', eta: 'Juin 2026' },
  { icon: 'ti-robot', color: '#534AB7', bg: '#EEEDFE', title: 'Assistant IA Napo', desc: 'Réponses contextualisées à vos questions business et bien-être, intégré à votre espace.', eta: 'Juillet 2026' },
  { icon: 'ti-message-2', color: '#0F7070', bg: '#E6F6F5', title: 'Rappels automatiques SMS', desc: 'Envoi de rappels de séance par SMS ou email avec templates personnalisables.', eta: 'Juillet 2026' },
  { icon: 'ti-chart-bar', color: '#1565A8', bg: '#E8F4FB', title: 'Statistiques avancées', desc: 'Graphiques d\'activité : revenus, fréquence des séances, fidélisation clients, tendances.', eta: 'Août 2026' },
  { icon: 'ti-users-group', color: '#6B35A8', bg: '#F3EEF8', title: 'Mode multi-praticiens', desc: 'Cabinet partagé, gestion d\'équipe, accès par rôle et agenda commun.', eta: '2027' },
]

const TYPE_STYLE = {
  new:  { bg: '#E6F4EE', color: '#1A7A4A', label: 'Nouveau' },
  maj:  { bg: '#E6F1FB', color: '#185FA5', label: 'Amélioration' },
  fix:  { bg: '#FAEEDA', color: '#854F0B', label: 'Correction' },
}

export default function NewsNapo() {
  const [activeTab, setActiveTab] = useState('changelog')

  const TABS = [
    { id: 'changelog', label: 'Historique versions', icon: 'ti-git-branch' },
    { id: 'roadmap',   label: 'Roadmap',             icon: 'ti-map-2' },
  ]

  return (
    <div style={{ fontFamily: 'inherit', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1B2D4F 0%, #243B67 60%, #2E4D85 100%)', padding: '32px 32px 36px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-speakerphone" style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
              News <span style={{ color: '#7BA7E8' }}>NapoCRM</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>Historique des versions · Roadmap · Évolutions à venir</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 28, marginTop: 22 }}>
          {[
            { icon: 'ti-git-commit', label: 'Alpha v1.2', sub: 'Version actuelle' },
            { icon: 'ti-calendar', label: 'Avril 2026', sub: 'Début du projet' },
            { icon: 'ti-rocket', label: '4 versions', sub: 'Publiées' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 14, color: '#7BA7E8' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 32px', borderBottom: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', display: 'flex' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13,
            fontWeight: activeTab === tab.id ? 600 : 400,
            color: activeTab === tab.id ? '#185FA5' : 'var(--color-text-secondary)',
            borderBottom: activeTab === tab.id ? '2px solid #185FA5' : '2px solid transparent',
            marginBottom: -1, transition: 'color 0.12s',
          }}>
            <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} />{tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '28px 32px' }}>

        {/* ── CHANGELOG ─────────────────────────────────── */}
        {activeTab === 'changelog' && (
          <div style={{ maxWidth: 720 }}>
            {CHANGELOG.map((release, ri) => (
              <div key={release.version} style={{ display: 'flex', gap: 20, marginBottom: 36 }}>

                {/* Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: ri === 0 ? '#1A7A4A' : 'var(--color-border-secondary)', border: `2px solid ${ri === 0 ? '#1A7A4A' : 'var(--color-border-tertiary)'}`, marginTop: 4 }} />
                  {ri < CHANGELOG.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--color-border-tertiary)', marginTop: 6 }} />}
                </div>

                {/* Contenu */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>{release.version}</span>
                    {release.tag && (
                      <span style={{ fontSize: 10, fontWeight: 600, background: release.tagBg, color: release.tagColor, padding: '2px 8px', borderRadius: 20 }}>{release.tagLabel}</span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>{release.date}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {release.items.map((item, ii) => {
                      const s = TYPE_STYLE[item.type]
                      return (
                        <div key={ii} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, background: s.bg, color: s.color, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap', marginTop: 1 }}>{s.label}</span>
                          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{item.text}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ROADMAP ─────────────────────────────────── */}
        {activeTab === 'roadmap' && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.6, maxWidth: 600 }}>
              Les fonctionnalités ci-dessous sont en cours de développement ou planifiées. Les dates sont indicatives et peuvent évoluer. Votez pour vos priorités via le support.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {ROADMAP.map(item => (
                <div key={item.title} style={{ padding: '18px 20px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${item.icon}`} style={{ fontSize: 20, color: item.color }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, background: '#E6F1FB', color: '#185FA5', padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                      {item.eta}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 5 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 28, padding: '18px 22px', borderRadius: 12, background: '#EEF3FB', border: '0.5px solid #7BA7E8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1A2E', marginBottom: 3 }}>Une fonctionnalité manque ?</div>
                <div style={{ fontSize: 12, color: '#185FA5' }}>Proposez vos idées — nous construisons NapoCRM avec les praticiens.</div>
              </div>
              <a href="mailto:idees@napocrm.fr" style={{ flexShrink: 0, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Suggérer
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
