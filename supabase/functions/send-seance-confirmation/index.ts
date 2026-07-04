import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { email, prenom, nom, date_seance, heure_seance, duree_minutes, type_seance, praticien, praticien_tel, praticien_email, praticien_adresse } = await req.json()

  if (!email) return new Response('No email', { status: 400, headers: corsHeaders })

  const date = new Date(date_seance).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const dateObj = new Date(date_seance)
  const jour = String(dateObj.getDate()).padStart(2,'0')
  const mois = String(dateObj.getMonth()+1).padStart(2,'0')
  const annee = dateObj.getFullYear()
  const heureH = heure_seance ? heure_seance.split(':')[0] : '09'
  const heureM = heure_seance ? heure_seance.split(':')[1] : '00'
  const dateICS = `${annee}${mois}${jour}`
  const heureICS = `T${heureH}${heureM}00`
  const heureICSFin = `T${String(parseInt(heureH)+1).padStart(2,'0')}${heureM}00`
  const praticienEmailEncode = encodeURIComponent(praticien || '')

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:#4BBFCE;padding:32px 40px;text-align:center;">
          <div style="font-size:22px;font-weight:700;color:#ffffff;">Napo<span style="color:#4BBFCE;">solo</span></div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Votre confirmation de séance</div>
        </td></tr>
        <tr><td align="center" style="padding:40px 40px 0;">
          <div style="width:64px;height:64px;background:#4BBFCE18;border-radius:50%;text-align:center;line-height:64px;font-size:28px;">📅</div>
        </td></tr>
        <tr><td style="padding:24px 40px 0;text-align:center;">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">Votre séance est confirmée !</h1>
          <p style="margin:0;font-size:15px;color:#4B5563;line-height:1.6;">Bonjour ${prenom ? prenom.charAt(0).toUpperCase() + prenom.slice(1).toLowerCase() : ''} ${nom ? nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase() : ''},</p>
        </td></tr>
        <tr><td style="padding:24px 40px;">
          <div style="background:#F0F9FF;border-radius:12px;padding:20px;border:0.5px solid #BAE6FD;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">📆 Date</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right;">${date}</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">🕐 Heure</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right;">${heure_seance || '—'}</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">⏱ Durée</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right;">${duree_minutes || '—'} min</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">🌿 Type</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right;">${type_seance || '—'}</td></tr>
              <tr><td colspan="2" style="padding-top:12px;text-align:center;">
  <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=RDV%20${encodeURIComponent(type_seance || 'Séance')}%20—%20${praticienEmailEncode}&dates=${dateICS}${heureICS}/${dateICS}${heureICSFin}&details=RDV%20avec%20${praticienEmailEncode}%0A%0A📞%20${encodeURIComponent(praticien_tel || '')}%0A✉️%20${encodeURIComponent(praticien_email || '')}%0A📍%20${encodeURIComponent(praticien_adresse || '')}&location=${encodeURIComponent(praticien_adresse || '')}"
     target="_blank"
     style="display:inline-block;margin-top:8px;padding:8px 20px;background:#4285F4;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">
    📆 Ajouter à Google Calendar
  </a>
</td></tr>
            </table>
          </div>
        </td></tr>
        <tr><td style="padding:0 40px 24px;">
          <div style="background:#F9FAFB;border-radius:12px;padding:20px;border:0.5px solid #E5E7EB;margin-top:16px;">
            <div style="font-size:12px;font-weight:700;color:#111827;margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em;">👤 Votre praticien</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Nom</td><td style="padding:4px 0;font-size:13px;font-weight:600;color:#111827;text-align:right;">${praticien || '—'}</td></tr>
              ${praticien_tel ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">📞 Téléphone</td><td style="padding:4px 0;font-size:13px;font-weight:600;color:#4BBFCE;text-align:right;">${praticien_tel}</td></tr>` : ''}
              ${praticien_email ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">✉️ Email</td><td style="padding:4px 0;font-size:13px;font-weight:600;color:#4BBFCE;text-align:right;">${praticien_email}</td></tr>` : ''}
              ${praticien_adresse ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">📍 Adresse</td><td style="padding:4px 0;font-size:13px;font-weight:600;color:#111827;text-align:right;">${praticien_adresse}</td></tr>` : ''}
            </table>
          </div>
        </td></tr>
        <tr><td style="background:#F9FAFB;padding:20px 40px;text-align:center;border-top:1px solid #F3F4F6;">
          <p style="margin:0 0 4px;font-size:12px;color:#9CA3AF;">Naposolo · L'outil des praticiens indépendants</p>
          <p style="margin:0;font-size:11px;color:#D1D5DB;font-style:italic;">"Les petits font les grands !"</p>
          <p style="margin:12px 0 0;font-size:10px;color:#D1D5DB;">Conformément au Règlement (UE) 2016/679 (RGPD), vous disposez d'un droit d'accès, de rectification et d'effacement de vos données. Consultez notre <a href="https://naposolo.com/politique-confidentialite" style="color:#9CA3AF;text-decoration:underline;">politique de confidentialité</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Naposolo <contact@naposolo.com>',
      to: [email],
      subject: `✅ Votre séance du ${date} est confirmée`,
      html,
    })
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
