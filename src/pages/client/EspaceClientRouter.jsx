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
import ClientMonProfil from './screens/ClientMonProfil';
import ClientBientotDisponible from './screens/ClientBientotDisponible';
import ClientPraticienDetail from './screens/ClientPraticienDetail';

const AUTHENTICATED_SCREENS = [
  { path: '/client/accueil', element: (session) => <ClientAccueil session={session} /> },
  { path: '/client/seances', element: () => <ClientSeances /> },
  { path: '/client/annuaire', element: (session) => <ClientAnnuaire session={session} /> },
  { path: '/client/praticien/:slug', element: () => <ClientPraticienDetail /> },
  { path: '/client/evenements', element: (session) => <ClientEvenements session={session} /> },
  { path: '/client/favoris', element: (session) => <ClientFavoris session={session} /> },
  { path: '/client/live', element: () => <ClientLive /> },
  { path: '/client/profil', element: () => <ClientProfil /> },
  { path: '/client/profil/moi', element: (session) => <ClientMonProfil session={session} /> },
  { path: '/client/profil/notifications', element: () => <ClientBientotDisponible titre="Notifications" /> },
  { path: '/client/profil/aide', element: () => <ClientBientotDisponible titre="Aide / FAQ" /> },
];

// Racine de routage de l'espace client, montée sur /client/* dans App.jsx.
// Session gérée via supabaseClient (storageKey dédiée) — totalement
// indépendante de l'état `user` praticien géré par App.jsx.
//
// auth.users est PARTAGÉ entre l'espace client et l'espace praticien (même
// projet Supabase) : la storageKey dédiée isole seulement le stockage de
// session côté navigateur, pas l'authentification elle-même. N'importe
// quelles identifiants valides (y compris ceux d'un praticien) réussiraient
// un signInWithPassword ici. roleStatus vérifie donc l'appartenance à
// clients_portail AVANT tout rendu de contenu authentifié — tant que ce
// n'est pas confirmé ('ok'), rien ne s'affiche (pas de fenêtre où les
// données du mauvais espace apparaissent brièvement).
export default function EspaceClientRouter() {
  const [session, setSession] = useState(undefined); // undefined = chargement initial
  const [roleStatus, setRoleStatus] = useState('idle'); // idle | checking | ok | denied
  const [deniedMessage, setDeniedMessage] = useState('');

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabaseClient.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!session) {
      setRoleStatus('idle');
      return;
    }
    let cancelled = false;
    setRoleStatus('checking');
    supabaseClient
      .from('clients_portail')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setRoleStatus('ok');
        } else {
          setDeniedMessage("Ce compte n'est pas un compte client.");
          supabaseClient.auth.signOut().then(() => {
            if (!cancelled) setRoleStatus('denied');
          });
        }
      });
    return () => { cancelled = true; };
  }, [session]);

  if (session === undefined) return null;
  // Session présente mais rôle pas encore confirmé (ou refusé, signOut en
  // cours) : ne rien rendre, plutôt que de rendre puis corriger après coup.
  if (session && roleStatus !== 'ok') return null;

  const authorized = !!session && roleStatus === 'ok';

  return (
    <div className="font-clientSans min-h-screen bg-creme">
      <Routes>
        <Route
          path="/client/inscription"
          element={authorized ? <Navigate to="/client/accueil" replace /> : <ClientInscription />}
        />
        <Route
          path="/client/connexion"
          element={
            authorized
              ? <Navigate to="/client/accueil" replace />
              : <ClientConnexion errorMessage={deniedMessage} onErrorShown={() => setDeniedMessage('')} />
          }
        />
        {AUTHENTICATED_SCREENS.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={authorized ? <ClientShell>{element(session)}</ClientShell> : <Navigate to="/client/connexion" replace />}
          />
        ))}
        <Route
          path="*"
          element={<Navigate to={authorized ? '/client/accueil' : '/client/connexion'} replace />}
        />
      </Routes>
    </div>
  );
}
