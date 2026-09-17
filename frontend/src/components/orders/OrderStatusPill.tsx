import React from 'react';
import { OrderStatus } from '../../types';
import { ORDER_STATUS_META } from '../../utils/orderStatus';

export interface OrderStatusDotProps {
  status: OrderStatus;
  className?: string;
}

/**
 * Decorative status dot. The visible label text always accompanies it so that
 * status is never communicated by colour alone.
 */
export const OrderStatusDot: React.FC<OrderStatusDotProps> = ({ status, className = '' }) => (
  <span
    aria-hidden="true"
    className={`inline-block h-2 w-2 shrink-0 rounded-full ${ORDER_STATUS_META[status].dotClass} ${className}`}
  />
);

export interface OrderStatusPillProps {
  status: OrderStatus;
  className?: string;
}

export const OrderStatusPill: React.FC<OrderStatusPillProps> = ({ status, className = '' }) => {
  const meta = ORDER_STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-[#E8E5DF] bg-white px-3 py-1 shadow-xs ${className}`}
    >
      <span className="sr-only">Order status:</span>
      <OrderStatusDot status={status} />
      <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-[11px] ${meta.pillTextClass}`}>
        {meta.label}
      </span>
    </span>
  );
};