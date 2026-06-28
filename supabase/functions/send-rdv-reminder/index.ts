import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

  const demain = new Date()
  demain.setDate(demain.getDate() + 1)
  const demainISO = demain.toISOString().slice(0, 10)

  const { data: seances, error } = await sb
    .from('seances')
    .select('*, clients(prenom, nom, email), profiles(prenom, nom, tel, email_contact, adresse_rdv, ville_rdv, code_postal)')
    .eq('date_seance', demainISO)
    .neq('statut', 'annulé')

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  let sent = 0
  for (const s of seances || []) {
    const client = s.clients
    const profile = s.profiles
    if (!client?.email) continue

    const praticien = `${profile?.prenom || ''} ${profile?.nom || ''}`.trim()
    const praticienTel = profile?.tel || ''
    const praticienEmail = profile?.email_contact || ''
    const praticienAdresse = [profile?.adresse_rdv, profile?.ville_rdv, profile?.code_postal].filter(Boolean).join(', ')

    const dateObj = new Date(s.date_seance)
    const dateLabel = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const jour = String(dateObj.getDate()).padStart(2, '0')
    const mois = String(dateObj.getMonth() + 1).padStart(2, '0')
    const annee = dateObj.getFullYear()
    const heureH = s.heure_seance ? s.heure_seance.split(':')[0] : '09'
    const heureM = s.heure_seance ? s.heure_seance.split(':')[1] : '00'
    const dateICS = `${annee}${mois}${jour}`
    const heureICS = `${heureH}${heureM}00`
    const heureICSFin = `${String(parseInt(heureH) + 1).padStart(2, '0')}${heureM}00`
    const praticienEncode = encodeURIComponent(praticien)
    const prenomCapitalized = client.prenom ? client.prenom.charAt(0).toUpperCase() + client.prenom.slice(1).toLowerCase() : ''

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:#4BBFCE;padding:32px 40px;text-align:center;">
          <div style="font-size:22px;font-weight:700;color:#ffffff;">Napo<span style="color:#ffffff;opacity:0.8;">solo</span></div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Rappel de votre séance</div>
        </td></tr>
        <tr><td align="center" style="padding:40px 40px 0;">
          <div style="width:64px;height:64px;background:#4BBFCE18;border-radius:50%;text-align:center;line-height:64px;font-size:28px;">🔔</div>
        </td></tr>
        <tr><td style="padding:24px 40px 0;text-align:center;">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">Votre RDV est demain !</h1>
          <p style="margin:0;font-size:15px;color:#4B5563;">Bonjour ${prenomCapitalized},</p>
        </td></tr>
        <tr><td style="padding:24px 40px;">
          <div style="background:#F0F9FF;border-radius:12px;padding:20px;border:0.5px solid #BAE6FD;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">📆 Date</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right;">${dateLabel}</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">🕐 Heure</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right;">${s.heure_seance || '—'}</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">⏱ Durée</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right;">${s.duree_minutes || 60} min</td></tr>
              <tr><td colspan="2" style="padding-top:12px;text-align:center;">
                <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=RDV%20${encodeURIComponent(s.type_seance || 'Séance')}%20—%20${praticienEncode}&dates=${dateICS}${heureICS}/${dateICS}${heureICSFin}&details=RDV%20avec%20${praticienEncode}%0A%0A📞%20${encodeURIComponent(praticienTel)}%0A✉️%20${encodeURIComponent(praticienEmail)}%0A📍%20${encodeURIComponent(praticienAdresse)}&location=${encodeURIComponent(praticienAdresse)}"
                   target="_blank"
                   style="display:inline-block;padding:8px 20px;background:#4285F4;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">
                  📆 Google Calendar
                </a>
              </td></tr>
            </table>
          </div>
        </td></tr>
        ${praticien ? `<tr><td style="padding:0 40px 24px;">
          <div style="background:#F9FAFB;border-radius:12px;padding:20px;border:0.5px solid #E5E7EB;">
            <div style="font-size:12px;font-weight:700;color:#111827;margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em;">👤 Votre praticien</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Nom</td><td style="padding:4px 0;font-size:13px;font-weight:600;color:#111827;text-align:right;">${praticien}</td></tr>
              ${praticienTel ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">📞 Téléphone</td><td style="padding:4px 0;font-size:13px;font-weight:600;color:#4BBFCE;text-align:right;">${praticienTel}</td></tr>` : ''}
              ${praticienEmail ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">✉️ Email</td><td style="padding:4px 0;font-size:13px;font-weight:600;color:#4BBFCE;text-align:right;">${praticienEmail}</td></tr>` : ''}
              ${praticienAdresse ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">📍 Adresse</td><td style="padding:4px 0;font-size:13px;font-weight:600;color:#111827;text-align:right;">${praticienAdresse}</td></tr>` : ''}
            </table>
          </div>
        </td></tr>` : ''}
        <tr><td style="background:#F9FAFB;padding:20px 40px;text-align:center;border-top:1px solid #F3F4F6;">
          <p style="margin:0 0 4px;font-size:12px;color:#9CA3AF;">Naposolo · L'outil des praticiens indépendants</p>
          <p style="margin:0;font-size:11px;color:#D1D5DB;font-style:italic;">"Les petits font les grands !"</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Naposolo <contact@naposolo.com>',
        to: [client.email],
        subject: `🔔 Rappel — Votre RDV demain à ${s.heure_seance}`,
        html
      })
    })
    sent++
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
})
