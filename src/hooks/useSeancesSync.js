import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/* ─── Rendez-vous (lit depuis seances) ───────────────────── */

function toDateRdv(date_seance, heure_seance) {
  if (!date_seance) return null
  const iso = `${date_seance.slice(0, 10)}T${heure_seance || '00:00:00'}`
  return isNaN(new Date(iso).getTime()) ? null : iso
}

export function useRendezVousSync() {
  const [rdvs,    setRdvs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [userId,  setUserId]  = useState(null)

  const fetchRdvs = useCallback(async (uid) => {
    const id = uid || userId
    if (!id) return
    setLoading(true)
    const { data } = await supabase
      .from('seances')
      .select('id, date_seance, heure_seance, type_seance, statut, notes, client_id, clients(nom, prenom)')
      .eq('user_id', id)
      .order('date_seance', { ascending: true })
    // Reconstruit date_rdv pour compat avec Agenda.jsx
    const mapped = (data || []).map(r => ({
      ...r,
      date_rdv: toDateRdv(r.date_seance, r.heure_seance),
    }))
    setRdvs(mapped)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    let channel
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      await fetchRdvs(user.id)

      channel = supabase
        .channel(`rdv-sync-${user.id}-${Date.now()}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'seances',
          filter: `user_id=eq.${user.id}`,
        }, () => fetchRdvs(user.id))
        .subscribe()
    }
    init()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  return { rdvs, loading, userId, fetchRdvs }
}

/* ─── Séances ─────────────────────────────────────────────── */

export function useSeancesSync() {
  const [seances, setSeances] = useState([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(null)

  const fetchSeances = useCallback(async (uid) => {
    const id = uid || userId
    if (!id) return
    setLoading(true)
    const { data } = await supabase
      .from('seances')
      .select('*')
      .eq('user_id', id)
      .order('date_seance', { ascending: false })
    setSeances(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    let channel
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      await fetchSeances(user.id)

      channel = supabase
        .channel('seances-sync-global')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'seances',
          filter: `user_id=eq.${user.id}`
        }, () => fetchSeances(user.id))
        .subscribe()
    }
    init()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  async function addSeance(data) {
    if (!userId) return { error: 'Non connecté' }
    if (data.date_seance && data.heure_seance) {
      const { data: conflicts } = await supabase
        .from('seances')
        .select('id')
        .eq('user_id', userId)
        .eq('date_seance', data.date_seance)
        .eq('heure_seance', data.heure_seance)
      if (conflicts && conflicts.length > 0) {
        const confirmer = window.confirm('Un rendez-vous existe deja a ce creneau. Continuer quand meme ?')
        if (!confirmer) return { error: null, cancelled: true }
      }
    }
    const { data: inserted, error } = await supabase
      .from('seances')
      .insert([{ ...data, user_id: userId }])
      .select()
      .single()
    return { data: inserted, error }
  }

  async function updateSeance(id, updates) {
    const { data: updated, error } = await supabase
      .from('seances')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data: updated, error }
  }

  async function deleteSeance(id) {
    const { error } = await supabase
      .from('seances')
      .delete()
      .eq('id', id)
    return { error }
  }

  function getSeancesByClient(clientId) {
    return seances.filter(s => s.client_id === clientId)
  }

  return {
    seances,
    loading,
    userId,
    fetchSeances,
    addSeance,
    updateSeance,
    deleteSeance,
    getSeancesByClient,
  }
}
