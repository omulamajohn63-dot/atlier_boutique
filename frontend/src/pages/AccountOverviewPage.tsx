import React from 'react';
import { Package, Heart, Eye, UserRound, Bell } from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationsContext';
import { useRouter } from '../router/RouterContext';
import { formatPrice } from '../utils/currency';

export const AccountOverviewPage: React.FC = () => {
  const { navigate } = useRouter();
  const { orders } = useOrders();
  const { wishlistCount } = useWishlist();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const activeOrders = orders.filter((order) =>
    ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)
  ).length;
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#827E77]">Good Morning</div>
          <h1 className="font-serif text-4xl leading-tight text-[#181716]">Atelier Dashboard</h1>
          <p className="text-sm text-[#63605A]">Manage your Atelier experience</p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-[1.5rem] border border-[#E8E5DF] bg-[#FAF9F6] p-6">
            <div className="flex items-center justify-between">
              <span className="font-serif text-xl text-[#181716]">ACTIVE ORDERS</span>
              <Package className="h-5 w-5 text-[#8A745C]" />
            </div>
            <div className="mt-4 text-5xl font-serif leading-none text-[#181716]">{String(activeOrders).padStart(2, '0')}</div>
          </article>
          <article className="rounded-[1.5rem] border border-[#E8E5DF] bg-[#FAF9F6] p-6">
            <div className="flex items-center justify-between">
              <span className="font-serif text-xl text-[#181716]">WISHLIST</span>
              <Heart className="h-5 w-5 text-[#8A745C]" />
            </div>
            <div className="mt-4 text-5xl font-serif leading-none text-[#181716]">{String(wishlistCount).padStart(2, '0')}</div>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-[#E8E5DF] bg-[#FAF9F6] p-6">
          <div className="flex items-center justify-between">
            <div className="font-serif text-2xl text-[#181716]">NOTIFICATIONS</div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[#8A745C]">
                <Bell className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">{unreadCount} unread</span>
              </div>
              <button type="button" onClick={() => navigate('/account/notifications')} className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A745C] hover:text-[#181716]">View all</button>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-[#63605A]">No notifications yet.</p>
            ) : (
              notifications.slice(0, 4).map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() => void markAsRead(notification.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${notification.isRead ? 'border-[#E8E5DF] bg-white' : 'border-[#D8C7A6] bg-[#FFFDF8]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-[#827E77]">{notification.category}</div>
                      <div className="mt-1 font-medium text-[#181716]">{notification.title}</div>
                    </div>
                    {!notification.isRead && <span className="h-2.5 w-2.5 rounded-full bg-[#8A745C]" />}
                  </div>
                  <p className="mt-2 text-sm text-[#63605A]">{notification.message}</p>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[#E8E5DF] bg-[#FAF9F6] p-6">
          <div className="flex items-center justify-between">
            <div className="font-serif text-2xl text-[#181716]">RECENT ORDERS</div>
            <button type="button" onClick={() => navigate('/orders')} className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A745C] hover:text-[#181716]">View all</button>
          </div>
          <div className="mt-5 space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-[#63605A]">No orders yet.</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b border-[#E8E5DF] pb-4 last:border-b-0 last:pb-0">
                  <div>
                    <div className="font-serif text-sm text-[#181716]">#{order.orderNumber}</div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-[#827E77] mt-1">{order.status}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-serif text-sm text-[#181716]">{formatPrice(order.total)}</span>
                    <button type="button" onClick={() => navigate(`/track?order=${encodeURIComponent(order.orderNumber)}`)} className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A745C] hover:text-[#181716]">View →</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[#E8E5DF] bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="font-serif text-2xl text-[#181716]">Storefront at a glance</div>
            <Eye className="h-5 w-5 text-[#8A745C]" />
          </div>
          <div className="mt-4 grid sm:grid-cols-3 gap-4">
            <div className="rounded-[1.5rem] border border-[#E8E5DF] bg-[#FAF9F6] px-4 py-5">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#827E77]">Status</div>
              <div className="font-serif text-xl text-[#181716] mt-2">In Season</div>
            </div>
            <div className="rounded-[1.5rem] border border-[#E8E5DF] bg-[#FAF9F6] px-4 py-5">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#827E77]">Wishlist</div>
              <div className="font-serif text-xl text-[#181716] mt-2">{wishlistCount}</div>
            </div>
            <div className="rounded-[1.5rem] border border-[#E8E5DF] bg-[#FAF9F6] px-4 py-5">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#827E77]">Orders</div>
              <div className="font-serif text-xl text-[#181716] mt-2">{orders.length}</div>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
};
