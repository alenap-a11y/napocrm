import { useState } from 'react'

const GUIDES = [
  {
    icon: 'ti-rocket',
    bg: '#E6F1FB', color: '#185FA5',
    title: 'Guide de démarrage rapide',
    steps: [
      { num: '01', label: 'Créez votre profil', desc: 'Renseignez vos informations praticien : nom, spécialité, SIRET, adresse. Ces données alimentent vos factures et documents.' },
      { num: '02', label: 'Ajoutez vos premiers clients', desc: 'Section "Clients" → "+ Nouveau client". Importez une liste CSV si vous en avez déjà une.' },
      { num: '03', label: 'Planifiez vos séances', desc: 'Créez vos RDV depuis le dashboard (calendrier) ou la section "Séances → Nouvelle séance".' },
      { num: '04', label: 'Personnalisez votre espace', desc: 'Couleurs, thèmes, widgets dashboard, ordre de la sidebar — tout est configurable dans "Réglages".' },
    ],
  },
]

const RESSOURCES = [
  { icon: 'ti-video', color: '#534AB7', bg: '#EEEDFE', title: 'Tutoriels vidéo', desc: 'Guides pas-à-pas en vidéo : prise en main, facturation, agenda, Fleurs de Bach. Nouvelle vidéo chaque semaine.', cta: 'Accéder aux vidéos', href: '#' },
  { icon: 'ti-book', color: '#0F6E56', bg: '#E1F5EE', title: 'Documentation complète', desc: 'Toute la documentation technique et fonctionnelle de NapoCRM : guides, référence, intégrations et API.', cta: 'Lire la documentation', href: '#' },
  { icon: 'ti-brand-youtube', color: '#993C1D', bg: '#FAECE7', title: 'Chaîne YouTube', desc: 'Abonnez-vous à la chaîne NapoCRM Official pour les nouveautés, astuces et retours d\'expérience praticiens.', cta: 'Voir la chaîne', href: '#' },
]

const SUPPORT_ITEMS = [
  {
    icon: 'ti-mail',
    color: '#185FA5', bg: '#E6F1FB',
    title: 'Email support',
    desc: 'support@napocrm.fr',
    sub: 'Réponse sous 24h en jours ouvrés. Joignez une capture d\'écran si possible.',
    cta: 'Envoyer un email',
    href: 'mailto:support@napocrm.fr',
  },
  {
    icon: 'ti-message-circle',
    color: '#0F6E56', bg: '#E1F5EE',
    title: 'Chat en direct',
    desc: 'Réservé aux abonnés Plan Napoléon',
    sub: 'Accès au chat en temps réel depuis votre profil. Disponible 9h–18h du lundi au vendredi.',
    cta: 'Ouvrir le chat',
    href: '#',
  },
  {
    icon: 'ti-bug',
    color: '#854F0B', bg: '#FAEEDA',
    title: 'Signaler un bug',
    desc: 'bugs@napocrm.fr',
    sub: 'Décrivez le problème, l\'écran sur lequel il apparaît et les étapes pour le reproduire.',
    cta: 'Signaler',
    href: 'mailto:bugs@napocrm.fr',
  },
]

const RACCOURCIS = [
  { keys: ['Ctrl', 'F'], desc: 'Ouvrir la recherche globale' },
  { keys: ['Échap'], desc: 'Fermer un panneau ou modal' },
  { keys: ['Tab'], desc: 'Naviguer entre les champs' },
  { keys: ['Entrée'], desc: 'Valider un formulaire ou bouton actif' },
]

export default function Aide() {
  const [activeTab, setActiveTab] = useState('demarrage')

  const TABS = [
    { id: 'demarrage', label: 'Démarrage', icon: 'ti-rocket' },
    { id: 'ressources', label: 'Ressources', icon: 'ti-books' },
    { id: 'support', label: 'Support', icon: 'ti-lifebuoy' },
    { id: 'raccourcis', label: 'Raccourcis', icon: 'ti-keyboard' },
  ]

  return (
    <div style={{ fontFamily: 'inherit', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #085041 0%, #0F6E56 60%, #1D9E75 100%)', padding: '32px 32px 36px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-lifebuoy" style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Centre d'aide</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>Guides, ressources et support — tout pour bien utiliser NapoCRM</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 32px', borderBottom: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', display: 'flex', gap: 0 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13,
            fontWeight: activeTab === tab.id ? 600 : 400,
            color: activeTab === tab.id ? '#0F6E56' : 'var(--color-text-secondary)',
            borderBottom: activeTab === tab.id ? '2px solid #0F6E56' : '2px solid transparent',
            marginBottom: -1, transition: 'color 0.12s', whiteSpace: 'nowrap',
          }}>
            <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} />
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '28px 32px' }}>

        {/* ── DÉMARRAGE ─────────────────────────────────── */}
        {activeTab === 'demarrage' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 20 }}>Guide de démarrage rapide</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {GUIDES[0].steps.map(step => (
                <div key={step.num} style={{ display: 'flex', gap: 16, padding: '16px 20px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E1F5EE', color: '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {step.num}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>{step.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 28, padding: '18px 22px', borderRadius: 12, background: '#E1F5EE', border: '0.5px solid #1D9E75' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#085041', marginBottom: 6 }}>💡 Astuce</div>
              <div style={{ fontSize: 13, color: '#0F6E56', lineHeight: 1.6 }}>
                Glissez-déposez les icônes de la sidebar et de la topbar pour les réorganiser selon votre flux de travail. Utilisez "Perso" en bas de la sidebar pour masquer les sections que vous n'utilisez pas.
              </div>
            </div>
          </div>
        )}

        {/* ── RESSOURCES ─────────────────────────────────── */}
        {activeTab === 'ressources' && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 20 }}>Ressources disponibles</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {RESSOURCES.map(r => (
                <div key={r.title} style={{ padding: '20px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`ti ${r.icon}`} style={{ fontSize: 20, color: r.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>{r.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{r.desc}</div>
                  </div>
                  <a href={r.href} style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: r.color, textDecoration: 'none' }}>
                    {r.cta} <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUPPORT ─────────────────────────────────── */}
        {activeTab === 'support' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 20 }}>Contacter le support</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SUPPORT_ITEMS.map(item => (
                <div key={item.title} style={{ display: 'flex', gap: 16, padding: '18px 20px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', alignItems: 'flex-start' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${item.icon}`} style={{ fontSize: 20, color: item.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: item.color, marginBottom: 4 }}>{item.desc}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{item.sub}</div>
                  </div>
                  <a href={item.href} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 8, border: `0.5px solid ${item.color}44`, background: item.bg, color: item.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    {item.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RACCOURCIS ─────────────────────────────────── */}
        {activeTab === 'raccourcis' && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 20 }}>Raccourcis clavier</div>
            <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden' }}>
              {RACCOURCIS.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderBottom: i < RACCOURCIS.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{r.desc}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {r.keys.map(k => (
                      <kbd key={k} style={{ padding: '3px 8px', borderRadius: 6, background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              D'autres raccourcis seront ajoutés dans les prochaines versions. Vous pouvez suggérer vos raccourcis favoris via le support.
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
