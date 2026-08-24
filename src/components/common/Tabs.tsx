import React from 'react';
import { clsx } from 'clsx';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline';
  fullWidth?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  fullWidth = false
}) => {
  return (
    <div className={clsx("flex overflow-x-auto no-scrollbar", variant === 'underline' ? "border-b border-[#E3EAE6] gap-6" : "bg-[#DDEDE5]/40 p-1.5 rounded-2xl gap-1")}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        
        if (variant === 'underline') {
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                "pb-3 text-sm font-semibold whitespace-nowrap transition-all duration-150 relative flex items-center gap-2",
                isActive ? "text-[#0F6B50]" : "text-[#667085] hover:text-[#1F2933]"
              )}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={clsx("px-2 py-0.5 text-xs rounded-full", isActive ? "bg-[#DDEDE5] text-[#084C3A]" : "bg-gray-100 text-gray-600")}>
                  {tab.count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F6B50] rounded-full" />
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 flex items-center justify-center gap-2",
              fullWidth && "flex-1",
              isActive
                ? "bg-white text-[#084C3A] shadow-sm shadow-black/5"
                : "text-[#667085] hover:text-[#1F2933] hover:bg-white/40"
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={clsx("px-1.5 py-0.5 text-xs rounded-full font-bold", isActive ? "bg-[#DDEDE5] text-[#084C3A]" : "bg-black/5 text-[#667085]")}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
