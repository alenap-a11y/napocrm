// src/pages/AdminAnalytics.jsx
// Affiche le dashboard Umami en lecture seule via une URL de partage publique.
// Aucune donnée ne transite par Supabase — c'est un simple embed iframe.

export default function AdminAnalytics() {
  // Remplace cette URL par le lien "Share URL" généré dans Umami
  // (Dashboard Umami → naposolo.com → icône partage → Share URL)
  const UMAMI_SHARE_URL = 'https://cloud.umami.is/share/4MuNr6GZdnjiMQ7I'

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>Analytics — trafic landing</h2>
      <iframe
        src={UMAMI_SHARE_URL}
        title="Umami Analytics"
        style={{
          width: '100%',
          height: '80vh',
          border: '1px solid #e5e5e5',
          borderRadius: 8
        }}
      />
    </div>
  )
}