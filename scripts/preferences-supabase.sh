#!/bin/bash
set -e
cd ~/napocrm

echo "=== 1. Migration SQL - colonne preferences ==="
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_add_preferences.sql << 'SQL'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}';
SQL
supabase db push

echo "=== 2. Patch AppShell.jsx ==="
python3 - << 'EOF'
content = open('src/AppShell.jsx').read()

# Import supabase si pas déjà là
if "import { supabase }" not in content:
    content = content.replace(
        "import { useState",
        "import { supabase } from './lib/supabase'\nimport { useState"
    )

# Ajouter state userId + prefsLoaded
if 'prefsLoaded' not in content:
    content = content.replace(
        "  const [fs, setFs] = useState(() => parseInt(localStorage.getItem('napo_font_size') || '100', 10))",
        """  const [fs, setFs] = useState(() => parseInt(localStorage.getItem('napo_font_size') || '100', 10))
  const [userId,     setUserId]     = useState(null)
  const [prefsLoaded,setPrefsLoaded]= useState(false)"""
    )

# Ajouter useEffect chargement préférences depuis Supabase
if 'loadPrefs' not in content:
    content = content.replace(
        "  const navigate = useNavigate()",
        """  const navigate = useNavigate()

  // Chargement préférences depuis Supabase
  useEffect(() => {
    async function loadPrefs() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)
        const { data } = await supabase.from('profiles').select('preferences').eq('id', user.id).single()
        const p = data?.preferences
        if (p && Object.keys(p).length > 0) {
          if (p.accent)   setAccent(p.accent)
          if (p.bgCol)    setBgCol(p.bgCol)
          if (p.fs)       setFs(p.fs)
          if (p.widgets)  setWidgets(w => ({ ...w, ...p.widgets }))
          if (p.sbItems)  setSbItems(prev => {
            const order = p.sbItems
            return [...prev].sort((a,b) => order.indexOf(a.id) - order.indexOf(b.id))
          })
          if (p.sbVis)    setSbVis(p.sbVis)
        }
      } catch(e) { console.warn('loadPrefs:', e) }
      setPrefsLoaded(true)
    }
    loadPrefs()
  }, [])"""
    )

# Ajouter sauvegarde Supabase avec debounce après les localStorage
if 'savePrefs' not in content:
    content = content.replace(
        "    localStorage.setItem(SB_VIS_KEY, JSON.stringify(sbVis))\n  }, [sbVis])",
        """    localStorage.setItem(SB_VIS_KEY, JSON.stringify(sbVis))
  }, [sbVis])

  // Sauvegarde auto Supabase (debounce 1s)
  useEffect(() => {
    if (!userId || !prefsLoaded) return
    const timer = setTimeout(async () => {
      try {
        await supabase.from('profiles').update({
          preferences: {
            accent, bgCol, fs,
            widgets,
            sbItems: sbItems.map(i => i.id),
            sbVis,
          }
        }).eq('id', userId)
      } catch(e) { console.warn('savePrefs:', e) }
    }, 1000)
    return () => clearTimeout(timer)
  }, [accent, bgCol, fs, widgets, sbItems, sbVis, userId, prefsLoaded])"""
    )

open('src/AppShell.jsx', 'w').write(content)
print("OK AppShell")
EOF

echo "=== 3. Git push ==="
git add -A && git commit -m "feat: préférences utilisateur sauvegardées dans Supabase profiles" && git push

echo "=== DONE ==="
