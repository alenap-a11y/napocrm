import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AgendaSettings() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    heure_debut: '08:00',
    heure_fin: '19:00',
    jour_semaine: [1,2,3,4,5],
    actif: true
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const joursList = [
    { id: 1, label: 'Lundi' },
    { id: 2, label: 'Mardi' },
    { id: 3, label: 'Mercredi' },
    { id: 4, label: 'Jeudi' },
    { id: 5, label: 'Vendredi' },
    { id: 6, label: 'Samedi' },
    { id: 7, label: 'Dimanche' }
  ]

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Récupérer les disponibilités du praticien
      const { data, error } = await supabase
        .from('disponibilites')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setSettings({
          heure_debut: data.heure_debut || '08:00',
          heure_fin: data.heure_fin || '19:00',
          jour_semaine: data.jour_semaine || [1,2,3,4,5],
          actif: data.actif ?? true
        })
      } else {
        // Si aucune dispo n'existe, créer une ligne par défaut
        await supabase.from('disponibilites').insert({
          user_id: user.id,
          heure_debut: '08:00',
          heure_fin: '19:00',
          jour_semaine: [1,2,3,4,5],
          actif: true
        })
      }
      setLoading(false)
    }
    loadSettings()
  }, [])

  const toggleJour = (jourId) => {
    setSettings(prev => ({
      ...prev,
      jour_semaine: prev.jour_semaine.includes(jourId)
        ? prev.jour_semaine.filter(j => j !== jourId)
        : [...prev.jour_semaine, jourId]
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('disponibilites')
      .update({
        heure_debut: settings.heure_debut,
        heure_fin: settings.heure_fin,
        jour_semaine: settings.jour_semaine,
        actif: settings.actif
      })
      .eq('user_id', user.id)

    if (error) {
      setMessage('❌ Erreur : ' + error.message)
    } else {
      setMessage('✅ Paramètres enregistrés !')
    }
    setSaving(false)
  }

  if (loading) return <div style={{ padding: '2rem' }}>Chargement...</div>

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>⚙️ Gestion de mon agenda</h2>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Jours travaillés</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {joursList.map(jour => (
            <button
              key={jour.id}
              onClick={() => toggleJour(jour.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: settings.jour_semaine.includes(jour.id) ? '2px solid #0F6E56' : '1px solid #D1D5DB',
                background: settings.jour_semaine.includes(jour.id) ? '#E1F5EE' : '#F9FAFB',
                color: settings.jour_semaine.includes(jour.id) ? '#0F6E56' : '#374151',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {jour.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Heure de début</label>
          <input
            type="time"
            value={settings.heure_debut}
            onChange={(e) => setSettings({ ...settings, heure_debut: e.target.value })}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Heure de fin</label>
          <input
            type="time"
            value={settings.heure_fin}
            onChange={(e) => setSettings({ ...settings, heure_fin: e.target.value })}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.actif}
            onChange={(e) => setSettings({ ...settings, actif: e.target.checked })}
          />
          <span>Agenda public activé</span>
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: '12px 24px',
          background: '#0F6E56',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: saving ? 'default' : 'pointer',
          opacity: saving ? 0.7 : 1
        }}
      >
        {saving ? 'Enregistrement...' : '💾 Enregistrer'}
      </button>
      {message && <p style={{ marginTop: '16px', fontWeight: 500 }}>{message}</p>}
    </div>
  )
}
