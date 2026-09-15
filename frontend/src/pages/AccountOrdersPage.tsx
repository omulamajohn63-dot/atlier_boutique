import React from 'react';
import { Package, ArrowUpRight } from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { useRouter } from '../router/RouterContext';
import { formatPrice } from '../utils/currency';

export const AccountOrdersPage: React.FC = () => {
  const { navigate } = useRouter();
  const { orders } = useOrders();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="rounded-[2rem] border border-[#E8E5DF] bg-white shadow-sm">
        <div className="border-b border-[#E8E5DF] px-8 py-6 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#827E77]">Account</div>
            <h1 className="font-serif text-3xl text-[#181716] mt-2">My Orders</h1>
          </div>
          <Package className="h-7 w-7 text-[#8A745C]" />
        </div>

        <div className="p-8">
          {orders.length === 0 ? (
            <div className="rounded-[1.5rem] border border-[#E8E5DF] bg-[#FAF9F6] p-8 text-sm text-[#63605A]">
              No orders yet. Start shopping your atelier edit.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <article key={order.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-[#E8E5DF] bg-[#FAF9F6] px-5 py-4">
                  <div className="space-y-1">
                    <div className="font-serif text-lg text-[#181716]">#{order.orderNumber}</div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#827E77]">
                      {order.status} • {order.items.length} item{order.items.length === 1 ? '' : 's'}
                    </div>
                  </div>

                  <div className="space-y-1 text-right">
                    <div className="font-serif text-sm text-[#181716]">{formatPrice(order.total)}</div>
                    <div className="text-[11px] text-[#63605A]">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/account/orders/${encodeURIComponent(order.orderNumber)}`)}
                    className="flex items-center gap-2 rounded-full border border-[#181716] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#181716] hover:bg-[#181716] hover:text-[#FAF9F6] transition-colors"
                  >
                    Details <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
