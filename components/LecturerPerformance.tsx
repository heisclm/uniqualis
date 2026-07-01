"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, TrendingUp, BarChart2, MessageSquare, Filter, Zap, Target } from "lucide-react";
import { EvaluationCard, type Evaluation } from "@/components/lecturer/EvaluationCard";
import { EmptyFeed } from "@/components/lecturer/EmptyFeed";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export function LecturerPerformance() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [courses, setCourses] = useState<{id: string, title: string, code: string}[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("ALL");
  const [insights, setInsights] = useState<{strengths: string[], improvements: string[]}>({strengths: [], improvements: []});
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [dynamicTrendData, setDynamicTrendData] = useState<{semester: string, score: number}[]>([]);
  const [dynamicCriteria, setDynamicCriteria] = useState<{subject: string, A: number, fullMark: number}[]>([]);

  const fetchEvaluations = useCallback(async (courseId: string) => {
    try {
      setIsLoading(true);
      const url = new URL('/api/lecturer/evaluations', window.location.origin);
      if (courseId !== "ALL") {
        url.searchParams.append("courseId", courseId);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      
      const fetchedEvaluations: Evaluation[] = data.evaluations || [];
      setEvaluations(fetchedEvaluations);
      
      if (data.courses) setCourses(data.courses);
      if (data.extractedInsights) setInsights(data.extractedInsights);
      
      if (data.analytics) {
        setDynamicTrendData(data.analytics.trendData);
        setDynamicCriteria(data.analytics.criteriaData);
      } else {
        setDynamicTrendData([]);
        setDynamicCriteria([]);
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvaluations(selectedCourse);
  }, [fetchEvaluations, selectedCourse]);

  if (isLoading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh] w-full">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error && courses.length === 0) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-[1.5rem] border border-red-100 text-center max-w-2xl mx-auto mt-8">
        <h3 className="font-bold mb-2">Failed to load analytics</h3>
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => fetchEvaluations(selectedCourse)}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Deep Analytics Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Granular retrospective analysis of your evaluation metrics and student feedback.</p>
        </div>
        
        {/* Dynamic Course Filter */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm self-start md:self-auto">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <select 
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none pr-4"
          >
            <option value="ALL">All Courses Aggregate</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.code} - {course.title}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* AI Theme Extraction Highlights */}
      {(insights.strengths.length > 0 || insights.improvements.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100/50">
            <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4" />
              Core Strengths (AI Extracted)
            </h3>
            <div className="flex flex-wrap gap-2">
              {insights.strengths.length > 0 ? insights.strengths.map((theme, i) => (
                <span key={i} className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                  {theme}
                </span>
              )) : <span className="text-xs text-emerald-600/50 font-medium">Accumulating data...</span>}
            </div>
          </div>
          
          <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-100/50">
            <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-4">
              <Target className="w-4 h-4" />
              Areas for Optimization
            </h3>
            <div className="flex flex-wrap gap-2">
              {insights.improvements.length > 0 ? insights.improvements.map((theme, i) => (
                <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                  {theme}
                </span>
              )) : <span className="text-xs text-amber-600/50 font-medium">Accumulating data...</span>}
            </div>
          </div>
        </div>
      )}

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
            {dynamicTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dynamicTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
            ) : (
              <div className="flex flex-col items-center justify-center h-full w-full text-slate-400">
                <TrendingUp className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">No performance data yet</p>
              </div>
            )}
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
            {dynamicCriteria.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dynamicCriteria}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.2} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full w-full text-slate-400">
                <BarChart2 className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">Insufficient data for breakdown</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 relative">
        {isLoading && (
           <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-3xl">
             <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
           </div>
        )}
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
                onResponseSubmitted={() => fetchEvaluations(selectedCourse)} 
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
