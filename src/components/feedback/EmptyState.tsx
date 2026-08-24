import React from 'react';
import { Button } from '../common/Button';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-[#FAF8F2]/60 border border-dashed border-[#E3EAE6]">
      <div className="w-14 h-14 rounded-2xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center mb-4">
        {icon || <FolderOpen className="w-7 h-7" />}
      </div>
      <h4 className="text-base font-bold text-[#1F2933] mb-1">{title}</h4>
      {description && (
        <p className="text-xs sm:text-sm text-[#667085] max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
