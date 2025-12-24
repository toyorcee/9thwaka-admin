import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import { fetchAdminNotifications, markNotificationAsRead } from '../services/notificationsApi';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminNotifications({ skip: 0, limit: 20 });
      const items = data?.items || data?.notifications || [];
      const adminItems = items.filter((item) => item?.metadata?.adminNotification);
      setNotifications(adminItems);
    } catch (e) {
      console.error('Failed to load admin notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && notifications.length === 0 && !loading) {
      loadNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        setMarkingId(notification._id);
        await markNotificationAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id
              ? { ...n, read: true, readAt: n.readAt || new Date().toISOString() }
              : n
          )
        );
        toast.success('Notification marked as read.');
      } catch {
        toast.error('Failed to mark notification as read.');
      } finally {
        setMarkingId(null);
      }
    }
  };

  const handleViewAll = () => {
    navigate('/notifications');
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative inline-flex items-center justify-center rounded-full p-2 text-gray-500 hover:text-accent-blue hover:bg-gray-100 focus:outline-none"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-xl bg-white z-20">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">Notifications</span>
            <button
              type="button"
              onClick={loadNotifications}
              disabled={loading}
              className="text-xs text-accent-blue hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && !loading ? (
              <div className="px-4 py-6 text-sm text-gray-500 text-center">
                No admin notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  disabled={markingId === notification._id}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                    notification.read ? 'bg-white' : 'bg-blue-50'
                  } hover:bg-gray-50 disabled:opacity-75`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                      {notification.type || 'notification'}
                    </span>
                    {!notification.read && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500 text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {notification.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {notification.createdAt
                      ? new Date(notification.createdAt).toLocaleString()
                      : ''}
                  </p>
                </button>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleViewAll}
              className="w-full text-center text-sm font-semibold text-accent-blue hover:underline"
            >
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
