import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtimeDashboard() {
  const [revenusCeMois, setRevenusCeMois] = useState(0)

  useEffect(() => {
    const fetchRevenues = async () => {
      const now = new Date()
      const debut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('seances')
        .select('montant')
        .gte('date', debut)
        .lte('date', fin)
        .eq('statut', 'payée')

      if (!error && data) {
        const total = data.reduce((sum, s) => sum + (parseFloat(s.montant) || 0), 0)
        setRevenusCeMois(total)
      }
    }

    fetchRevenues()

    const channel = supabase
      .channel('realtime-dashboard-revenus')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seances' }, fetchRevenues)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return { revenusCeMois }
}
