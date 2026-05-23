import { useState } from 'react'

const PAGES = {
  faq: {
    icon: 'ti-help-circle', iconColor: '#185FA5',
    title: 'FAQ — Questions fréquentes',
    type: 'accordion',
    items: [
      { q: 'Comment ajouter un client ?', a: 'Cliquez sur "Clients" dans la sidebar, puis sur le bouton "+ Nouveau client" en haut à droite. Remplissez les informations et sauvegardez.' },
      { q: 'Comment créer une facture ?', a: 'Depuis la fiche d\'un client, cliquez sur "Facturation" puis "+ Nouvelle facture". Les mentions légales sont pré-remplies avec votre SIRET.' },
      { q: 'Comment personnaliser mon dashboard ?', a: 'Cliquez sur l\'icône "Perso" en bas de la sidebar. Vous pouvez réordonner les sections, activer ou désactiver les widgets, changer les couleurs.' },
      { q: 'Mes données sont-elles sécurisées ?', a: 'Oui. Vos données sont hébergées sur Supabase (infrastructure EU) avec chiffrement en transit et au repos. Conformité RGPD garantie.' },
      { q: 'Comment changer mon abonnement ?', a: 'Rendez-vous dans votre profil → "Gérer l\'abonnement". Vous pouvez passer au plan Napoléon (29,99€/mois) ou revenir au plan Créateur à tout moment.' },
    ],
  },
  aide: {
    icon: 'ti-lifebuoy', iconColor: '#0F6E56',
    title: 'Aide & support',
    type: 'accordion',
    items: [
      { q: 'Contacter le support', a: 'Écrivez à support@napocrm.fr — réponse sous 24h en jours ouvrés. Abonnés Napoléon : accès chat en direct.' },
      { q: 'Tutoriels vidéo', a: 'Retrouvez nos tutoriels sur YouTube : "NapoCRM Official". Nouvelle vidéo chaque semaine sur les fonctionnalités et bonnes pratiques.' },
      { q: 'Documentation complète', a: 'Toute la documentation est disponible sur docs.napocrm.fr. Guides pas-à-pas, référence API et intégrations tierces.' },
      { q: 'Signaler un problème', a: 'Utilisez le bouton "Signaler" en bas de n\'importe quelle page, ou envoyez un email à bugs@napocrm.fr avec une capture d\'écran.' },
    ],
  },
  news: {
    icon: 'ti-speakerphone', iconColor: '#854F0B',
    title: 'News NapoCRM',
    type: 'news',
    items: [
      { tag: 'new', label: 'Nouveau', title: 'Export PDF des fiches clients', desc: 'Générez un PDF complet de chaque fiche client en un clic depuis la section Clients.', date: '23 mai 2026' },
      { tag: 'maj', label: 'Mise à jour', title: 'Synchronisation agenda Google améliorée', desc: 'La sync bidirectionnelle est désormais instantanée. Vos RDV NapoCRM apparaissent en temps réel dans Google Calendar.', date: '18 mai 2026' },
      { tag: 'tip', label: 'Astuce', title: 'Personnalisation complète du dashboard', desc: 'Saviez-vous que vous pouvez réordonner les icônes de la topbar par glisser-déposer ? Allez dans Perso pour essayer.', date: '12 mai 2026' },
      { tag: 'new', label: 'Nouveau', title: 'Modes d\'accessibilité', desc: '4 modes daltoniens, taille de police ajustable, mode malentendant et réduction d\'animations maintenant disponibles.', date: '5 mai 2026' },
    ],
  },
}

export default function SimplePage({ view }) {
  const [openIdx, setOpenIdx] = useState(null)
  const page = PAGES[view]
  if (!page) return null

  return (
    <div className="simple-page">
      <div className="sp-title">
        <i className={`ti ${page.icon}`} style={{ color: page.iconColor }} aria-hidden="true" />
        {page.title}
      </div>

      {page.type === 'accordion' && page.items.map((item, idx) => (
        <div
          key={idx}
          className={`sp-card${openIdx === idx ? ' open' : ''}`}
          onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
        >
          <div className="sp-card-q">
            {item.q}
            <i className="ti ti-chevron-right" aria-hidden="true" />
          </div>
          <div className="sp-card-a">{item.a}</div>
        </div>
      ))}

      {page.type === 'news' && page.items.map((item, idx) => (
        <div className="news-item" key={idx}>
          <span className={`news-tag tag-${item.tag}`}>{item.label}</span>
          <div className="news-title">{item.title}</div>
          <div className="news-desc">{item.desc}</div>
          <div className="news-date">{item.date}</div>
        </div>
      ))}
    </div>
  )
}
