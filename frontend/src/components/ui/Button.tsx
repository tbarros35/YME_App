import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] select-none';

    const variants = {
      primary:
        'bg-[#151e33] hover:bg-[#212d4a] text-white focus:ring-[#151e33] shadow-clean-sm hover:shadow-clean-md',
      accent:
        'bg-[#ff6ef6] hover:bg-[#f555ea] text-[#151e33] font-bold focus:ring-[#ff6ef6] shadow-clean-sm hover:shadow-pink-subtle',
      secondary:
        'bg-slate-100 hover:bg-slate-200 text-[#151e33] focus:ring-slate-400',
      outline:
        'border border-slate-300 hover:border-[#151e33] bg-white hover:bg-slate-50 text-[#151e33] focus:ring-[#151e33]',
      danger:
        'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 focus:ring-rose-500',
      success:
        'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 focus:ring-emerald-500',
      ghost:
        'text-slate-600 hover:text-[#151e33] hover:bg-slate-100 focus:ring-slate-300',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-xs gap-2',
      lg: 'h-12 px-6 text-sm gap-2.5',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>A carregar...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
