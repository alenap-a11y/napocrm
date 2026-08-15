import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabaseClient } from '../../../lib/supabaseClient';
import PraticienApercuContenu from '../../../components/PraticienApercuContenu';

export default function ClientPraticienDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [activites, setActivites] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabaseClient.rpc('get_praticien_detail', { p_slug: slug }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error('get_praticien_detail error:', error);
      setP(data?.[0] || null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!p?.id) return;
    const key = `vue_praticien_${p.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    supabaseClient.rpc('increment_vue_praticien', { p_praticien_id: p.id });
  }, [p?.id]);

  useEffect(() => {
    if (!p?.id) return;
    supabaseClient.rpc('get_activites_praticien', { p_praticien_id: p.id })
      .then(({ data }) => setActivites((data || []).filter(a => !a.date_prevue || new Date(a.date_prevue) >= new Date(new Date().toDateString()))));
    supabaseClient
      .from('boutique_produits')
      .select('*')
      .eq('user_id', p.id)
      .order('ordre')
      .then(({ data }) => setProduits(data || []));
  }, [p?.id]);

  if (loading) return <div className="px-6 py-8 text-center text-sauge">Chargement...</div>;
  if (!p) return <div className="px-6 py-8 text-center text-sauge">Praticien introuvable.</div>;

  return <PraticienApercuContenu p={p} activites={activites} produits={produits} />;
}
