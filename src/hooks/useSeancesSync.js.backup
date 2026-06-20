import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/* ─── Rendez-vous ─────────────────────────────────────────── */

export function useRendezVousSync() {
  const [rdvs,    setRdvs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [userId,  setUserId]  = useState(null)

  const fetchRdvs = useCallback(async (uid) => {
    const id = uid || userId
    if (!id) return
    setLoading(true)
    const { data } = await supabase
      .from('rendez_vous')
      .select('id, date_rdv, type_seance, statut, notes, client_id, clients(nom, prenom)')
      .eq('user_id', id)
      .order('date_rdv', { ascending: true })
    setRdvs(data || [])
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
          table: 'rendez_vous',
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
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      await fetchSeances(user.id)

      const channel = supabase
        .channel('seances-sync-global')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'seances',
          filter: `user_id=eq.${user.id}`
        }, () => fetchSeances(user.id))
        .subscribe()

      return () => supabase.removeChannel(channel)
    }
    init()
  }, [])

  async function addSeance(data) {
    if (!userId) return { error: 'Non connecté' }
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
