import { useEffect, useState } from 'react';
import { supabaseClient } from '../../../lib/supabaseClient';

export default function ClientMessagerie({ session }) {
  const [liaisons, setLiaisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [unreadByLiaison, setUnreadByLiaison] = useState({});

  async function charger() {
    setLoading(true);
    const { data: ls } = await supabaseClient
      .from('liaisons_praticien_client')
      .select('id, praticien_id')
      .eq('client_portail_id', session.user.id)
      .eq('statut', 'accepte');
    const praticienIds = [...new Set((ls || []).map(l => l.praticien_id))];
    let profilesMap = {};
    if (praticienIds.length > 0) {
      const { data: profs } = await supabaseClient
        .from('profiles')
        .select('id, prenom, nom, avatar_url, slug')
        .in('id', praticienIds);
      (profs || []).forEach(p => { profilesMap[p.id] = p; });
    }
    const withProfil = (ls || []).map(l => ({ ...l, profil: profilesMap[l.praticien_id] || null }));
    setLiaisons(withProfil);

    if (withProfil.length > 0) {
      const { data: nonLus } = await supabaseClient
        .from('messages_liaison')
        .select('liaison_id')
        .in('liaison_id', withProfil.map(l => l.id))
        .eq('expediteur_type', 'praticien')
        .is('lu_at', null);
      const counts = {};
      (nonLus || []).forEach(m => { counts[m.liaison_id] = (counts[m.liaison_id] || 0) + 1; });
      setUnreadByLiaison(counts);
    } else {
      setUnreadByLiaison({});
    }
    setLoading(false);
  }

  useEffect(() => { if (session?.user?.id) charger(); }, [session?.user?.id]);

  async function ouvrirConversation(liaison) {
    setSelected(liaison);
    setMsgLoading(true);
    const { data } = await supabaseClient
      .from('messages_liaison')
      .select('*')
      .eq('liaison_id', liaison.id)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setMsgLoading(false);
    const aLire = (data || []).filter(m => m.expediteur_type === 'praticien' && !m.lu_at).map(m => m.id);
    if (aLire.length > 0) {
      await supabaseClient.from('messages_liaison').update({ lu_at: new Date().toISOString() }).in('id', aLire);
      setUnreadByLiaison(prev => ({ ...prev, [liaison.id]: 0 }));
    }
  }

  async function envoyer() {
    if (!selected || !msgText.trim() || msgSending) return;
    setMsgSending(true);
    const { error } = await supabaseClient.from('messages_liaison').insert({
      liaison_id: selected.id, expediteur_type: 'client', contenu: msgText.trim(),
    });
    setMsgSending(false);
    if (!error) {
      setMsgText('');
      ouvrirConversation(selected);
    }
  }

  if (loading) return <div className="px-6 py-8 text-center text-sauge">Chargement…</div>;

  if (selected) {
    return (
      <div className="px-4 py-6 max-w-md mx-auto">
        <button onClick={() => setSelected(null)} className="text-sm text-sauge mb-4">← Retour</button>
        <div className="flex items-center gap-3 mb-4">
          {selected.profil?.avatar_url && <img src={selected.profil.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />}
          <div className="font-clientSerif text-lg">{selected.profil?.prenom} {selected.profil?.nom}</div>
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {msgLoading && <p className="text-xs text-sauge">Chargement…</p>}
          {!msgLoading && messages.length === 0 && <p className="text-xs text-sauge">Aucun message pour l'instant.</p>}
          {messages.map(m => (
            <div key={m.id} style={{
              alignSelf: m.expediteur_type === 'client' ? 'flex-end' : 'flex-start',
              background: m.expediteur_type === 'client' ? '#2C5F66' : '#F1EFE8',
              color: m.expediteur_type === 'client' ? '#fff' : '#222',
              borderRadius: 10, padding: '8px 12px', fontSize: 13, maxWidth: '80%',
            }}>
              {m.contenu}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') envoyer(); }}
            placeholder="Votre message…"
            className="flex-1 border border-sauge/25 rounded-full px-3 py-2 text-sm"
          />
          <button
            onClick={envoyer}
            disabled={msgSending || !msgText.trim()}
            className="text-xs px-4 py-2 rounded-full text-white font-medium"
            style={{ background: '#2C5F66', opacity: msgSending ? 0.6 : 1 }}
          >
            Envoyer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-md mx-auto">
      <h1 className="font-clientSerif text-2xl text-saugeDark mb-4 text-center">Messagerie</h1>
      {liaisons.length === 0 && (
        <p className="text-sauge text-sm text-center">
          Aucune conversation pour l'instant. Demandez une liaison depuis la fiche d'un praticien dans l'annuaire.
        </p>
      )}
      <div className="space-y-2">
        {liaisons.map(l => (
          <button
            key={l.id}
            onClick={() => ouvrirConversation(l)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-sauge/15 bg-white text-left"
          >
            {l.profil?.avatar_url && <img src={l.profil.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />}
            <div className="flex-1">
              <div className="text-sm font-medium">{l.profil?.prenom} {l.profil?.nom}</div>
            </div>
            {unreadByLiaison[l.id] > 0 && (
              <span className="text-xs text-white rounded-full px-2 py-0.5" style={{ background: '#993556' }}>
                {unreadByLiaison[l.id]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
