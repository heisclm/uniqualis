"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, BookOpen, Star, Tag, Calendar, Quote, Lock } from "lucide-react";
import { motion } from "motion/react";

export function EvaluationHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/student/evaluations');
        if (res.ok) {
          const data = await res.json();
          setHistory(data.evaluations || []);
        }
      } catch (err) {
        console.error("Failed to fetch evaluation history", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-8 md:mt-12 px-4 sm:px-6 lg:px-8 pb-16">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-12 text-center md:text-left"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center md:justify-start gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          Evaluation History
        </h1>
        <p className="text-slate-500 mt-4 text-base md:text-lg max-w-2xl mx-auto md:mx-0 leading-relaxed">
          A secure, read-only ledger of your submitted feedback. Review the impact you've made on your courses and instructors.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {history.map((evaluation, idx) => {
          return (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
              key={evaluation.id} 
              className="group relative bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-emerald-200/60 transition-all duration-500 overflow-hidden flex flex-col h-full"
            >
              {/* Premium Top Gradient Line */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-purple-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Decorative Background Glow */}
              <div className="absolute -right-20 -top-20 w-48 h-48 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100/60 transition-colors duration-700 pointer-events-none"></div>

              {/* Header Section */}
              <div className="px-6 pt-8 pb-5 flex flex-col relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold uppercase tracking-wider shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Submitted
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    {new Date(evaluation.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                
                <h3 className="font-display font-extrabold text-slate-900 text-xl leading-tight line-clamp-2 mb-1 group-hover:text-emerald-700 transition-colors">
                  {evaluation.courseLecturer.course.title}
                </h3>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {evaluation.courseLecturer.course.code}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>
              
              {/* Content Section */}
              <div className="px-6 py-6 flex-1 flex flex-col relative z-10 bg-slate-50/30">
                <div className="flex items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform duration-500">
                      <span className="font-bold text-lg">{evaluation.courseLecturer.lecturer.firstName[0]}{evaluation.courseLecturer.lecturer.lastName[0]}</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Evaluated Instructor</div>
                      <div className="text-sm font-bold text-slate-800">{evaluation.courseLecturer.lecturer.firstName} {evaluation.courseLecturer.lecturer.lastName}</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center shrink-0 min-w-[3.5rem] h-14 px-4 bg-white rounded-2xl shadow-md border border-slate-100 relative z-10 group-hover:border-emerald-300 group-hover:shadow-emerald-100 transition-all">
                    {evaluation.ratingQuantitative === 'Anonymous' ? (
                      <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-emerald-600 transition-colors">
                        <Lock className="w-4 h-4 opacity-70" />
                        <span className="text-xs font-bold uppercase tracking-widest mt-0.5">Anonymous</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-xl font-black text-slate-800 leading-none group-hover:text-emerald-600 transition-colors">{evaluation.ratingQuantitative}</span>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mt-1" />
                      </>
                    )}
                  </div>
                </div>

                {evaluation.themes && evaluation.themes.length > 0 ? (
                  <div className="mt-auto">
                    <div className="flex items-center mb-3 text-slate-400">
                       <Quote className="w-4 h-4 text-emerald-400 mr-2 opacity-70" />
                       <span className="text-xs font-bold uppercase tracking-widest">Key Insights</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {evaluation.themes.map((theme: string, idx: number) => (
                        <span key={idx} className="px-3 py-1.5 bg-white text-slate-600 text-xs font-semibold tracking-wide rounded-lg border border-slate-200 shadow-sm hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all cursor-default">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                   <div className="mt-auto flex items-center justify-center py-4 bg-white rounded-xl border border-slate-100 border-dashed">
                      <div className="text-sm text-slate-400 italic font-medium">No specific themes extracted.</div>
                   </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {history.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="col-span-1 md:col-span-2 lg:col-span-3"
          >
            <div className="relative overflow-hidden p-12 md:p-20 text-center border-2 border-slate-100 border-dashed rounded-[3rem] bg-white group hover:border-emerald-200 transition-colors duration-500">
              <div className="absolute -right-24 -top-24 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl group-hover:bg-emerald-100/50 transition-colors duration-700 pointer-events-none"></div>
              <div className="absolute -left-24 -bottom-24 w-64 h-64 bg-purple-50/50 rounded-full blur-3xl group-hover:bg-purple-100/50 transition-colors duration-700 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 mb-8 rounded-[2rem] bg-emerald-50 border border-emerald-100 shadow-sm flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500">
                  <BookOpen className="w-10 h-10 text-emerald-500 relative z-10" />
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-extrabold text-slate-800 tracking-tight mb-4">No Evaluation History</h3>
                <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed font-medium">
                  You haven't completed any evaluations yet. Your finalized feedback receipts and extracted insights will appear here securely.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
