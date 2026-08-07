import { supabase } from './supabase'

// Deux mécanismes d'activation cohabitent :
// - Modules catalogue (Oracle : catalogue_deck_id / catalogue_theme_id) →
//   existence d'une copie perso (napo_oracle_decks_perso / themes_perso).
// - Modules Napo-Métiers (Yoga, Magnétiseur, etc., sans catalogue_*) →
//   présence d'une ligne dans profil_modules_actifs (table de liaison dédiée).
export async function checkActivatedModules(userId, modules) {
  const results = {}
  const metierIds = []
  for (const m of modules) {
    if (m.catalogue_deck_id) {
      const { data } = await supabase.from('napo_oracle_decks_perso').select('id').eq('user_id', userId).eq('nom', m.title).maybeSingle()
      if (data) results[m.id] = true
    } else if (m.catalogue_theme_id) {
      const { data } = await supabase.from('napo_oracle_themes_perso').select('id').eq('user_id', userId).eq('nom', m.title).maybeSingle()
      if (data) results[m.id] = true
    } else {
      metierIds.push(m.id)
    }
  }
  if (metierIds.length) {
    const { data } = await supabase.from('profil_modules_actifs').select('module_id').eq('user_id', userId).in('module_id', metierIds)
    ;(data || []).forEach(row => { results[row.module_id] = true })
  }
  return results
}

export async function activateMetierModule(userId, moduleId) {
  await supabase.from('profil_modules_actifs').upsert({ user_id: userId, module_id: moduleId }, { onConflict: 'user_id,module_id', ignoreDuplicates: true })
}

export async function deactivateMetierModule(userId, moduleId) {
  await supabase.from('profil_modules_actifs').delete().eq('user_id', userId).eq('module_id', moduleId)
}

export async function activateCatalogueModule(userId, mod) {
  if (mod.catalogue_deck_id) {
    const { data: existant } = await supabase.from('napo_oracle_decks_perso').select('id').eq('user_id', userId).eq('nom', mod.title).maybeSingle()
    if (existant) return
    const { data: deckPerso } = await supabase.from('napo_oracle_decks_perso').insert({ user_id: userId, nom: mod.title }).select().single()
    const { data: cartesSrc } = await supabase.from('napo_oracle_cartes_catalogue').select('*').eq('deck_id', mod.catalogue_deck_id).order('numero')
    if (deckPerso && cartesSrc) {
      await supabase.from('napo_oracle_cartes_perso').insert(cartesSrc.map(c => ({ deck_id: deckPerso.id, user_id: userId, numero: c.numero, nom: c.nom })))
    }
  } else if (mod.catalogue_theme_id) {
    const { data: existant } = await supabase.from('napo_oracle_themes_perso').select('id').eq('user_id', userId).eq('nom', mod.title).maybeSingle()
    if (existant) return
    const { data: themePerso } = await supabase.from('napo_oracle_themes_perso').insert({ user_id: userId, nom: mod.title }).select().single()
    const { data: questionsSrc } = await supabase.from('napo_oracle_questions_catalogue').select('*').eq('theme_id', mod.catalogue_theme_id)
    if (themePerso && questionsSrc) {
      await supabase.from('napo_oracle_questions_perso').insert(questionsSrc.map(q => ({ theme_id: themePerso.id, user_id: userId, texte: q.question })))
    }
  }
}

export async function deactivateCatalogueModule(userId, mod) {
  if (mod.catalogue_deck_id) {
    const { data: deckPerso } = await supabase.from('napo_oracle_decks_perso').select('id').eq('user_id', userId).eq('nom', mod.title).maybeSingle()
    if (deckPerso) {
      await supabase.from('napo_oracle_cartes_perso').delete().eq('deck_id', deckPerso.id).eq('user_id', userId)
      await supabase.from('napo_oracle_decks_perso').delete().eq('id', deckPerso.id)
    }
  } else if (mod.catalogue_theme_id) {
    const { data: themePerso } = await supabase.from('napo_oracle_themes_perso').select('id').eq('user_id', userId).eq('nom', mod.title).maybeSingle()
    if (themePerso) {
      await supabase.from('napo_oracle_questions_perso').delete().eq('theme_id', themePerso.id).eq('user_id', userId)
      await supabase.from('napo_oracle_themes_perso').delete().eq('id', themePerso.id)
    }
  }
}
