#!/bin/bash

# ============================================================
# NapoCRM — Fix Supabase Password Reset Redirect
# Exécuter depuis la racine du projet : bash fix-supabase-reset.sh
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║     NapoCRM — Fix Supabase Password Reset        ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ── 1. Détection du dossier src ──────────────────────────────
SRC="src"
if [ ! -d "$SRC" ]; then
  echo -e "${RED}❌ Dossier 'src' introuvable. Lancer depuis la racine du projet.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Dossier src trouvé${NC}"

# ── 2. Créer src/pages/ResetPassword.jsx ────────────────────
RESET_FILE="$SRC/pages/ResetPassword.jsx"

if [ -f "$RESET_FILE" ]; then
  echo -e "${YELLOW}⚠ $RESET_FILE existe déjà — ignoré (supprimer manuellement pour régénérer)${NC}"
else
  cat > "$RESET_FILE" << 'RESET_EOF'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

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
      setTimeout(() => navigate("/login"), 1500);
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
RESET_EOF
  echo -e "${GREEN}✓ ResetPassword.jsx créé${NC}"
fi

# ── 3. Chercher App.jsx ou App.tsx ───────────────────────────
APP_FILE=""
for f in "$SRC/App.jsx" "$SRC/App.tsx" "$SRC/app/App.jsx" "$SRC/app/App.tsx"; do
  [ -f "$f" ] && APP_FILE="$f" && break
done

if [ -z "$APP_FILE" ]; then
  echo -e "${RED}❌ App.jsx/App.tsx introuvable dans src/. Patch manuel requis.${NC}"
  echo ""
  echo -e "${YELLOW}── Ajoute manuellement dans ton router :${NC}"
  echo '   import ResetPassword from "./pages/ResetPassword";'
  echo '   <Route path="/reset-password" element={<ResetPassword />} />'
else
  echo -e "${GREEN}✓ App file trouvé : $APP_FILE${NC}"

  # Vérifier si le patch est déjà présent
  if grep -q "reset-password" "$APP_FILE" 2>/dev/null; then
    echo -e "${YELLOW}⚠ Route /reset-password déjà présente dans $APP_FILE — ignoré${NC}"
  else
    echo ""
    echo -e "${CYAN}── Contenu actuel de $APP_FILE :${NC}"
    echo "────────────────────────────────────────"
    cat -n "$APP_FILE"
    echo ""
    echo "────────────────────────────────────────"
    echo ""
    echo -e "${YELLOW}⚠ Patch automatique non appliqué (risque de casser le routing existant).${NC}"
    echo -e "${YELLOW}   Ajoute ces deux lignes manuellement dans $APP_FILE :${NC}"
    echo ""
    echo -e "   ${CYAN}// En haut avec les imports :${NC}"
    echo '   import ResetPassword from "./pages/ResetPassword";'
    echo ""
    echo -e "   ${CYAN}// Dans ton <Routes> :${NC}"
    echo '   <Route path="/reset-password" element={<ResetPassword />} />'
  fi
fi

# ── 4. Vérifier / patcher useEffect de détection dans App ────
echo ""
echo -e "${CYAN}── Vérification du hook de détection du token recovery…${NC}"

if [ -n "$APP_FILE" ] && grep -q "type=recovery" "$APP_FILE" 2>/dev/null; then
  echo -e "${GREEN}✓ Hook de détection déjà présent dans $APP_FILE${NC}"
else
  echo ""
  echo -e "${YELLOW}⚠ Hook manquant. Ajoute ce useEffect dans ton composant App (après les imports) :${NC}"
  echo ""
  cat << 'HOOK_EOF'
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      // Supabase a déjà chargé la session depuis le hash
      navigate("/reset-password");
    }
  }, []);
HOOK_EOF
  echo ""
  echo -e "${YELLOW}   Assure-toi d'importer useEffect et useNavigate si pas déjà fait.${NC}"
fi

# ── 5. Rappel Supabase Dashboard ─────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗"
echo -e "║  ⚙  Supabase Dashboard — à faire manuellement   ║"
echo -e "╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo "  1. Va sur : https://supabase.com/dashboard"
echo "  2. Projet → Authentication → URL Configuration"
echo ""
echo -e "  ${GREEN}Site URL :${NC}"
echo "     https://napocrm.netlify.app"
echo ""
echo -e "  ${GREEN}Redirect URLs (ajoute les deux) :${NC}"
echo "     https://napocrm.netlify.app/**"
echo "     http://localhost:3000/**"
echo ""

# ── 6. Résumé ────────────────────────────────────────────────
echo -e "${CYAN}╔══════════════════════════════════════════════════╗"
echo -e "║                    Résumé                        ║"
echo -e "╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}✓ Fichier créé   :${NC} $RESET_FILE"
echo -e "  ${YELLOW}▸ Action requise :${NC} Ajouter la route /reset-password dans $APP_FILE"
echo -e "  ${YELLOW}▸ Action requise :${NC} Ajouter le useEffect de détection dans App"
echo -e "  ${YELLOW}▸ Action requise :${NC} Configurer les URLs dans Supabase Dashboard"
echo ""
echo -e "${GREEN}Terminé.${NC}"
