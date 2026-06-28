import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  const { to_client, client, praticien, praticien_id, date, heure, praticien_tel: praticienTel, praticien_adresse: praticienAdresse } = await req.json()
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

  // Calculs pour lien .ics
  const [jour, mois, annee] = date.split('/')
  const [heureH, heureM] = heure.split(':')
  const dateICS = `${annee}${mois.padStart(2,'0')}${jour.padStart(2,'0')}`
  const heureICS = `T${heureH.padStart(2,'0')}${heureM.padStart(2,'0')}00`
  const heureICSFin = `T${String(parseInt(heureH)+1).padStart(2,'0')}${heureM.padStart(2,'0')}00`

  // Email client
  await sendEmail(to_client, `✅ RDV confirmé — ${praticien}`,
    `<div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;padding:32px">
  <div style="background:linear-gradient(135deg,#085041,#0F6E56);padding:24px;border-radius:12px;margin-bottom:24px">
    <h1 style="color:#fff;margin:0;font-size:20px">Votre confirmation de séance ✅</h1>
    <p style="color:#A7F3D0;margin:8px 0 0;font-size:14px">Votre RDV est bien enregistré</p>
  </div>
  <p>Bonjour <strong>${client.prenom}</strong>,</p>
  <p>Votre rendez-vous avec <strong>${praticien}</strong> est confirmé.</p>
  <div style="background:#E1F5EE;border-radius:10px;padding:16px;margin:20px 0">
    <p style="margin:0 0 8px;color:#0F6E56;font-weight:600;font-size:16px">📅 ${date} à ${heure}</p>
    <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=RDV+${encodeURIComponent(praticien)}&dates=${dateICS}${heureICS}/${dateICS}${heureICSFin}&details=RDV%20avec%20${encodeURIComponent(praticien)}%0A%0A📞%20${encodeURIComponent(praticienTel || '')}%0A✉️%20${encodeURIComponent(praticienEmail || '')}%0A📍%20${encodeURIComponent(praticienAdresse || '')}&location=${encodeURIComponent(praticienAdresse || '')}"
       target="_blank"
       style="display:inline-block;margin-top:8px;padding:8px 16px;background:#4285F4;color:#fff;border-radius:6px;text-decoration:none;font-size:13px">
      📆 Ajouter à Google Calendar
    </a>
  </div>
  <div style="margin:20px 0;padding:16px;border:1px solid #E5E7EB;border-radius:10px;font-size:13px">
    <p style="margin:0 0 8px;color:#374151;font-weight:600">Besoin de modifier ce RDV ?</p>
    <a href="mailto:${praticienEmail}" style="color:#0F6E56;margin-right:16px">✉️ Contacter le praticien</a>
  </div>
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
