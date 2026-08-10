#!/usr/bin/env python3
"""
Injection de l'onglet "Stats" dans src/pages/Clients.jsx, méthode assertions
(content.count(old) == 1 avant tout remplacement — voir Mnapo.md §3.14).

Prérequis : le chantier "Récap" (onglet 'recap', useEffect étendu, bloc de
rendu recap) doit déjà être appliqué — ce script part de cet état, pas de
l'état d'origine avant Récap.

Usage :
    python3 inject_stats_tab.py src/pages/Clients.jsx              # dry-run
    python3 inject_stats_tab.py src/pages/Clients.jsx --apply      # applique

Chaque remplacement est vérifié indépendamment. Si un seul échoue, AUCUN
n'est écrit (tout ou rien) — pas d'état intermédiaire incohérent.
"""

import sys
import argparse
from pathlib import Path


REPLACEMENTS = [
    {
        "label": "Tableau des onglets (ajout 'stats')",
        "old": "[['infos','Infos','ti-user'],['seances','Séances','ti-calendar-stats'],['recap','Récap','ti-list-details'],['notes','Notes','ti-notes'],['bach','🌿 Bach','ti-leaf'],['energie','⚡ Énergie','ti-sparkles'],['oracle','🔮 Oracle','ti-cards']]",
        "new": "[['infos','Infos','ti-user'],['seances','Séances','ti-calendar-stats'],['recap','Récap','ti-list-details'],['stats','Stats','ti-chart-bar'],['notes','Notes','ti-notes'],['bach','🌿 Bach','ti-leaf'],['energie','⚡ Énergie','ti-sparkles'],['oracle','🔮 Oracle','ti-cards']]",
    },
    {
        "label": "useEffect — condition energie",
        "old": "if ((detailTab === 'energie' || detailTab === 'recap') && detail) {",
        "new": "if ((detailTab === 'energie' || detailTab === 'recap' || detailTab === 'stats') && detail) {",
    },
    {
        "label": "useEffect — condition oracle",
        "old": "if ((detailTab === 'oracle' || detailTab === 'recap') && detail) {",
        "new": "if ((detailTab === 'oracle' || detailTab === 'recap' || detailTab === 'stats') && detail) {",
    },
    {
        "label": "useEffect — condition bach (déclenchement)",
        "old": "if ((detailTab === 'bach' || detailTab === 'recap') && detail) {",
        "new": "if ((detailTab === 'bach' || detailTab === 'recap' || detailTab === 'stats') && detail) {",
    },
    {
        "label": "useEffect — condition bach (reset)",
        "old": "if (detailTab !== 'bach' && detailTab !== 'recap') { setBachFiches([]) }",
        "new": "if (detailTab !== 'bach' && detailTab !== 'recap' && detailTab !== 'stats') { setBachFiches([]) }",
    },
]

RENDER_BLOCK_ANCHOR = "{detailTab === 'recap' && ("  # on insère juste avant ce bloc

RENDER_BLOCK = """{detailTab === 'stats' && (() => {
  const allEvents = [...clientSeances, ...energieSeances, ...oracleSeances]
  const totalCA = clientSeances.reduce((sum, s) => sum + (parseFloat(s.prix_euros) || 0), 0)
  const dates = [
    ...allEvents.map(s => s.date_seance).filter(Boolean),
    ...bachFiches.map(s => s.created_at ? s.created_at.slice(0,10) : null).filter(Boolean)
  ].sort()
  const derniere = dates.length ? dates[dates.length - 1] : null
  const derniereStr = derniere ? (() => {
    const d = derniere.slice(0,10).split('-')
    return `${parseInt(d[2])} ${['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'][parseInt(d[1])-1]} ${d[0]}`
  })() : '—'

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12 }}>
      <div style={{ background:'var(--color-background-secondary)', borderRadius:10, padding:16 }}>
        <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Séances totales (tous modules)</div>
        <div style={{ fontSize:24, fontWeight:600, marginTop:4 }}>{clientSeances.length + energieSeances.length + oracleSeances.length + bachFiches.length}</div>
      </div>
      <div style={{ background:'var(--color-background-secondary)', borderRadius:10, padding:16 }}>
        <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Dernière activité</div>
        <div style={{ fontSize:24, fontWeight:600, marginTop:4 }}>{derniereStr}</div>
      </div>
      <div style={{ background:'var(--color-background-secondary)', borderRadius:10, padding:16 }}>
        <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>CA renseigné (séances classiques)</div>
        <div style={{ fontSize:24, fontWeight:600, marginTop:4 }}>{totalCA.toFixed(2)} €</div>
        <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:2 }}>Montants renseignés, pas paiements confirmés</div>
      </div>
      <div style={{ background:'var(--color-background-secondary)', borderRadius:10, padding:16 }}>
        <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Répartition par module</div>
        <div style={{ fontSize:13, marginTop:4, lineHeight:1.8 }}>
          Séances {clientSeances.length} · Énergie {energieSeances.length} · Oracle {oracleSeances.length} · Bach {bachFiches.length}
        </div>
      </div>
    </div>
  )
})()}

"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("filepath")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    path = Path(args.filepath)
    assert path.exists(), f"Fichier introuvable : {path}"
    content = path.read_text(encoding="utf-8")
    original = content

    print(f"Fichier : {path} ({len(content)} caractères)\n")

    all_ok = True
    new_content = content

    for r in REPLACEMENTS:
        count = new_content.count(r["old"])
        status = "✅" if count == 1 else "❌"
        print(f"{status} {r['label']} — {count} occurrence(s)")
        if count != 1:
            all_ok = False
        else:
            new_content = new_content.replace(r["old"], r["new"], 1)

    anchor_count = new_content.count(RENDER_BLOCK_ANCHOR)
    status = "✅" if anchor_count == 1 else "❌"
    print(f"{status} Point d'insertion bloc de rendu Stats — {anchor_count} occurrence(s)")
    if anchor_count != 1:
        all_ok = False
    else:
        new_content = new_content.replace(RENDER_BLOCK_ANCHOR, RENDER_BLOCK + RENDER_BLOCK_ANCHOR, 1)

    print()
    if not all_ok:
        print("⚠️  Au moins un pattern attendu est absent ou en double — RIEN n'est écrit.")
        print("   Vérifie que le chantier Récap est bien appliqué tel quel dans ce fichier,")
        print("   ou colle-moi le contenu réel autour de la zone concernée pour ajuster le script.")
        sys.exit(1)

    print("Tous les patterns trouvés exactement une fois — prêt à écrire.")

    if not args.apply:
        print("\n[DRY-RUN] Rien n'a été écrit. Relance avec --apply pour appliquer.")
        return

    backup = path.with_suffix(path.suffix + ".bak")
    backup.write_text(original, encoding="utf-8")
    path.write_text(new_content, encoding="utf-8")
    print(f"\n✅ Fichier modifié : {path}")
    print(f"   Backup : {backup}")


if __name__ == "__main__":
    main()
