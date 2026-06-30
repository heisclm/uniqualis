"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, BarChart2, MessageSquare } from "lucide-react";
import { EvaluationCard, type Evaluation } from "@/components/lecturer/EvaluationCard";
import { EmptyFeed } from "@/components/lecturer/EmptyFeed";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const trendData = [
  { semester: 'Fall 2024', score: 3.8 },
  { semester: 'Spring 2025', score: 4.2 },
  { semester: 'Fall 2025', score: 4.1 },
  { semester: 'Spring 2026', score: 4.5 },
  { semester: 'Fall 2026', score: 4.7 },
];

const criteriaData = [
  { subject: 'Clarity', A: 4.8, fullMark: 5 },
  { subject: 'Punctuality', A: 4.9, fullMark: 5 },
  { subject: 'Engagement', A: 4.3, fullMark: 5 },
  { subject: 'Fairness', A: 4.5, fullMark: 5 },
  { subject: 'Availability', A: 4.0, fullMark: 5 },
];

export function LecturerPerformance() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluations = async () => {
    try {
      const response = await fetch('/api/lecturer/evaluations');
      if (!response.ok) throw new Error('Failed to fetch evaluations');
      const data = await response.json();
      setEvaluations(data.evaluations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvaluations();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] w-full">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-[1.5rem] border border-red-100 text-center max-w-2xl mx-auto mt-8">
        <h3 className="font-bold mb-2">Failed to load analytics</h3>
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

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700">
      
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Deep Analytics Hub</h1>
        <p className="text-sm text-slate-500 mt-1">Granular retrospective analysis of your evaluation metrics and student feedback.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Trend Graph */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Semester Performance Trend
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg">Historical</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 8 }} />
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="5 5" />
                <XAxis dataKey="semester" stroke="#94a3b8" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-500" />
              Criteria Breakdown
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg">Current Term</span>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={criteriaData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="A" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.2} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Qualitative Feedback Wall
          </h2>
          <span className="text-xs font-medium text-slate-500">Heavily Moderated & Anonymized</span>
        </div>
        
        {evaluations.length === 0 ? (
          <EmptyFeed />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {evaluations.map((evaluation) => (
              <EvaluationCard 
                key={evaluation.id} 
                evaluation={evaluation} 
                onResponseSubmitted={fetchEvaluations} 
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
