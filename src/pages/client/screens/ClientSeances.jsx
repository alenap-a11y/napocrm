import { useEffect, useState } from 'react';
import { supabaseClient } from '../../../lib/supabaseClient';

const STATUT_LABELS = {
  planifié: 'Planifiée',
  confirmé: 'Confirmée',
  annulé: 'Annulée',
  disponible: 'Disponible',
};

function SeanceCard({ seance }) {
  const date = seance.date_seance ? new Date(seance.date_seance) : null;
  return (
    <div className="bg-white rounded-xl border border-sauge/15 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-saugeDark">{seance.type_seance || 'Séance'}</p>
          {date && (
            <p className="text-xs text-sauge mt-0.5">
              {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {seance.heure_seance ? ` · ${seance.heure_seance.slice(0, 5)}` : ''}
            </p>
          )}
        </div>
        {seance.statut && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-sauge/10 text-saugeDark whitespace-nowrap">
            {STATUT_LABELS[seance.statut] || seance.statut}
          </span>
        )}
      </div>
      <p className="text-xs text-sauge mt-3">Paiement : bientôt disponible</p>
    </div>
  );
}

export default function ClientSeances() {
  const [seances, setSeances] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await supabaseClient
        .from('seances')
        .select('id, date_seance, heure_seance, type_seance, statut, client_id')
        .order('date_seance', { ascending: false });
      if (cancelled) return;
      if (fetchError) setError(fetchError.message);
      else setSeances(data || []);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return <div className="px-6 py-10 text-center text-sm text-red-500">{error}</div>;
  }
  if (seances === null) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);
  const aVenir = seances.filter((s) => s.date_seance >= today).sort((a, b) => a.date_seance.localeCompare(b.date_seance));
  const historique = seances.filter((s) => s.date_seance < today);

  return (
    <div className="px-6 py-8 max-w-md mx-auto">
      <h1 className="font-clientSerif text-2xl text-saugeDark mb-6 text-center">Séances</h1>

      <h2 className="font-clientSerif text-lg text-saugeDark mb-3">À venir</h2>
      {aVenir.length === 0 ? (
        <p className="text-sauge text-sm mb-8">Aucun rendez-vous à venir.</p>
      ) : (
        <div className="space-y-3 mb-8">
          {aVenir.map((s) => <SeanceCard key={s.id} seance={s} />)}
        </div>
      )}

      <h2 className="font-clientSerif text-lg text-saugeDark mb-3">Historique</h2>
      {historique.length === 0 ? (
        <p className="text-sauge text-sm">Aucune séance passée pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {historique.map((s) => <SeanceCard key={s.id} seance={s} />)}
        </div>
      )}
    </div>
  );
}
