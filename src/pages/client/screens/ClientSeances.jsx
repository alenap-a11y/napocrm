import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseClient } from '../../../lib/supabaseClient';

const STATUT_LABELS = {
  planifié: 'Planifiée',
  confirmé: 'Confirmée',
  annulé: 'Annulée',
  disponible: 'Disponible',
};

function SeanceCard({ seance, praticien, slug, showActions, annuling, onAnnuler }) {
  const date = seance.date_seance ? new Date(seance.date_seance) : null;
  const isAnnulee = seance.statut === 'annulé';
  return (
    <div className="bg-white rounded-xl border border-sauge/15 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-saugeDark">{praticien ? `${praticien.prenom}${praticien.metier ? ' — ' + praticien.metier : ''}` : 'Praticien'}</p>
          <p className="text-xs text-sauge">{seance.type_seance || 'Séance'}</p>
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
      {showActions && !isAnnulee && (
        <button
          onClick={() => onAnnuler(seance.id)}
          disabled={annuling}
          className="text-xs mt-2 underline disabled:opacity-50"
          style={{ color: '#C4694A' }}
        >
          {annuling ? 'Annulation...' : 'Annuler'}
        </button>
      )}
      {showActions && isAnnulee && slug && (
        <Link to={`/client/rdv/${slug}`} className="text-xs mt-2 inline-block underline" style={{ color: '#2C5F66' }}>
          Reprendre un RDV
        </Link>
      )}
    </div>
  );
}

export default function ClientSeances() {
  const [seances, setSeances] = useState(null);
  const [slugsParPraticien, setSlugsParPraticien] = useState({});
  const [error, setError] = useState('');
  const [annulingId, setAnnulingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await supabaseClient
        .from('seances')
        .select('id, date_seance, heure_seance, type_seance, statut, client_id, user_id')
        .order('date_seance', { ascending: false });
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      setSeances(data || []);

      const userIds = [...new Set((data || []).map((s) => s.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profils } = await supabaseClient.from('profiles').select('id, slug, prenom, nom, metier').in('id', userIds);
        if (!cancelled) setSlugsParPraticien(Object.fromEntries((profils || []).map((p) => [p.id, p])));
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function annuler(seanceId) {
    setAnnulingId(seanceId);
    // RPC (annulation + notification praticien atomiques) plutôt que deux
    // appels séparés : notifications n'accorde l'insert qu'à auth.uid() =
    // user_id, un client_portail ne peut donc jamais insérer sous l'id du
    // praticien directement — cf. 20260815120000_annulation_notifie_praticien.sql.
    const { error: annulerError } = await supabaseClient.rpc('annuler_seance_client', { p_seance_id: seanceId });
    if (annulerError) {
      console.error(annulerError);
      setAnnulingId(null);
      return;
    }
    setSeances((prev) => prev.map((s) => (s.id === seanceId ? { ...s, statut: 'annulé' } : s)));
    setAnnulingId(null);
  }

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
          {aVenir.map((s) => (
            <SeanceCard
              key={s.id}
              seance={s}
              praticien={slugsParPraticien[s.user_id]}
              slug={slugsParPraticien[s.user_id]?.slug}
              showActions
              annuling={annulingId === s.id}
              onAnnuler={annuler}
            />
          ))}
        </div>
      )}

      <h2 className="font-clientSerif text-lg text-saugeDark mb-3">Historique</h2>
      {historique.length === 0 ? (
        <p className="text-sauge text-sm">Aucune séance passée pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {historique.map((s) => <SeanceCard key={s.id} seance={s} showActions={false} />)}
        </div>
      )}
    </div>
  );
}
