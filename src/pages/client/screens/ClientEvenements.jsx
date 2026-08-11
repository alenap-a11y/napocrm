import { useEffect, useState } from 'react';
import { supabaseClient } from '../../../lib/supabaseClient';

const TYPE_LABELS = {
  atelier: 'Atelier',
  formation: 'Formation',
  ceremonie: 'Cérémonie',
  stage: 'Stage',
  replay: 'Replay',
};

const SUGGESTIONS = ['Atelier', 'Formation', 'En ligne', 'Cérémonie', 'Ce week-end'];

function EvenementCard({ evt }) {
  return (
    <div className="bg-white rounded-2xl border border-sauge/15 p-4">
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="font-clientSerif text-lg text-saugeDark leading-tight">{evt.titre}</p>
        {evt.type && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sauge/10 text-saugeDark whitespace-nowrap shrink-0">
            {TYPE_LABELS[evt.type] || evt.type}
          </span>
        )}
      </div>

      {evt.description && <p className="text-xs text-sauge mt-1 line-clamp-2">{evt.description}</p>}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-sauge mt-3">
        {evt.date_debut && (
          <span className="flex items-center gap-1">
            <i className="ti ti-calendar-event" style={{ fontSize: 12 }} aria-hidden="true" />
            {new Date(evt.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </span>
        )}
        {evt.format && (
          <span className="flex items-center gap-1">
            <i className={`ti ${evt.format === 'en_ligne' ? 'ti-broadcast' : 'ti-map-pin'}`} style={{ fontSize: 12 }} aria-hidden="true" />
            {evt.format === 'en_ligne' ? 'En ligne' : 'Présentiel'}
          </span>
        )}
        {evt.pays && (
          <span className="flex items-center gap-1">
            <i className="ti ti-flag" style={{ fontSize: 12 }} aria-hidden="true" />
            {evt.pays}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-sauge/10">
        <span className="text-sm font-medium text-saugeDark">
          {evt.prix != null ? `${evt.prix} €` : 'Prix sur demande'}
        </span>
        {evt.lien_externe && (
          <a
            href={evt.lien_externe}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-full border border-sauge/30 text-saugeDark hover:bg-sauge/10"
          >
            En savoir plus
          </a>
        )}
      </div>
    </div>
  );
}

export default function ClientEvenements() {
  const [query, setQuery] = useState('');
  const [evenements, setEvenements] = useState([]);
  const [loading, setLoading] = useState(true);

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
        {evenements.map((evt) => <EvenementCard key={evt.id} evt={evt} />)}
      </div>
    </div>
  );
}
