"use client";

import { useState, useEffect } from "react";
import { Loader2, BookOpen, Users, Clock, ArrowRight, BarChart3, History, Layers, AlertCircle } from "lucide-react";

type TermFilter = 'current' | 'historical';

interface CourseData {
  id: string;
  code: string;
  title: string;
  studentsEnrolled: number;
  evaluationsSubmitted: number;
  status: string;
  nextEvaluationDate: string;
  term: string;
}

export function LecturerCourses() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTerm, setActiveTerm] = useState<TermFilter>('current');
  const [courses, setCourses] = useState<CourseData[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/lecturer/courses');
        if (!response.ok) throw new Error('Failed to fetch courses');
        const data = await response.json();
        setCourses(data.courses || []);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourses();
  }, []);

  const currentCourses = courses.filter(c => c.status === "ACTIVE" || c.status === "Active Window");
  const historicalCourses = courses.filter(c => c.status !== "ACTIVE" && c.status !== "Active Window");

  const displayCourses = activeTerm === 'current' ? currentCourses : historicalCourses;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            Structural Teaching Directory
          </h1>
          <p className="text-sm text-slate-500 mt-2">Manage your academic rosters and monitor live evaluation engagement metrics.</p>
        </div>
        
        {/* Term Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200/60 self-start md:self-auto shrink-0">
          <button
            onClick={() => setActiveTerm('current')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTerm === 'current' 
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Active Roster
          </button>
          <button
            onClick={() => setActiveTerm('historical')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTerm === 'historical' 
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Historical Archive
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[40vh] w-full">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCourses.map((course) => {
              const completionRate = Math.round((course.evaluationsSubmitted / course.studentsEnrolled) * 100) || 0;
              
              return (
                <div key={course.id} className="group relative bg-white rounded-[2rem] p-7 shadow-sm border border-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden">
                  {/* Decorative Background Blob */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative z-10 mb-6">
                    <div className="flex justify-between items-center mb-5">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${activeTerm === 'current' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'} shadow-sm border border-slate-100`}>
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="inline-block px-2.5 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-100 uppercase tracking-widest">
                          {course.term}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border uppercase tracking-wider ${
                          course.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' : 
                          course.status === 'Archived' ? 'bg-slate-50 text-slate-600 border-slate-200/50' : 
                          'bg-indigo-50 text-indigo-700 border-indigo-100/50'
                        }`}>
                          {course.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                          {course.status}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs font-bold text-indigo-600/80 tracking-widest block mb-1.5">{course.code}</span>
                      <h3 className="text-2xl font-extrabold text-slate-900 leading-tight tracking-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
                    </div>
                  </div>
                  
                  <div className="space-y-6 mt-auto pt-6 border-t border-slate-100/80 relative z-10">
                    {/* Engagement Metrics */}
                    <div className="space-y-3">
                      <div className="flex items-end justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Completion Rate</span>
                          <span className="text-sm font-medium text-slate-600">{course.evaluationsSubmitted} / {course.studentsEnrolled} students</span>
                        </div>
                        <span className="text-2xl font-black text-slate-800 tabular-nums tracking-tighter">{completionRate}%</span>
                      </div>
                      
                      <div className="w-full bg-slate-100/80 rounded-full h-3 overflow-hidden border border-slate-200/50 relative">
                        <div 
                          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${
                            completionRate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 
                            completionRate >= 40 ? 'bg-gradient-to-r from-indigo-400 to-indigo-500' : 
                            completionRate > 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-slate-300'
                          }`}
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <button className="relative z-10 mt-6 w-full py-3.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-slate-200/60 hover:border-indigo-100">
                    <BarChart3 className="w-4 h-4" />
                    <span>Drill Down Metrics</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 absolute right-6" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Advanced Quality Tools */}
          {activeTerm === 'current' && (
            <div className="mt-12 border-t border-slate-200/60 pt-10">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  Advanced Quality Tools
                </h2>
                <p className="text-sm text-slate-500 mt-1">Opt-in modules to extend the standard evaluation framework.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Custom Modules Tool */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Layers className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Custom Evaluation Modules</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                      Add up to 2 custom course-specific questions to the core university evaluation. Perfect for gathering feedback on new teaching methods or guest speakers.
                    </p>
                    <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                      Configure Modules <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Peer Sandbox Tool */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Peer Evaluation Sandbox</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                      Invite a faculty peer to evaluate your course material or a specific lecture. This feedback remains entirely private to you before official evaluations begin.
                    </p>
                    <button className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors">
                      Invite a Peer <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
