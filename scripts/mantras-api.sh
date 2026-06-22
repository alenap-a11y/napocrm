#!/bin/bash
set -e
cd ~/napocrm

echo "=== Patch Dashboard.jsx - Mantras API ZenQuotes ==="
python3 - << 'EOF'
content = open('src/components/Dashboard.jsx').read()

# 1. Ajouter state mantraApi
if 'mantraApi' not in content:
    content = content.replace(
        "  const [mantra] = useState(() => MANTRAS[Math.floor(Math.random() * MANTRAS.length)])",
        """  const [mantra] = useState(() => MANTRAS[Math.floor(Math.random() * MANTRAS.length)])
  const [mantraApi, setMantraApi] = useState(null)"""
    )

# 2. Ajouter useEffect fetch ZenQuotes via proxy
if 'zenquotes' not in content:
    content = content.replace(
        "  useEffect(() => {\n    const getUser",
        """  useEffect(() => {
    async function fetchMantra() {
      try {
        const r = await fetch('https://zenquotes.io/api/random')
        const d = await r.json()
        if (d && d[0]) {
          setMantraApi({ t: `"${d[0].q}"`, s: `— ${d[0].a}` })
        }
      } catch {
        // Fallback sur mantra local si API indispo
        setMantraApi(null)
      }
    }
    fetchMantra()
  }, [])

  useEffect(() => {
    const getUser"""
    )

# 3. Remplacer affichage mantra par mantraApi si disponible
content = content.replace(
    "            <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--color-text-primary)', lineHeight: 1.5, marginBottom: 8 }}>{mantra.t}</div>\n            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{mantra.s}</div>",
    """            <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--color-text-primary)', lineHeight: 1.5, marginBottom: 8 }}>{(mantraApi || mantra).t}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{(mantraApi || mantra).s}</div>"""
)

open('src/components/Dashboard.jsx', 'w').write(content)
print("OK Dashboard mantras API")
EOF

echo "=== Git push ==="
git add -A && git commit -m "feat: mantras API ZenQuotes temps réel + fallback local" && git push

echo "=== DONE ==="
