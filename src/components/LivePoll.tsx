'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoteCount {
  party: string;
  count: number;
}

interface LivePollProps {
  showTitle?: boolean;
  compact?: boolean;
}

export function LivePoll({ showTitle = true, compact = false }: LivePollProps) {
  const [votes, setVotes] = useState<VoteCount[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    fetchVotes();

    const sub = supabase
      .channel('live_poll')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        fetchVotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const fetchVotes = async () => {
    try {
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
    } catch (err) {
      console.error('Error fetching votes for LivePoll:', err);
    }
  };

  if (votes.length === 0) return null;

  return (
    <div className={cn("glass w-full", compact ? "p-4" : "p-6")}>
      {showTitle && (
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="text-blue-500" size={compact ? 20 : 24} />
          <h3 className={cn("font-bold", compact ? "text-base" : "text-lg")}>Live Polling</h3>
          <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
      )}

      <div className={cn("space-y-4", compact ? "space-y-3" : "")}>
        {votes.map((v, index) => {
          const percentage = totalVotes === 0 ? 0 : (v.count / totalVotes) * 100;
          const isFirst = index === 0 && v.count > 0;
          
          return (
            <div key={v.party}>
              <div className="flex justify-between items-end mb-1">
                <span className={cn("font-bold", compact ? "text-sm" : "text-base flex items-center gap-2")}>
                  {!compact && (
                    <span className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] text-gray-500 font-mono">
                      {index + 1}
                    </span>
                  )}
                  {v.party}
                </span>
                <span className={cn("font-mono", compact ? "text-xs text-gray-500" : "text-sm")}>
                  {v.count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className={cn("w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner", compact ? "h-2" : "h-3")}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={cn(
                    "h-full rounded-full relative",
                    isFirst ? "bg-gradient-to-r from-yellow-400 to-orange-500" : "bg-blue-500"
                  )}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
