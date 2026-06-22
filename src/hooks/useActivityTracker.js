import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function useActivityTracker() {
  const location = useLocation()
  const sessionId = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    async function startSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('user_sessions')
        .insert({ user_id: user.id })
        .select('id')
        .single()
      if (data) sessionId.current = data.id
    }
    startSession()

    return () => {
      if (sessionId.current) {
        supabase.from('user_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', sessionId.current)
      }
    }
  }, [])

  useEffect(() => {
    async function logPage() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const page = location.pathname.replace('/', '') || 'dashboard'
      await supabase.from('user_events').insert({
        user_id: user.id,
        event_type: 'page_view',
        page
      })
    }
    logPage()
  }, [location.pathname])
}

export async function logEvent(eventType, page = null) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('user_events').insert({
    user_id: user.id,
    event_type: eventType,
    page
  })
}
