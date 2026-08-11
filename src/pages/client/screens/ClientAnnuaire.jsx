import { useEffect, useState } from 'react';
import { supabaseClient } from '../../../lib/supabaseClient';
import PraticienCard from '../PraticienCard';

const SUGGESTIONS = ['Sophrologie', 'Massage', 'Naturopathie', 'En live', 'Paris'];

export default function ClientAnnuaire({ session }) {
  const [query, setQuery] = useState('');
  const [praticiens, setPraticiens] = useState([]);
  const [favorisIds, setFavorisIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    supabaseClient
      .from('favoris_client')
      .select('target_id')
      .eq('user_id', session.user.id)
      .eq('target_type', 'praticien')
      .then(({ data }) => setFavorisIds(new Set((data || []).map((f) => f.target_id))));
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timeout = setTimeout(async () => {
      const { data, error } = await supabaseClient.rpc('search_praticiens', { query });
      if (!cancelled) {
        if (!error) setPraticiens(data || []);
        setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [query]);

  return (
    <div className="px-6 py-8 max-w-md mx-auto">
      <h1 className="font-clientSerif text-2xl text-saugeDark mb-4 text-center">Annuaire</h1>

      <div className="relative mb-3">
        <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-sauge" style={{ fontSize: 16 }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un praticien, un métier, une ville..."
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

      {!loading && praticiens.length === 0 && (
        <p className="text-sauge text-sm text-center">Aucun praticien trouvé.</p>
      )}

      <div className="space-y-3">
        {praticiens.map((p) => (
          <PraticienCard key={p.id} praticien={p} session={session} isFavori={favorisIds.has(p.id)} />
        ))}
      </div>
    </div>
  );
}
