import React from 'react';
import { Card } from './Card';
import { clsx } from 'clsx';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'green' | 'gold' | 'ivory';
  trend?: {
    value: string;
    positive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  icon,
  variant = 'default',
  trend,
  onClick
}) => {
  return (
    <Card
      variant={variant === 'green' ? 'green' : (variant === 'gold' ? 'gold' : 'default')}
      padding="md"
      hoverEffect={!!onClick}
      className={clsx("relative overflow-hidden", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={clsx("text-xs font-bold uppercase tracking-wider", variant === 'green' ? "text-[#DDEDE5]" : "text-[#667085]")}>
            {label}
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={clsx("text-2xl sm:text-3xl font-extrabold tracking-tight", variant === 'green' ? "text-white" : "text-[#1F2933]")}>
              {value}
            </span>
            {trend && (
              <span
                className={clsx(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  trend.positive
                    ? (variant === 'green' ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700")
                    : "bg-rose-50 text-rose-700"
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
          {sublabel && (
            <p className={clsx("text-xs mt-1.5", variant === 'green' ? "text-[#DDEDE5]/90" : "text-[#667085]")}>
              {sublabel}
            </p>
          )}
        </div>

        {icon && (
          <div
            className={clsx(
              "p-2.5 sm:p-3 rounded-2xl flex items-center justify-center shrink-0",
              variant === 'green'
                ? "bg-white/10 text-[#FAF8F2]"
                : (variant === 'gold' ? "bg-[#C9A227]/15 text-[#9A7B1C]" : "bg-[#DDEDE5] text-[#0F6B50]")
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
