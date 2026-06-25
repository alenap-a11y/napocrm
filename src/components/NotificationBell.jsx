import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  function handleBellClick() {
    const opening = !open
    setOpen(opening)
    if (opening && unreadCount > 0) markAllAsRead()
  }

  return (
    <div className="notification-bell">
      <button onClick={handleBellClick}>
        🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notification-dropdown">
          {notifications.length === 0 && (
            <div className="nd-empty">Aucune notification</div>
          )}
          {notifications.map(n => (
            <div
              key={n.id}
              className={n.unread ? 'unread' : 'read'}
              onClick={() => { markAsRead(n.id); if (n.lien) window.location.hash = '#' + n.lien.replace(/^\//, ''); setOpen(false); }}
            >
              <strong>{n.msg}</strong>
              <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>{n.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
