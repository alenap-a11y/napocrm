import { useEffect, useState } from 'react';
import { supabaseClient } from '../../../lib/supabaseClient';

function useHorlogeEnDirect() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

export default function ClientAccueil({ session }) {
  const prenom = session?.user?.user_metadata?.prenom || '';
  const now = useHorlogeEnDirect();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadSuggestions() {
      const { data: profil } = await supabaseClient
        .from('clients_portail')
        .select('preferences')
        .eq('id', session.user.id)
        .single();

      const preferences = profil?.preferences || [];
      if (preferences.length === 0) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data: evenements } = await supabaseClient
        .from('evenements')
        .select('id, titre, type, date_debut, prix, format')
        .overlaps('tags', preferences)
        .gte('date_debut', new Date().toISOString())
        .order('date_debut', { ascending: true })
        .limit(2);

      if (!cancelled) {
        setSuggestions(evenements || []);
        setLoading(false);
      }
    }
    loadSuggestions();
    return () => { cancelled = true; };
  }, [session.user.id]);

  return (
    <div className="px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="font-clientSerif text-3xl text-saugeDark mb-1">Bonjour {prenom} 🌿</h1>
        <p className="text-sauge text-xs capitalize">
          {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          {' · '}
          {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {!loading && suggestions.length > 0 && (
        <div className="max-w-md mx-auto">
          <h2 className="font-clientSerif text-lg text-saugeDark mb-3">Suggéré pour vous</h2>
          <div className="space-y-3">
            {suggestions.map((evt) => (
              <div key={evt.id} className="bg-white rounded-xl border border-sauge/15 p-4">
                <p className="text-sm font-medium text-saugeDark">{evt.titre}</p>
                {evt.date_debut && (
                  <p className="text-xs text-sauge mt-1">
                    {new Date(evt.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
