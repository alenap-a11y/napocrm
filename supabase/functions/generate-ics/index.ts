import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const praticien = url.searchParams.get('praticien') || ''
  const date = url.searchParams.get('date') || ''
  const heure = url.searchParams.get('heure') || ''

  const [jour, mois, annee] = date.split('/')
  const [heureH, heureM] = heure.split(':')
  const dateICS = `${annee}${mois.padStart(2,'0')}${jour.padStart(2,'0')}`
  const heureICS = `T${heureH.padStart(2,'0')}${heureM.padStart(2,'0')}00`
  const heureICSFin = `T${String(parseInt(heureH)+1).padStart(2,'0')}${heureM.padStart(2,'0')}00`

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Naposolo//FR',
    'BEGIN:VEVENT',
    `SUMMARY:RDV ${praticien}`,
    `DTSTART:${dateICS}${heureICS}`,
    `DTEND:${dateICS}${heureICSFin}`,
    `DESCRIPTION:RDV avec ${praticien}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return new Response(ics, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/calendar',
      'Content-Disposition': 'attachment; filename="rdv-naposolo.ics"',
    },
  })
})
