import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDateShort(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function clientFullName(c) {
  if (!c) return '—'
  return [c.prenom, c.nom].filter(Boolean).join(' ') || '—'
}

export default function Notes() {
  const navigate = useNavigate()

  /* ── Data ── */
  const [notes,    setNotes]    = useState([])
  const [clients,  setClients]  = useState([])
  const [seances,  setSeances]  = useState([]) // filtered by selected client in compose form

  /* ── UI state ── */
  const [loading,    setLoading]    = useState(true)
  const [err,        setErr]        = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [composing,  setComposing]  = useState(false)

  /* ── Filters (list) ── */
  const [filterClient, setFilterClient] = useState('')

  /* ── Compose form ── */
  const [draftText,     setDraftText]     = useState('')
  const [draftClientId, setDraftClientId] = useState('')
  const [draftSeanceId, setDraftSeanceId] = useState('')
  const [saving,        setSaving]        = useState(false)
  const [saveErr,       setSaveErr]       = useState(null)

  /* ── Load notes ── */
  const loadNotes = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setErr('Non connecté'); return }

      const { data, error } = await supabase
        .from('notes')
        .select('*, clients(id, nom, prenom), seances(id, date, heure, type)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setNotes(data ?? [])
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  /* ── Load clients (for filters + compose dropdown) ── */
  const loadClients = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('clients')
        .select('id, nom, prenom')
        .eq('user_id', user.id)
        .order('nom')
      setClients(data ?? [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    loadNotes()
    loadClients()
  }, [loadNotes, loadClients])

  /* ── Load séances when compose client changes ── */
  useEffect(() => {
    if (!draftClientId) { setSeances([]); setDraftSeanceId(''); return }
    ;(async () => {
      const { data } = await supabase
        .from('seances')
        .select('id, date, heure, type')
        .eq('client_id', draftClientId)
        .order('date', { ascending: false })
      setSeances(data ?? [])
      setDraftSeanceId('')
    })()
  }, [draftClientId])

  /* ── Derived ── */
  const filtered = filterClient
    ? notes.filter(n => n.client_id === filterClient)
    : notes

  const selected = notes.find(n => n.id === selectedId) ?? null

  /* ── Handlers ── */
  function openCompose() {
    setSelectedId(null)
    setComposing(true)
    setDraftText('')
    setDraftClientId('')
    setDraftSeanceId('')
    setSaveErr(null)
  }

  function selectNote(id) {
    setSelectedId(id)
    setComposing(false)
  }

  async function saveNote() {
    if (!draftText.trim() || !draftClientId) return
    setSaving(true)
    setSaveErr(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')
      const { error } = await supabase.from('notes').insert({
        user_id:   user.id,
        client_id: draftClientId || null,
        seance_id: draftSeanceId || null,
        contenu:   draftText.trim(),
      })
      if (error) throw error
      setComposing(false)
      setDraftText('')
      setDraftClientId('')
      setDraftSeanceId('')
      await loadNotes()
    } catch (e) {
      setSaveErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteNote(id) {
    await supabase.from('notes').delete().eq('id', id)
    setSelectedId(null)
    setComposing(false)
    await loadNotes()
  }

  /* ── Styles ── */
  const panelBg = '#f9fafb'

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'inherit' }}>

      {/* ── Panneau gauche — liste ── */}
      <div style={{ width: 272, flexShrink: 0, borderRight: '0.5px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: panelBg }}>

        {/* Header */}
        <div style={{ padding: '16px 16px 10px', borderBottom: '0.5px solid #e5e7eb' }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Notes</h1>
          <p style={{ fontSize: 11, color: '#6b7280', margin: '3px 0 0' }}>
            {filtered.length} note{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Actions + filtre */}
        <div style={{ padding: '10px 12px 8px', borderBottom: '0.5px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <button
            onClick={openCompose}
            style={{
              padding: '7px 12px', borderRadius: 4,
              border: '0.5px solid #1a2744',
              background: composing && !selectedId ? '#1a2744' : '#fff',
              color: composing && !selectedId ? '#c9a84c' : '#1a2744',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: 14 }} />
            Nouvelle note
          </button>

          {clients.length > 0 && (
            <select
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
              style={{
                width: '100%', padding: '5px 8px', borderRadius: 4,
                border: '0.5px solid #e5e7eb', background: '#fff',
                fontSize: 11, color: '#374151', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value=''>Tous les clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{clientFullName(c)}</option>
              ))}
            </select>
          )}
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Chargement…</div>
            </div>
          ) : err ? (
            <div style={{ padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#ef4444' }}>{err}</div>
              <button onClick={loadNotes} style={{ marginTop: 8, fontSize: 11, color: '#1a2744', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Réessayer</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <i className="ti ti-notebook-off" style={{ fontSize: 28, color: '#d1d5db', display: 'block', marginBottom: 8 }} aria-hidden="true" />
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Aucune note</div>
            </div>
          ) : filtered.map(n => {
            const active = selectedId === n.id
            const preview = (n.contenu ?? '').split('\n')[0].slice(0, 60)
            return (
              <div
                key={n.id}
                onClick={() => selectNote(n.id)}
                style={{
                  padding: '10px 14px',
                  borderBottom: '0.5px solid #f3f4f6',
                  cursor: 'pointer',
                  background: active ? '#e8f0fe' : 'transparent',
                  borderLeft: `3px solid ${active ? '#1a2744' : 'transparent'}`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 500, color: '#111827', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {preview || '(sans contenu)'}
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>
                  {clientFullName(n.clients)} · {formatDate(n.created_at)}
                </div>
                {n.seances && (
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>
                    Séance {n.seances.type} — {formatDateShort(n.seances.date)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Panneau droit ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {composing ? (
          /* Compositeur nouvelle note */
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px 12px', borderBottom: '0.5px solid #e5e7eb', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Nouvelle note</span>
              <button
                onClick={saveNote}
                disabled={saving || !draftText.trim() || !draftClientId}
                style={{
                  padding: '6px 16px', borderRadius: 4, border: 'none',
                  background: draftText.trim() && draftClientId ? '#1a2744' : '#e5e7eb',
                  color: draftText.trim() && draftClientId ? '#c9a84c' : '#9ca3af',
                  fontSize: 12, fontWeight: 700,
                  cursor: draftText.trim() && draftClientId ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'background .15s',
                }}
              >
                <i className="ti ti-device-floppy" style={{ fontSize: 14 }} />
                {saving ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>

            {/* Selects client + séance */}
            <div style={{ padding: '14px 24px 0', display: 'flex', gap: 12, flexShrink: 0 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: '#6b7280', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }}>Client *</label>
                <select
                  value={draftClientId}
                  onChange={e => setDraftClientId(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '0.5px solid #d1d5db', fontSize: 12, color: '#111827', outline: 'none', cursor: 'pointer' }}
                >
                  <option value=''>— Sélectionner —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{clientFullName(c)}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: '#6b7280', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }}>Séance associée</label>
                <select
                  value={draftSeanceId}
                  onChange={e => setDraftSeanceId(e.target.value)}
                  disabled={!draftClientId || seances.length === 0}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '0.5px solid #d1d5db', fontSize: 12, color: '#111827', outline: 'none', cursor: draftClientId ? 'pointer' : 'default', opacity: draftClientId ? 1 : 0.5 }}
                >
                  <option value=''>— Aucune —</option>
                  {seances.map(s => (
                    <option key={s.id} value={s.id}>{s.type} — {formatDateShort(s.date)}{s.heure ? ` ${s.heure}` : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {saveErr && (
              <div style={{ margin: '8px 24px 0', padding: '6px 10px', borderRadius: 4, background: '#fef2f2', border: '0.5px solid #fca5a5', fontSize: 11, color: '#b91c1c' }}>{saveErr}</div>
            )}

            <textarea
              value={draftText}
              onChange={e => setDraftText(e.target.value)}
              placeholder="Écrivez votre note ici… (Ctrl+Entrée pour sauvegarder)"
              onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') saveNote() }}
              style={{
                flex: 1, resize: 'none', border: 'none', outline: 'none',
                padding: '16px 24px',
                fontSize: 13, color: '#111827', lineHeight: 1.8,
                fontFamily: 'inherit', background: '#fff',
              }}
              autoFocus
            />
            <div style={{ padding: '4px 24px 10px', fontSize: 10, color: '#9ca3af', textAlign: 'right', flexShrink: 0 }}>
              Ctrl+Entrée pour sauvegarder · Client requis
            </div>
          </>

        ) : selected ? (
          /* Vue note existante */
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px 12px', borderBottom: '0.5px solid #e5e7eb', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{clientFullName(selected.clients)}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{formatDate(selected.created_at)}</div>
                {selected.seances && (
                  <button
                    onClick={() => navigate(`/seances/${selected.seance_id}`)}
                    style={{ marginTop: 4, fontSize: 10, color: '#1a2744', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <i className="ti ti-calendar" style={{ fontSize: 11 }} />
                    Séance {selected.seances.type} — {formatDateShort(selected.seances.date)}
                  </button>
                )}
              </div>
              <button
                onClick={() => deleteNote(selected.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 11px', borderRadius: 4,
                  border: '0.5px solid #fca5a5', background: '#fef2f2',
                  color: '#b91c1c', fontSize: 11, cursor: 'pointer',
                }}
              >
                <i className="ti ti-trash" style={{ fontSize: 13 }} />
                Supprimer
              </button>
            </div>
            <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', fontSize: 13, color: '#111827', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {selected.contenu}
            </div>
          </>

        ) : (
          /* État vide */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#9ca3af' }}>
            <i className="ti ti-notebook" style={{ fontSize: 40, color: '#d1d5db' }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: '#6b7280' }}>Sélectionnez une note</div>
            <div style={{ fontSize: 12 }}>ou créez-en une nouvelle</div>
          </div>
        )}
      </div>
    </div>
  )
}
