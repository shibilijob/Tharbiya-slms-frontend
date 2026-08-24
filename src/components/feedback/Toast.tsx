import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export const Toast: React.FC = () => {
  const { toastMessage, clearToast } = useNotifications();

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full bg-[#084C3A] text-white rounded-2xl p-4 shadow-xl border border-[#0F6B50] flex items-center gap-3"
        >
          <div className="p-1.5 rounded-xl bg-[#DDEDE5]/20 text-[#DDEDE5] shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm font-semibold flex-1 leading-snug">
            {toastMessage}
          </p>
          <button
            onClick={clearToast}
            className="p-1 text-[#DDEDE5]/70 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
