import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Order, OrderItem, OrderStatus, CreateOrderInput, OrderTimelineEvent } from '../types';
import { useStore } from './StoreContext';
import { api } from '../services/apiClient';
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_COST,
  EXPRESS_SHIPPING_COST,
  VAT_RATE,
} from '../utils/currency';

const ORDERS_STORAGE_KEY = 'atelier_orders_v3_kes';

const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: 'ord-demo-001',
    orderNumber: 'ATL-KES-849201',
    customer: {
      firstName: 'Elena',
      lastName: 'Wambui',
      email: 'elena.wambui@atelier.com',
      phone: '+254 (0) 712 345 678',
      addressLine1: '14 Riverside Drive, Westlands',
      addressLine2: 'Apartment 4B',
      city: 'Nairobi',
      stateOrProvince: 'Nairobi County',
      postalCode: '00100',
      country: 'Kenya',
    },
    items: [
      {
        id: 'ord-item-1',
        productId: 'prod-1',
        variantId: 'v-1-s',
        productName: 'The Drape Silk Midi Dress',
        variantDetails: 'Size S / Oatmeal',
        sku: 'DRP-OAT-S',
        unitPrice: 24500,
        quantity: 1,
        subtotal: 24500,
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop',
      },
    ],
    subtotal: 24500,
    shippingMethod: 'express',
    shippingCost: 1500,
    tax: 3920,
    total: 29920,
    status: 'processing',
    paymentStatus: 'paid',
    notes: 'Please pack with atelier silk garment bag.',
    timeline: [
      {
        status: 'confirmed',
        title: 'Order Confirmed & Authorized',
        description: 'Payment verified and transaction recorded.',
        timestamp: '2026-09-05T09:30:00Z',
        completed: true,
      },
      {
        status: 'processing',
        title: 'Atelier Preparation & Steaming',
        description: 'Garment passed artisan stitch check and hand-packaged with lavender sachet.',
        timestamp: '2026-09-05T14:15:00Z',
        completed: true,
      },
      {
        status: 'shipped',
        title: 'Express Dispatch',
        description: 'Handed to courier for carbon-neutral express transit.',
        timestamp: '2026-09-06T08:00:00Z',
        completed: false,
      },
      {
        status: 'delivered',
        title: 'Delivery & Signature',
        description: 'Signed delivery at designated residence.',
        timestamp: '',
        completed: false,
      },
    ],
    createdAt: '2026-09-05T09:30:00Z',
    updatedAt: '2026-09-05T14:15:00Z',
  },
];

export interface OrdersContextType {
  orders: Order[];
  createOrder: (input: CreateOrderInput) => Promise<{ success: boolean; order?: Order; error?: string }>;
  getOrder: (orderNumberOrId: string) => Order | undefined;
  updateOrderStatus: (orderNumber: string, status: OrderStatus) => void;
  cancelOrder: (orderNumber: string) => { success: boolean; message: string };
  receiveOrder: (orderNumber: string) => { success: boolean; message: string };
  searchOrders: (query: string) => Order[];
  resetOrdersToDefault: () => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { checkBatchStock, deductInventoryForOrder, restockInventoryForOrder, validatePromoCode } = useStore();

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_DEMO_ORDERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  const getOrder = useCallback(
    (orderNumberOrId: string): Order | undefined => {
      const query = orderNumberOrId.trim().toUpperCase();
      return orders.find(
        (o) => o.orderNumber.toUpperCase() === query || o.id.toUpperCase() === query
      );
    },
    [orders]
  );

  const createOrder = useCallback(
    async (input: CreateOrderInput): Promise<{ success: boolean; order?: Order; error?: string }> => {
      if (!input.items || input.items.length === 0) {
        return { success: false, error: 'Your cart is empty.' };
      }

      // Try authoritative backend order placement via /api/orders
      try {
        const serverOrder = await api.createOrder({
          customer: {
            fullName: `${input.customer.firstName} ${input.customer.lastName}`.trim(),
            email: input.customer.email,
            phone: input.customer.phone,
            addressLine1: input.customer.addressLine1,
            addressLine2: input.customer.addressLine2,
            city: input.customer.city,
            county: input.customer.stateOrProvince || 'Nairobi',
            postalCode: input.customer.postalCode,
            deliveryInstructions: input.notes,
          },
          shippingMethod: input.shippingMethod,
          paymentMethod: input.paymentMethod || 'mpesa',
          notes: input.notes,
        });

        const now = new Date().toISOString();
        const mappedOrder: Order = {
          id: serverOrder.id,
          orderNumber: serverOrder.orderNumber,
          customer: input.customer,
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
          status: serverOrder.status === 'cancelled' ? 'cancelled' : 'confirmed',
          paymentStatus: serverOrder.paymentStatus,
          paymentMethod: serverOrder.paymentMethod,
          notes: input.notes,
          timeline: [
            {
              status: 'confirmed',
              title: 'Order Authorized & Received',
              description: 'Order created with authoritative server inventory decrement.',
              timestamp: now,
              completed: true,
            },
            {
              status: 'processing',
              title: 'Atelier Preparation & Finishing',
              description: 'Garments queued for fine inspection and tissue wrapping.',
              timestamp: now,
              completed: true,
            },
            {
              status: 'shipped',
              title: 'Courier Dispatch',
              description: 'Scheduled for courier collection.',
              timestamp: '',
              completed: false,
            },
            {
              status: 'delivered',
              title: 'Handover & Signature',
              description: 'Delivery at client destination.',
              timestamp: '',
              completed: false,
            },
          ],
          createdAt: serverOrder.createdAt,
          updatedAt: serverOrder.updatedAt,
        };

        setOrders((prev) => [mappedOrder, ...prev]);
        return { success: true, order: mappedOrder };
      } catch (backendErr: unknown) {
        const errorObj = backendErr as Error & { code?: string };
        // If the server rejected due to stock conflict, report authoritative message
        if (
          errorObj.code === 'INSUFFICIENT_STOCK' ||
          errorObj.message?.toLowerCase().includes('stock')
        ) {
          return { success: false, error: errorObj.message };
        }

        // Local fallback if offline or local preview
        const stockCheck = checkBatchStock(input.items);
        if (!stockCheck.available) {
          return {
            success: false,
            error: stockCheck.errors[0] || 'One or more items exceed current atelier inventory.',
          };
        }

        const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let orderDiscount = undefined;
        let discountAmount = 0;
        if (input.discountCode) {
          const promo = validatePromoCode(input.discountCode, subtotal);
          if (promo.valid && promo.discount) {
            discountAmount = promo.discountAmount;
            orderDiscount = {
              code: promo.discount.code,
              type: promo.discount.type,
              amount: discountAmount,
              description: promo.discount.description,
            };
          }
        }

        const standardCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
        const shippingCost = input.shippingMethod === 'express' ? EXPRESS_SHIPPING_COST : standardCost;
        const taxableSubtotal = Math.max(0, subtotal - discountAmount);
        const tax = Math.round(taxableSubtotal * VAT_RATE);
        const grandTotal = taxableSubtotal + shippingCost + tax;

        const randomSuffix = Math.floor(100000 + Math.random() * 900000);
        const orderNumber = `ATL-KES-${randomSuffix}`;
        const orderId = `ord-${Date.now()}`;
        const now = new Date().toISOString();

        const orderItems: OrderItem[] = input.items.map((ci) => ({
          id: `oi-${Date.now()}-${ci.variantId}`,
          productId: ci.productId,
          variantId: ci.variantId,
          productName: ci.name,
          variantDetails: `Size ${ci.size} / ${ci.color}`,
          sku: `${ci.productId.toUpperCase()}-${ci.size}`,
          unitPrice: ci.price,
          quantity: ci.quantity,
          subtotal: ci.price * ci.quantity,
          image: ci.image,
        }));

        const newOrder: Order = {
          id: orderId,
          orderNumber,
          customer: input.customer,
          items: orderItems,
          subtotal,
          discount: orderDiscount,
          shippingMethod: input.shippingMethod,
          shippingCost,
          tax,
          total: grandTotal,
          status: 'processing',
          paymentStatus: 'paid',
          notes: input.notes,
          timeline: [
            {
              status: 'confirmed',
              title: 'Order Authorized & Received',
              description: 'Payment verified and registered in atelier ledger.',
              timestamp: now,
              completed: true,
            },
            {
              status: 'processing',
              title: 'Atelier Preparation & Finishing',
              description: 'Garments queued for fine inspection and tissue wrapping.',
              timestamp: now,
              completed: true,
            },
            {
              status: 'shipped',
              title: 'Courier Dispatch',
              description: 'Scheduled for courier collection.',
              timestamp: '',
              completed: false,
            },
            {
              status: 'delivered',
              title: 'Handover & Signature',
              description: 'Delivery at client destination.',
              timestamp: '',
              completed: false,
            },
          ],
          createdAt: now,
          updatedAt: now,
        };

        deductInventoryForOrder(
          input.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          orderNumber
        );

        setOrders((prev) => [newOrder, ...prev]);
        return { success: true, order: newOrder };
      }
    },
    [checkBatchStock, deductInventoryForOrder, validatePromoCode]
  );

  const updateOrderStatus = useCallback(
    (orderNumber: string, status: OrderStatus) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.orderNumber.toUpperCase() !== orderNumber.toUpperCase()) return o;

          const now = new Date().toISOString();
          const updatedTimeline = o.timeline.map((step) => {
            if (step.status === status) {
              return { ...step, completed: true, timestamp: now };
            }
            return step;
          });

          return {
            ...o,
            status,
            timeline: updatedTimeline,
            updatedAt: now,
          };
        })
      );
    },
    []
  );

  const cancelOrder = useCallback(
    (orderNumber: string): { success: boolean; message: string } => {
      const order = orders.find((o) => o.orderNumber.toUpperCase() === orderNumber.toUpperCase());
      if (!order) {
        return { success: false, message: 'Order not found.' };
      }
      if (order.status === 'cancelled') {
        return { success: false, message: 'Order is already cancelled.' };
      }
      if (order.status === 'shipped' || order.status === 'delivered') {
        return {
          success: false,
          message: 'Order has already dispatched and cannot be cancelled automatically. Contact support.',
        };
      }

      // Restock inventory
      restockInventoryForOrder(
        order.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          sku: i.sku,
        })),
        orderNumber
      );

      const now = new Date().toISOString();
      setOrders((prev) =>
        prev.map((o) => {
          if (o.orderNumber !== order.orderNumber) return o;
          return {
            ...o,
            status: 'cancelled',
            paymentStatus: 'refunded',
            updatedAt: now,
            timeline: [
              ...o.timeline,
              {
                status: 'cancelled',
                title: 'Order Cancelled & Restocked',
                description: 'Client requested cancellation. Atelier inventory restocked.',
                timestamp: now,
                completed: true,
              },
            ],
          };
        })
      );

      return { success: true, message: `Order ${orderNumber} has been cancelled and restocked.` };
    },
    [orders, restockInventoryForOrder]
  );

  const receiveOrder = useCallback(
    (orderNumber: string): { success: boolean; message: string } => {
      const order = orders.find((o) => o.orderNumber.toUpperCase() === orderNumber.toUpperCase());
      if (!order) {
        return { success: false, message: 'Order not found.' };
      }
      if (order.status === 'received') {
        return { success: false, message: 'Order is already marked as received.' };
      }
      if (order.status !== 'delivered') {
        return { success: false, message: 'Only delivered orders can be marked as received.' };
      }

      const now = new Date().toISOString();
      setOrders((prev) =>
        prev.map((o) => {
          if (o.orderNumber !== order.orderNumber) return o;
          return {
            ...o,
            status: 'received',
            updatedAt: now,
            timeline: [
              ...o.timeline,
              {
                status: 'received',
                title: 'Order Received',
                description: 'Customer confirmed receipt of their order.',
                timestamp: now,
                completed: true,
              },
            ],
          };
        })
      );

      return { success: true, message: `Order ${orderNumber} has been marked as received.` };
    },
    [orders]
  );

  const searchOrders = useCallback(
    (query: string): Order[] => {
      const q = query.trim().toLowerCase();
      if (!q) return orders;
      return orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q) ||
          `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase().includes(q) ||
          o.customer.phone.toLowerCase().includes(q)
      );
    },
    [orders]
  );

  const resetOrdersToDefault = useCallback(() => {
    setOrders(INITIAL_DEMO_ORDERS);
    try {
      localStorage.removeItem(ORDERS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <OrdersContext.Provider
      value={{
        orders,
        createOrder,
        getOrder,
        updateOrderStatus,
        cancelOrder,
        receiveOrder,
        searchOrders,
        resetOrdersToDefault,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = (): OrdersContextType => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};
