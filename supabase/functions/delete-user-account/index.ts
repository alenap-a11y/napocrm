import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TABLES = [
  'agenda','board_cards','board_colonnes','clients','disponibilites',
  'energie_chakras_mesures','energie_seances','fleurs_bach','fleurs_perso',
  'notes','notifications','rendez_vous','seances','suivi_plans',
  'taches','user_events','user_sessions'
]

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

  const { data: userList, error: listErr } = await sb.auth.admin.listUsers()
  if (listErr) {
    return new Response(JSON.stringify({ error: 'Erreur recherche utilisateur: ' + listErr.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
  const user = userList.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    return new Response(JSON.stringify({ error: 'Aucun utilisateur trouve avec cet email' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }

  const userId = user.id
  const results: Record<string, string> = {}

  for (const table of TABLES) {
    try {
      const { error } = await sb.from(table).delete().eq('user_id', userId)
      results[table] = error ? `ECHEC: ${error.message}` : 'ok'
    } catch (e) {
      results[table] = `ECHEC: ${e.message}`
    }
  }

  try {
    const { error } = await sb.from('profiles').delete().eq('id', userId)
    results['profiles'] = error ? `ECHEC: ${error.message}` : 'ok'
  } catch (e) {
    results['profiles'] = `ECHEC: ${e.message}`
  }

  let authDeleted = false
  try {
    const { error } = await sb.auth.admin.deleteUser(userId)
    authDeleted = !error
    results['auth.users'] = error ? `ECHEC: ${error.message}` : 'ok'
  } catch (e) {
    results['auth.users'] = `ECHEC: ${e.message}`
  }

  try {
    await sb.from('system_email_stats').insert({ event_type: 'deletion_request' })
  } catch (e) {
    console.error('Erreur log deletion_request:', e.message)
  }

  return new Response(JSON.stringify({ ok: authDeleted, results }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
})
