"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertTriangle, ShieldCheck, TrendingDown, BookOpen, Users } from "lucide-react";
import { OfficialEvaluationCard, type EvaluationForOfficial } from "@/components/official/OfficialEvaluationCard";
import { EmptyFeed } from "@/components/lecturer/EmptyFeed"; // Assuming this is generic enough

export function OfficialDashboard() {
  const [evaluations, setEvaluations] = useState<EvaluationForOfficial[]>([]);
  const [stats, setStats] = useState({ pendingQAPlansCount: 0, atRiskCoursesCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'flagged'>('all');

  const fetchEvaluations = useCallback(async () => {
    try {
      const response = await fetch('/api/official/evaluations');
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to fetch department evaluations');
      }
      const data = await response.json();
      setEvaluations(data.evaluations || []);
      setStats({
        pendingQAPlansCount: data.pendingQAPlansCount || 0,
        atRiskCoursesCount: data.atRiskCoursesCount || 0
      });
      setError(null);
    } catch (err: any) {
      setEvaluations((prev) => {
         if (prev.length === 0) setError(err.message);
         return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const poll = async () => {
       await fetchEvaluations();
    };
    poll();
    const interval = setInterval(poll, 15000); // Live poll
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchEvaluations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-[1.5rem] border border-red-100 text-center max-w-2xl mx-auto mt-8">
        <h3 className="font-bold mb-2">Failed to load data</h3>
        <p className="text-sm">{error}</p>
        <button 
          onClick={fetchEvaluations}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const flaggedCount = evaluations.filter(e => e.isFlagged).length;
  const filteredEvaluations = filter === 'flagged' ? evaluations.filter(e => e.isFlagged) : evaluations;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-9 h-9 text-emerald-600" />
            Department Oversight
          </h1>
          <p className="text-slate-500 mt-2">Monitor evaluations and submit administrative notes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors"></div>
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider"><BookOpen className="w-4 h-4 text-emerald-400" /> Total Evaluations</p>
            <h3 className="text-5xl font-display font-bold text-slate-800 tracking-tight">{evaluations.length}</h3>
          </div>
        </div>
        
        <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-[2rem] border border-red-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full blur-2xl group-hover:bg-red-100 transition-colors"></div>
          <div>
            <p className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" /> Flagged for Review
            </p>
            <h3 className="text-5xl font-display font-bold text-red-700 tracking-tight">{flaggedCount}</h3>
          </div>
        </div>

        <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-[2rem] border border-amber-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full blur-2xl group-hover:bg-amber-100 transition-colors"></div>
          <div>
            <p className="text-sm font-semibold text-amber-600 mb-2 flex items-center gap-2 uppercase tracking-wider">
              <TrendingDown className="w-4 h-4" /> At-Risk Courses
            </p>
            <h3 className="text-5xl font-display font-bold text-amber-700 tracking-tight">{stats.atRiskCoursesCount}</h3>
            <p className="text-xs font-medium text-amber-500/80 mt-2">Avg below 3.0 threshold</p>
          </div>
        </div>

        <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-[2rem] border border-emerald-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors"></div>
          <div>
            <p className="text-sm font-semibold text-emerald-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
              <Users className="w-4 h-4" /> Pending QA Plans
            </p>
            <h3 className="text-5xl font-display font-bold text-emerald-700 tracking-tight">{stats.pendingQAPlansCount}</h3>
            <p className="text-xs font-medium text-emerald-400/80 mt-2">Awaiting your approval</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 mb-8 inline-flex flex-wrap gap-1">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
            filter === 'all' 
              ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          All Feedback
        </button>
        <button
          onClick={() => setFilter('flagged')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
            filter === 'flagged' 
              ? 'bg-red-50 text-red-700 shadow-sm' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Flagged Only
        </button>
      </div>

      <div className="space-y-6 max-w-4xl">
        {filteredEvaluations.length === 0 ? (
          <EmptyFeed />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredEvaluations.map((evaluation) => (
              <OfficialEvaluationCard 
                key={evaluation.id} 
                evaluation={evaluation} 
                onCommentSubmitted={fetchEvaluations} 
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
