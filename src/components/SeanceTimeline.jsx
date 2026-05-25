import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DOT_COLORS = {
  recent: '#1D9E75',
  old: '#888780',
}

export default function SeanceTimeline({ clientId }) {
  const [seances, setSeances] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) return
    const fetchSeances = async () => {
      const { data, error } = await supabase
        .from('seances')
        .select('*')
        .eq('client_id', clientId)
        .order('date_seance', { ascending: false })
      if (!error) setSeances(data || [])
      setLoading(false)
    }
    fetchSeances()
  }, [clientId])

  if (loading) return (
    <div style={{ padding: '12px 0', fontSize: 13, color: 'var(--color-text-tertiary)' }}>
      Chargement des séances…
    </div>
  )

  if (!seances.length) return (
    <div style={{ padding: '12px', background: 'var(--color-background-secondary)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
      Aucune séance enregistrée pour ce client.
    </div>
  )

  return (
    <div>
      {seances.map((s, i) => {
        const isRecent = i < 2
        return (
          <div key={s.id} style={{ display: 'flex', gap: 12, marginBottom: i < seances.length - 1 ? 16 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: isRecent ? DOT_COLORS.recent : DOT_COLORS.old,
                flexShrink: 0, marginTop: 4
              }} />
              {i < seances.length - 1 && (
                <div style={{ flex: 1, width: 1, background: 'var(--color-border-tertiary)', margin: '2px 0' }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                Séance {seances.length - i} — {new Date(s.date_seance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </div>
              {s.notes && (
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0' }}>
                  {s.notes}
                </div>
              )}
              {s.fleurs && s.fleurs.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                  Flacon : {Array.isArray(s.fleurs) ? s.fleurs.slice(0, 3).join(' + ') : s.fleurs}
                  {Array.isArray(s.fleurs) && s.fleurs.length > 3 ? '…' : ''}
                </div>
              )}
              {s.score_bien_etre && (
                <div style={{ fontSize: 11, marginTop: 3 }}>
                  <span style={{
                    background: '#E1F5EE', color: '#085041',
                    padding: '1px 7px', borderRadius: 10, fontWeight: 500
                  }}>
                    Score {s.score_bien_etre}/10
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
