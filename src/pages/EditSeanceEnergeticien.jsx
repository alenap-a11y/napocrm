import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function EditSeanceEnergeticien() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const [seances, setSeances] = useState([])
  const [clientNom, setClientNom] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: client } = await supabase
        .from('clients')
        .select('prenom, nom')
        .eq('id', clientId)
        .single()
      if (client) setClientNom(`${client.prenom} ${client.nom}`)

      const { data } = await supabase
        .from('seances')
        .select('id, date_seance, type_seance, duree_minutes, tarif')
        .eq('client_id', clientId)
        .order('date_seance', { ascending: false })
      setSeances(data || [])
      setLoading(false)
    }
    load()
  }, [clientId])

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontWeight: 600, marginBottom: 16 }}>
        ← Retour
      </button>
      <h2 style={{ marginBottom: 4 }}>Séances de {clientNom}</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: 14 }}>Sélectionne une séance à modifier</p>

      {loading && <p>Chargement...</p>}

      {!loading && seances.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)' }}>Aucune séance trouvée.</p>
      )}

      {!loading && seances.map(s => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--color-border)', marginBottom: 10, background: 'var(--color-surface)' }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{s.date_seance}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{s.type_seance} · {s.duree_minutes} min {s.tarif ? `· ${s.tarif}€` : ''}</div>
          </div>
          <button
            onClick={() => navigate(`/chakras/edit/${clientId}/${s.id}`)}
            style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid var(--color-accent)', background: 'transparent', color: 'var(--color-accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Éditer
          </button>
        </div>
      ))}
    </div>
  )
}
