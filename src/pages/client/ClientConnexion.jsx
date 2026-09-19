import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseClient } from '../../lib/supabaseClient';
import napopetit from '../../assets/napopetitv1.png';

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
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#111827', background: '#f0f9ff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <Link to="/" style={{ display: 'block', textAlign: 'center', width: '100%', maxWidth: 420, marginBottom: 12, fontSize: 13, color: '#8A8378', textDecoration: 'none' }}>← Page d'accueil</Link>
      <div style={{ display: 'flex', gap: 6, padding: 4, width: '100%', maxWidth: 420, marginBottom: 16, background: '#e5f2f8', borderRadius: 999 }}>
        <Link to="/client/connexion" style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: 'none', color: '#fff', background: '#1E95C1' }}>Client</Link>
        <Link to="/login" style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: 'none', color: '#6b7280', background: 'transparent' }}>Praticien</Link>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, border: '0.5px solid rgba(14,165,233,0.2)', boxShadow: '0 8px 40px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <img src={napopetit} alt="Naposolo" style={{ height: 28 }} />
          <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Naposolo</span>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Espace client</div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>Connectez-vous à votre compte.</div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 8, background: '#FCEBEB', color: '#A32D2D', fontSize: 13 }}><i className="ti ti-alert-circle" style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }} />{error}</div>}
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Mot de passe</label>
            <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 9, border: 'none', minHeight: 44, background: loading ? '#7dd3fc' : '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
          <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            Pas encore de compte ?{' '}
            <Link to="/client/inscription" style={{ color: '#0EA5E9', fontWeight: 600, textDecoration: 'none' }}>S'inscrire</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8, minHeight: 44,
  border: '0.5px solid #d1d5db', background: '#f9fafb',
  color: '#111827', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color .15s',
}
