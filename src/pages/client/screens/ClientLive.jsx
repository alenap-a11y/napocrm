// Écran minimal V1 : pas de logique de visio dans ce chantier (dépend de
// Napo-Live, chantier séparé) — affiche la prochaine session ou ce message.
export default function ClientLive() {
  return (
    <div className="px-6 py-10 text-center">
      <h1 className="font-clientSerif text-2xl text-saugeDark mb-2">Live</h1>
      <p className="text-sauge text-sm">Aucune session en cours.</p>
    </div>
  );
}
