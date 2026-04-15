'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ErrorMessage } from '@/components/ErrorMessage';
import { validateRegNo, getDeviceId, hasVotedLocally } from '@/lib/validation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ShieldCheck, Info, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const [regNo, setRegNo] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [shake, setShake] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hidden admin trigger
  const handleBottomTap = () => {
    setTapCount(prev => {
      const newCount = prev + 1;
      if (newCount === 5) {
        router.push('/admin');
        return 0;
      }
      return newCount;
    });
    // Reset tap count after delay
    setTimeout(() => setTapCount(0), 3000);
  };

  useEffect(() => {
    setMounted(true);
    if (hasVotedLocally()) {
      setHasVoted(true);
      setError('You have already voted from this device.');
    }
  }, []);

  // Auto clear error when valid format is entered
  useEffect(() => {
    if (error && validateRegNo(regNo.toUpperCase().trim()) && !hasVoted) {
      setError('');
    }
  }, [regNo, error, hasVoted]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasVoted) return;
    
    setError('');
    
    const formattedRegNo = regNo.toUpperCase().trim();
    if (!validateRegNo(formattedRegNo)) {
      setError('Invalid Register Number format. Example: 927625BEC000');
      triggerShake();
      return;
    }

    setIsLoading(true);
    try {
      // 1. Check if user already exists
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('reg_no', formattedRegNo)
        .single();

      if (user) {
        if (user.has_voted) {
          setError('This registration number has already been used to vote.');
          triggerShake();
          setIsLoading(false);
          return;
        }
      }

      // 2. Check if device_id already voted (server-side)
      const deviceId = getDeviceId();
      const { data: deviceUser } = await supabase
        .from('users')
        .select('*')
        .eq('device_id', deviceId)
        .single();

      if (deviceUser && deviceUser.has_voted) {
        setError('This device has already recorded a vote.');
        triggerShake();
        setIsLoading(false);
        return;
      }

      // 3. User is valid, store locally and proceed
      sessionStorage.setItem('temp_reg_no', formattedRegNo);
      router.push('/vote');
    } catch (err) {
      console.error(err);
      setError('Database connection error. Please try again.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // Guard hydration-sensitive props
  const isInputDisabled = isLoading || (mounted && hasVoted);
  const isButtonDisabled = isLoading || !regNo || (mounted && hasVoted);

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-transparent to-blue-50/50 dark:to-blue-950/20">
      <Navbar />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 border border-blue-200 dark:border-blue-800">
            <ShieldCheck className="text-blue-600 dark:text-blue-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-center">Student Authentication</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
            Enter your college register number to verify eligibility.
          </p>
        </div>

        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Register Number
                <Info size={14} className="text-blue-500" />
              </label>
              <input
                type="text"
                placeholder="e.g. 927625BEC000"
                className={cn(
                  "input-field text-lg uppercase font-mono tracking-wider",
                  error ? "border-red-500 focus:border-red-500" : ""
                )}
                value={regNo}
                onChange={(e) => {
                  setRegNo(e.target.value);
                  if (error && !hasVoted) setError('');
                }}
                disabled={isInputDisabled}
              />
            </div>

            <ErrorMessage message={error} isVisible={!!error} />

            <button
              type="submit"
              disabled={isButtonDisabled}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Verify Identity
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
            Security Notice
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            One device per vote. Your device ID is logged for transparency. 
            All attempts to double-vote are automatically blocked.
          </p>
        </div>
      </motion.div>

      {/* Hidden admin trigger area */}
      <div 
        onClick={handleBottomTap}
        className="fixed bottom-0 left-0 w-full h-12 cursor-default z-50 select-none"
        aria-hidden="true"
      />
    </main>
  );
}
