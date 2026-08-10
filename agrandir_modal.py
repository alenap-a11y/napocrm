#!/usr/bin/env python3
"""
Agrandit la modal "fiche client" (FicheClients.jsx ou équivalent).
Cherche un conteneur du type :
    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto ...">
et remplace max-w-2xl -> max-w-6xl, max-h-[80vh] -> h-[92vh].

Usage :
    python3 agrandir_modal.py chemin/vers/FicheClients.jsx            # dry-run, n'écrit rien
    python3 agrandir_modal.py chemin/vers/FicheClients.jsx --apply    # applique réellement

Sécurité : le script s'arrête (assertion) si le pattern n'est pas trouvé exactement
une fois, pour ne jamais modifier la mauvaise modal ou un fichier avec plusieurs
occurrences ambiguës.
"""

import sys
import re
import argparse
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("filepath", help="Chemin vers le fichier .jsx contenant la modal")
    parser.add_argument("--apply", action="store_true", help="Écrit réellement le fichier (sinon dry-run)")
    parser.add_argument("--max-width", default="max-w-6xl", help="Nouvelle largeur max (défaut: max-w-6xl)")
    args = parser.parse_args()

    path = Path(args.filepath)
    assert path.exists(), f"Fichier introuvable : {path}"

    content = path.read_text(encoding="utf-8")
    original_content = content

    # --- Étape 1 : trouver les lignes candidates (celles avec max-w-2xl ET max-h ensemble) ---
    # On cherche un attribut className sur une ou plusieurs lignes contenant à la fois
    # une classe max-w-2xl et une classe max-h-[...vh]
    pattern_width = re.compile(r"\bmax-w-2xl\b")
    pattern_height = re.compile(r"\bmax-h-\[(\d+)vh\]")

    width_matches = list(pattern_width.finditer(content))
    height_matches = list(pattern_height.finditer(content))

    print(f"Occurrences de 'max-w-2xl' trouvées : {len(width_matches)}")
    print(f"Occurrences de 'max-h-[XXvh]' trouvées : {len(height_matches)}")

    # --- Étape 2 : afficher le contexte de chaque occurrence pour vérification humaine ---
    def print_context(matches, label):
        for m in matches:
            line_start = content.rfind("\n", 0, m.start()) + 1
            line_end = content.find("\n", m.end())
            if line_end == -1:
                line_end = len(content)
            line_no = content.count("\n", 0, m.start()) + 1
            print(f"  [{label}] ligne {line_no}: {content[line_start:line_end].strip()}")

    print("\n--- Contexte ---")
    print_context(width_matches, "max-w-2xl")
    print_context(height_matches, "max-h")

    # --- Étape 3 : assertions de sécurité ---
    if len(width_matches) == 0:
        print("\n⚠️  Aucune occurrence de 'max-w-2xl' trouvée.")
        print("   Le fichier utilise peut-être une autre classe (max-w-xl, max-w-3xl, un style inline...).")
        print("   Colle-moi le vrai bloc JSX de ta modal pour un script ciblé.")
        sys.exit(1)

    if len(width_matches) > 1:
        print(f"\n⚠️  {len(width_matches)} occurrences de 'max-w-2xl' — impossible de savoir laquelle")
        print("   correspond à la modal fiche client sans ambiguïté. Le script s'arrête volontairement.")
        print("   Indique-moi le numéro de ligne à modifier, ou isole le bon bloc.")
        sys.exit(1)

    # --- Étape 4 : appliquer le remplacement (une seule occurrence confirmée) ---
    new_content = pattern_width.sub(args.max_width, content, count=1)

    if height_matches:
        # On remplace max-h-[XXvh] par h-[92vh] (seulement la première occurrence, déjà validée unique ci-dessus si ==1)
        if len(height_matches) == 1:
            new_content = re.sub(r"max-h-\[\d+vh\]", "h-[92vh]", new_content, count=1)
        else:
            print(f"\n⚠️  {len(height_matches)} occurrences de 'max-h-[XXvh]' — hauteur non modifiée automatiquement,")
            print("   seule la largeur (max-w) a été changée. Ajuste la hauteur manuellement si besoin.")

    assert new_content != original_content, "Aucun changement effectif — vérifie le pattern."

    print("\n--- Diff résumé ---")
    print(f"  max-w-2xl  ->  {args.max_width}")
    if len(height_matches) == 1:
        print(f"  max-h-[{height_matches[0].group(1)}vh]  ->  h-[92vh]")

    if not args.apply:
        print("\n[DRY-RUN] Rien n'a été écrit. Relance avec --apply pour appliquer.")
        return

    # Backup avant écriture
    backup_path = path.with_suffix(path.suffix + ".bak")
    backup_path.write_text(original_content, encoding="utf-8")
    path.write_text(new_content, encoding="utf-8")
    print(f"\n✅ Fichier modifié : {path}")
    print(f"   Backup créé : {backup_path}")


if __name__ == "__main__":
    main()
