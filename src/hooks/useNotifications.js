import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { fmtNotifTime } from '../lib/notif';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) console.error(error);
    else setNotifications((data || []).map(n => ({
      id:        n.id,
      msg:       n.msg,
      icon:      n.icon       || 'ti-bell',
      iconColor: n.icon_color || '#6B7280',
      bg:        n.bg         || '#F3F4F6',
      unread:    n.unread,
      time:      fmtNotifTime(n.created_at),
    })));
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, fetchNotifications)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ unread: false }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    await supabase.from('notifications').update({ unread: false }).eq('unread', true);
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead };
}
