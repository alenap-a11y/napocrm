import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabaseClient } from '../../lib/supabaseClient';
import ClientInscription from './ClientInscription';
import ClientConnexion from './ClientConnexion';
import ClientAccueilPlaceholder from './ClientAccueilPlaceholder';

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
        <Route
          path="/client/accueil"
          element={session ? <ClientAccueilPlaceholder session={session} /> : <Navigate to="/client/connexion" replace />}
        />
        <Route
          path="*"
          element={<Navigate to={session ? '/client/accueil' : '/client/connexion'} replace />}
        />
      </Routes>
    </div>
  );
}
