'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { getDeviceId, hasVotedLocally, markAsVotedLocally, isDeadlinePassed } from '@/lib/validation';
import { motion } from 'framer-motion';
import { CheckCircle2, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn, maskRegNo } from '@/lib/utils';
import { CountdownTimer } from '@/components/CountdownTimer';
import { LivePoll } from '@/components/LivePoll';

const PARTIES = ['DMK', 'ADMK', 'TVK', 'NTK', 'OTHERS', 'NOTA'];

export default function VotePage() {
  const router = useRouter();
  const [regNo, setRegNo] = useState<string | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Ensure user has valid session reg_no
    const sessionRegNo = sessionStorage.getItem('temp_reg_no');
    if (!sessionRegNo || hasVotedLocally()) {
      router.replace('/');
      return;
    }
    setRegNo(sessionRegNo);

    // Initial check to redirect if results are already published
    const checkResults = async () => {
      const { data } = await supabase.from('results').select('published').eq('id', 1).single();
      if (data?.published) {
        toast.info('Results are already published. Voting has ended.');
        router.replace('/results');
      }
    };
    checkResults();

    // Check deadline periodically
    setDeadlinePassed(isDeadlinePassed());
    const interval = setInterval(() => {
      setDeadlinePassed(isDeadlinePassed());
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  const handleVote = async () => {
    if (!selectedParty || !regNo) return;
    if (isDeadlinePassed()) {
      toast.error('Voting has officially ended. No new votes can be cast.');
      return;
    }
    
    setIsSubmitting(true);
    const deviceId = getDeviceId();

    try {
      // Create user record or update if exists
      const { error: userError } = await supabase
        .from('users')
        .upsert({ reg_no: regNo, device_id: deviceId, has_voted: true }, { onConflict: 'reg_no' });

      if (userError) throw userError;

      const { error: voteError } = await supabase
        .from('votes')
        .insert({ reg_no: regNo, party: selectedParty });

      if (voteError) throw voteError;

      markAsVotedLocally();
      sessionStorage.removeItem('temp_reg_no');
      
      toast.success('Your vote has been successfully cast!');
      router.replace('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === '23505') {
        toast.error('You have already voted!');
      } else {
        toast.error('An error occurred while submitting your vote.');
      }
      setIsSubmitting(false);
    }
  };

  if (!regNo) return null;

  return (
    <main className="flex-1 flex flex-col items-center p-6 bg-gradient-to-b from-transparent to-blue-50/50 dark:to-blue-950/20 min-h-[calc(100vh-80px)]">
      <Navbar />
      
      <div className="max-w-5xl w-full mt-4 flex flex-col lg:flex-row gap-8">
        {/* Left Side: Voting Area */}
        <div className="flex-1">
          <CountdownTimer />

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <div>
              <h1 className="text-3xl font-bold mb-1">Cast Your Vote</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select your preferred candidate carefully.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-4 py-2 rounded-lg font-mono text-sm shadow-sm">
              <UserCircle2 size={16} />
              {maskRegNo(regNo)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PARTIES.map((party, i) => (
              <motion.button
                key={party}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !(mounted && deadlinePassed) && setSelectedParty(party)}
                disabled={isSubmitting || (mounted && deadlinePassed)}
                className={cn(
                  "glass p-6 text-left relative overflow-hidden transition-all duration-300 group",
                  selectedParty === party 
                    ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20" 
                    : "hover:bg-gray-50/50 dark:hover:bg-gray-800/50",
                  (mounted && deadlinePassed) && "opacity-60 cursor-not-allowed hover:bg-transparent"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold tracking-tight">{party}</span>
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    selectedParty === party 
                      ? "border-blue-500 bg-blue-500 text-white" 
                      : deadlinePassed ? "border-gray-200 dark:border-gray-700" : "border-gray-300 dark:border-gray-600 group-hover:border-blue-400"
                  )}>
                    {selectedParty === party && <CheckCircle2 size={16} />}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: selectedParty || (mounted && deadlinePassed) ? 1 : 0 }}
            className="mt-8 flex justify-center sticky bottom-8"
          >
            <button
              onClick={handleVote}
              disabled={!selectedParty || isSubmitting || (mounted && deadlinePassed)}
              className="btn-primary w-full max-w-md text-lg py-4 font-semibold shadow-2xl flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (mounted && deadlinePassed) ? (
                'Polling Has Ended'
              ) : (
                'Confirm Selection'
              )}
            </button>
          </motion.div>
        </div>

        {/* Right Side: Sidebar */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="sticky top-6">
            <LivePoll compact={true} />
          </div>
        </div>
      </div>
    </main>
  );
}
