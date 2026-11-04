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
      'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] select-none';

    const variants = {
      primary:
        'bg-[#151e33] hover:bg-[#1e2a47] text-white focus:ring-[#151e33] shadow-clean-sm hover:shadow-clean-md',
      accent:
        'bg-[#ff63f6] hover:bg-[#ff2ef3] text-[#151e33] focus:ring-[#ff63f6] shadow-stitch-subtle hover:shadow-stitch-glow',
      secondary:
        'bg-[#151e33]/5 hover:bg-[#151e33]/10 text-[#151e33] focus:ring-[#151e33]',
      outline:
        'border border-[#151e33]/20 hover:border-[#ff63f6] bg-white hover:bg-[#fff0fe]/40 text-[#151e33] hover:text-[#151e33] focus:ring-[#ff63f6]',
      danger:
        'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 focus:ring-rose-500',
      success:
        'bg-[#151e33] hover:bg-[#1e2a47] text-[#ff63f6] border border-[#ff63f6]/40 focus:ring-[#ff63f6]',
      ghost:
        'text-[#151e33]/70 hover:text-[#151e33] hover:bg-[#151e33]/5 focus:ring-[#151e33]',
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
