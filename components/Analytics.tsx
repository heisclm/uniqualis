"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Filter, Calendar, Download, RefreshCw, BarChart2, TrendingUp, Users, Target, Search, Loader2 } from "lucide-react";

export function Analytics() {
  const [timeframe, setTimeframe] = useState("5-years");
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>({
    yearlyData: [],
    sentimentDistribution: [],
    radarData: [],
    totalEvaluations: 0
  });
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/official/analytics?filter=${timeframe}`);
        if (res.ok) {
          const data = await res.json();
          setAnalyticsData(data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [timeframe]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  // Safe fallback for UI rendering
  const yearlyData = analyticsData.yearlyData || [];
  const sentimentDistribution = analyticsData.sentimentDistribution || [];
  const radarData = analyticsData.radarData || [];
  const demographicData = analyticsData.demographicData || [];
  const totalEvaluations = analyticsData.totalEvaluations || 0;
  
  // Find top sentiment group for UI display
  const topSentiment = sentimentDistribution.length > 0 
    ? sentimentDistribution.reduce((prev: any, current: any) => (prev.value > current.value) ? prev : current)
    : { type: "N/A", value: 0 };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Strategic Analytics Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Deep historical data exploration and performance strategy.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search metrics..." 
              className="h-10 pl-9 pr-4 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full sm:w-64 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none h-10 px-4 rounded-xl bg-white flex items-center justify-center gap-2 text-slate-600 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 hover:bg-slate-50 transition-all font-medium text-sm">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <button className="flex-1 sm:flex-none h-10 px-4 rounded-xl bg-blue-600 flex items-center justify-center gap-2 text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:bg-blue-700 transition-all font-medium text-sm whitespace-nowrap">
              <Download className="w-4 h-4 shrink-0" />
              <span>Export Data</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Primary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* YoY Trends */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Year-Over-Year Trajectory
              </h3>
              <p className="text-xs text-slate-500 mt-1">Holistic institutional performance trends.</p>
            </div>
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 transition-colors"
            >
              <option value="1-year">Last Year</option>
              <option value="3-years">Last 3 Years</option>
              <option value="5-years">Last 5 Years</option>
            </select>
          </div>
          <div className="h-[300px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} domain={[0, 5]} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={false} domain={[0, 100]} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="satisfaction" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSat)" name="Satisfaction (0-5)" />
                <Area yAxisId="right" type="monotone" dataKey="engagement" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorEng)" name="Engagement %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Sentiment Distribution */}
        <motion.div variants={itemVariants} className="bg-slate-900 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-800 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-400" />
                AI Sentiment Depth Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-1">Processed from {totalEvaluations} qualitative feedback entries.</p>
            </div>
            <div className="px-2.5 py-1 bg-white/10 border border-white/10 rounded-md text-[10px] font-bold text-white flex items-center gap-1.5 shadow-sm uppercase tracking-wide backdrop-blur-md">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
              Neural Processing
            </div>
          </div>
          
          <div className="space-y-6 relative z-10 mb-8 mt-4">
            {sentimentDistribution.map((sentiment: any, index: number) => {
              // Map color names to actual Tailwind values
              let bgClass = "bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]";
              if (sentiment.color === "slate") bgClass = "bg-slate-400";
              if (sentiment.color === "amber") bgClass = "bg-rose-400";
              
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm font-medium mb-2.5">
                    <span className="text-slate-300">{sentiment.type}</span>
                    <span className="text-white font-bold">{sentiment.value}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${sentiment.value}%` }} 
                      transition={{ duration: 1, delay: 0.2 + (index * 0.1) }} 
                      className={`h-full rounded-full ${bgClass}`} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="pt-6 border-t border-slate-800 relative z-10">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Semantic Clusters Identified</h4>
            <div className="flex flex-wrap gap-2">
              {(analyticsData.semanticClusters || []).map((cluster: any, idx: number) => {
                const colors = [
                  "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
                  "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
                  "bg-rose-500/10 border-rose-500/20 text-rose-300",
                  "bg-amber-500/10 border-amber-500/20 text-amber-300",
                  "bg-cyan-500/10 border-cyan-500/20 text-cyan-300"
                ];
                return (
                  <span key={idx} className={`px-3 py-1.5 border text-xs font-medium rounded-lg ${colors[idx % colors.length]}`}>
                    {cluster.name} ({cluster.count})
                  </span>
                );
              })}
              {!(analyticsData.semanticClusters?.length) && (
                <span className="text-xs text-slate-500 italic">No semantic clusters identified yet.</span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Matrices */}
        <motion.div variants={itemVariants} className="lg:col-span-1 bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60">
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-blue-600" />
            Capability Matrices
          </h3>
          <p className="text-xs text-slate-500 mb-6">Cross-departmental competency mapping.</p>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Performance" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-600 opacity-50"></span><span className="text-xs text-slate-600 font-medium">Department Performance (%)</span></div>
          </div>
        </motion.div>

        {/* Demographic Breakdown */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Participation Demographics
              </h3>
              <p className="text-xs text-slate-500 mt-1">Evaluation response rates segmented by academic year.</p>
            </div>
          </div>
          
          <div className="h-[280px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demographicData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="freshmen" name="Freshmen %" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sophomores" name="Sophomores %" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="juniors" name="Juniors %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="seniors" name="Seniors %" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
