import { useState } from 'react'

const SECTIONS = [
  {
    title: 'Premiers pas',
    icon: 'ti-rocket',
    color: '#185FA5',
    bg: '#E6F1FB',
    items: [
      {
        q: 'Comment créer mon compte NapoCRM ?',
        a: 'Rendez-vous sur l\'application et cliquez sur "Créer un compte". Renseignez votre prénom, email et mot de passe. Un email de confirmation vous sera envoyé. Une fois validé, vous accédez directement à votre espace praticien.',
      },
      {
        q: 'Comment configurer mon profil praticien ?',
        a: 'Accédez à votre profil via l\'icône en bas de la sidebar. Vous pouvez y renseigner votre nom, prénom, spécialité, SIRET, adresse professionnelle et photo. Ces informations apparaîtront sur vos factures et documents.',
      },
      {
        q: 'Comment personnaliser l\'apparence de NapoCRM ?',
        a: 'Cliquez sur "Réglages" en bas de la sidebar. Vous pouvez choisir la couleur accent, la couleur de fond de la sidebar, appliquer un thème prédéfini, activer ou désactiver les widgets du dashboard et ajuster la taille de la police.',
      },
    ],
  },
  {
    title: 'Clients',
    icon: 'ti-users',
    color: '#0F6E56',
    bg: '#E1F5EE',
    items: [
      {
        q: 'Comment ajouter un nouveau client ?',
        a: 'Depuis la section "Clients" dans la sidebar, cliquez sur le bouton "+ Nouveau client" en haut à droite. Renseignez les informations (nom, prénom, email, téléphone, date de naissance, spécialité suivie). La fiche est sauvegardée automatiquement.',
      },
      {
        q: 'Comment retrouver rapidement un client ?',
        a: 'Utilisez la barre de recherche en haut de la topbar (icône loupe) ou le filtre dans la section Clients. Vous pouvez filtrer par nom, spécialité, statut ou date de dernière séance.',
      },
      {
        q: 'Peut-on archiver un client inactif ?',
        a: 'Oui. Depuis la fiche client, cliquez sur le menu "…" puis "Archiver". Le client n\'apparaîtra plus dans votre liste principale mais reste accessible via le filtre "Archivés". Ses données et l\'historique de séances sont conservés.',
      },
      {
        q: 'Les données clients sont-elles sécurisées ?',
        a: 'Oui. Toutes les données sont hébergées sur Supabase (infrastructure EU, Frankfurt) avec chiffrement en transit (TLS 1.3) et au repos (AES-256). NapoCRM est conforme au RGPD — vos clients peuvent exercer leur droit d\'accès et d\'effacement à tout moment.',
      },
    ],
  },
  {
    title: 'Séances & Agenda',
    icon: 'ti-calendar-event',
    color: '#854F0B',
    bg: '#FAEEDA',
    items: [
      {
        q: 'Comment créer une nouvelle séance ?',
        a: 'Via la sidebar, cliquez sur "Séances" puis "+ Nouvelle séance". Sélectionnez le client, la date, l\'heure, la durée et le type de séance. Vous pouvez aussi ajouter des notes et marquer la séance comme payée directement.',
      },
      {
        q: 'Comment ajouter un RDV depuis le dashboard ?',
        a: 'Pour ajouter un rendez-vous, rendez-vous dans la page Agenda (menu de navigation) et cliquez sur le bouton d\'ajout. Renseignez le client, le type de séance, l\'heure et la durée. Le RDV apparaît immédiatement dans le calendrier.',
      },
      {
        q: 'Peut-on synchroniser avec Google Calendar ?',
        a: 'La synchronisation Google Calendar est disponible via le module Napo+ Marketplace. Une fois activé (3,99 €/mois), vos séances NapoCRM apparaissent automatiquement dans votre agenda Google, et inversement.',
      },
    ],
  },
  {
    title: 'Facturation',
    icon: 'ti-file-invoice',
    color: '#6B35A8',
    bg: '#F3EEF8',
    items: [
      {
        q: 'Comment créer une facture ?',
        a: 'Dans la section "Factures", cliquez sur "+ Nouvelle facture". Sélectionnez le client dans la liste, renseignez la date, l\'échéance, le montant et une description. La facture est numérotée automatiquement (FAC-ANNÉE-NNN).',
      },
      {
        q: 'Comment exporter mes factures ?',
        a: 'Depuis la section Factures, cliquez sur "Exporter CSV" pour télécharger toutes vos factures au format tableur. Vous pouvez aussi exporter une facture individuelle via le bouton de téléchargement sur chaque ligne ou dans le détail de la facture.',
      },
      {
        q: 'Comment importer des factures existantes ?',
        a: 'Cliquez sur "Importer" dans la section Factures et sélectionnez un fichier CSV. Le format attendu est : Numéro, Client, Date, Échéance, Montant, Statut, Description. Les factures importées s\'ajoutent à votre liste existante.',
      },
      {
        q: 'Comment marquer une facture comme payée ?',
        a: 'Cliquez sur une facture pour ouvrir son détail, puis sur "Changer statut" pour faire tourner le statut entre En attente, Payée et En retard. Vous pouvez aussi choisir le statut directement lors de la création.',
      },
    ],
  },
  {
    title: 'Abonnement & Compte',
    icon: 'ti-credit-card',
    color: '#993556',
    bg: '#FBEAF0',
    items: [
      {
        q: 'Quels sont les plans disponibles ?',
        a: 'NapoCRM propose un plan Créateur (accès aux fonctions essentielles) et un plan Napoléon (29,99 €/mois, accès complet incluant les modules Napo+). Vous pouvez changer de plan à tout moment depuis votre profil.',
      },
      {
        q: 'Comment résilier mon abonnement ?',
        a: 'Rendez-vous dans votre profil → "Gérer l\'abonnement" → "Résilier". La résiliation prend effet à la fin de la période en cours. Vos données restent accessibles en lecture pendant 30 jours après la résiliation.',
      },
      {
        q: 'Comment changer mon mot de passe ?',
        a: 'Depuis votre profil, cliquez sur "Sécurité" puis "Changer le mot de passe". Un lien de réinitialisation sera envoyé à votre adresse email. Le lien est valable 1 heure.',
      },
    ],
  },
]

export default function FAQ() {
  const [openKey, setOpenKey] = useState(null)

  function toggle(key) {
    setOpenKey(k => k === key ? null : key)
  }

  return (
    <div style={{ padding: '1.6rem 2rem', maxWidth: 800, fontFamily: 'inherit' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-help-circle" style={{ fontSize: 22, color: '#185FA5' }} />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>Questions fréquentes</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Tout ce qu'il faut savoir pour utiliser NapoCRM</div>
        </div>
      </div>

      {/* Barre de recherche visuelle */}
      <div style={{ margin: '20px 0 28px', padding: '10px 16px', borderRadius: 10, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-secondary)', fontSize: 13 }}>
        <i className="ti ti-search" style={{ fontSize: 16 }} />
        <span>Utilisez Ctrl+F pour rechercher dans cette page</span>
      </div>

      {/* Sections */}
      {SECTIONS.map(section => (
        <div key={section.title} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: section.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ti ${section.icon}`} style={{ fontSize: 14, color: section.color }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{section.title}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {section.items.map((item, idx) => {
              const key = `${section.title}-${idx}`
              const isOpen = openKey === key
              return (
                <div
                  key={key}
                  style={{ borderRadius: 10, border: `0.5px solid ${isOpen ? section.color + '44' : 'var(--color-border-tertiary)'}`, background: isOpen ? section.bg + '55' : 'var(--color-background-secondary)', overflow: 'hidden', transition: 'border-color 0.15s' }}
                >
                  <button
                    onClick={() => toggle(key)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', flex: 1 }}>{item.q}</span>
                    <i className={`ti ti-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: 14, color: section.color, flexShrink: 0, transition: 'transform 0.2s' }} />
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 16px 14px', fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7, borderTop: `0.5px solid ${section.color}22` }}>
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Footer contact */}
      <div style={{ marginTop: 12, padding: '18px 22px', borderRadius: 12, background: '#E6F1FB', border: '0.5px solid #7BA7E8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1A2E', marginBottom: 3 }}>Vous ne trouvez pas la réponse ?</div>
          <div style={{ fontSize: 12, color: '#185FA5' }}>Notre équipe répond sous 24h en jours ouvrés.</div>
        </div>
        <a href="mailto:support@napocrm.fr" style={{ flexShrink: 0, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Contacter le support
        </a>
      </div>
    </div>
  )
}
