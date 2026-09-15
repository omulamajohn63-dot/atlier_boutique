import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col animate-pulse space-y-3.5">
      {/* Aspect Ratio 3:4 portrait skeleton */}
      <div className="w-full aspect-[3/4] skeleton rounded-xl" />
      <div className="space-y-2">
        <div className="h-2.5 skeleton rounded w-1/3" />
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/4" />
        <div className="h-10 skeleton rounded-full w-3/4 mt-2" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start animate-pulse">
      <div className="lg:col-span-7 space-y-4">
        <div className="aspect-[3/4] w-full rounded-2xl skeleton" />
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-20 h-24 rounded-xl skeleton shrink-0" />
          ))}
        </div>
      </div>
      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
        <div className="space-y-2 border-b border-[#E8E5DF] pb-5">
          <div className="h-3 skeleton rounded w-1/3" />
          <div className="h-8 skeleton rounded w-3/4" />
          <div className="h-3 skeleton rounded w-1/2" />
          <div className="flex items-baseline gap-3 pt-2">
            <div className="h-8 skeleton rounded w-24" />
            <div className="h-5 skeleton rounded w-16" />
          </div>
        </div>
        <div>
          <div className="h-3 skeleton rounded w-1/4 mb-2" />
          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 skeleton rounded-full px-3" />
            ))}
          </div>
        </div>
        <div>
          <div className="h-3 skeleton rounded w-1/4 mb-2" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-11 skeleton rounded-xl" />
            ))}
          </div>
        </div>
        <div className="pt-2 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 skeleton rounded-full w-24 flex-1" />
            <div className="h-12 skeleton rounded-full flex-1" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 py-4 border-y border-[#E8E5DF]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-1 p-3 skeleton rounded-xl" />
          ))}
        </div>
        <div className="space-y-2 text-xs">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-[#E8E5DF] rounded-xl overflow-hidden bg-[#FFFFFF]">
              <div className="h-12 skeleton rounded-t-xl" />
              <div className="p-4 pt-0 space-y-2 skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const LoadingSpinner: React.FC<{ label?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  label = 'Loading...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#63605A]">
      <svg
        className={`animate-spin text-[#181716] ${sizeClasses[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-xs uppercase tracking-widest font-medium text-[#827E77]">{label}</span>
    </div>
  );
};

export const InlineLoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; color?: string }> = ({
  size = 'md',
  color = '#181716',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]}`}
      style={{ color }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
};

export const PageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#FAF9F6]">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" label="Loading Atelier..." />
        <div className="w-48 h-1 bg-[#EFECE6] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#8A745C] to-[#A6937D] animate-shimmer" />
        </div>
      </div>
    </div>
  );
};