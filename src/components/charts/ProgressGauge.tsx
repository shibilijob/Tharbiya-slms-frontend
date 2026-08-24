import React from 'react';
import { clsx } from 'clsx';

interface ProgressGaugeProps {
  score: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  variant?: 'green' | 'gold' | 'dark';
  showPercentage?: boolean;
}

export const ProgressGauge: React.FC<ProgressGaugeProps> = ({
  score,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  variant = 'green',
  showPercentage = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const colorMap = {
    green: {
      stroke: '#0F6B50',
      track: '#DDEDE5',
      text: '#084C3A'
    },
    gold: {
      stroke: '#C9A227',
      track: '#FBF4DE',
      text: '#9A7B1C'
    },
    dark: {
      stroke: '#084C3A',
      track: '#DDEDE5',
      text: '#084C3A'
    }
  };

  const colors = colorMap[variant];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.track}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {showPercentage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: colors.text }}>
              {normalizedScore}%
            </span>
          </div>
        )}
      </div>

      {label && (
        <span className={clsx("text-xs font-bold uppercase tracking-wider mt-2.5", variant === 'gold' ? "text-[#9A7B1C]" : "text-[#1F2933]")}>
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-xs text-[#667085] mt-0.5">
          {sublabel}
        </span>
      )}
    </div>
  );
};
