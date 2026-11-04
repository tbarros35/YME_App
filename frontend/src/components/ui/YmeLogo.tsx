import React from 'react';
import { cn } from '@/lib/utils';

export interface YmeLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: 'dark' | 'white';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const YmeLogo: React.FC<YmeLogoProps> = ({
  variant = 'dark',
  size = 'md',
  className,
  alt = 'YME Logo',
  ...props
}) => {
  const sizes = {
    sm: 'h-8 w-auto',
    md: 'h-11 w-auto',
    lg: 'h-20 w-auto',
    xl: 'h-28 w-auto',
    '2xl': 'h-36 w-auto',
  };

  return (
    <img
      src="/logo.png"
      alt={alt}
      className={cn(
        'object-contain inline-block shrink-0 select-none transition-all duration-200',
        sizes[size],
        variant === 'white' && 'brightness-0 invert drop-shadow-sm',
        className
      )}
      {...props}
    />
  );
};
