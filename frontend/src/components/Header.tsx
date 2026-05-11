import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiLoader, FiLogOut, FiSettings, FiTrash2, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

type HeaderNotification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
};

const formatNotificationTime = (date: string) => {
  const now = Date.now();
  const created = new Date(date).getTime();
  const diffMs = Math.max(0, now - created);
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const Header = () => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [itemActionLoading, setItemActionLoading] = useState<Record<string, 'read' | 'delete' | null>>({});

  const unreadCountLabel = useMemo(() => {
    if (unreadCount <= 0) return null;
    return unreadCount > 99 ? '99+' : String(unreadCount);
  }, [unreadCount]);

  const fetchNotifications = async (limit = 20) => {
    setLoadingNotifications(true);
    try {
      const res = await api.get('/notifications', { params: { limit } });
      const payload = res.data?.data || res.data;
      const list = payload?.notifications || payload?.data || [];
      const normalized = (Array.isArray(list) ? list : []).map((n: any) => ({
        id: n.id || n._id,
        title: n.title || 'Notification',
        message: n.message || '',
        isRead: !!n.isRead,
        createdAt: n.createdAt || new Date().toISOString(),
        actionUrl: n.actionUrl,
      }));

      setNotifications(normalized);
      setUnreadCount(typeof payload?.unreadCount === 'number' ? payload.unreadCount : normalized.filter((n) => !n.isRead).length);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications(10);
    const interval = setInterval(() => {
      fetchNotifications(10);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showNotifications) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showNotifications]);

  const handleToggleNotifications = () => {
    const next = !showNotifications;
    setShowNotifications(next);
    setShowDropdown(false);
    if (next) fetchNotifications(20);
  };

  const handleMarkAsRead = async (id: string) => {
    setItemActionLoading((s) => ({ ...s, [id]: 'read' }));
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } finally {
      setItemActionLoading((s) => ({ ...s, [id]: null }));
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    setItemActionLoading((s) => ({ ...s, [id]: 'delete' }));
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } finally {
      setItemActionLoading((s) => ({ ...s, [id]: null }));
    }
  };

  const navigate = useNavigate();

  const handleOpenAction = (actionUrl?: string) => {
    if (!actionUrl) return;
    try {
      if (actionUrl.startsWith('http')) {
        window.open(actionUrl, '_blank');
      } else {
        navigate(actionUrl);
      }
      setShowNotifications(false);
    } catch (err) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true);
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } finally {
      setMarkingAllRead(false);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Welcome, {user?.firstName}!
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={handleToggleNotifications}
          className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          aria-label="Toggle notifications"
        >
          <FiBell size={20} />
          {unreadCountLabel && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center bg-red-500 text-white rounded-full text-[10px] leading-none font-semibold">
              {unreadCountLabel}
            </span>
          )}
        </button>

        {showNotifications && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
            <div className="fixed left-4 right-4 top-20 z-20 max-h-[70vh] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 md:absolute md:right-16 md:left-auto md:top-14 md:w-[26rem] md:max-h-[32rem]">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAllRead || unreadCount === 0}
                  className="text-xs font-medium text-primary-600 disabled:opacity-50"
                >
                  {markingAllRead ? 'Marking...' : 'Mark all read'}
                </button>
              </div>

              <div className="max-h-[calc(70vh-3.5rem)] overflow-y-auto md:max-h-[28rem]">
                {loadingNotifications ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <FiLoader className="animate-spin mr-2" />
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-8 text-sm text-center text-gray-500">No notifications yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        onClick={() => handleOpenAction(n.actionUrl)}
                        className={`px-4 py-3 ${!n.isRead ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''}`}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 break-words">{n.message}</p>
                            <p className="text-[11px] text-gray-500 mt-2">{formatNotificationTime(n.createdAt)}</p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {!n.isRead && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }}
                                disabled={itemActionLoading[n.id] !== null}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                                title="Mark as read"
                              >
                                {itemActionLoading[n.id] === 'read' ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteNotification(n.id); }}
                              disabled={itemActionLoading[n.id] !== null}
                              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 disabled:opacity-50"
                              title="Delete notification"
                            >
                              {itemActionLoading[n.id] === 'delete' ? <FiLoader className="animate-spin" size={14} /> : <FiTrash2 size={14} />}
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}

        <div className="relative">
          <button
            onClick={() => {
              setShowDropdown(!showDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
            </div>
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setShowDropdown(false)}
                >
                  <FiUser size={16} />
                  <span>Profile</span>
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setShowDropdown(false)}
                >
                  <FiSettings size={16} />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                  className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left text-red-600"
                >
                  <FiLogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
