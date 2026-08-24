import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const variantClasses = {
    primary: "bg-[#0F6B50] hover:bg-[#084C3A] text-white focus:ring-[#0F6B50] shadow-sm shadow-[#0F6B50]/20",
    secondary: "bg-[#DDEDE5] hover:bg-[#bbdcd0] text-[#084C3A] focus:ring-[#0F6B50]",
    outline: "border border-[#E3EAE6] hover:bg-[#FAF8F2] text-[#1F2933] hover:border-[#bbdcd0] focus:ring-[#0F6B50]",
    ghost: "bg-transparent hover:bg-[#DDEDE5]/50 text-[#1F2933] focus:ring-[#0F6B50]",
    gold: "bg-[#C9A227] hover:bg-[#b08d1e] text-white focus:ring-[#C9A227] shadow-sm shadow-[#C9A227]/20",
    danger: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500"
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs font-semibold gap-1.5",
    md: "px-4 py-2.5 text-sm font-semibold gap-2",
    lg: "px-6 py-3.5 text-base font-bold gap-2.5"
  };

  return (
    <button
      className={twMerge(clsx(baseClasses, variantClasses[variant], sizeClasses[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
