#!/bin/bash

# =============================================
# SCRIPT COMPLET - Installation widget Notes
# =============================================

set -e  # Stop en cas d'erreur

cd ~/napocrm

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 INSTALLATION WIDGET NOTES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# =============================================
# ÉTAPE 1 : Sauvegarde
# =============================================
echo "📦 ÉTAPE 1/6 : Sauvegarde du fichier..."
BACKUP_FILE="src/components/Dashboard.jsx.backup-$(date +%Y%m%d-%H%M%S)"
cp src/components/Dashboard.jsx "$BACKUP_FILE"
echo "✅ Sauvegarde créée : $BACKUP_FILE"
echo ""

# =============================================
# ÉTAPE 2 : Restauration propre
# =============================================
echo "🔄 ÉTAPE 2/6 : Restauration du fichier propre..."
# On utilise le backup original s'il existe, sinon on garde le fichier actuel
if [ -f "src/components/Dashboard.jsx.backup-notes" ]; then
    cp src/components/Dashboard.jsx.backup-notes src/components/Dashboard.jsx
    echo "✅ Restauré depuis Dashboard.jsx.backup-notes"
else
    echo "⚠️  Pas de backup notes trouvé, utilisation du fichier actuel"
fi
echo ""

# =============================================
# ÉTAPE 3 : Ajout des imports si manquants
# =============================================
echo "📦 ÉTAPE 3/6 : Vérification des imports..."
python3 << 'PYTHON'
import re

with open('src/components/Dashboard.jsx', 'r') as f:
    content = f.read()

# Vérifie que useState est importé
if 'import { useState, useEffect }' not in content:
    content = content.replace(
        'import { useState, useEffect } from "react"',
        'import { useState, useEffect } from "react"'
    )
    print("✅ Imports OK")

with open('src/components/Dashboard.jsx', 'w') as f:
    f.write(content)
PYTHON
echo "✅ Imports vérifiés"
echo ""

# =============================================
# ÉTAPE 4 : Ajout du state notesCount
# =============================================
echo "📝 ÉTAPE 4/6 : Ajout du state notesCount..."

python3 << 'PYTHON'
import re

with open('src/components/Dashboard.jsx', 'r') as f:
    content = f.read()

# 1. Ajoute le state après la déclaration de taches
# Vérifie si notesCount existe déjà
if 'notesCount' not in content:
    # Trouve la ligne avec "const { data: taches }"
    pattern = r'(const \{ data: taches \} = useRealtimeTable\([^)]*\)\s*\))'
    replacement = r'\1\n  const [notesCount, setNotesCount] = useState(null)'
    content = re.sub(pattern, replacement, content)
    print("✅ State notesCount ajouté")
else:
    print("⚠️  State notesCount déjà présent")

with open('src/components/Dashboard.jsx', 'w') as f:
    f.write(content)
PYTHON
echo ""

# =============================================
# ÉTAPE 5 : Ajout du useEffect
# =============================================
echo "🔄 ÉTAPE 5/6 : Ajout du useEffect pour charger les notes..."

python3 << 'PYTHON'
import re

with open('src/components/Dashboard.jsx', 'r') as f:
    content = f.read()

# Vérifie si le useEffect notes existe déjà
if 'fetchNotesCount' not in content:
    # Trouve le useEffect getUser et ajoute après
    # On cherche le pattern du getUser
    pattern = r'(useEffect\(\(\) => \{\s*const getUser = async \(\) => \{\s*const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\)\s*const p = user\?\.user_metadata\?\.prenom \|\| user\?\.email\s*setPrenom\(p\)\s*\}\s*getUser\(\)\s*\}, \[\]\))'
    
    replacement = r'''\1

  // Charger le nombre de notes
  useEffect(() => {
    async function fetchNotesCount() {
      try {
        const { count, error } = await supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
        
        if (error) throw error
        setNotesCount(count || 0)
      } catch (error) {
        console.error('Erreur chargement notes:', error)
        setNotesCount(0)
      }
    }
    fetchNotesCount()
  }, [])'''
    
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    print("✅ useEffect pour notes ajouté")
else:
    print("⚠️  useEffect notes déjà présent")

with open('src/components/Dashboard.jsx', 'w') as f:
    f.write(content)
PYTHON
echo ""

# =============================================
# ÉTAPE 6 : Remplacement du widget Tâches par Notes
# =============================================
echo "🎨 ÉTAPE 6/6 : Remplacement du widget..."

python3 << 'PYTHON'
import re

with open('src/components/Dashboard.jsx', 'r') as f:
    content = f.read()

# Vérifie si le widget Notes est déjà présent
if 'ti-notes' in content:
    print("⚠️  Widget Notes déjà présent")
else:
    # Définition du nouveau widget
    new_widget = '''          <div style={{ ...cardStyle, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#8B5CF618', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-notes" style={{ fontSize: 16, color: '#8B5CF6' }} aria-hidden="true" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Notes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {notesCount !== null ? notesCount : '...'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  note{notesCount > 1 ? 's' : ''} enregistrée{notesCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>'''
    
    # Pattern pour trouver le widget Tâches
    # On cherche le div parent avec flex: 1 qui contient Tâches
    pattern = r'<div style={{\s*\.\.\.cardStyle,\s*flex: 1\s*}}>\s*<div style={{ display: [\'"]flex[\'"], alignItems: [\'"]center[\'"], gap: 8, marginBottom: 10 }}>\s*<div style={{ width: 36, height: 36, borderRadius: 8, background: [\'"]#D4537E18[\'"], display: [\'"]flex[\'"], alignItems: [\'"]center[\'"], justifyContent: [\'"]center[\'"], flexShrink: 0 }}>\s*<i className="ti ti-checkbox" style={{ fontSize: 16, color: [\'"]#D4537E[\'"] }} aria-hidden="true" \/>\s*<\/div>\s*<span style={{ fontSize: 13, fontWeight: 500, color: [\'"]var\(--color-text-primary\)[\'"] }}>Tâches<\/span>\s*<\/div>\s*{taches\.length === 0 \? \([\s\S]*?\) : \([\s\S]*?\)\s*}\s*<\/div>'
    
    # Simplifié : on cherche le contenu exact
    old_widget_start = '<div style={{ ...cardStyle, flex: 1 }}>\n            <div style={{ display: '
    old_widget_end = '            )}\n          </div>'
    
    # Méthode plus robuste : trouver par le texte "Tâches"
    import re
    
    # Trouve la position du widget Tâches
    start_pos = content.find('<div style={{ ...cardStyle, flex: 1 }}>\n            <div style={{ display:')
    if start_pos == -1:
        # Essai avec un autre format
        start_pos = content.find('<div style={{ ...cardStyle, flex: 1 }}>\n            <div style={{ display:')
    
    if start_pos != -1:
        # Trouve la fin du div (compte les accolades)
        depth = 0
        end_pos = -1
        for i in range(start_pos, len(content)):
            if content[i] == '<' and i+3 < len(content) and content[i:i+4] == '<div':
                depth += 1
            elif content[i] == '<' and i+4 < len(content) and content[i:i+5] == '</div':
                depth -= 1
                if depth == 0:
                    end_pos = i + 6  # Jusqu'à la fin de </div>
                    break
        
        if end_pos != -1:
            # Vérifie que c'est bien le widget Tâches
            widget_content = content[start_pos:end_pos]
            if 'Tâches' in widget_content:
                content = content[:start_pos] + new_widget + content[end_pos:]
                print("✅ Widget Tâches remplacé par Notes")
            else:
                print("⚠️  Le widget trouvé ne contient pas 'Tâches'")
        else:
            print("❌ Fin du widget non trouvée")
    else:
        print("❌ Widget Tâches non trouvé, recherche alternative...")
        
        # Méthode alternative : chercher par le texte "Tâches"
        import re
        pattern = r'(<div style={{\s*\.\.\.cardStyle,\s*flex: 1\s*}}>.*?Tâches.*?</div>\s*</div>\s*</div>\s*</div>\s*\))'
        match = re.search(pattern, content, re.DOTALL)
        if match:
            content = content.replace(match.group(1), new_widget)
            print("✅ Widget Tâches remplacé (méthode alternative)")

with open('src/components/Dashboard.jsx', 'w') as f:
    f.write(content)
PYTHON
echo ""

# =============================================
# VÉRIFICATION FINALE
# =============================================
echo "──────────────────────────────────────────"
echo "🔍 VÉRIFICATION FINALE"
echo "──────────────────────────────────────────"

# Vérifie les modifications
echo ""
echo "1. State notesCount :"
grep -n "notesCount" src/components/Dashboard.jsx | head -2 || echo "❌ Non trouvé"

echo ""
echo "2. UseEffect notes :"
grep -n "fetchNotesCount" src/components/Dashboard.jsx | head -2 || echo "❌ Non trouvé"

echo ""
echo "3. Widget Notes :"
grep -n "ti-notes" src/components/Dashboard.jsx | head -2 || echo "❌ Non trouvé"

echo ""
echo "──────────────────────────────────────────"
echo "🎉 INSTALLATION TERMINÉE !"
echo "──────────────────────────────────────────"
echo ""
echo "📌 Pour tester :"
echo "  cd ~/napocrm"
echo "  npm run dev"
echo ""
echo "🔙 Pour restaurer :"
echo "  cp $BACKUP_FILE src/components/Dashboard.jsx"
echo ""
echo "⚠️  Si tu as des erreurs, vérifie la table 'notes' dans Supabase"
echo ""

