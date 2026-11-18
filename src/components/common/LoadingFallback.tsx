import React from 'react';

/**
 * Clean Tharbiyah green loading indicator for route outlets within application layouts.
 * Keeps the existing sidebar/navbar shell intact while loading child page chunks.
 */
export const PageLoadingFallback: React.FC<{ label?: string }> = ({
  label = 'Loading module...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center min-h-[360px] p-8 text-center"
    >
      <div className="relative w-10 h-10 mb-3">
        <div className="w-10 h-10 rounded-full border-3 border-[#DDEDE5] border-t-[#0F6B50] animate-spin" />
      </div>
      <p className="text-xs sm:text-sm font-bold text-[#1F2933]">{label}</p>
      <p className="text-[11px] text-[#667085] mt-0.5">Please wait while the page is prepared</p>
    </div>
  );
};

/**
 * Full-screen fallback for public routes (e.g. initial Landing page, Login page transitions).
 */
export const FullPageLoadingFallback: React.FC<{ message?: string }> = ({
  message = 'Loading Tharbiyah SLMS...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-[#FAF8F2] flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="relative w-12 h-12 mb-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#DDEDE5] border-t-[#0F6B50] animate-spin" />
      </div>
      <h2 className="text-sm sm:text-base font-extrabold text-[#1F2933] tracking-tight">
        Tharbiyah SLMS
      </h2>
      <p className="text-xs text-[#667085] mt-1">{message}</p>
    </div>
  );
};

/**
 * Lightweight fallback for deferred modals, drawers, or widgets.
 */
export const ComponentLoadingFallback: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center p-8 min-h-[140px]"
    >
      <div className="w-6 h-6 rounded-full border-2 border-[#DDEDE5] border-t-[#0F6B50] animate-spin" />
    </div>
  );
};
