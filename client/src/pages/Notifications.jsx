import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { BellIcon, CheckCircleIcon, EnvelopeOpenIcon } from '@heroicons/react/24/outline';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import {
  fetchAdminNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
} from '../services/notificationsApi';

const statusTabs = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
];

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('unread');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadNotifications = async (tab) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (tab === 'unread') params.status = 'unread';
      if (tab === 'read') params.status = 'read';
      const data = await fetchAdminNotifications(params);
      setNotifications(data.notifications || data.items || []);
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to load notifications.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(activeTab);
  }, [activeTab]);

  const handleMarkSingle = async (notification, targetStatus) => {
    try {
      if (targetStatus === 'read') {
        await markNotificationAsRead(notification.id || notification._id);
      } else {
        await markNotificationAsUnread(notification.id || notification._id);
      }
      setNotifications((prev) =>
        prev.map((item) =>
          (item.id || item._id) === (notification.id || notification._id)
            ? { ...item, read: targetStatus === 'read' }
            : item
        )
      );
      if (targetStatus === 'read') {
        toast.success('Notification marked as read.');
      } else {
        toast.success('Notification marked as unread.');
      }
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to update notification.';
      toast.error(message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      if (activeTab === 'unread') {
        setActiveTab('all');
      }
      toast.success('All notifications marked as read.');
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to mark all notifications as read.';
      toast.error(message);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading && !notifications.length && !error) {
    return (
      <div className="p-6 h-full">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Notifications</h1>
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 h-full">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Notifications</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
            <BellIcon className="h-6 w-6 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            <p className="text-sm text-gray-500">Track new activity for the admin.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={!unreadCount}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-accent-blue hover:bg-light-blue disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          Mark all as read
        </button>
      </div>

      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {statusTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count =
              tab.key === 'unread'
                ? unreadCount
                : tab.key === 'all'
                ? notifications.length
                : notifications.filter((n) => n.read).length;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 text-sm font-medium ${
                  isActive
                    ? 'border-accent-blue text-accent-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>{tab.label}</span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {count}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {loading && (
        <div className="mb-4">
          <Loader />
        </div>
      )}

      {!notifications.length && !loading ? (
        <EmptyState
          title="No notifications yet"
          description="When there is new activity for the admin, it will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const id = notification.id || notification._id;
            const isRead = !!notification.read;
            return (
              <div
                key={id}
                className={`flex items-start justify-between p-4 rounded-lg border ${
                  isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-accent-blue'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`mt-1 h-9 w-9 rounded-full flex items-center justify-center ${
                      isRead ? 'bg-gray-100' : 'bg-accent-blue'
                    }`}
                  >
                    <EnvelopeOpenIcon
                      className={`h-5 w-5 ${
                        isRead ? 'text-gray-500' : 'text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-semibold text-gray-800">
                        {notification.title || notification.type || 'Notification'}
                      </p>
                      {!isRead && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-700">
                      {notification.message || notification.body}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDateTime(notification.createdAt || notification.at)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleMarkSingle(notification, isRead ? 'unread' : 'read')
                    }
                    className="text-xs font-medium text-accent-blue hover:text-light-blue"
                  >
                    Mark as {isRead ? 'unread' : 'read'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Notifications;
