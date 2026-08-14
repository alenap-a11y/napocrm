import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient } from '../../lib/supabaseClient';

const TYPE_LABELS = {
  en_live: 'En live',
  replay: 'Replay',
  formation: 'Formation',
  atelier: 'Atelier',
  seminaire: 'Séminaire',
};

const OFFRE_LABELS = {
  live: 'Live',
  formation: 'Formation',
  seminaire: 'Séminaire',
  meditation: 'Méditation',
  atelier: 'Atelier',
};

// Carte praticien réutilisable (Annuaire, Favoris...). `isFavori` initial
// vient du parent (une seule requête favoris_client pour toute la liste),
// le composant gère ensuite le toggle localement.
export default function PraticienCard({ praticien, session, isFavori = false, onToggle }) {
  const navigate = useNavigate();
  const [favori, setFavori] = useState(isFavori);
  const [toggling, setToggling] = useState(false);

  const initials = `${praticien.prenom?.[0] || ''}${praticien.nom?.[0] || ''}`.toUpperCase() || '?';
  const hasStats = praticien.note_moyenne != null && praticien.nombre_avis > 0;
  const nbMusiques = praticien.musiques?.length || 0;
  const nbLivres = praticien.livres?.length || 0;
  const nbRecettes = praticien.recettes?.length || 0;
  const depuisAnnee = praticien.anciennete_depuis ? new Date(praticien.anciennete_depuis).getFullYear() : null;
  const prochaineOffre = praticien.prochaine_offre_date
    ? `${OFFRE_LABELS[praticien.prochaine_offre_type] || praticien.prochaine_offre_type} · ${new Date(praticien.prochaine_offre_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
    : null;

  async function toggleFavori() {
    if (toggling || !session) return;
    setToggling(true);
    if (favori) {
      await supabaseClient.from('favoris_client').delete()
        .eq('user_id', session.user.id).eq('target_type', 'praticien').eq('target_id', praticien.id);
      setFavori(false);
      onToggle?.(false);
    } else {
      await supabaseClient.from('favoris_client').insert({
        user_id: session.user.id, target_type: 'praticien', target_id: praticien.id,
      });
      setFavori(true);
      onToggle?.(true);
    }
    setToggling(false);
  }

  return (
    <div
      className="bg-white rounded-2xl border border-sauge/15 p-4 relative cursor-pointer"
      onClick={() => praticien.slug && navigate(`/client/praticien/${praticien.slug}`)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavori(); }}
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

      <div className="flex items-center gap-3 mb-3 pr-6">
        {praticien.avatar_url ? (
          <img src={praticien.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-sauge/15 text-saugeDark flex items-center justify-center font-medium shrink-0">
            {initials}
          </div>
        )}
        <div>
          <p className="font-clientSerif text-lg text-saugeDark leading-tight">{praticien.prenom} {praticien.nom}</p>
          {praticien.pays && (
            <p className="text-xs text-sauge flex items-center gap-1 mt-0.5">
              <i className="ti ti-flag" style={{ fontSize: 12 }} aria-hidden="true" />
              {praticien.pays}
              {praticien.langues?.length > 0 ? ` · ${praticien.langues.join(', ')}` : ''}
            </p>
          )}
        </div>
      </div>

      {praticien.specialites?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {praticien.specialites.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-sauge/10 text-saugeDark">{tag}</span>
          ))}
        </div>
      )}

      {praticien.types_prestation?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {praticien.types_prestation.map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-sauge/30 text-sauge">
              {TYPE_LABELS[t] || t}
            </span>
          ))}
        </div>
      )}

      {(depuisAnnee || prochaineOffre) && (
        <div className="flex items-center gap-3 text-[11px] text-sauge mb-2">
          {depuisAnnee && (
            <span className="flex items-center gap-1">
              <i className="ti ti-calendar-time" style={{ fontSize: 12 }} aria-hidden="true" />
              Depuis {depuisAnnee}
            </span>
          )}
          {prochaineOffre && (
            <span className="flex items-center gap-1">
              <i className="ti ti-calendar-event" style={{ fontSize: 12 }} aria-hidden="true" />
              {prochaineOffre}
            </span>
          )}
        </div>
      )}

      {hasStats && (
        <p className="text-xs text-saugeDark flex items-center gap-1 mb-1">
          <i className="ti ti-star-filled" style={{ fontSize: 12, color: '#D9A441' }} aria-hidden="true" />
          {Number(praticien.note_moyenne).toFixed(1)} ({praticien.nombre_avis} avis)
        </p>
      )}

      {(nbMusiques + nbLivres + nbRecettes) > 0 && (
        <div className="flex items-center gap-3 text-[11px] text-sauge/70 mt-1">
          {nbMusiques > 0 && <span className="flex items-center gap-1"><i className="ti ti-music" style={{ fontSize: 12 }} aria-hidden="true" />{nbMusiques}</span>}
          {nbLivres > 0 && <span className="flex items-center gap-1"><i className="ti ti-book" style={{ fontSize: 12 }} aria-hidden="true" />{nbLivres}</span>}
          {nbRecettes > 0 && <span className="flex items-center gap-1"><i className="ti ti-tools-kitchen-2" style={{ fontSize: 12 }} aria-hidden="true" />{nbRecettes}</span>}
        </div>
      )}
    </div>
  );
}
