"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Filter, Calendar, Download, RefreshCw, BarChart2, TrendingUp, Users, Target, Search } from "lucide-react";

const yearlyData = [
  { year: "2022", satisfaction: 3.8, engagement: 65, responseRate: 50 },
  { year: "2023", satisfaction: 4.1, engagement: 72, responseRate: 65 },
  { year: "2024", satisfaction: 4.3, engagement: 78, responseRate: 75 },
  { year: "2025", satisfaction: 4.5, engagement: 82, responseRate: 85 },
  { year: "2026", satisfaction: 4.7, engagement: 88, responseRate: 92 },
];

const departmentMatrix = [
  { subject: "Teaching Quality", CS: 4.8, Math: 4.2, Physics: 4.5, Biology: 4.1, fullMark: 5 },
  { subject: "Materials", CS: 4.5, Math: 3.8, Physics: 4.2, Biology: 4.4, fullMark: 5 },
  { subject: "Communication", CS: 4.2, Math: 4.0, Physics: 4.6, Biology: 4.5, fullMark: 5 },
  { subject: "Fairness", CS: 4.6, Math: 4.5, Physics: 4.1, Biology: 4.2, fullMark: 5 },
  { subject: "Engagement", CS: 4.1, Math: 3.9, Physics: 4.4, Biology: 4.7, fullMark: 5 },
];

const demographicData = [
  { term: "Fall", freshmen: 85, sophomores: 78, juniors: 82, seniors: 90 },
  { term: "Winter", freshmen: 80, sophomores: 82, juniors: 85, seniors: 88 },
  { term: "Spring", freshmen: 92, sophomores: 85, juniors: 89, seniors: 95 },
];

export function Analytics() {
  const [timeframe, setTimeframe] = useState("Yearly");
  
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
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 transition-colors">
              <option>Last 5 Years</option>
              <option>Last 10 Years</option>
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
              <p className="text-xs text-slate-400 mt-1">Processed from 14,203 qualitative feedback entries.</p>
            </div>
            <div className="px-2.5 py-1 bg-white/10 border border-white/10 rounded-md text-[10px] font-bold text-white flex items-center gap-1.5 shadow-sm uppercase tracking-wide backdrop-blur-md">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
              Neural Processing
            </div>
          </div>
          
          <div className="space-y-6 relative z-10 mb-8 mt-4">
            <div>
              <div className="flex justify-between text-sm font-medium mb-2.5">
                <span className="text-slate-300">Constructive / Positive</span>
                <span className="text-white font-bold">68.4%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '68.4%' }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium mb-2.5">
                <span className="text-slate-300">Observational / Neutral</span>
                <span className="text-white font-bold">22.1%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '22.1%' }} transition={{ duration: 1, delay: 0.3 }} className="h-full bg-slate-400 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium mb-2.5">
                <span className="text-slate-300">Critical / Negative</span>
                <span className="text-white font-bold">9.5%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '9.5%' }} transition={{ duration: 1, delay: 0.4 }} className="h-full bg-rose-400 rounded-full" />
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-800 relative z-10">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Semantic Clusters Identified</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium rounded-lg">Pacing too fast (420)</span>
              <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium rounded-lg">Excellent lab support (850)</span>
              <span className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium rounded-lg">Clear grading rubrics (612)</span>
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
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={departmentMatrix}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                <Radar name="Computer Science" dataKey="CS" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
                <Radar name="Physics" dataKey="Physics" stroke="#34d399" fill="#34d399" fillOpacity={0.2} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-600 opacity-50"></span><span className="text-xs text-slate-600 font-medium">CS</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-400 opacity-50"></span><span className="text-xs text-slate-600 font-medium">Physics</span></div>
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
