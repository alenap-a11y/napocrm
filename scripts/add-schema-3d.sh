#!/bin/bash
set -e
cd ~/napocrm

echo "=== 1. Migration SQL ==="
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_add_schema_image.sql << 'SQL'
ALTER TABLE seances ADD COLUMN IF NOT EXISTS schema_image text;
SQL
supabase db push

echo "=== 2. Install html2canvas ==="
npm install html2canvas

echo "=== 3. Git push ==="
git add -A && git commit -m "feat: colonne schema_image + html2canvas" && git push

echo "=== DONE ==="
