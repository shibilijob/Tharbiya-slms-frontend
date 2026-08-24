import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-[#1F2933] uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#667085]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                "w-full rounded-xl border border-[#E3EAE6] bg-white px-3.5 py-2.5 text-sm text-[#1F2933] placeholder:text-[#667085]/60 focus:border-[#0F6B50] focus:ring-2 focus:ring-[#0F6B50]/15 outline-none transition-all duration-200",
                leftIcon && "pl-10",
                rightIcon && "pr-10",
                error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15",
                className
              )
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#667085]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-[#667085]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
