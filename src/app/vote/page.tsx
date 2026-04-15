'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { CountdownTimer } from '@/components/CountdownTimer';
import { LivePoll } from '@/components/LivePoll';
import { supabase } from '@/lib/supabase';
import { getDeviceId, hasVotedLocally, isDeadlinePassed } from '@/lib/validation';
import { maskEmail, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

const PARTIES = ['PROGRESSIVE PARTY', 'UNITY ALLIANCE', 'FUTURE FORWARD', 'EQUALITY FRONT', 'INDEPENDENCE GROUP'];

export default function VotePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Ensure user has valid session identity
    const sessionEmail = sessionStorage.getItem('temp_email');
    if (!sessionEmail || hasVotedLocally()) {
      router.push('/');
      return;
    }
    setEmail(sessionEmail);
    setDeadlinePassed(isDeadlinePassed());
  }, [router]);

  const handleVote = async () => {
    if (!selectedParty || !email || isSubmitting || (mounted && deadlinePassed)) return;

    setIsSubmitting(true);
    const deviceId = getDeviceId();

    try {
      // 1. Final check for already voted (Both email and device)
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${email},device_id.eq.${deviceId}`)
        .eq('has_voted', true)
        .single();

      if (existingUser) {
        toast.error('Identity already noted as voted. Blocking submission.');
        localStorage.setItem('vote_submitted', 'true');
        setTimeout(() => router.push('/results'), 2000);
        return;
      }

      // 2. Record the vote in Supabase using email as identifier
      const { error: voteError } = await supabase
        .from('votes')
        .insert([{ email, party: selectedParty }]);

      if (voteError) throw voteError;

      // 3. Mark user as voted in users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({ email, device_id: deviceId, has_voted: true }, { onConflict: 'email' });

      if (userError) throw userError;

      // 4. Update local state
      localStorage.setItem('vote_submitted', 'true');
      toast.success('Your vote has been securely recorded!');
      
      // Navigate to results
      setTimeout(() => router.push('/results'), 2000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !email) return null;

  return (
    <main className="flex-1 flex flex-col items-center p-6 bg-gradient-to-b from-transparent to-blue-50/10">
      <Navbar />
      
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        {/* Main Voting Area */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-8 relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  Select Your Delegate
                </h1>
                <div className="flex items-center gap-2 mt-2 text-gray-500">
                  <span className="text-sm font-medium">Identity:</span>
                  <code className="text-xs font-mono bg-blue-50 dark:bg-blue-900/40 px-2 py-1 rounded text-blue-700 dark:text-blue-300">
                    {maskEmail(email)}
                  </code>
                </div>
              </div>
              <CountdownTimer />
            </div>

            <div className="grid grid-cols-1 gap-4">
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
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        selectedParty === party ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"
                      )}>
                        {selectedParty === party && <CheckCircle2 className="text-white" size={12} />}
                      </div>
                      <span className={cn(
                        "font-semibold text-lg",
                        selectedParty === party ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                      )}>{party}</span>
                    </div>
                  </div>
                  
                  {selectedParty === party && (
                    <motion.div 
                      layoutId="partyHighlight"
                      className="absolute inset-0 bg-blue-500/5 pointer-events-none"
                    />
                  )}
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {(mounted && deadlinePassed) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700"
                >
                  <AlertCircle size={20} />
                  <p className="text-sm font-medium">The election window has closed. Voting is no longer active.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

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

        {/* Sidebar */}
        <div className="space-y-6">
          <LivePoll />
          
          <div className="glass p-6 space-y-4 bg-blue-50/30 dark:bg-blue-900/10">
            <h3 className="font-bold flex items-center gap-2">
              <Info size={18} className="text-blue-500" />
              Information
            </h3>
            <ul className="text-xs space-y-3 text-gray-500 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-blue-500">•</span>
                Your vote is permanently associated with your unique device fingerprint and email.
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500">•</span>
                Once choice is confirmed, it cannot be modified or withdrawn.
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500">•</span>
                Real-time results are projected and may differ from official final tallies.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
