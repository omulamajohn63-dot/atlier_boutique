import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: 'default' | 'inline' | 'page';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an unexpected issue. Please try refreshing or attempting the action again.',
  onRetry,
  retryLabel = 'Try Again',
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-[#FDF7F7] border border-[#F5DCDC] rounded-2xl p-8 max-w-md mx-auto my-6',
    inline: 'bg-[#FDF7F7] border border-[#F5DCDC] rounded-xl p-6',
    page: 'bg-[#FAF9F6] rounded-3xl p-10 sm:p-14 max-w-lg mx-auto',
  };

  const iconStyles = {
    default: 'w-12 h-12 rounded-full bg-[#FCEBEA] flex items-center justify-center text-[#9E332B] mb-3',
    inline: 'w-10 h-10 rounded-full bg-[#FCEBEA] flex items-center justify-center text-[#9E332B] mb-2',
    page: 'w-16 h-16 rounded-full bg-[#FCEBEA] flex items-center justify-center text-[#9E332B] mb-4',
  };

  const titleStyles = {
    default: 'font-serif text-lg text-[#181716] font-medium mb-1',
    inline: 'font-serif text-base text-[#181716] font-medium mb-1',
    page: 'font-serif text-xl sm:text-2xl text-[#181716] font-medium mb-2',
  };

  const messageStyles = {
    default: 'text-xs sm:text-sm text-[#63605A] leading-relaxed mb-5',
    inline: 'text-xs text-[#63605A] leading-relaxed mb-4',
    page: 'text-sm text-[#63605A] leading-relaxed mb-6',
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${variantStyles[variant]}`}>
      <div className={iconStyles[variant]}>
        <AlertTriangle className={variant === 'page' ? 'w-7 h-7' : variant === 'inline' ? 'w-5 h-5' : 'w-5 h-5'} strokeWidth={1.5} />
      </div>
      <h4 className={titleStyles[variant]}>{title}</h4>
      <p className={messageStyles[variant]}>{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size={variant === 'page' ? 'md' : 'sm'}
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
};