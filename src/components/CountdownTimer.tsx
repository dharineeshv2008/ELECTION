'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEADLINE, isDeadlinePassed } from '@/lib/validation';

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = DEADLINE.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) return null; // Don't render until client-side hydration

  const isEndingSoon = timeLeft.days === 0 && timeLeft.hours < 24;
  const passed = isDeadlinePassed();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border-l-4",
        passed ? "border-red-500 bg-red-50/50 dark:bg-red-900/10" : 
        isEndingSoon ? "border-orange-500 bg-orange-50/50 dark:bg-orange-900/10" : 
        "border-blue-500"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          passed ? "bg-red-100 text-red-600 dark:bg-red-900/30" : 
          isEndingSoon ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30" : 
          "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
        )}>
          <Clock size={20} />
        </div>
        <div>
          <h3 className="font-bold">
            {passed ? "Polling Ended" : "Polling Deadline"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {DEADLINE.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at Midnight
          </p>
        </div>
      </div>

      <div className="flex gap-2 text-center">
        {[
          { label: 'Days', value: timeLeft.days },
          { label: 'Hours', value: timeLeft.hours },
          { label: 'Mins', value: timeLeft.minutes },
          { label: 'Secs', value: timeLeft.seconds }
        ].map((unit, i) => (
          <div key={unit.label} className="flex flex-col">
            <div className={cn(
              "w-12 h-14 md:w-14 md:h-16 flex items-center justify-center rounded-lg font-mono text-xl font-bold border",
              passed ? "bg-red-100/50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800" :
              isEndingSoon ? "bg-orange-100/50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800" :
              "bg-white/50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700"
            )}>
              {unit.value.toString().padStart(2, '0')}
            </div>
            <span className="text-[10px] uppercase font-bold text-gray-500 mt-1">{unit.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
