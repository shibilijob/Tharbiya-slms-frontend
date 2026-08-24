import React from 'react';
import logoImg from '../../assets/logo.png';
import { clsx } from 'clsx';

export interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  textDark?: boolean;
  title?: string;
  subtitle?: string;
  greenCircle?: boolean;
  statusDot?: boolean;
}

const sizeMap = {
  xs: 'w-7 h-7',
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
  '2xl': 'w-28 h-28',
};

const titleSizeMap = {
  xs: 'text-sm font-bold',
  sm: 'text-base font-extrabold',
  md: 'text-xl font-extrabold',
  lg: 'text-2xl font-black',
  xl: 'text-3xl font-black',
  '2xl': 'text-4xl font-black',
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  imageClassName = '',
  showText = false,
  textDark = true,
  title = 'Tharbiyah',
  subtitle = 'Darunnajath Mundambra',
  greenCircle = false,
  statusDot = false,
}) => {
  return (
    <div className={clsx('inline-flex items-center gap-3', className)}>
      <div
        className={clsx(
          'relative rounded-full bg-white shadow-sm flex items-center justify-center p-0.5 shrink-0 overflow-visible group-hover:scale-105 transition-all',
          greenCircle
            ? 'ring-2 ring-[#0F6B50] ring-offset-2 border-2 border-[#0F6B50] shadow-md shadow-[#0F6B50]/20'
            : 'border border-[#E3EAE6]',
          sizeMap[size],
          imageClassName
        )}
      >
        <img
          src={logoImg}
          alt="Darunnajath Madrasa Mundambra Logo"
          className="w-full h-full object-contain rounded-full"
          loading="eager"
        />

        {statusDot && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#0F6B50] border-2 border-white rounded-full shadow-xs" />
        )}
      </div>

      {showText && (
        <div className="flex flex-col justify-center">
          <span
            className={clsx(
              'tracking-tight leading-none',
              titleSizeMap[size],
              textDark ? 'text-[#0F6B50]' : 'text-white'
            )}
          >
            {title}
          </span>
          {subtitle && (
            <span
              className={clsx(
                'text-[11px] font-semibold tracking-wide block mt-1 leading-tight',
                textDark ? 'text-[#667085]' : 'text-[#DDEDE5]'
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
