import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabaseClient } from '../../../lib/supabaseClient';

export default function ClientPraticienDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [offres, setOffres] = useState([]);
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
    supabaseClient
      .from('offres_praticien')
      .select('*')
      .eq('user_id', p.id)
      .gte('date_prevue', new Date().toISOString().slice(0, 10))
      .order('date_prevue', { ascending: true })
      .then(({ data }) => setOffres(data || []));
  }, [p?.id]);

  if (loading) return <div className="px-6 py-8 text-center text-sauge">Chargement...</div>;
  if (!p) return <div className="px-6 py-8 text-center text-sauge">Praticien introuvable.</div>;

  return (
    <div className="px-6 py-8 max-w-md mx-auto space-y-6">

      <div className="flex items-center gap-4">
        {p.avatar_url && <img src={p.avatar_url} alt={p.prenom} className="w-20 h-20 rounded-full object-cover" />}
        <div>
          <h1 className="font-clientSerif text-xl">{p.prenom} {p.nom}</h1>
          <p className="text-sauge text-sm">{p.metier}</p>
        </div>
      </div>

      <section className="rounded-2xl p-4" style={{ background: '#EAF2F4' }}>
        <h2 className="font-semibold mb-3" style={{ color: '#2C5F66' }}>Qui je suis</h2>
        {p.pays && <p className="text-sm mb-1">📍 {p.pays}</p>}
        {p.langues?.length > 0 && <p className="text-sm mb-1">🗣️ {p.langues.join(', ')}</p>}
        {p.parcours && <p className="text-sm mb-2 whitespace-pre-wrap">{p.parcours}</p>}
        {p.formations?.length > 0 && (
          <ul className="text-sm list-disc list-inside mb-2">
            {p.formations.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        )}
        {p.tarif_indicatif && <p className="text-sm font-medium">💶 {p.tarif_indicatif}</p>}
        {p.anciennete_depuis && (
          <p className="text-sm text-sauge">Pratique depuis {new Date(p.anciennete_depuis).getFullYear()}</p>
        )}
        {(p.tel_pro || p.email_pro) && (
          <div className="flex gap-2 mt-3">
            {p.tel_pro && <a href={`tel:${p.tel_pro}`} className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: '#2C5F66', color: '#2C5F66' }}>📞 Appeler</a>}
            {p.email_pro && <a href={`mailto:${p.email_pro}`} className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: '#2C5F66', color: '#2C5F66' }}>✉️ Email</a>}
          </div>
        )}
      </section>

      <section className="rounded-2xl p-4" style={{ background: '#EEF5EA' }}>
        <h2 className="font-semibold mb-3" style={{ color: '#4A7A3E' }}>Me connaître</h2>
        {p.musiques?.length > 0 && <p className="text-sm mb-1">🎵 {p.musiques.join(', ')}</p>}
        {p.livres?.length > 0 && <p className="text-sm mb-1">📚 {p.livres.join(', ')}</p>}
        {p.recettes?.length > 0 && <p className="text-sm mb-1">🍳 {p.recettes.join(', ')}</p>}
        {p.films_series?.length > 0 && <p className="text-sm mb-1">🎬 {p.films_series.join(', ')}</p>}
        {p.passions?.length > 0 && <p className="text-sm mb-1">🌿 {p.passions.join(', ')}</p>}
        {p.animal && <p className="text-sm mb-1">🐶 {p.animal}</p>}
        {p.petit_plaisir && <p className="text-sm mb-1">☕ {p.petit_plaisir}</p>}
        {p.endroit_prefere && <p className="text-sm mb-1">🌍 {p.endroit_prefere}</p>}
        {p.cote_decale && <p className="text-sm mb-1">😂 {p.cote_decale}</p>}
        {p.phrase_representative && <p className="text-sm italic mt-2">« {p.phrase_representative} »</p>}
        {p.choses_insolites?.length > 0 && (
          <ul className="text-sm list-disc list-inside mt-2">
            {p.choses_insolites.map((c, i) => <li key={i}>✨ {c}</li>)}
          </ul>
        )}
      </section>

      {offres.length > 0 && (
        <section className="rounded-2xl p-4" style={{ background: '#FBEEE6' }}>
          <h2 className="font-semibold mb-3" style={{ color: '#B5652F' }}>Je propose</h2>
          <ul className="space-y-2">
            {offres.map((o) => (
              <li key={o.id} className="text-sm">
                {o.type} · {o.modalite}
                {o.date_prevue && ` · ${new Date(o.date_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.siret && (
        <section className="text-xs text-sauge">
          <h2 className="font-semibold mb-1 text-sauge">Mentions légales</h2>
          <p>SIRET : {p.siret}</p>
        </section>
      )}
    </div>
  );
}
