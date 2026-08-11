import { useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';

const TYPE_LABELS = {
  atelier: 'Atelier',
  formation: 'Formation',
  ceremonie: 'Cérémonie',
  stage: 'Stage',
  replay: 'Replay',
};

// Carte événement réutilisable (Événements, Favoris...).
export default function EvenementCard({ evt, session, isFavori = false, onToggle }) {
  const [favori, setFavori] = useState(isFavori);
  const [toggling, setToggling] = useState(false);

  async function toggleFavori() {
    if (toggling || !session) return;
    setToggling(true);
    if (favori) {
      await supabaseClient.from('favoris_client').delete()
        .eq('user_id', session.user.id).eq('target_type', 'evenement').eq('target_id', evt.id);
      setFavori(false);
      onToggle?.(false);
    } else {
      await supabaseClient.from('favoris_client').insert({
        user_id: session.user.id, target_type: 'evenement', target_id: evt.id,
      });
      setFavori(true);
      onToggle?.(true);
    }
    setToggling(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-sauge/15 p-4 relative">
      {session && (
        <button
          onClick={toggleFavori}
          disabled={toggling}
          aria-label={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="absolute top-3 right-3"
        >
          <i
            className={`ti ${favori ? 'ti-heart-filled' : 'ti-heart'}`}
            style={{ fontSize: 20, color: favori ? '#C4694A' : '#B8C4AE' }}
            aria-hidden="true"
          />
        </button>
      )}

      <div className="flex items-start justify-between gap-3 mb-1 pr-6">
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
