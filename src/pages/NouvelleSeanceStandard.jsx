import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const TYPES = ['Sophrologie', 'Naturopathie', 'Coaching', 'Énergie', 'Massage', 'Fleurs de Bach', 'Autre'];
const ENERGIE_TYPES = ['Énergie', 'Magnétiseur', 'Énergéticien'];

export default function NouvelleSeanceStandard() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [heure, setHeure] = useState('09:00');
  const [duree, setDuree] = useState('60');
  const [prix, setPrix] = useState('');
  const [type, setType] = useState('Sophrologie');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingClients(false); return; }
      const { data } = await supabase.from('clients').select('id, prenom, nom').eq('user_id', user.id).order('nom');
      setClients(data || []);
      setLoadingClients(false);
    })();
  }, []);

  const clientLabel = c => `${c.prenom || ''} ${c.nom || ''}`.trim() || '—';

  async function handleSave() {
    if (!date || !heure) { setMsg('Date et heure requises.'); return; }
    setSaving(true);
    setMsg('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      const client = clients.find(c => c.id === clientId);

      const { data: seance, error } = await supabase.from('seances').insert({
        user_id: user.id,
        client_id: clientId || null,
        prenom: client?.prenom || 'Client',
        nom: client?.nom || 'non renseigné',
        date_seance: date,
        heure_seance: heure,
        duree_minutes: parseInt(duree, 10) || 60,
        prix_euros: parseFloat(prix) || null,
        type_seance: type,
        notes: notes.trim() || null,
        statut: 'planifié',
      }).select().single();

      if (error) throw error;

      if (ENERGIE_TYPES.includes(type) && clientId) {
        try {
          const { count } = await supabase.from('energie_seances')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId);
          await supabase.from('energie_seances').insert({
            user_id: user.id,
            client_id: clientId,
            date_seance: date,
            heure_seance: heure,
            numero_seance: (count || 0) + 1,
          });
        } catch (e) { console.warn('Création séance Énergie liée:', e); }
      }

      setMsg('✓ Séance créée');
      setTimeout(() => navigate(`/seances/${seance.id}/fiche`), 900);
    } catch (err) {
      setMsg(`✗ ${err.message}`);
      setSaving(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button
          onClick={() => navigate('/seances')}
          style={{ position: 'absolute', top: '16px', right: '16px', background: '#4BBFCE', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: '15px' }} /> Séances
        </button>
        <div>
          <h1 style={s.titre}>📋 Nouvelle séance</h1>
          <p style={s.sousTitre}>Séance standard — pour Énergie/Fleurs de Bach/3D, utilisez leur module dédié</p>
        </div>
      </div>

      <div style={s.body}>

        <div style={s.card}>
          <h2 style={s.cardTitre}>📅 Rendez-vous</h2>
          <div style={s.grid}>

            <div>
              <span style={s.label}>Client</span>
              <select value={clientId} onChange={e => setClientId(e.target.value)} disabled={loadingClients} style={s.input}>
                <option value="">— Sans client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{clientLabel(c)}</option>)}
              </select>
            </div>

            <div>
              <span style={s.label}>Type</span>
              <select value={type} onChange={e => setType(e.target.value)} style={s.input}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <span style={s.label}>Date</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} />
            </div>

            <div>
              <span style={s.label}>Heure</span>
              <input type="time" value={heure} onChange={e => setHeure(e.target.value)} style={s.input} />
            </div>

            <div>
              <span style={s.label}>Durée (min)</span>
              <select value={duree} onChange={e => setDuree(e.target.value)} style={s.input}>
                {[30, 45, 60, 75, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>

            <div>
              <span style={s.label}>Prix (€)</span>
              <input type="number" value={prix} onChange={e => setPrix(e.target.value)} placeholder="60" min="0" step="5" style={s.input} />
            </div>

          </div>
        </div>

        <div style={s.card}>
          <h2 style={s.cardTitre}>🖊️ Notes de consultation</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Observations, ressentis, points abordés pendant la séance…"
            style={s.textarea}
          />
        </div>

        {msg && (
          <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, background: msg.startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: msg.startsWith('✓') ? '#3B6D11' : '#993556' }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/seances')} style={{ ...s.btn, background: '#f0f0ec', color: '#333' }}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving} style={{ ...s.btn, background: '#2d6a4f', color: '#fff', opacity: saving ? 0.7 : 1, flex: 1 }}>
            {saving ? 'Enregistrement…' : '💾 Créer la séance'}
          </button>
        </div>

      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f5f5f0", fontFamily: "\'DM Sans\', sans-serif" },
  header: { background: "#1a3a2a", padding: "20px 32px", display: "flex", alignItems: "center", gap: 24, position: "relative" },
  titre: { margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" },
  sousTitre: { margin: "4px 0 0", fontSize: 13, color: "#a8c5b5" },
  body: { maxWidth: 800, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 },
  card: { background: "#fff", borderRadius: 12, padding: "28px 32px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" },
  cardTitre: { margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#2d6a4f" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" },
  label: { display: 'block', fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 },
  input: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e0e0d8', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', color: '#1a1a1a', background: '#fafaf8' },
  textarea: { width: "100%", minHeight: 160, border: "1px solid #e0e0d8", borderRadius: 10, padding: 16, fontSize: 15, lineHeight: 1.7, color: "#333", resize: "vertical", outline: "none", fontFamily: "inherit", background: "#fafaf8", boxSizing: "border-box" },
  btn: { padding: "12px 24px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 },
};
