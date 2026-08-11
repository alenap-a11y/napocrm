import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseClient } from '../../lib/supabaseClient';

export default function ClientConnexion({ errorMessage, onErrorShown }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Message de refus de rôle remonté par EspaceClientRouter (ex. connexion
  // réussie mais compte praticien, pas client) — arrive après coup, une fois
  // le signOut effectué, donc on doit aussi réarmer le bouton.
  useEffect(() => {
    if (errorMessage) {
      setError(errorMessage);
      setLoading(false);
      onErrorShown?.();
    }
  }, [errorMessage, onErrorShown]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Email et mot de passe requis.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setLoading(false);
      if (signInError.message.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect.');
      } else if (signInError.message.includes('Email not confirmed')) {
        setError('Merci de confirmer votre email avant de vous connecter.');
      } else {
        setError(signInError.message);
      }
      return;
    }
    // Pas de navigate() ici : EspaceClientRouter vérifie le rôle puis
    // redirige seul dès que l'état de session se propage (évite la course
    // entre navigate() et onAuthStateChange/vérification de rôle).
  }

  return (
    <div className="min-h-screen bg-creme flex flex-col items-center justify-center px-6">
      <Link to="/" className="font-clientSerif text-2xl text-saugeDark mb-6">Naposolo</Link>
      <form onSubmit={handleSubmit} className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-sauge/15 p-8">
        <h1 className="font-clientSerif text-3xl text-saugeDark mb-1">Espace client</h1>
        <p className="text-sauge text-sm mb-6">Connectez-vous à votre compte.</p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
        )}

        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email"
          className="w-full border border-sauge/25 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:border-sauge" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mot de passe"
          className="w-full border border-sauge/25 rounded-lg px-3 py-2.5 text-sm mb-5 focus:outline-none focus:border-sauge" />

        <button type="submit" disabled={loading}
          className="w-full bg-sauge hover:bg-saugeDark text-white rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-50">
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        <p className="text-center text-xs text-sauge mt-5">
          Pas encore de compte ? <Link to="/client/inscription" className="text-saugeDark underline">S'inscrire</Link>
        </p>
      </form>
    </div>
  );
}
