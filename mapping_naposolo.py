#!/usr/bin/env python3
"""
Génère un mapping Route -> Fichier -> Taille pour Naposolo, à partir du code réel.

Usage (depuis la racine du repo) :
    python3 mapping_naposolo.py > mapping_output.md

Ce que ça fait :
1. Cherche le(s) fichier(s) contenant le routing principal (pattern location.pathname
   ou react-router-dom <Route path=...>) et en extrait la table route -> composant.
2. Liste tous les fichiers .jsx de src/pages et src/components avec leur nombre de
   lignes (pour repérer d'un coup d'œil les gros fichiers / la dette de taille).
3. Sort tout en Markdown, prêt à coller dans Mnapo.md.

Ne modifie AUCUN fichier du projet — lecture seule.
"""

import re
import sys
from pathlib import Path

ROOT = Path.cwd()
SRC = ROOT / "src"

def find_routes():
    """Cherche les patterns de routing dans App.jsx et fichiers similaires."""
    candidates = list(SRC.glob("App.jsx")) + list(SRC.glob("*.jsx"))
    routes = []
    seen_files = set()

    for f in candidates:
        if f in seen_files:
            continue
        try:
            text = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        # Pattern 1 : location.pathname === '/xxx' ou .startsWith('/xxx')
        for m in re.finditer(r"location\.pathname\s*(?:===|\.startsWith)\(?\s*['\"](/[a-zA-Z0-9_\-/:]*)['\"]", text):
            routes.append((m.group(1), f.relative_to(ROOT).as_posix(), "pathname match"))

        # Pattern 2 : <Route path="/xxx" element={<Xxx />} />  (react-router-dom)
        for m in re.finditer(r'<Route\s+path=["\']([^"\']+)["\']\s+element=\{<(\w+)', text):
            routes.append((m.group(1), m.group(2), "react-router Route"))

        if routes:
            seen_files.add(f)

    return routes


def list_files_by_size(subdir):
    folder = SRC / subdir
    if not folder.exists():
        return []
    results = []
    for f in sorted(folder.rglob("*.jsx")):
        if ".backup" in f.name or ".bak" in f.name:
            continue
        try:
            n_lines = sum(1 for _ in f.open(encoding="utf-8", errors="ignore"))
        except Exception:
            n_lines = 0
        results.append((f.relative_to(ROOT).as_posix(), n_lines))
    return sorted(results, key=lambda x: -x[1])


def main():
    if not SRC.exists():
        print("ERREUR : pas de dossier src/ ici. Lance ce script depuis la racine de ~/napocrm.", file=sys.stderr)
        sys.exit(1)

    print("## Mapping routes -> fichiers (généré automatiquement)\n")
    routes = find_routes()
    if routes:
        print("| Route | Fichier / Composant | Détection |")
        print("|---|---|---|")
        for route, target, method in sorted(set(routes)):
            print(f"| `{route}` | `{target}` | {method} |")
    else:
        print("_Aucune route détectée automatiquement — pattern de routing non reconnu, à vérifier manuellement dans App.jsx._")

    print("\n## Fichiers src/pages (triés par taille décroissante)\n")
    print("| Fichier | Lignes |")
    print("|---|---|")
    for path, n in list_files_by_size("pages"):
        flag = " ⚠️" if n > 800 else ""
        print(f"| `{path}` | {n}{flag} |")

    print("\n## Fichiers src/components (triés par taille décroissante)\n")
    print("| Fichier | Lignes |")
    print("|---|---|")
    for path, n in list_files_by_size("components"):
        flag = " ⚠️" if n > 800 else ""
        print(f"| `{path}` | {n}{flag} |")

    print("\n_⚠️ = fichier de plus de 800 lignes, candidat à découper._")


if __name__ == "__main__":
    main()
