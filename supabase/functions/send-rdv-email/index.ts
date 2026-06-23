import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  const { to_client, client, praticien, praticien_id, date, heure } = await req.json()
  const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  // Récupérer email praticien depuis auth.users
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { data: userData } = await sb.auth.admin.getUserById(praticien_id)
  const praticienEmail = userData?.user?.email || ''

  async function sendEmail(to, subject, html) {
    return fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({ from: 'Naposolo <onboarding@resend.dev>', to: [to], subject, html })
    })
  }

  // Email client
  await sendEmail(to_client, `✅ RDV confirmé — ${praticien}`,
    `<div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;padding:32px">
      <div style="background:linear-gradient(135deg,#085041,#0F6E56);padding:24px;border-radius:12px;margin-bottom:24px">
        <h1 style="color:#fff;margin:0;font-size:20px">Demande de RDV reçue ✅</h1>
      </div>
      <p>Bonjour <strong>${client.prenom}</strong>,</p>
      <p>Votre demande de RDV avec <strong>${praticien}</strong> a bien été reçue.</p>
      <div style="background:#E1F5EE;border-radius:10px;padding:16px;margin:20px 0">
        <p style="margin:0;color:#0F6E56;font-weight:600;font-size:16px">📅 ${date} à ${heure}</p>
      </div>
      <p style="color:#6B7280;font-size:13px">Vous serez recontacté(e) sous 24h pour confirmer.</p>
      <p style="color:#9CA3AF;font-size:11px;text-align:center">Propulsé par <strong style="color:#0F6E56">Naposolo</strong></p>
    </div>`
  )

  // Email praticien
  if (praticienEmail) {
    await sendEmail(praticienEmail, `🔔 Nouveau RDV — ${client.prenom} ${client.nom}`,
      `<div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;padding:32px">
        <h2>Nouvelle demande de RDV 🔔</h2>
        <div style="background:#F9FAFB;border-radius:10px;padding:16px;margin:16px 0">
          <p style="margin:4px 0"><strong>Client :</strong> ${client.prenom} ${client.nom}</p>
          <p style="margin:4px 0"><strong>Email :</strong> ${client.email}</p>
          <p style="margin:4px 0"><strong>Tél :</strong> ${client.telephone}</p>
          <p style="margin:4px 0"><strong>Motif :</strong> ${client.motif || '—'}</p>
        </div>
        <div style="background:#E1F5EE;border-radius:10px;padding:16px">
          <p style="margin:0;color:#0F6E56;font-weight:600">📅 ${date} à ${heure}</p>
        </div>
        <p style="margin-top:16px;font-size:13px;color:#6B7280">
          Connectez-vous sur <a href="https://naposolo.com" style="color:#0F6E56">naposolo.com</a> pour confirmer.
        </p>
      </div>`
    )
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
})
