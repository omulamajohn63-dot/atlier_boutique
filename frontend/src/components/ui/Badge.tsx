import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'sale' | 'new' | 'lowStock' | 'neutral' | 'success' | 'warning' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantStyles = {
    default: 'bg-[#181716] text-[#FAF9F6]',
    sale: 'bg-[#9E332B] text-[#FAF9F6]',
    new: 'bg-gradient-to-r from-[#8A745C] to-[#A6937D] text-[#FAF9F6] shadow-[0_2px_8px_-2px_rgba(138,116,92,0.4)]',
    lowStock: 'bg-[#FFF8F0] text-[#8A6024] border border-[#ECD9BD]',
    neutral: 'bg-[#EFECE6] text-[#63605A]',
    success: 'bg-[#E8EFEA] text-[#2E5A44] border border-[#C8D8CA]',
    warning: 'bg-[#FFF8F0] text-[#8A745C] border border-[#E7D8B3]',
    info: 'bg-[#EFF2FA] text-[#3A5BA0] border border-[#C8D4F0]',
    outline: 'bg-transparent text-[#181716] border border-[#E8E5DF] hover:bg-[#F3F1ED]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-0.5 text-[11px] gap-1.5',
    lg: 'px-3 py-1 text-xs gap-1.5',
  };

  const dotColors = {
    default: 'bg-[#181716]',
    sale: 'bg-[#9E332B]',
    new: 'bg-[#8A745C]',
    lowStock: 'bg-[#8A745C]',
    neutral: 'bg-[#827E77]',
    success: 'bg-[#2E5A44]',
    warning: 'bg-[#8A745C]',
    info: 'bg-[#3A5BA0]',
    outline: 'bg-[#181716]',
  };

  return (
    <span
      className={`inline-flex items-center font-medium tracking-wider uppercase whitespace-nowrap rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} aria-hidden="true" />}
      {children}
    </span>
  );
};

export interface StatusBadgeProps {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const statusConfig = {
    pending: { label: 'Pending', variant: 'warning' as const, icon: '⏳' },
    processing: { label: 'Processing', variant: 'info' as const, icon: '⚙️' },
    shipped: { label: 'Shipped', variant: 'default' as const, icon: '📦' },
    delivered: { label: 'Delivered', variant: 'success' as const, icon: '✓' },
    cancelled: { label: 'Cancelled', variant: 'neutral' as const, icon: '✕' },
    refunded: { label: 'Refunded', variant: 'neutral' as const, icon: '↩' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size="md" className={className} dot>
      {config.label}
    </Badge>
  );
};