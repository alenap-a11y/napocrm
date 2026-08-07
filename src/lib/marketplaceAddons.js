import { supabase } from './supabase'

// Un module de marketplace_modules n'est "activable" que s'il pointe vers un
// deck ou un thème Oracle catalogue. Les autres modules (Napo-Métiers, etc.)
// n'ont pas d'état d'activation : ils sont soit accessibles librement, soit
// "coming_soon".
export async function checkActivatedModules(userId, modules) {
  const results = {}
  for (const m of modules) {
    if (m.catalogue_deck_id) {
      const { data } = await supabase.from('napo_oracle_decks_perso').select('id').eq('user_id', userId).eq('nom', m.title).maybeSingle()
      if (data) results[m.id] = true
    } else if (m.catalogue_theme_id) {
      const { data } = await supabase.from('napo_oracle_themes_perso').select('id').eq('user_id', userId).eq('nom', m.title).maybeSingle()
      if (data) results[m.id] = true
    }
  }
  return results
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
