import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAdminStats() {
  const [stats, setStats] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  async function fetchStats(userId) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, prenom, is_admin')
      .neq('id', userId)

    const { data: events } = await supabase
      .from('user_events')
      .select('user_id, event_type, page, created_at')
      .order('created_at', { ascending: false })

    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('user_id, started_at, ended_at')

    const statsParUser = (users ?? []).map(u => {
      const ue = (events ?? []).filter(e => e.user_id === u.id)
      const us = (sessions ?? []).filter(s => s.user_id === u.id)
      const durations = us
        .filter(s => s.ended_at)
        .map(s => (new Date(s.ended_at) - new Date(s.started_at)) / 60000)

      return {
        id: u.id,
        prenom: u.prenom ?? `User ${u.id.slice(0,6)}`,
        events: ue,
        sessions: us,
        totalEvents: ue.length,
        totalSessions: us.length,
        avgDuration: durations.length
          ? Math.round(durations.reduce((a,b)=>a+b,0) / durations.length)
          : 0,
        eventsByType: ue.reduce((acc, e) => {
          acc[e.event_type] = (acc[e.event_type] || 0) + 1
          return acc
        }, {}),
        pageViews: ue
          .filter(e => e.event_type === 'page_view')
          .reduce((acc, e) => {
            acc[e.page] = (acc[e.page] || 0) + 1
            return acc
          }, {}),
        lastSeen: ue[0]?.created_at ?? null
      }
    })

    setStats(statsParUser)
    setLoading(false)
  }

  useEffect(() => {
    let userId = null

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      if (!user) return

      userId = user.id

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      setIsAdmin(true)
      await fetchStats(userId)

      // Realtime — nouveau profil créé
      supabase.getChannels()
        .filter(ch => ch.topic === 'realtime:profiles-changes')
        .forEach(ch => supabase.removeChannel(ch))
      const profileSub = supabase
        .channel('profiles-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles'
        }, () => fetchStats(userId))
        .subscribe()

            // Realtime — nouvel event
      supabase.getChannels()
        .filter(ch => ch.topic === 'realtime:events-changes')
        .forEach(ch => supabase.removeChannel(ch))
      const eventSub = supabase
        .channel('events-changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'user_events'
        }, () => fetchStats(userId))
        .subscribe()

            // Realtime — nouvelle session
      supabase.getChannels()
        .filter(ch => ch.topic === 'realtime:sessions-changes')
        .forEach(ch => supabase.removeChannel(ch))
      const sessionSub = supabase
        .channel('sessions-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_sessions'
        }, () => fetchStats(userId))
        .subscribe()

      return () => {
        supabase.removeChannel(profileSub)
        supabase.removeChannel(eventSub)
        supabase.removeChannel(sessionSub)
      }
    }

    init()
  }, [])

  return { stats, isAdmin, loading }
}
