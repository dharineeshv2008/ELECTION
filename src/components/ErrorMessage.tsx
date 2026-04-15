'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  message: string;
  isVisible: boolean;
}

export function ErrorMessage({ message, isVisible }: ErrorMessageProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            "flex items-center gap-3 p-4 rounded-[12px] shadow-md border",
            "bg-[#ffe5e5] border-red-200 text-red-700",
            "dark:bg-[#3a1a1a] dark:border-red-900/50 dark:text-red-400"
          )}
        >
          <AlertTriangle className="shrink-0" size={20} />
          <p className="text-sm font-medium leading-tight">
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
