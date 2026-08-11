import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseClient } from '../../../lib/supabaseClient';

const PREFERENCES = [
  { id: 'chamanisme', label: 'Chamanisme' },
  { id: 'magnetisme', label: 'Magnétisme / énergétique' },
  { id: 'tarologie', label: 'Tarologie / oracle' },
  { id: 'bien_etre', label: 'Bien-être / relaxation' },
];

const EMPTY = {
  nom: '', prenom: '', age: '', telephone: '', nationalite: '',
  adresse_postale: '', whatsapp: '', facebook: '', instagram: '', preferences: [],
};

export default function ClientMonProfil({ session }) {
  const [profil, setProfil] = useState(null);
  const [draft, setDraft] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    supabaseClient
      .from('clients_portail')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        const loaded = {
          nom: data?.nom || '',
          prenom: data?.prenom || '',
          age: data?.age ?? '',
          telephone: data?.telephone || '',
          nationalite: data?.nationalite || '',
          adresse_postale: data?.adresse_postale || '',
          whatsapp: data?.whatsapp || '',
          facebook: data?.facebook || '',
          instagram: data?.instagram || '',
          preferences: data?.preferences || [],
        };
        setProfil(loaded);
        setDraft(loaded);
      });
  }, [session.user.id]);

  function togglePreference(id) {
    setDraft((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(id)
        ? prev.preferences.filter((p) => p !== id)
        : [...prev.preferences, id],
    }));
  }

  async function save() {
    setSaving(true);
    setSaveMsg('');
    const { error } = await supabaseClient
      .from('clients_portail')
      .update({
        nom: draft.nom,
        prenom: draft.prenom,
        age: draft.age ? parseInt(draft.age, 10) : null,
        telephone: draft.telephone,
        nationalite: draft.nationalite || null,
        adresse_postale: draft.adresse_postale || null,
        whatsapp: draft.whatsapp || null,
        facebook: draft.facebook || null,
        instagram: draft.instagram || null,
        preferences: draft.preferences,
      })
      .eq('id', session.user.id);
    setSaving(false);
    if (error) {
      setSaveMsg('Erreur : ' + error.message);
    } else {
      setProfil(draft);
      setSaveMsg('✓ Enregistré');
      setTimeout(() => setSaveMsg(''), 3000);
    }
  }

  if (!profil) return null;

  return (
    <div className="px-6 py-8 max-w-md mx-auto">
      <Link to="/client/profil" className="text-xs text-saugeDark mb-4 inline-flex items-center gap-1">
        <i className="ti ti-arrow-left" style={{ fontSize: 12 }} aria-hidden="true" /> Retour
      </Link>
      <h1 className="font-clientSerif text-2xl text-saugeDark mb-6 text-center">Mon profil</h1>

      <div className="bg-white rounded-2xl border border-sauge/15 p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input value={draft.prenom} onChange={(e) => setDraft((p) => ({ ...p, prenom: e.target.value }))} placeholder="Prénom"
            className="border border-sauge/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sauge" />
          <input value={draft.nom} onChange={(e) => setDraft((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom"
            className="border border-sauge/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sauge" />
        </div>
        <input value={draft.age} onChange={(e) => setDraft((p) => ({ ...p, age: e.target.value }))} type="number" placeholder="Âge"
          className="w-full border border-sauge/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sauge" />
        <div>
          <div className="text-xs text-sauge px-1 mb-1">Email</div>
          <div className="px-3 py-2 text-sm text-saugeDark bg-creme rounded-lg">{session.user.email}</div>
        </div>
        <input value={draft.telephone} onChange={(e) => setDraft((p) => ({ ...p, telephone: e.target.value }))} placeholder="Téléphone"
          className="w-full border border-sauge/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sauge" />
        <input value={draft.nationalite} onChange={(e) => setDraft((p) => ({ ...p, nationalite: e.target.value }))} placeholder="Nationalité"
          className="w-full border border-sauge/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sauge" />
        <input value={draft.adresse_postale} onChange={(e) => setDraft((p) => ({ ...p, adresse_postale: e.target.value }))} placeholder="Adresse postale"
          className="w-full border border-sauge/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sauge" />
        <input value={draft.whatsapp} onChange={(e) => setDraft((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="WhatsApp"
          className="w-full border border-sauge/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sauge" />
        <input value={draft.facebook} onChange={(e) => setDraft((p) => ({ ...p, facebook: e.target.value }))} placeholder="Facebook"
          className="w-full border border-sauge/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sauge" />
        <input value={draft.instagram} onChange={(e) => setDraft((p) => ({ ...p, instagram: e.target.value }))} placeholder="Instagram"
          className="w-full border border-sauge/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sauge" />

        <div>
          <p className="text-xs text-sauge mb-2">Vos centres d'intérêt :</p>
          <div className="flex flex-wrap gap-2">
            {PREFERENCES.map((p) => (
              <label key={p.id} className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${draft.preferences.includes(p.id) ? 'bg-sauge text-white border-sauge' : 'border-sauge/25 text-saugeDark'}`}>
                <input type="checkbox" className="hidden" checked={draft.preferences.includes(p.id)} onChange={() => togglePreference(p.id)} />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        {saveMsg && <p className="text-xs text-saugeDark">{saveMsg}</p>}

        <button onClick={save} disabled={saving}
          className="w-full bg-sauge hover:bg-saugeDark text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
