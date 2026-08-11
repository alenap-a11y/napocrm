import { Link } from 'react-router-dom';
import { supabaseClient } from '../../../lib/supabaseClient';

// Contenu minimal — menu de navigation uniquement. "Mon profil" (édition des
// informations personnelles) sera construit en détail avec le reste des
// écrans de données. Historique et Paiement renvoient vers Séances, pas de
// duplication de contenu.
export default function ClientProfil() {
  return (
    <div className="px-6 py-10">
      <h1 className="font-clientSerif text-2xl text-saugeDark mb-6 text-center">Profil</h1>
      <div className="max-w-sm mx-auto bg-white rounded-2xl border border-sauge/15 divide-y divide-sauge/10 overflow-hidden">
        <div className="px-4 py-3 text-sm text-saugeDark">Mon profil</div>
        <Link to="/client/seances" className="block px-4 py-3 text-sm text-saugeDark hover:bg-creme">Historique</Link>
        <Link to="/client/seances" className="block px-4 py-3 text-sm text-saugeDark hover:bg-creme">Paiement</Link>
        <div className="px-4 py-3 text-sm text-saugeDark">Notifications</div>
        <div className="px-4 py-3 text-sm text-saugeDark">Confidentialité et RGPD</div>
        <div className="px-4 py-3 text-sm text-saugeDark">Aide / FAQ</div>
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
