'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Lock, BarChart3, Users, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface VoteCount {
  party: string;
  count: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [votes, setVotes] = useState<VoteCount[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if session has admin auth
    if (sessionStorage.getItem('admin_auth') === 'true') {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'dha123' && password === 'dha123') {
      sessionStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
      fetchData();
      toast.success('Admin authenticated');
    } else {
      toast.error('Invalid credentials');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: voteData, error: voteError } = await supabase
        .from('votes')
        .select('party');
      
      const { data: resData, error: resError } = await supabase
        .from('results')
        .select('published')
        .eq('id', 1)
        .single();
        
      if (voteError) throw voteError;
      if (resError) throw resError;

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
      setIsPublished(resData.published);
      
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePublish = async () => {
    try {
      const newStatus = !isPublished;
      const { error } = await supabase
        .from('results')
        .update({ published: newStatus })
        .eq('id', 1);
        
      if (error) throw error;
      
      setIsPublished(newStatus);
      toast.success(`Results ${newStatus ? 'Published' : 'Hidden'} successfully`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to change publish status');
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-transparent to-blue-50/50 dark:to-blue-950/20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full glass p-8 shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="text-gray-600 dark:text-gray-400" size={32} />
            </div>
            <h1 className="text-xl font-bold">Admin Portal</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="btn-primary w-full mt-4">Login</button>
          </form>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col p-6 min-h-screen">
      <Navbar />
      
      <div className="max-w-4xl mx-auto w-full mt-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="text-blue-500" />
              Live Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Manage election results in real-time</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchData} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button 
              onClick={() => router.push('/results')}
              className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-200 dark:hover:bg-indigo-900 transition"
            >
              <Eye size={18} />
              Public View
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-6 flex flex-col items-center justify-center text-center">
            <Users size={40} className="text-blue-500 mb-4" />
            <div className="text-5xl font-black">{totalVotes}</div>
            <div className="text-sm text-gray-500 mt-2 uppercase tracking-wider font-bold">Total Votes Cast</div>
          </div>
          
          <div className="glass p-6 flex flex-col items-center justify-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isPublished ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
              <Eye size={32} />
            </div>
            <div className="text-2xl font-bold mb-2">
              {isPublished ? 'Results Public' : 'Results Hidden'}
            </div>
            <button 
              onClick={togglePublish}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${isPublished ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
            >
              {isPublished ? 'Unpublish Results' : 'Publish Results'}
            </button>
          </div>
        </div>

        <div className="glass p-8">
          <h2 className="text-xl font-bold mb-6">Vote Distribution</h2>
          <div className="space-y-6">
            {votes.map((v, i) => {
              const percentage = totalVotes === 0 ? 0 : (v.count / totalVotes) * 100;
              return (
                <div key={v.party}>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold flex items-center gap-2">
                      <span className="text-gray-400 text-sm">#{i+1}</span>
                      {v.party}
                    </span>
                    <span className="font-mono">{v.count} votes ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
