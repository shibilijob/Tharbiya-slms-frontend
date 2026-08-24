import React from 'react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading...',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div
        className={`${sizeClasses[size]} rounded-full border-[#DDEDE5] border-t-[#0F6B50] animate-spin mb-3`}
      />
      {label && <p className="text-xs sm:text-sm font-medium text-[#667085]">{label}</p>}
    </div>
  );
};
