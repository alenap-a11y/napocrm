import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { insertNotif } from '../lib/notif'
import SlotPicker from './SlotPicker'

const TYPES_SEANCE = [
  'Sophrologie', 'Naturopathie', 'Coaching',
  'Énergie', 'Massage', 'Fleurs de Bach', '3D Humain', 'Autre',
]

const STATUTS = [
  { value: 'planifié', label: 'Planifié' },
  { value: 'confirmé', label: 'Confirmé' },
  { value: 'annulé',   label: 'Annulé'   },
]

const inp = {
  width: '100%', padding: '7px 10px', borderRadius: 6,
  border: '0.5px solid var(--color-border-secondary)',
  background: 'var(--color-background-primary)',
  color: 'var(--color-text-primary)', fontSize: 13,
  boxSizing: 'border-box', fontFamily: 'inherit',
  outline: 'none',
}

const lbl = {
  fontSize: 11, fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase', letterSpacing: '.05em',
  marginBottom: 5, display: 'block',
}

/*
 * Props :
 *   onSuccess(rdv)      — appelé après insertion réussie
 *   onCancel()          — appelé si bouton Annuler cliqué (optionnel)
 *   prefillDate         — "YYYY-MM-DD" pré-rempli (optionnel)
 *   prefillClientId     — UUID pré-sélectionné (optionnel)
 */
export default function NouveauRdv({ onSuccess, onCancel, prefillDate, prefillClientId }) {
  const todayStr = new Date().toISOString().slice(0, 10)

  const [clients,        setClients]        = useState([])
  const [loadingClients, setLoadingClients] = useState(true)

  const [clientId,   setClientId]   = useState(prefillClientId || '')
  const [date,       setDate]       = useState(prefillDate || todayStr)
  const [heure,      setHeure]      = useState('09:00')
  const [typeSeance, setTypeSeance] = useState('Sophrologue')
  const [statut,     setStatut]     = useState('planifié')
  const [notes,      setNotes]      = useState('')
  const [duree,      setDuree]      = useState(60)

  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState('')
  const [seancesJour, setSeancesJour] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  /* ── Chargement séances du jour ── */
  useEffect(() => {
    async function fetchSlots() {
      if (!date) return
      setLoadingSlots(true)
      const { data } = await supabase
        .from('seances')
        .select('id, heure_seance, duree_minutes')
        .eq('date_seance', date)
      setSeancesJour(data || [])
      setLoadingSlots(false)
    }
    fetchSlots()
  }, [date])

  /* ── Chargement de la liste clients ── */
  useEffect(() => {
    async function fetchClients() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('clients')
          .select('id, nom, prenom')
          .eq('user_id', user.id)
          .order('nom')
        setClients(data || [])
      } catch {}
      setLoadingClients(false)
    }
    fetchClients()
  }, [])

  /* ── Soumission ── */
  async function handleSubmit(e) {
    e.preventDefault()
    if (!date || !heure) { setMsg('Date et heure requises.'); return }

    setSaving(true)
    setMsg('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const client = clients.find(c => c.id === clientId)

      const { data: conflicts } = await supabase
        .from('seances')
        .select('id')
        .eq('user_id', user.id)
        .eq('date_seance', date)
        .eq('heure_seance', heure)
      if (conflicts && conflicts.length > 0) {
        const confirmer = window.confirm('Un rendez-vous existe deja a ce creneau. Continuer quand meme ?')
        if (!confirmer) { setSaving(false); return }
      }
      const { data: rdv, error } = await supabase
        .from('seances')
        .insert({
          user_id:       user.id,
          client_id:     clientId || null,
          date_seance:   date,
          heure_seance:  heure,
          type_seance:   typeSeance || null,
          statut,
          notes:         notes.trim() || null,
          prenom:        client?.prenom || 'Client',
          nom:           client?.nom || 'non renseigné',
          duree_minutes: parseInt(duree, 10) || 60,
        })
        .select()
        .single()

      if (error) throw error

      const clientLabel = client
        ? `${client.prenom || ''} ${client.nom || ''}`.trim()
        : 'Client non renseigné'

      insertNotif({
        msg:       `Nouveau RDV — ${clientLabel}`,
        icon:      'ti-calendar-event',
        iconColor: '#185FA5',
        bg:        '#E6F1FB',
      })

      setMsg('✓ Rendez-vous créé')
      setTimeout(() => onSuccess?.(rdv), 900)
    } catch (err) {
      setMsg(`✗ ${err.message}`)
      setSaving(false)
    }
  }

  const clientLabel = c => `${c.prenom || ''} ${c.nom || ''}`.trim() || '—'

  /* ── Render ── */
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Client */}
      <div>
        <label style={lbl}>Client</label>
        <select
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          style={inp}
          disabled={loadingClients}
        >
          <option value="">— Sans client —</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{clientLabel(c)}</option>
          ))}
        </select>
        {loadingClients && (
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Chargement des clients…
          </div>
        )}
      </div>

      {/* Date + Heure */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={lbl}>Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            style={inp}
          />
        </div>
        <div>
          <label style={lbl}>Heure</label>
          <SlotPicker
            value={heure}
            onChange={h => setHeure(h)}
            duree={parseInt(duree, 10) || 60}
            seancesJour={seancesJour}
            loading={loadingSlots}
          />
        </div>
      </div>

      {/* Durée */}
      <div>
        <label style={lbl}>Durée (min)</label>
        <select value={duree} onChange={e => setDuree(e.target.value)} style={inp}>
          {[15, 30, 45, 60, 75, 90, 120].map(d => (
            <option key={d} value={d}>{d} min</option>
          ))}
        </select>
      </div>
      {/* Type de séance */}
      <div>
        <label style={lbl}>Type de séance</label>
        <select value={typeSeance} onChange={e => setTypeSeance(e.target.value)} style={inp}>
          <option>Aromathérapeute</option>
          <option>Astrologue</option>
          <option>Cartomancienne</option>
          <option>Coach bien-être</option>
          <option>Coach yoga</option>
          <option>Energéticien</option>
          <option>Fleurs de Bach</option>
          <option>Hypnothérapeute</option>
          <option>Magnétiseur</option>
          <option>Médium</option>
          <option>Naturopathe</option>
          <option>Ostéopathe</option>
          <option>Praticien massage</option>
          <option>Psychologue</option>
          <option>Réflexologue</option>
          <option>Reiki</option>
          <option>Sophrologue</option>
          <option>Autre</option>
          {TYPES_SEANCE.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Statut */}
      <div>
        <label style={lbl}>Statut</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUTS.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatut(s.value)}
              style={{
                flex: 1, padding: '7px 4px', borderRadius: 7, fontSize: 12,
                cursor: 'pointer', transition: 'all .12s',
                border: statut === s.value
                  ? '1.5px solid var(--color-accent)'
                  : '0.5px solid var(--color-border-secondary)',
                background: statut === s.value
                  ? 'var(--color-accent)'
                  : 'var(--color-background-secondary)',
                color: statut === s.value ? '#fff' : 'var(--color-text-secondary)',
                fontWeight: statut === s.value ? 600 : 400,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={lbl}>Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Demande particulière, rappels…"
          rows={3}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>

      {/* Message flash */}
      {msg && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, fontSize: 13,
          background: msg.startsWith('✓') ? '#EAF3DE' : '#FBEAF0',
          color:      msg.startsWith('✓') ? '#3B6D11' : '#993556',
        }}>
          {msg}
        </div>
      )}

      {/* Boutons */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 2 }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            style={{
              padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
              border: '0.5px solid var(--color-border-secondary)',
              background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 13,
            }}
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '9px 22px', borderRadius: 8, border: 'none',
            background: 'var(--color-accent)', color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600,
            opacity: saving ? 0.7 : 1, transition: 'opacity .15s',
            display: 'flex', alignItems: 'center', gap: 7,
          }}
        >
          <i className="ti ti-calendar-plus" aria-hidden="true" />
          {saving ? 'Enregistrement…' : 'Créer le rendez-vous'}
        </button>
      </div>
    </form>
  )
}
