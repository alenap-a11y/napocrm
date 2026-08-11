import { useEffect, useState } from 'react';
import { supabaseClient } from '../../../lib/supabaseClient';
import PraticienCard from '../PraticienCard';
import EvenementCard from '../EvenementCard';

const PROFIL_COLUMNS = 'id, prenom, nom, avatar_url, metier, activite, bio, ville, pays, langues, specialites, types_prestation, note_moyenne, nombre_avis, musiques, livres, recettes, slug';

export default function ClientFavoris({ session }) {
  const [praticiens, setPraticiens] = useState(null);
  const [evenements, setEvenements] = useState(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function load() {
      const { data: favoris } = await supabaseClient
        .from('favoris_client')
        .select('target_type, target_id')
        .eq('user_id', session.user.id);

      const praticienIds = (favoris || []).filter((f) => f.target_type === 'praticien').map((f) => f.target_id);
      const evenementIds = (favoris || []).filter((f) => f.target_type === 'evenement').map((f) => f.target_id);

      const [praticiensRes, evenementsRes] = await Promise.all([
        praticienIds.length
          ? supabaseClient.from('profiles').select(PROFIL_COLUMNS).in('id', praticienIds)
          : Promise.resolve({ data: [] }),
        evenementIds.length
          ? supabaseClient.from('evenements').select('*').in('id', evenementIds)
          : Promise.resolve({ data: [] }),
      ]);

      if (!cancelled) {
        setPraticiens(praticiensRes.data || []);
        setEvenements(evenementsRes.data || []);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [session]);

  if (praticiens === null || evenements === null) return null;

  const vide = praticiens.length === 0 && evenements.length === 0;

  return (
    <div className="px-6 py-8 max-w-md mx-auto">
      <h1 className="font-clientSerif text-2xl text-saugeDark mb-6 text-center">Favoris</h1>

      {vide && (
        <p className="text-sauge text-sm text-center">
          Les praticiens et événements que vous aimez apparaîtront ici.
        </p>
      )}

      {praticiens.length > 0 && (
        <div className="mb-8">
          <h2 className="font-clientSerif text-lg text-saugeDark mb-3">Praticiens</h2>
          <div className="space-y-3">
            {praticiens.map((p) => (
              <PraticienCard
                key={p.id}
                praticien={p}
                session={session}
                isFavori
                onToggle={(fav) => { if (!fav) setPraticiens((prev) => prev.filter((x) => x.id !== p.id)); }}
              />
            ))}
          </div>
        </div>
      )}

      {evenements.length > 0 && (
        <div>
          <h2 className="font-clientSerif text-lg text-saugeDark mb-3">Événements</h2>
          <div className="space-y-3">
            {evenements.map((evt) => (
              <EvenementCard
                key={evt.id}
                evt={evt}
                session={session}
                isFavori
                onToggle={(fav) => { if (!fav) setEvenements((prev) => prev.filter((x) => x.id !== evt.id)); }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
