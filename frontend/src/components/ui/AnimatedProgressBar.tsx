import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedProgressBarProps {
  percentage: number;
  className?: string;
  barClassName?: string;
  durationMs?: number;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  percentage,
  className = 'h-1.5 bg-[#151e33]/10 rounded-full overflow-hidden',
  barClassName = 'bg-gradient-to-r from-[#151e33] to-[#ff63f6] h-full rounded-full',
  durationMs = 900,
}) => {
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    // Slight delay to trigger CSS transition smoothly after mounting
    const timer = setTimeout(() => {
      setWidth(Math.min(Math.max(percentage, 0), 100));
    }, 80);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className={className}>
      <div
        className={cn(barClassName, 'transition-all ease-out')}
        style={{
          width: `${width}%`,
          transitionDuration: `${durationMs}ms`,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  );
};
