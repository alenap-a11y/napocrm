import { Link } from 'react-router-dom';
import { supabaseClient } from '../../../lib/supabaseClient';

// Menu de navigation. Historique et Paiement renvoient vers Séances (pas de
// duplication de contenu). Confidentialité et RGPD renvoie vers la page
// légale déjà existante (/politique-confidentialite), pas de duplication
// de contenu non plus.
export default function ClientProfil() {
  return (
    <div className="px-6 py-10">
      <h1 className="font-clientSerif text-2xl text-saugeDark mb-6 text-center">Profil</h1>
      <div className="max-w-sm mx-auto bg-white rounded-2xl border border-sauge/15 divide-y divide-sauge/10 overflow-hidden">
        <Link to="/client/profil/moi" className="block px-4 py-3 text-sm text-saugeDark hover:bg-creme">Mon profil</Link>
        <Link to="/client/seances" className="block px-4 py-3 text-sm text-saugeDark hover:bg-creme">Historique</Link>
        <Link to="/client/seances" className="block px-4 py-3 text-sm text-saugeDark hover:bg-creme">Paiement</Link>
        <Link to="/client/profil/notifications" className="block px-4 py-3 text-sm text-saugeDark hover:bg-creme">Notifications</Link>
        <a href="/politique-confidentialite" target="_blank" rel="noopener noreferrer" className="block px-4 py-3 text-sm text-saugeDark hover:bg-creme">Confidentialité et RGPD</a>
        <Link to="/client/profil/aide" className="block px-4 py-3 text-sm text-saugeDark hover:bg-creme">Aide / FAQ</Link>
        <button
          onClick={() => supabaseClient.auth.signOut()}
          className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-creme"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
