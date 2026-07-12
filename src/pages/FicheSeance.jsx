import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function FicheSeance() {
  const { id: seanceId } = useParams();
  const navigate = useNavigate();

  const [seance,  setSeance]  = useState(null);
  const [client,  setClient]  = useState(null);
  const [notes,   setNotes]   = useState("");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [editPrix, setEditPrix] = useState(false);
  const [prixVal, setPrixVal] = useState('');
  const [editType, setEditType] = useState(false);
  const [typeVal, setTypeVal] = useState('');

  useEffect(() => {
    if (!seanceId) return;
    (async () => {
      setLoading(true);
      const { data: s } = await supabase
        .from("seances")
        .select("*")
        .eq("id", seanceId)
        .single();
      if (s) {
        setSeance(s);
        setNotes(s.notes || "");
        setPrixVal(s.prix_euros != null ? String(s.prix_euros) : '');
        setTypeVal(s.type_seance || '');
        setPrixVal(s.prix_euros != null ? String(s.prix_euros) : '');
        setTypeVal(s.type_seance || '');
        if (s.client_id) {
          const { data: c } = await supabase
            .from("clients")
            .select("nom, prenom, email, telephone")
            .eq("id", s.client_id)
            .single();
          setClient(c);
        }
      }
      setLoading(false);
    })();
  }, [seanceId]);

  const savePrix = async () => {
    await supabase.from("seances").update({ prix_euros: parseFloat(prixVal)||0 }).eq("id", seanceId);
    setSeance(s => ({...s, prix_euros: parseFloat(prixVal)||0}));
    setEditPrix(false);
  };
  const saveType = async () => {
    await supabase.from("seances").update({ type_seance: typeVal }).eq("id", seanceId);
    setSeance(s => ({...s, type_seance: typeVal}));
    setEditType(false);
  };
  const saveNotes = useCallback(async (value) => {
    setSaving(true);
    setSaved(false);
    await supabase.from("seances").update({ notes: value }).eq("id", seanceId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [seanceId]);

  useEffect(() => {
    if (!seance) return;
    const timer = setTimeout(() => saveNotes(notes), 1000);
    return () => clearTimeout(timer);
  }, [notes]);

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  };

  if (loading) return (
    <div style={s.center}>
      <div style={s.spinner} />
      <p style={{ color: "#888", marginTop: 16 }}>Chargement…</p>
    </div>
  );

  if (!seance) return (
    <div style={s.center}>
      <p style={{ color: "#c00" }}>Séance introuvable.</p>
      <button onClick={() => window.location.hash = '#agenda'} style={s.btnRetour}>← Retour agenda</button>
    </div>
  );

  return (
    <div style={s.page}>

      {/* HEADER */}
      <div style={s.header}>
        <button
          onClick={() => navigate('/agenda')}
          style={{position:'absolute',top:'16px',right:'16px',background:'#4BBFCE',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 16px',fontSize:'13px',fontWeight:'600',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px'}}
        >
          <i className="ti ti-calendar" style={{fontSize:'15px'}} /> Agenda
        </button>
        <div>
          <h1 style={s.titre}>📋 Fiche séance</h1>
          <p style={s.sousTitre}>
            {client ? `${client.prenom} ${client.nom}` : seance.prenom ? `${seance.prenom} ${seance.nom}` : "Client inconnu"}
            {" · "}
            <span style={{ textTransform: "capitalize" }}>
              {formatDate(seance.date_seance)}
            </span>
            {seance.heure_seance ? ` à ${seance.heure_seance}` : ""}
          </p>
        </div>
      </div>

      <div style={s.body}>

        {/* INFOS RDV */}
        <div style={s.card}>
          <h2 style={s.cardTitre}>📅 Rendez-vous</h2>
          <div style={s.grid}>
            <InfoLine label="Client"  value={client ? `${client.prenom} ${client.nom}` : seance.prenom ? `${seance.prenom} ${seance.nom}` : "—"} />
            <InfoLine label="Email"   value={client?.email     || "—"} />
            <InfoLine label="Tél."    value={client?.telephone || "—"} />
            <InfoLine label="Date"    value={formatDate(seance.date_seance)} capitalize />
            <InfoLine label="Heure"   value={seance.heure_seance || "—"} />
            {editType ? (
              <div style={{display:'flex',gap:8,alignItems:'center',gridColumn:'1/-1'}}>
                <select value={typeVal} onChange={e=>setTypeVal(e.target.value)} style={{padding:'6px 10px',borderRadius:6,border:'1px solid #ddd',fontSize:13}}>
                  {['Sophrologie','Coaching','Naturopathie','Massage','Autre'].map(t=><option key={t}>{t}</option>)}
                </select>
                <button onClick={saveType} style={{padding:'5px 12px',background:'#2d6a4f',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>✓</button>
                <button onClick={()=>setEditType(false)} style={{padding:'5px 10px',background:'#eee',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>✕</button>
              </div>
            ) : (
              <div style={{cursor:'pointer'}} onClick={()=>setEditType(true)}>
                <InfoLine label="Type ✏️" value={seance.type_seance||'—'} />
              </div>
            )}
            {editPrix ? (
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <input type="number" value={prixVal} onChange={e=>setPrixVal(e.target.value)} style={{padding:'6px 10px',borderRadius:6,border:'1px solid #ddd',fontSize:13,width:100}} placeholder="0" />
                <span style={{fontSize:13}}>€</span>
                <button onClick={savePrix} style={{padding:'5px 12px',background:'#2d6a4f',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>✓</button>
                <button onClick={()=>setEditPrix(false)} style={{padding:'5px 10px',background:'#eee',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>✕</button>
              </div>
            ) : (
              <div style={{cursor:'pointer'}} onClick={()=>setEditPrix(true)}>
                <InfoLine label="Prix ✏️" value={seance.prix_euros != null ? `${seance.prix_euros} €` : '— (cliquer pour ajouter)'} />
              </div>
            )}
            {seance.statut      && <InfoLine label="Statut" value={seance.statut} />}
          </div>
        </div>

        {/* NOTES */}
        <div style={s.card}>
          <div style={s.notesHeader}>
            <h2 style={s.cardTitre}>🖊️ Notes de consultation</h2>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:12,color:saving?"#f0a500":saved?"#2d6a4f":"#ccc",transition:"color 0.3s"}}>
                {saving?"Enregistrement…":saved?"✓ Sauvegardé":"Sauvegarde auto"}
              </span>
              <button onClick={()=>saveNotes(notes)} style={{padding:'5px 14px',borderRadius:6,border:'none',background:'#2d6a4f',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                💾 Sauvegarder
              </button>
            </div>
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Observations, ressentis, points abordés pendant la séance…"
            style={s.textarea}
          />
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => window.location.href = '/seances'}
            style={{ ...s.btn, background: "#f0f0ec", color: "#333" }}>
            📋 Voir toutes les séances
          </button>
          <button
            onClick={() => client && navigate(`/clients/${client.id}`)}
            style={{ ...s.btn, background: "#2d6a4f", color: "#fff" }}
            disabled={!client}>
            👤 Fiche client
          </button>
        </div>

      </div>
    </div>
  );
}

function InfoLine({ label, value, capitalize }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </span>
      <span style={{
        fontSize: 15, color: "#1a1a1a", fontWeight: 500,
        textTransform: capitalize ? "capitalize" : "none",
      }}>
        {value}
      </span>
    </div>
  );
}

const s = {
  page:    { minHeight: "100vh", background: "#f5f5f0", fontFamily: "'DM Sans', sans-serif" },
  header:  { background: "#1a3a2a", padding: "20px 32px", display: "flex", alignItems: "center", gap: 24, position: "relative" },
  titre:   { margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" },
  sousTitre: { margin: "4px 0 0", fontSize: 14, color: "#a8c5b5" },
  btnRetour: { background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" },
  body:    { maxWidth: 800, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 },
  card:    { background: "#fff", borderRadius: 12, padding: "28px 32px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" },
  cardTitre: { margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#2d6a4f" },
  grid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 32px" },
  notesHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  textarea: { width: "100%", minHeight: 240, border: "1px solid #e0e0d8", borderRadius: 10, padding: 16, fontSize: 15, lineHeight: 1.7, color: "#333", resize: "vertical", outline: "none", fontFamily: "inherit", background: "#fafaf8", boxSizing: "border-box" },
  btn:     { padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  center:  { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 },
  spinner: { width: 36, height: 36, border: "3px solid #e0e0d8", borderTop: "3px solid #2d6a4f", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};
