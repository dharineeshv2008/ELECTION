'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="p-4 flex justify-between items-center max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
        </div>
        <span className="font-bold text-xl tracking-tight">E-VOTE</span>
      </div>
      
      <button
        onClick={toggleTheme}
        className={cn(
          "p-2 rounded-full transition-all active:scale-95 bg-gray-100 dark:bg-gray-800",
          "hover:bg-gray-200 dark:hover:bg-gray-700"
        )}
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>
    </nav>
  );
}
