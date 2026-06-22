#!/bin/bash
cd ~/napocrm

# Restaure la sauvegarde
cp src/components/Dashboard.jsx.backup-notes src/components/Dashboard.jsx

# Fais les modifications avec sed de façon précise
# 1. Ajoute le state
sed -i '/const { data: taches }/a \  const [notesCount, setNotesCount] = useState(null)' src/components/Dashboard.jsx

# 2. Ajoute le useEffect après getUser
sed -i '/getUser()/a \
\
  \/\/ Charger le nombre de notes\
  useEffect(() => {\
    async function fetchNotesCount() {\
      try {\
        const { count, error } = await supabase\
          .from('\''notes'\'')\
          .select('\''*'\'', { count: '\''exact'\'', head: true })\
        if (error) throw error\
        setNotesCount(count || 0)\
      } catch (error) {\
        console.error('\''Erreur chargement notes:'\'', error)\
        setNotesCount(0)\
      }\
    }\
    fetchNotesCount()\
  }, [])' src/components/Dashboard.jsx

echo "✅ Modifications faites, vérifie manuellement le widget Tâches"
echo "📝 Ouvre le fichier et remplace manuellement le widget Tâches"
