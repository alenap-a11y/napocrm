import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const MODULES = [
  { id: 'crm',      name: 'NapoCRM',      sub: 'Gestion clients',       icon: 'ti-users',         tag: 'Module', nav: 'clients' },
  { id: 'oracle',   name: 'NapoOracle',   sub: 'Tirage & consultation', icon: 'ti-sparkles',      tag: 'Module', nav: 'oracle' },
  { id: 'fleurs',   name: 'NapoFleurs',   sub: 'Fleurs de Bach',        icon: 'ti-flower',        tag: 'Module', nav: 'fleurs' },
  { id: 'cards',    name: 'NapoCards',    sub: 'Cartes mantras',        icon: 'ti-cards',         tag: 'Module', nav: 'cards' },
  { id: 'agenda',   name: 'NapoAgenda',   sub: 'Rendez-vous',           icon: 'ti-calendar',      tag: 'Module', nav: 'agenda' },
  { id: 'seances',  name: 'NapoSéances',  sub: 'Suivi séances',         icon: 'ti-clipboard',     tag: 'Module', nav: 'seances' },
  { id: 'notes',    name: 'NapoNotes',    sub: 'Notes & memos',         icon: 'ti-notes',         tag: 'Module', nav: 'notes' },
  { id: 'factures', name: 'NapoFacture',  sub: 'Facturation',           icon: 'ti-receipt',       tag: 'Module', nav: 'factures' },
  { id: 'annuaire', name: 'NapoAnnuaire', sub: 'Annuaire praticiens',   icon: 'ti-map',           tag: 'Module', nav: 'annuaire' },
  { id: 'sms',      name: 'NapoSMS',      sub: 'Messagerie SMS',        icon: 'ti-message',       tag: 'Module', nav: 'sms' },
]

export function useSearch(query) {
  const [results, setResults] = useState({ clients: [], taches: [], modules: [] })
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults({ clients: [], taches: [], modules: [] })
      return
    }
    setLoading(true)
    const term = q.trim()

    const [{ data: clients }, { data: taches }] = await Promise.all([
      supabase
        .from('clients')
        .select('id, prenom, nom, email, telephone')
        .or(`prenom.ilike.%${term}%,nom.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(5),
      supabase
        .from('taches')
        .select('id, titre, statut, priorite')
        .ilike('titre', `%${term}%`)
        .limit(5),
    ])

    const lower = term.toLowerCase()
    const filteredModules = MODULES.filter(m =>
      m.name.toLowerCase().includes(lower) || m.sub.toLowerCase().includes(lower)
    )

    setResults({
      clients: (clients || []).map(c => ({
        id: c.id,
        name: `${c.prenom} ${c.nom}`,
        sub: c.email || c.telephone || '',
        icon: 'ti-user',
        tag: 'Client',
        nav: 'clients',
      })),
      taches: (taches || []).map(t => ({
        id: t.id,
        name: t.titre,
        sub: t.statut || '',
        icon: 'ti-checkbox',
        tag: 'Tâche',
        nav: 'taches',
      })),
      modules: filteredModules,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  return { results, loading }
}
