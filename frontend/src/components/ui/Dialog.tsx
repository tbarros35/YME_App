import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Clean backdrop */}
      <div
        className="fixed inset-0 bg-[#151e33]/60 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className={cn(
          'relative w-full rounded-[32px] bg-white border border-[#151e33]/10 p-7 shadow-2xl z-10 animate-fade-in overflow-hidden max-h-[90vh] overflow-y-auto',
          maxWidths[maxWidth]
        )}
      >
        <div className="flex items-start justify-between pb-4 border-b border-[#151e33]/10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full flex-shrink-0" />
              <h2 className="text-lg font-bold text-[#151e33]">{title}</h2>
            </div>
            {description && (
              <p className="text-xs text-[#151e33]/60 mt-1 ml-3">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#151e33]/40 hover:text-[#151e33] hover:bg-[#151e33]/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
};
