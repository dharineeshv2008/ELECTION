'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Trophy, Clock, SearchX, Award } from 'lucide-react';
import { LivePoll } from '@/components/LivePoll';

interface VoteCount {
  party: string;
  count: number;
}

export default function ResultsPage() {
  const [votes, setVotes] = useState<VoteCount[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isPublished, setIsPublished] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResults();

    // Set up realtime subscription for results toggle and votes
    const numSub = supabase
      .channel('results_update')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'results' }, payload => {
        setIsPublished(payload.new.published);
        if(payload.new.published) {
            fetchResults();
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, () => {
        // fetch again if we r published
        if(isPublished) {
            fetchResults();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(numSub);
    };
  }, [isPublished]);

  const fetchResults = async () => {
    try {
      const { data: resData } = await supabase
        .from('results')
        .select('published')
        .eq('id', 1)
        .single();
        
      setIsPublished(!!resData?.published);

      if (resData?.published) {
        const { data: voteData } = await supabase.from('votes').select('party');
        if (voteData) {
          const counts: Record<string, number> = {};
          const parties = ['DMK', 'ADMK', 'TVK', 'NTK', 'OTHERS', 'NOTA'];
          parties.forEach(p => counts[p] = 0);
          
          voteData.forEach(v => {
            if(counts[v.party] !== undefined) counts[v.party]++;
          });

          const formatted = Object.keys(counts).map(k => ({ party: k, count: counts[k] }));
          formatted.sort((a,b) => b.count - a.count);
          
          setVotes(formatted);
          setTotalVotes(voteData.length);
        }
      }
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!isPublished) {
    return (
      <main className="flex-1 flex flex-col p-6 min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-12 text-center max-w-md w-full"
          >
            <Clock size={48} className="text-gray-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">Results Pending</h1>
            <p className="text-gray-500">
              The election results have not been published yet. Please check back later.
            </p>
          </motion.div>
        </div>
      </main>
    );
  }

  if (totalVotes === 0) {
    return (
      <main className="flex-1 flex flex-col p-6 min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="glass p-12 text-center">
            <SearchX size={48} className="text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold">No Votes Cast</h1>
            <p className="text-gray-500">There are no votes recorded in this election.</p>
          </div>
        </div>
      </main>
    );
  }

  const winner = votes.length > 0 ? votes[0] : null;
  const isTie = votes.length > 1 && votes[0].count === votes[1].count;

  return (
    <main className="flex-1 flex flex-col p-6 min-h-screen">
      <Navbar />
      
      <div className="max-w-4xl mx-auto w-full mt-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-4 uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
            Official Results
          </h1>
          <p className="text-gray-500">Total Valid Votes: <strong>{totalVotes}</strong></p>
        </div>

        {!isTie && winner && winner.count > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="glass bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 p-8 rounded-3xl flex flex-col sm:flex-row items-center gap-6 justify-center text-center sm:text-left">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-yellow-500/20 shrink-0">
                <Trophy size={40} className="text-white" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-widest text-yellow-600 dark:text-yellow-500 font-bold mb-1">
                  Projected Winner
                </p>
                <h2 className="text-4xl font-black">{winner.party}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Leading with {winner.count} votes ({(winner.count / totalVotes * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {isTie && (
          <div className="glass border-orange-500/20 bg-orange-500/5 p-6 mb-12 text-center rounded-2xl">
            <Award size={32} className="text-orange-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold">It's a Tie!</h2>
            <p className="text-gray-500 text-sm mt-1">Multiple candidates have the exact same top vote count.</p>
          </div>
        )}

        <div className="glass p-8 space-y-8">
          <h3 className="text-xl font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            Final Standings
          </h3>
          
          <LivePoll showTitle={false} compact={false} />
        </div>
      </div>
    </main>
  );
}


