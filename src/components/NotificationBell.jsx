import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="notification-bell">
      <button onClick={() => setOpen(!open)}>
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
              onClick={() => { markAsRead(n.id); if (n.lien) navigate(n.lien); setOpen(false); }}
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
