import { Link } from 'react-router-dom';

export default function ClientBientotDisponible({ titre }) {
  return (
    <div className="px-6 py-8 max-w-md mx-auto text-center">
      <Link to="/client/profil" className="text-xs text-saugeDark mb-4 inline-flex items-center gap-1">
        <i className="ti ti-arrow-left" style={{ fontSize: 12 }} aria-hidden="true" /> Retour
      </Link>
      <h1 className="font-clientSerif text-2xl text-saugeDark mb-2">{titre}</h1>
      <p className="text-sauge text-sm">Bientôt disponible.</p>
    </div>
  );
}
