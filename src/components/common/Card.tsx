import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'ivory' | 'green' | 'gold' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverEffect = false,
  className,
  ...props
}) => {
  const baseClasses = "rounded-2xl transition-all duration-200";

  const variantClasses = {
    default: "bg-white border border-[#E3EAE6] shadow-sm shadow-[#0F6B50]/5",
    ivory: "bg-[#FAF8F2] border border-[#E3EAE6]",
    green: "bg-gradient-to-br from-[#0F6B50] to-[#084C3A] text-white border border-[#084C3A] shadow-md shadow-[#0F6B50]/15",
    gold: "bg-gradient-to-br from-[#FAF8F2] to-[#FBF4DE] border border-[#C9A227]/30 text-[#1F2933]",
    flat: "bg-white border border-[#E3EAE6]"
  };

  const paddingClasses = {
    none: "",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8"
  };

  const hoverClass = hoverEffect ? "hover:border-[#bbdcd0] hover:shadow-md hover:-translate-y-0.5" : "";

  return (
    <div className={twMerge(clsx(baseClasses, variantClasses[variant], paddingClasses[padding], hoverClass, className))} {...props}>
      {children}
    </div>
  );
};
