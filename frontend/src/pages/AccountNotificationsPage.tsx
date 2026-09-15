import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useRouter } from '../router/RouterContext';
import { useNotifications } from '../context/NotificationsContext';
import { api } from '../services/apiClient';
import { CustomerNotification } from '../types';

type Filter = 'all' | 'unread';

export const AccountNotificationsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { refreshNotifications, markAsRead, markAllAsRead } = useNotifications();
  const [items, setItems] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getNotifications(500)
      .then((response) => {
        if (active) setItems(response.results || []);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = filter === 'unread' ? items.filter((item) => !item.isRead) : items;
  const unreadCount = items.filter((item) => !item.isRead).length;

  const handleMarkAll = async () => {
    await markAllAsRead();
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
  };

  const handleOpen = (notification: CustomerNotification) => {
    if (!notification.isRead) {
      void markAsRead(notification.id);
      setItems((current) => current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)));
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl text-[#181716]">Notifications</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#FFF0E3] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A5A2B]">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#63605A]">Alerts about your orders, payments and account.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-[#E8E5DF] bg-[#FAF9F6] p-1">
            {(['all', 'unread'] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${filter === f ? 'bg-[#181716] text-[#FAF9F6]' : 'text-[#63605A] hover:text-[#181716]'}`}
              >
                {f === 'all' ? 'All' : 'Unread'}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void handleMarkAll()}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#C7BDAB] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A745C] hover:bg-[#FAF9F6] transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-8 text-center text-sm text-[#63605A]">
            Loading notifications...
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-10 text-center">
            <Bell className="mx-auto h-8 w-8 text-[#C7BDAB]" />
            <p className="mt-3 text-sm font-medium text-[#181716]">
              {filter === 'unread' ? 'You are all caught up.' : 'No notifications yet.'}
            </p>
            {filter === 'unread' && <p className="mt-1 text-xs text-[#63605A]">No unread notifications right now.</p>}
          </div>
        ) : (
          visible.map((notification) => (
            <button
              type="button"
              key={notification.id}
              onClick={() => handleOpen(notification)}
              className={`w-full rounded-2xl border p-4 text-left transition ${notification.isRead ? 'border-[#E8E5DF] bg-white' : 'border-[#D8C7A6] bg-[#FFFDF8]'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[#827E77]">{notification.category}</div>
                  <div className="mt-1 font-medium text-[#181716]">{notification.title}</div>
                </div>
                {!notification.isRead && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#8A745C]" />}
              </div>
              <p className="mt-2 text-sm text-[#63605A]">{notification.message}</p>
              <div className="mt-3 text-[11px] text-[#A29E96]">
                {new Date(notification.createdAt).toLocaleString('en-KE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};