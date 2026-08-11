import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/client/accueil', icon: 'ti-home', label: 'Accueil' },
  { path: '/client/seances', icon: 'ti-calendar-event', label: 'Séances' },
  { path: '/client/annuaire', icon: 'ti-address-book', label: 'Annuaire' },
  { path: '/client/evenements', icon: 'ti-ticket', label: 'Événements' },
  { path: '/client/favoris', icon: 'ti-heart', label: 'Favoris' },
  { path: '/client/live', icon: 'ti-broadcast', label: 'Live' },
  { path: '/client/profil', icon: 'ti-user', label: 'Profil' },
];

// Shell des écrans connectés de l'espace client — bottom nav à 7 icônes,
// volontairement construite telle quelle malgré la zone tactile réduite
// (~54px vs 44px recommandés), décision utilisateur assumée.
export default function ClientShell({ children }) {
  return (
    <div className="min-h-screen bg-creme flex flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-sauge/15 flex justify-around z-40">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-sauge' : 'text-gray-400'
              }`
            }
            style={{ minHeight: 54, fontSize: 10 }}
          >
            <i className={`ti ${item.icon}`} style={{ fontSize: 20 }} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
