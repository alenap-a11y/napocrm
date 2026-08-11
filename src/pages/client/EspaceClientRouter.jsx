import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabaseClient } from '../../lib/supabaseClient';
import ClientInscription from './ClientInscription';
import ClientConnexion from './ClientConnexion';
import ClientShell from './ClientShell';
import ClientAccueil from './screens/ClientAccueil';
import ClientSeances from './screens/ClientSeances';
import ClientAnnuaire from './screens/ClientAnnuaire';
import ClientEvenements from './screens/ClientEvenements';
import ClientFavoris from './screens/ClientFavoris';
import ClientLive from './screens/ClientLive';
import ClientProfil from './screens/ClientProfil';

const AUTHENTICATED_SCREENS = [
  { path: '/client/accueil', element: (session) => <ClientAccueil session={session} /> },
  { path: '/client/seances', element: () => <ClientSeances /> },
  { path: '/client/annuaire', element: (session) => <ClientAnnuaire session={session} /> },
  { path: '/client/evenements', element: (session) => <ClientEvenements session={session} /> },
  { path: '/client/favoris', element: (session) => <ClientFavoris session={session} /> },
  { path: '/client/live', element: () => <ClientLive /> },
  { path: '/client/profil', element: () => <ClientProfil /> },
];

// Racine de routage de l'espace client, montée sur /client/* dans App.jsx.
// Session gérée via supabaseClient (storageKey dédiée) — totalement
// indépendante de l'état `user` praticien géré par App.jsx.
export default function EspaceClientRouter() {
  const [session, setSession] = useState(undefined); // undefined = chargement initial

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabaseClient.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;

  return (
    <div className="font-clientSans min-h-screen bg-creme">
      <Routes>
        <Route
          path="/client/inscription"
          element={session ? <Navigate to="/client/accueil" replace /> : <ClientInscription />}
        />
        <Route
          path="/client/connexion"
          element={session ? <Navigate to="/client/accueil" replace /> : <ClientConnexion />}
        />
        {AUTHENTICATED_SCREENS.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={session ? <ClientShell>{element(session)}</ClientShell> : <Navigate to="/client/connexion" replace />}
          />
        ))}
        <Route
          path="*"
          element={<Navigate to={session ? '/client/accueil' : '/client/connexion'} replace />}
        />
      </Routes>
    </div>
  );
}
