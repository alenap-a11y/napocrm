import { useEffect, useState } from 'react';
import { supabaseClient } from '../../../lib/supabaseClient';
import EvenementCard from '../EvenementCard';

const SUGGESTIONS = ['Atelier', 'Formation', 'En ligne', 'Cérémonie', 'Ce week-end'];

export default function ClientEvenements({ session }) {
  const [query, setQuery] = useState('');
  const [evenements, setEvenements] = useState([]);
  const [favorisIds, setFavorisIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    supabaseClient
      .from('favoris_client')
      .select('target_id')
      .eq('user_id', session.user.id)
      .eq('target_type', 'evenement')
      .then(({ data }) => setFavorisIds(new Set((data || []).map((f) => f.target_id))));
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timeout = setTimeout(async () => {
      const { data, error } = await supabaseClient.rpc('search_evenements', { query });
      if (!cancelled) {
        if (!error) setEvenements(data || []);
        setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [query]);

  return (
    <div className="px-6 py-8 max-w-md mx-auto">
      <h1 className="font-clientSerif text-2xl text-saugeDark mb-4 text-center">Événements</h1>

      <div className="relative mb-3">
        <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-sauge" style={{ fontSize: 16 }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un atelier, une formation..."
          className="w-full border border-sauge/25 rounded-full pl-10 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:border-sauge"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setQuery(s)}
            className="text-xs px-3 py-1.5 rounded-full border border-sauge/25 text-saugeDark hover:bg-sauge/10"
          >
            {s}
          </button>
        ))}
      </div>

      {!loading && evenements.length === 0 && (
        <p className="text-sauge text-sm text-center">Aucun événement trouvé.</p>
      )}

      <div className="space-y-3">
        {evenements.map((evt) => (
          <EvenementCard key={evt.id} evt={evt} session={session} isFavori={favorisIds.has(evt.id)} />
        ))}
      </div>
    </div>
  );
}
