import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  PackageCheck,
  Truck,
} from 'lucide-react';
import { useRouter } from '../router/RouterContext';
import { useOrders } from '../context/OrdersContext';
import { Button } from '../components/ui/Button';
import { api } from '../services/apiClient';
import { Order, OrderStatus, PaymentStatus } from '../types';
import { formatPrice } from '../utils/currency';
import { OrderDTO } from '../types/api';

interface CustomerOrderDetailPageProps {
  orderNumber?: string;
}

function mapServerOrder(serverOrder: OrderDTO): Order {
  return {
    id: serverOrder.id,
    orderNumber: serverOrder.orderNumber,
    customer: {
      firstName: serverOrder.customer.fullName.split(' ')[0] || serverOrder.customer.fullName,
      lastName: serverOrder.customer.fullName.split(' ').slice(1).join(' ') || '',
      email: serverOrder.customer.email,
      phone: serverOrder.customer.phone,
      addressLine1: serverOrder.customer.addressLine1,
      addressLine2: serverOrder.customer.addressLine2 || '',
      city: serverOrder.customer.city,
      stateOrProvince: serverOrder.customer.county,
      postalCode: serverOrder.customer.postalCode || '',
      country: 'Kenya',
    },
    items: serverOrder.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      variantId: i.variantId,
      productName: i.productName,
      variantDetails: `${i.variantSize || ''} ${i.variantColor || ''}`.trim(),
      sku: i.variantSku,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      subtotal: i.lineTotal,
      image: i.imageUrl || '',
    })),
    subtotal: serverOrder.subtotal,
    shippingMethod: serverOrder.shippingMethod,
    shippingCost: serverOrder.shippingCost,
    tax: serverOrder.tax,
    total: serverOrder.total,
    status: serverOrder.status,
    paymentStatus: serverOrder.paymentStatus,
    paymentMethod: serverOrder.paymentMethod,
    notes: serverOrder.customer.deliveryInstructions,
    timeline: [
      {
        status: 'confirmed' as OrderStatus,
        title: 'Order Authorized & Received',
        description: 'Order registered in the atelier order ledger.',
        timestamp: serverOrder.createdAt,
        completed: true,
      },
      {
        status: 'processing' as OrderStatus,
        title: 'Atelier Preparation',
        description: 'The order is being prepared for delivery.',
        timestamp: serverOrder.updatedAt,
        completed: serverOrder.status !== 'pending',
      },
    ],
    createdAt: serverOrder.createdAt,
    updatedAt: serverOrder.updatedAt,
  };
}

const statusLabel: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  received: 'Received',
  cancelled: 'Cancelled',
};

const paymentLabel: Record<PaymentStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

export const CustomerOrderDetailPage: React.FC<CustomerOrderDetailPageProps> = ({ orderNumber: propOrderNumber }) => {
  const { navigate } = useRouter();
  const { getOrder, receiveOrder: receiveLocalOrder } = useOrders();
  const [order, setOrder] = useState<Order | null>(() => {
    if (!propOrderNumber) return null;
    return getOrder(propOrderNumber) || null;
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMarkReceived = async () => {
    if (!order) return;
    if (!window.confirm(`Mark order ${order.orderNumber} as received?`)) {
      return;
    }

    try {
      const serverOrder = await api.receiveOrder(order.orderNumber);
      const mapped = mapServerOrder(serverOrder);
      setOrder(mapped);
      setError('');
      receiveLocalOrder(order.orderNumber);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to mark order as received.';
      setError(message);
    }
  };

  useEffect(() => {
    const orderNum = propOrderNumber || '';
    if (!orderNum) return;

    const local = getOrder(orderNum);
    if (local) {
      setOrder(local);
      setError('');
      return;
    }

    setLoading(true);
    api.getOrder(orderNum)
      .then((serverOrder) => {
        const mapped = mapServerOrder(serverOrder);
        setOrder(mapped);
        setError('');
      })
      .catch(() => {
        setOrder(null);
        setError('No order could be found for this reference.');
      })
      .finally(() => setLoading(false));
  }, [propOrderNumber, getOrder]);

  if (!propOrderNumber) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="rounded-[2rem] border border-[#E8E5DF] bg-white p-8 text-sm text-[#63605A]">
          No order reference was provided.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="rounded-[2rem] border border-[#E8E5DF] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E8E5DF] px-8 py-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/account/orders')} className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#63605A] hover:text-[#181716]">
              <ArrowLeft className="h-4 w-4" />
              Back to orders
            </button>
          </div>
          <div className="font-serif text-2xl text-[#181716]">Order Detail</div>
        </div>

        {error && (
          <div className="px-8 py-6 text-sm text-[#9B1C1C]">{error}</div>
        )}

        {loading && (
          <div className="px-8 py-8 text-sm text-[#63605A]">Loading order...</div>
        )}

        {order && (
          <div className="p-8">
            <section className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F3F1ED] pb-6">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#827E77]">
                  Reference #{order.orderNumber}
                </div>
                <div className="font-serif text-3xl text-[#181716] mt-2">
                  {statusLabel[order.status]}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF1EA] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2E5A44]">
                  <PackageCheck className="h-3.5 w-3.5" />
                  {statusLabel[order.status]}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#FAF9F6] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A745C]">
                  <CreditCard className="h-3.5 w-3.5" />
                  {paymentLabel[order.paymentStatus]}
                </span>
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-[minmax(420px,1.7fr)_minmax(280px,1fr)] mt-8">
              <div className="space-y-6">
                <div className="rounded-[1.5rem] border border-[#E8E5DF] bg-[#FAF9F6] p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DF]">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#827E77]">Order Items</span>
                    <span className="font-mono text-[11px] text-[#63605A]">{order.items.length} item(s)</span>
                  </div>

                  <div className="divide-y divide-[#E8E5DF]">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 py-4">
                        <img src={item.image} alt={item.productName} referrerPolicy="no-referrer" className="w-16 h-16 object-cover rounded-xl border border-[#E8E5DF] bg-white" />
                        <div className="flex-1">
                          <div className="font-serif text-sm text-[#181716]">{item.productName}</div>
                          <div className="text-[11px] text-[#827E77]">{item.variantDetails}</div>
                          <div className="text-[11px] text-[#63605A] mt-1">
                            Qty {item.quantity} × {formatPrice(item.unitPrice)}
                          </div>
                        </div>
                        <div className="font-serif text-sm text-[#181716]">{formatPrice(item.subtotal)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#E8E5DF] bg-white p-5">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#827E77]">
                    <MapPin className="h-4 w-4 text-[#8A745C]" />
                    Delivery Address
                  </div>
                  <div className="mt-3 text-sm text-[#181716]">
                    <div className="font-medium">
                      {order.customer.firstName} {order.customer.lastName}
                    </div>
                    <div className="text-[#63605A] mt-1">
                      {order.customer.addressLine1}{order.customer.addressLine2 ? `, ${order.customer.addressLine2}` : ''}
                    </div>
                    <div className="text-[#63605A]">
                      {order.customer.city}, {order.customer.stateOrProvince} {order.customer.postalCode}
                    </div>
                    <div className="text-[#63605A]">{order.customer.country}</div>
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-[1.5rem] border border-[#E8E5DF] bg-[#FAF9F6] p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#827E77]">Payment History</div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-[#63605A]">
                      <span>Payment status</span>
                      <span className="font-medium text-[#181716]">{paymentLabel[order.paymentStatus]}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#63605A]">
                      <span>Payment method</span>
                      <span className="font-medium text-[#181716] capitalize">{order.paymentMethod || 'mpesa'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#63605A]">
                      <span>Order placed</span>
                      <span className="font-medium text-[#181716]">
                        {new Date(order.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#63605A]">
                      <span>Last update</span>
                      <span className="font-medium text-[#181716]">
                        {new Date(order.updatedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#E8E5DF] bg-[#FAF9F6] p-5">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#827E77]">
                    <Truck className="h-4 w-4 text-[#8A745C]" />
                    Fulfilment
                  </div>
                  <div className="mt-4 space-y-3 text-[11px] text-[#63605A]">
                    <div className="flex items-center justify-between">
                      <span>Shipping</span>
                      <span className="font-medium text-[#181716] capitalize">{order.shippingMethod}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Courier</span>
                      <span className="font-medium text-[#181716]">
                        {order.shippingMethod === 'express' ? 'Priority Air' : 'Standard Land'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <span className="font-medium text-[#181716]">{statusLabel[order.status]}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#E8E5DF] bg-white p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#827E77]">Total</div>
                  <div className="mt-4 flex justify-between items-end">
                    <span className="font-serif text-2xl text-[#181716]">{formatPrice(order.total)}</span>
                    <span className="text-[11px] text-[#63605A]">KES</span>
                  </div>

                  <div className="mt-5 space-y-2 text-[11px] text-[#63605A]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{order.shippingCost ? formatPrice(order.shippingCost) : 'Complimentary'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT</span>
                      <span>{formatPrice(order.tax)}</span>
                    </div>
                  </div>
                </div>
              </aside>
            </section>

            <section className="mt-8 flex items-center gap-3">
              <Button type="button" variant="outline" size="md" onClick={() => navigate('/track?order=' + encodeURIComponent(order.orderNumber))} className="text-xs">
                Track this order
              </Button>
              {order.status === 'confirmed' && (
                <Button type="button" variant="primary" size="md" onClick={handleMarkReceived} className="text-xs">
                  Mark as Received
                </Button>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
