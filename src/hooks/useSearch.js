import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const MODULES = [
  { id: 'crm',      name: 'NapoCRM',      sub: 'Gestion clients',       icon: 'ti-users',     tag: 'Module', nav: 'clients'  },
  { id: 'oracle',   name: 'NapoOracle',   sub: 'Tirage & consultation', icon: 'ti-sparkles',  tag: 'Module', nav: 'oracle'   },
  { id: 'fleurs',   name: 'NapoFleurs',   sub: 'Fleurs de Bach',        icon: 'ti-flower',    tag: 'Module', nav: 'fleurs'   },
  { id: 'cards',    name: 'NapoCards',    sub: 'Cartes mantras',        icon: 'ti-cards',     tag: 'Module', nav: 'cards'    },
  { id: 'agenda',   name: 'NapoAgenda',   sub: 'Rendez-vous',           icon: 'ti-calendar',  tag: 'Module', nav: 'agenda'   },
  { id: 'seances',  name: 'NapoSéances',  sub: 'Suivi séances',         icon: 'ti-clipboard', tag: 'Module', nav: 'seances'  },
  { id: 'notes',    name: 'NapoNotes',    sub: 'Notes & memos',         icon: 'ti-notes',     tag: 'Module', nav: 'notes'    },
  { id: 'factures', name: 'NapoFacture',  sub: 'Facturation',           icon: 'ti-receipt',   tag: 'Module', nav: 'factures' },
  { id: 'annuaire', name: 'NapoAnnuaire', sub: 'Annuaire praticiens',   icon: 'ti-map',       tag: 'Module', nav: 'annuaire' },
  { id: 'sms',      name: 'NapoSMS',      sub: 'Messagerie SMS',        icon: 'ti-message',   tag: 'Module', nav: 'sms'      },
]

const LIMIT = 6 // on fetch 6, on affiche 5, hasMore si 6e existe

// Déduplique par id et retourne { items: [5 max], hasMore }
function dedup(arrays, displayLimit = 5) {
  const seen = new Set()
  const all = arrays.flat().filter(item => {
    if (!item || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
  return { items: all.slice(0, displayLimit), hasMore: all.length > displayLimit }
}

const EMPTY = {
  clients: { items: [], hasMore: false },
  seances: { items: [], hasMore: false },
  notes:   { items: [], hasMore: false },
  taches:  { items: [], hasMore: false },
  modules: { items: [], hasMore: false },
}

export function useSearch(query) {
  const [results, setResults] = useState(EMPTY)
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q) => {
    if (!q || q.trim().length < 2) { setResults(EMPTY); return }
    setLoading(true)
    const term = q.trim()

    const [
      clientsByNom, clientsByPrenom, clientsByEmail,
      seancesByType, seancesByNotes,
      notesByTitre, notesByContenu,
      taches,
    ] = await Promise.all([
      supabase.from('clients').select('id, prenom, nom, email, tel').ilike('nom',         `%${term}%`).limit(LIMIT),
      supabase.from('clients').select('id, prenom, nom, email, tel').ilike('prenom',      `%${term}%`).limit(LIMIT),
      supabase.from('clients').select('id, prenom, nom, email, tel').ilike('email',       `%${term}%`).limit(LIMIT),
      supabase.from('seances').select('id, type_seance, notes, date_seance, prenom, nom').ilike('type_seance', `%${term}%`).limit(LIMIT),
      supabase.from('seances').select('id, type_seance, notes, date_seance, prenom, nom').ilike('notes',       `%${term}%`).limit(LIMIT),
      supabase.from('notes').select('id, titre, contenu, date_note').ilike('titre',   `%${term}%`).limit(LIMIT),
      supabase.from('notes').select('id, titre, contenu, date_note').ilike('contenu', `%${term}%`).limit(LIMIT),
      supabase.from('taches').select('id, titre, statut, priorite').ilike('titre',    `%${term}%`).limit(LIMIT),
    ])

    const lower = term.toLowerCase()
    const filteredModules = MODULES.filter(m =>
      m.name.toLowerCase().includes(lower) || m.sub.toLowerCase().includes(lower)
    )

    const clientsDedup = dedup([clientsByNom.data, clientsByPrenom.data, clientsByEmail.data])
    const seancesDedup = dedup([seancesByType.data, seancesByNotes.data])
    const notesDedup   = dedup([notesByTitre.data, notesByContenu.data])
    const tachesRaw    = taches.data || []

    setResults({
      clients: {
        ...clientsDedup,
        items: clientsDedup.items.map(c => ({
          id:   c.id,
          name: `${c.prenom || ''} ${c.nom || ''}`.trim() || '—',
          sub:  c.email || c.tel || '',
          icon: 'ti-user',
          tag:  'Client',
          nav:  'clients',
        })),
      },
      seances: {
        ...seancesDedup,
        items: seancesDedup.items.map(s => ({
          id:   s.id,
          name: `${s.prenom || ''} ${s.nom || ''}`.trim() || s.type_seance || 'Séance',
          sub:  [s.type_seance, s.date_seance?.slice(0, 10)].filter(Boolean).join(' · '),
          icon: 'ti-clipboard',
          tag:  'Séance',
          nav:  'seances',
        })),
      },
      notes: {
        ...notesDedup,
        items: notesDedup.items.map(n => ({
          id:   n.id,
          name: n.titre || 'Note sans titre',
          sub:  (n.contenu || '').slice(0, 60).replace(/\n/g, ' '),
          icon: 'ti-notes',
          tag:  'Note',
          nav:  'notes',
        })),
      },
      taches: {
        items:   tachesRaw.slice(0, 5).map(t => ({
          id:   t.id,
          name: t.titre,
          sub:  t.statut || '',
          icon: 'ti-checkbox',
          tag:  'Tâche',
          nav:  'taches',
        })),
        hasMore: tachesRaw.length > 5,
      },
      modules: {
        items:   filteredModules,
        hasMore: false,
      },
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  return { results, loading }
}
