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
    <div className="px-6 py-8 max-w-md mx-auto space-y-8">

      <div className="flex items-center gap-4">
        {p.avatar_url && <img src={p.avatar_url} alt={p.prenom} className="w-20 h-20 rounded-full object-cover" />}
        <div>
          <h1 className="font-clientSerif text-xl">{p.prenom} {p.nom}</h1>
          <p className="text-sauge text-sm">{p.metier}</p>
        </div>
      </div>

      {/* 1. PRO */}
      <section className="rounded-2xl p-4 border border-[#2C5F66]/15" style={{ background: '#EAF2F4' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-semibold" style={{ background: '#2C5F66' }}>1</span>
          <h2 className="font-semibold" style={{ color: '#2C5F66' }}>Qui je suis</h2>
        </div>
        {p.pays && <p className="text-sm mb-1">📍 {p.pays}</p>}
        {p.langues?.length > 0 && <p className="text-sm mb-1">🗣️ {p.langues.join(', ')}</p>}
        {p.parcours && <p className="text-sm mb-2 whitespace-pre-wrap">{p.parcours}</p>}
        {p.formations?.length > 0 && (
          <ul className="text-sm list-disc list-inside mb-2 space-y-0.5">
            {p.formations.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        )}
        {p.tarif_indicatif && <p className="text-sm font-medium mt-2">💶 {p.tarif_indicatif}</p>}
        {p.anciennete_depuis && (
          <p className="text-sm text-sauge mt-1">Pratique depuis {new Date(p.anciennete_depuis).getFullYear()}</p>
        )}
        {(p.tel_pro || p.email_pro) && (
          <div className="flex gap-2 mt-3">
            {p.tel_pro && <a href={`tel:${p.tel_pro}`} className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: '#2C5F66', color: '#2C5F66' }}>📞 Appeler</a>}
            {p.email_pro && <a href={`mailto:${p.email_pro}`} className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: '#2C5F66', color: '#2C5F66' }}>✉️ Email</a>}
          </div>
        )}
        {p.siret && <p className="text-xs text-sauge mt-3 pt-2 border-t border-[#2C5F66]/15">SIRET : {p.siret}</p>}
      </section>

      {/* 2. HUMAIN */}
      <section className="rounded-2xl p-4 border border-[#4A7A3E]/15" style={{ background: '#EEF5EA' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-semibold" style={{ background: '#4A7A3E' }}>2</span>
          <h2 className="font-semibold" style={{ color: '#4A7A3E' }}>Me connaître</h2>
        </div>
        <div className="space-y-2 text-sm">
          {p.musiques?.length > 0 && (
            <div><span className="font-medium">🎵 Musiques</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">{p.musiques.map((m, i) => <li key={i} className="break-all">{m}</li>)}</ul>
            </div>
          )}
          {p.livres?.length > 0 && (
            <div><span className="font-medium">📚 Livres</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">{p.livres.map((l, i) => <li key={i} className="break-all">{l}</li>)}</ul>
            </div>
          )}
          {p.recettes?.length > 0 && (
            <div><span className="font-medium">🍳 Recettes</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">{p.recettes.map((r, i) => <li key={i} className="break-all">{r}</li>)}</ul>
            </div>
          )}
          {p.films_series?.length > 0 && <p>🎬 {p.films_series.join(', ')}</p>}
          {p.passions?.length > 0 && <p>🌿 {p.passions.join(', ')}</p>}
          {p.animal && <p>🐶 {p.animal}</p>}
          {p.petit_plaisir && <p>☕ {p.petit_plaisir}</p>}
          {p.endroit_prefere && <p>🌍 {p.endroit_prefere}</p>}
          {p.cote_decale && <p>😂 {p.cote_decale}</p>}
        </div>
        {p.phrase_representative && <p className="text-sm italic mt-3 pt-2 border-t border-[#4A7A3E]/15">« {p.phrase_representative} »</p>}
        {p.choses_insolites?.length > 0 && (
          <ul className="text-sm list-disc list-inside mt-2 space-y-0.5">
            {p.choses_insolites.map((c, i) => <li key={i}>✨ {c}</li>)}
          </ul>
        )}
      </section>

      {/* 3. ACTIVITÉS */}
      {offres.length > 0 && (
        <section className="rounded-2xl p-4 border border-[#B5652F]/15" style={{ background: '#FBEEE6' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-semibold" style={{ background: '#B5652F' }}>3</span>
            <h2 className="font-semibold" style={{ color: '#B5652F' }}>Je propose</h2>
          </div>
          <ul className="space-y-2 text-sm">
            {offres.map((o) => (
              <li key={o.id}>
                {o.type} · {o.modalite}
                {o.date_prevue && ` · ${new Date(o.date_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
