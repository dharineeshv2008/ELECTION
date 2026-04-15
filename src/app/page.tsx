'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ErrorMessage } from '@/components/ErrorMessage';
import { AdminLoginModal } from '@/components/AdminLoginModal';
import { validateEmail, getDeviceId, hasVotedLocally } from '@/lib/validation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, ChevronRight, Lock } from 'lucide-react';
import { cn, maskEmail } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [shake, setShake] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Hidden admin trigger via 5 taps
  const handleBottomTap = () => {
    setTapCount(prev => {
      const newCount = prev + 1;
      if (newCount === 5) {
        setIsAdminModalOpen(true);
        return 0;
      }
      return newCount;
    });
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
    if (error && validateEmail(email.toLowerCase().trim()) && !hasVoted) {
      setError('');
    }
  }, [email, error, hasVoted]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasVoted) return;
    
    setError('');
    const formattedEmail = email.toLowerCase().trim();
    
    if (!validateEmail(formattedEmail)) {
      setError('Please enter a valid email address. Example: voter@school.com');
      triggerShake();
      return;
    }

    setIsLoading(true);
    try {
      // 1. Check if email already voted
      const { data: userByEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', formattedEmail)
        .single();

      if (userByEmail && userByEmail.has_voted) {
        setError(`The email ${maskEmail(formattedEmail)} has already cast a vote.`);
        triggerShake();
        setIsLoading(false);
        return;
      }

      // 2. Strong device detection: Check if device_id already voted
      const deviceId = getDeviceId();
      const { data: userByDevice } = await supabase
        .from('users')
        .select('*')
        .eq('device_id', deviceId)
        .eq('has_voted', true)
        .single();

      if (userByDevice) {
        setError('This device has already recorded a vote. Multiple accounts from one device are blocked to ensure fairness.');
        triggerShake();
        setIsLoading(false);
        return;
      }

      // 3. Identification successful, proceed to vote room
      sessionStorage.setItem('temp_email', formattedEmail);
      router.push('/vote');
    } catch (err) {
      console.error(err);
      setError('Connection error. Please check your internet and try again.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const isInputDisabled = isLoading || (mounted && hasVoted);
  const isButtonDisabled = isLoading || !email || (mounted && hasVoted);

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-transparent to-blue-50/50 dark:to-blue-950/20">
      <Navbar />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 border border-blue-200 dark:border-blue-800">
            <ShieldCheck className="text-blue-600 dark:text-blue-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-center">Identity Verification</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
            Enter your email to verify eligibility and securely record your vote.
          </p>
        </div>

        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Email Address
                <Mail size={14} className="text-blue-500" />
              </label>
              <input
                type="email"
                placeholder="e.g. johndoe@school.edu"
                className={cn(
                  "input-field text-lg",
                  error ? "border-red-500 focus:border-red-500" : ""
                )}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isInputDisabled}
                autoComplete="email"
              />
            </div>

            <ErrorMessage message={error} isVisible={!!error} />

            <button
              type="submit"
              disabled={isButtonDisabled}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-4 py-4 text-base font-bold shadow-lg"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate Identity
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock size={12} className="text-gray-400" />
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
              Secure Environment
            </p>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            Standard anti-fraud protocols active. Your advanced device fingerprint is being monitored to prevent duplicate submissions. 
          </p>
        </div>
      </motion.div>

      {/* Subtle Admin Trigger Button */}
      <div className="mt-8 flex items-center gap-4 opacity-30 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setIsAdminModalOpen(true)}
          className="text-[10px] uppercase tracking-widest text-gray-400 font-bold hover:text-blue-500"
        >
          Admin Access
        </button>
      </div>

      <AdminLoginModal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsAdminModalOpen(false)} 
      />

      {/* Hidden 5-tap trigger area overlay */}
      <div 
        onClick={handleBottomTap}
        className="fixed bottom-0 left-0 w-full h-16 cursor-default z-[90] select-none opacity-0"
        aria-hidden="true"
      />
    </main>
  );
}
