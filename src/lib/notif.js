import { supabase } from './supabase'

export async function insertNotif({ msg, icon = 'ti-bell', iconColor = '#6B7280', bg = '#F3F4F6' }) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').insert({
      user_id:    user.id,
      msg,
      icon,
      icon_color: iconColor,
      bg,
      unread:     true,
    })
  } catch {}
}

export function fmtNotifTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 2)  return "À l'instant"
  if (min < 60) return `Il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)   return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  return d === 1 ? 'Hier' : `Il y a ${d} jours`
}
