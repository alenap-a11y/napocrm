import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtimeTable(table, queryFn) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      const { data, error } = await queryFn()
      if (error) {
        console.error(`Erreur ${table}:`, error.message)
      } else if (isMounted) {
        setData(data || [])
      }
      setLoading(false)
    }

    fetchData()

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => fetchData()
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [table])

  return { data, loading }
}
