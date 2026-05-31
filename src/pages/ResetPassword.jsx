import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);

  const handleReset = async () => {
    if (!password || password.length < 8) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage("Erreur : " + error.message);
    } else {
      setMessage("Mot de passe mis à jour ✓");
      setTimeout(() => onDone?.(), 1500);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 1rem" }}>
      <h2>Nouveau mot de passe</h2>

      <input
        type="password"
        placeholder="Nouveau mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />
      <input
        type="password"
        placeholder="Confirmer le mot de passe"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        style={inputStyle}
      />

      <button onClick={handleReset} disabled={loading} style={btnStyle}>
        {loading ? "Enregistrement…" : "Mettre à jour"}
      </button>

      {message && <p style={{ marginTop: "1rem", color: message.startsWith("Erreur") ? "red" : "green" }}>{message}</p>}
    </div>
  );
}

const inputStyle = {
  display: "block", width: "100%", padding: "0.6rem",
  marginBottom: "0.75rem", fontSize: "1rem",
  border: "1px solid #ccc", borderRadius: "6px",
};
const btnStyle = {
  width: "100%", padding: "0.7rem", fontSize: "1rem",
  background: "#4a7c5b", color: "#fff",
  border: "none", borderRadius: "6px", cursor: "pointer",
};
