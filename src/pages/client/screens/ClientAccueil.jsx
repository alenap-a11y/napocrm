// Contenu minimal — la logique de suggestions basées sur les préférences
// arrive à l'étape 4/12.
export default function ClientAccueil({ session }) {
  const prenom = session?.user?.user_metadata?.prenom || '';
  return (
    <div className="px-6 py-10 text-center">
      <h1 className="font-clientSerif text-3xl text-saugeDark mb-2">Bonjour {prenom} 🌿</h1>
      <p className="text-sauge text-sm">Votre espace client est prêt.</p>
    </div>
  );
}
