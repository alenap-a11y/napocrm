import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TABLES = [
  // Pourquoi : tables ajoutées après la 1re version de la liste. Enfants avant parents pour ne pas
  // buter sur une clé étrangère ; placées avant la table clients car plusieurs fiches en dépendent.
  'fiches_magnetisme_zones','fiches_mediumnite_perceptions','fiches_radiesthesie_questions',
  'napo_oracle_cartes_perso','napo_oracle_questions_perso',
  'napo_oracle_decks_perso','napo_oracle_themes_perso','napo_oracle_seances',
  'fiches_magnetisme','fiches_mediumnite','fiches_radiesthesie','fiches_aromatherapie',
  'fiches_astrologie','fiches_chamanisme','fiches_hypnotherapie','fiches_massage',
  'fiches_naturopathie','fiches_sonotherapie','fiches_sophrologie','fiches_yoga',
  'favoris_client','boutique_produits','offres_praticien','profil_modules_actifs',
  'agenda','board_cards','board_colonnes','clients','disponibilites',
  'energie_chakras_mesures','energie_seances','fleurs_bach','fleurs_perso',
  'notes','notifications','rendez_vous','seances','suivi_plans',
  'taches','user_events','user_sessions'
]

// Pourquoi : l'API Storage ne liste pas récursivement, et supprimer des lignes SQL de
// storage.objects ne supprime pas les fichiers. On parcourt donc les dossiers via l'API.
async function purgerDossier(sb: any, bucket: string, prefix: string): Promise<number> {
  const fichiers: string[] = []
  async function parcourir(dir: string) {
    let offset = 0
    while (true) {
      const { data, error } = await sb.storage.from(bucket).list(dir, { limit: 100, offset })
      if (error) throw error
      if (!data || data.length === 0) break
      for (const it of data) {
        const chemin = `${dir}/${it.name}`
        if (it.id === null) await parcourir(chemin)
        else fichiers.push(chemin)
      }
      if (data.length < 100) break
      offset += 100
    }
  }
  await parcourir(prefix)
  for (let i = 0; i < fichiers.length; i += 100) {
    const { error } = await sb.storage.from(bucket).remove(fichiers.slice(i, i + 100))
    if (error) throw error
  }
  return fichiers.length
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey' } })
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'Configuration serveur manquante' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
  const sb = createClient(SUPABASE_URL, SERVICE_KEY)

  // Pourquoi : cette fonction utilise la clé service (contourne la RLS). Sans contrôle, quiconque
  // a la clé anon publique pourrait supprimer n'importe quel compte. On exige un JWT d'utilisateur
  // réel ET profiles.is_admin = true. is_admin_user() est inutilisable ici : auth.uid() est nul
  // avec la clé service. Fail-closed : au moindre doute, refus.
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
  const { data: authData, error: authErr } = await sb.auth.getUser(token)
  const caller = authData?.user
  if (authErr || !caller) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
  const { data: callerProfile } = await sb.from('profiles').select('is_admin').eq('id', caller.id).maybeSingle()
  if (!callerProfile?.is_admin) {
    return new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }

  let payload
  try {
    payload = await req.json()
  } catch (e) {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }

  const { email } = payload
  if (!email) {
    return new Response(JSON.stringify({ error: 'Email requis' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }

  // Pourquoi : listUsers() sans paramètre ne renvoie qu'une page (50 comptes) ; on pagine
  // jusqu'à trouver l'email, sinon un praticien hors première page serait introuvable et
  // son droit à l'effacement échouerait en silence.
  const cible = email.toLowerCase().trim()
  let user: any = null
  for (let page = 1; page <= 50 && !user; page++) {
    const { data: pageData, error: listErr } = await sb.auth.admin.listUsers({ page, perPage: 1000 })
    if (listErr) {
      return new Response(JSON.stringify({ error: 'Erreur recherche utilisateur: ' + listErr.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }
    user = pageData.users.find((u: any) => u.email?.toLowerCase() === cible) || null
    if (pageData.users.length < 1000) break
  }
  if (!user) {
    return new Response(JSON.stringify({ error: 'Aucun utilisateur trouve avec cet email' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }

  const userId = user.id
  // Pourquoi : évite de se verrouiller hors du cockpit par un clic sur le mauvais email
  if (userId === caller.id) {
    return new Response(JSON.stringify({ error: 'Suppression de son propre compte refusée' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
  const results: Record<string, string> = {}

  // Pourquoi : purge Storage AVANT toute suppression. Si elle échoue on s'arrête et le compte
  // reste intact ; après deleteUser() l'email n'est plus retrouvable, donc plus de reprise possible.
  try {
    const n = await purgerDossier(sb, 'oracle-audio', userId)
    results['storage:oracle-audio'] = `ok (${n} fichier(s))`
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Purge audio impossible, suppression annulée: ' + (e as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }

  for (const table of TABLES) {
    try {
      const { error } = await sb.from(table).delete().eq('user_id', userId)
      results[table] = error ? `ECHEC: ${error.message}` : 'ok'
    } catch (e) {
      results[table] = `ECHEC: ${(e as Error).message}`
    }
  }

  try {
    const { error } = await sb.from('profiles').delete().eq('id', userId)
    results['profiles'] = error ? `ECHEC: ${error.message}` : 'ok'
  } catch (e) {
    results['profiles'] = `ECHEC: ${(e as Error).message}`
  }

  let authDeleted = false
  try {
    const { error } = await sb.auth.admin.deleteUser(userId)
    authDeleted = !error
    results['auth.users'] = error ? `ECHEC: ${error.message}` : 'ok'
  } catch (e) {
    results['auth.users'] = `ECHEC: ${(e as Error).message}`
  }

  if (authDeleted) {
    try {
      await sb.from('system_email_stats').insert({ event_type: 'deletion_request' })
      const encoder = new TextEncoder()
      const data = encoder.encode(email.toLowerCase().trim())
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const emailHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      await sb.from('deletion_log').insert({ email_hash: emailHash })
    } catch (e) {
      console.error('Erreur log deletion_log:', (e as Error).message)
    }
  }

  return new Response(JSON.stringify({ ok: authDeleted, results }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
})
