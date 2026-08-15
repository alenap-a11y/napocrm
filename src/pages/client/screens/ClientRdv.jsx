import { useParams } from 'react-router-dom';
import AgendaPublic from '../../AgendaPublic';
import { supabaseClient } from '../../../lib/supabaseClient';

// AgendaPublic reçoit `slug` en prop direct dans App.jsx (pattern hybride,
// extrait de location.pathname), différent du routing déclaratif de
// l'espace client — ce wrapper fait le pont via useParams() sans toucher à
// AgendaPublic lui-même.
export default function ClientRdv({ session }) {
  const { slug } = useParams();
  return <AgendaPublic slug={slug} session={session} supabaseClient={supabaseClient} />;
}
