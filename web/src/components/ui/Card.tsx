import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Card({ children, hover = false, padding = 'md', className, ...props }: CardProps) {
  const padMap = { sm: 'p-4', md: 'p-5', lg: 'p-6' };

  return (
    <div
      className={cn(
        'card-panel',
        hover && 'card-panel-hover cursor-pointer',
        padMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
