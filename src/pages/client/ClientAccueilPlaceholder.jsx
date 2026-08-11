import { supabaseClient } from '../../lib/supabaseClient';

// Placeholder temporaire — remplacé par le vrai écran Accueil (étape 4/12)
// et la bottom nav (étape 3/12). Sert ici uniquement à valider le parcours
// inscription/connexion de bout en bout.
export default function ClientAccueilPlaceholder({ session }) {
  const prenom = session?.user?.user_metadata?.prenom || '';

  return (
    <div className="min-h-screen bg-creme flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="font-clientSerif text-3xl text-saugeDark mb-2">Bonjour {prenom} 🌿</h1>
        <p className="text-sauge text-sm mb-6">Votre espace client est prêt. Le reste arrive bientôt.</p>
        <button
          onClick={() => supabaseClient.auth.signOut()}
          className="text-xs text-saugeDark underline"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
