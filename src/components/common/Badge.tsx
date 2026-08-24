import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'dark' | 'gold' | 'gray' | 'red' | 'amber' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'green',
  size = 'md',
  dot = false,
  className,
  ...props
}) => {
  const baseClasses = "inline-flex items-center font-medium rounded-full shrink-0";

  const variantClasses = {
    green: "bg-[#DDEDE5] text-[#084C3A] border border-[#bbdcd0]",
    dark: "bg-[#084C3A] text-white",
    gold: "bg-[#FBF4DE] text-[#9A7B1C] border border-[#C9A227]/30",
    gray: "bg-[#FAF8F2] text-[#667085] border border-[#E3EAE6]",
    red: "bg-rose-50 text-rose-700 border border-rose-200",
    amber: "bg-amber-50 text-amber-800 border border-amber-200",
    blue: "bg-blue-50 text-blue-800 border border-blue-200"
  };

  const dotClasses = {
    green: "bg-[#0F6B50]",
    dark: "bg-[#DDEDE5]",
    gold: "bg-[#C9A227]",
    gray: "bg-gray-400",
    red: "bg-rose-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500"
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    lg: "px-3 py-1.5 text-sm font-semibold gap-2"
  };

  return (
    <span className={twMerge(clsx(baseClasses, variantClasses[variant], sizeClasses[size], className))} {...props}>
      {dot && <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", dotClasses[variant])} />}
      {children}
    </span>
  );
};
