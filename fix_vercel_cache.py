#!/usr/bin/env python3
import json
import subprocess
import sys
from pathlib import Path

VERCEL_JSON = Path("vercel.json")
FIX_COMMIT = "2d9e6a6"


def run(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip(), result.stderr.strip(), result.returncode


def main():
    if not Path(".git").exists():
        print("Pas de depot git ici. Lance ce script depuis ~/napocrm.")
        sys.exit(1)

    print("=== 1. Historique de vercel.json ===")
    out, err, code = run("git log --oneline --follow -- vercel.json")
    print(out if out else "Aucun historique trouve.")

    print(f"\n=== 2. vercel.json existait-il au commit {FIX_COMMIT} ? ===")
    out, err, code = run(f"git show {FIX_COMMIT}:vercel.json")
    if code != 0:
        print(f"vercel.json n'existait PAS au commit {FIX_COMMIT}.")
        print("=> cree/modifie APRES le fix, pas la cause de l'incident initial.")
    else:
        print(f"vercel.json existait deja au commit {FIX_COMMIT} :")
        print(out)

    if not VERCEL_JSON.exists():
        print("\nvercel.json introuvable. Arret.")
        sys.exit(1)

    print("\n=== 3. Contenu actuel ===")
    raw = VERCEL_JSON.read_text(encoding="utf-8")
    print(raw)

    try:
        config = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"\nJSON invalide : {e}")
        sys.exit(1)

    print("\n=== 4. Correction de la regle /assets/(.*) ===")
    changed = False
    for rule in config.get("headers", []):
        if rule.get("source") == "/assets/(.*)":
            for h in rule.get("headers", []):
                if h.get("key") == "Cache-Control" and h.get("value") != "public, max-age=31536000, immutable":
                    old_value = h["value"]
                    h["value"] = "public, max-age=31536000, immutable"
                    changed = True
                    print(f"  '{old_value}' -> '{h['value']}'")

    if not changed:
        print("  Rien a changer.")
        return

    answer = input("\nAppliquer ce changement a vercel.json ? [o/N] ").strip().lower()
    if answer != "o":
        print("Rien modifie.")
        return

    backup = VERCEL_JSON.with_suffix(".json.bak")
    backup.write_text(raw, encoding="utf-8")
    VERCEL_JSON.write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\nvercel.json mis a jour (backup : {backup}).")
    print("git add vercel.json && git commit -m \"perf: cache immutable pour assets Vite hashes\" && git push")


if __name__ == "__main__":
    main()
