import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseClient } from '../../lib/supabaseClient';

const PREFERENCES = [
  { id: 'chamanisme', label: 'Chamanisme' },
  { id: 'magnetisme', label: 'Magnétisme / énergétique' },
  { id: 'tarologie', label: 'Tarologie / oracle' },
  { id: 'bien_etre', label: 'Bien-être / relaxation' },
];

export default function ClientInscription() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [consentRgpd, setConsentRgpd] = useState(false);
  const [consentSms, setConsentSms] = useState(false);

  const [showOptional, setShowOptional] = useState(false);
  const [nationalite, setNationalite] = useState('');
  const [adressePostale, setAdressePostale] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [preferences, setPreferences] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  function togglePreference(id) {
    setPreferences((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim() || !email.trim() || !telephone.trim()) {
      setError('Nom, prénom, email et téléphone sont requis.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Mot de passe : 8 caractères minimum.');
      return;
    }
    if (!consentRgpd) {
      setError('Le consentement au traitement des données (RGPD) est requis.');
      return;
    }
    if (!consentSms) {
      setError('Le consentement au contact SMS/WhatsApp est requis pour prendre rendez-vous.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data: role } = await supabaseClient.rpc('check_email_role', { check_email: email.trim() });
      if (role === 'praticien') {
        setError('Cet email est déjà associé à un compte praticien Naposolo.');
        setLoading(false);
        return;
      }
      if (role === 'client') {
        setError('Cet email est déjà inscrit.');
        setLoading(false);
        return;
      }
      const { error: signUpError } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            account_type: 'client',
            nom: nom.trim(),
            prenom: prenom.trim(),
            age: age ? String(parseInt(age, 10)) : '',
            telephone: telephone.trim(),
            nationalite: nationalite.trim(),
            adresse_postale: adressePostale.trim(),
            whatsapp: whatsapp.trim(),
            facebook: facebook.trim(),
            instagram: instagram.trim(),
            preferences,
          },
          emailRedirectTo: `${window.location.origin}/client/connexion`,
        },
      });
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Cet email est déjà inscrit.');
        } else {
          setError(signUpError.message);
        }
      } else {
        setSent(true);
      }
    } catch (err) {
      setError('Erreur : ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-creme flex flex-col items-center justify-center px-6">
        <Link to="/accueil" className="font-clientSerif text-2xl text-saugeDark mb-6">Naposolo</Link>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-sauge/15 p-8 text-center">
          <h1 className="font-clientSerif text-2xl text-saugeDark mb-3">Vérifiez votre email</h1>
          <p className="text-sauge text-sm leading-relaxed">
            Un email de confirmation vient de vous être envoyé. Cliquez sur le lien qu'il contient pour activer votre
            espace client, puis connectez-vous.
          </p>
          <Link to="/client/connexion" className="inline-block mt-6 text-saugeDark font-medium text-sm underline">
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-creme flex flex-col items-center justify-center px-6 py-12">
      <Link to="/accueil" className="font-clientSerif text-2xl text-saugeDark mb-6">Naposolo</Link>
      <form onSubmit={handleSubmit} className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-sauge/15 p-8">
        <h1 className="font-clientSerif text-3xl text-saugeDark mb-1">Espace client</h1>
        <p className="text-sauge text-sm mb-6">Créez votre compte pour réserver vos séances.</p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom"
            className="border border-sauge/25 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-sauge" />
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom"
            className="border border-sauge/25 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-sauge" />
        </div>
        <input value={age} onChange={(e) => setAge(e.target.value)} type="number" min="0" placeholder="Âge"
          className="w-full border border-sauge/25 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:border-sauge" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email"
          className="w-full border border-sauge/25 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:border-sauge" />
        <input value={telephone} onChange={(e) => setTelephone(e.target.value)} type="tel" placeholder="Téléphone"
          className="w-full border border-sauge/25 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:border-sauge" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mot de passe (8 caractères min.)"
          className="w-full border border-sauge/25 rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:border-sauge" />

        <button type="button" onClick={() => setShowOptional((v) => !v)} className="text-xs text-saugeDark underline mb-4">
          {showOptional ? 'Masquer les informations optionnelles' : 'Ajouter des informations optionnelles'}
        </button>

        {showOptional && (
          <div className="mb-4 space-y-3">
            <input value={nationalite} onChange={(e) => setNationalite(e.target.value)} placeholder="Nationalité"
              className="w-full border border-sauge/25 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-sauge" />
            <input value={adressePostale} onChange={(e) => setAdressePostale(e.target.value)} placeholder="Adresse postale"
              className="w-full border border-sauge/25 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-sauge" />
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp"
              className="w-full border border-sauge/25 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-sauge" />
            <input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Facebook"
              className="w-full border border-sauge/25 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-sauge" />
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram"
              className="w-full border border-sauge/25 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-sauge" />
            <div>
              <p className="text-xs text-sauge mb-2">Vos centres d'intérêt (pour personnaliser vos suggestions) :</p>
              <div className="flex flex-wrap gap-2">
                {PREFERENCES.map((p) => (
                  <label key={p.id} className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${preferences.includes(p.id) ? 'bg-sauge text-white border-sauge' : 'border-sauge/25 text-saugeDark'}`}>
                    <input type="checkbox" className="hidden" checked={preferences.includes(p.id)} onChange={() => togglePreference(p.id)} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <label className="flex items-start gap-2 mb-3 text-xs text-saugeDark">
          <input type="checkbox" checked={consentRgpd} onChange={(e) => setConsentRgpd(e.target.checked)} className="mt-0.5" />
          <span>J'accepte le traitement de mes données personnelles (RGPD) ainsi que les CGU/CGV. *</span>
        </label>
        <label className="flex items-start gap-2 mb-5 text-xs text-saugeDark">
          <input type="checkbox" checked={consentSms} onChange={(e) => setConsentSms(e.target.checked)} className="mt-0.5" />
          <span>J'accepte d'être contacté(e) par SMS/WhatsApp pour mes rendez-vous. *</span>
        </label>

        <button type="submit" disabled={loading}
          className="w-full bg-sauge hover:bg-saugeDark text-white rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-50">
          {loading ? 'Inscription...' : "S'inscrire"}
        </button>

        <p className="text-center text-xs text-sauge mt-5">
          Déjà un compte ? <Link to="/client/connexion" className="text-saugeDark underline">Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
