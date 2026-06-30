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
                <div key={course.id} className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-shadow group flex flex-col h-full relative overflow-hidden">
                  {/* Accent line at top */}
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${activeTerm === 'current' ? 'bg-indigo-500' : 'bg-slate-400'}`}></div>
                  
                  <div className="mb-5 mt-1">
                    <div className="flex justify-between items-start mb-3">
                      <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100/50">
                        {course.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                        {course.term}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 leading-snug tracking-tight">{course.title}</h3>
                  </div>
                  
                  <div className="space-y-5 mt-auto pt-5 border-t border-slate-100">
                    
                    {/* Engagement Metrics */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 font-medium">Evaluation Completion</span>
                        <span className="font-bold text-slate-900">{completionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/50">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            completionRate >= 80 ? 'bg-emerald-500' : 
                            completionRate >= 40 ? 'bg-indigo-500' : 
                            completionRate > 0 ? 'bg-amber-500' : 'bg-slate-300'
                          }`}
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-slate-500 text-right">
                        {course.evaluationsSubmitted} of {course.studentsEnrolled} students submitted
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-500 flex items-center gap-2 font-medium">
                        <Clock className="w-4 h-4" /> 
                        Window Status
                      </span>
                      <span className={`font-bold ${
                        course.status === 'ACTIVE' ? 'text-emerald-600 flex items-center gap-1.5' : 
                        course.status === 'Archived' ? 'text-slate-500' : 
                        'text-indigo-600'
                      }`}>
                        {course.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                        {course.status}
                      </span>
                    </div>
                  </div>

                  <button className="mt-6 w-full py-3.5 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 group-hover:shadow-sm">
                    <BarChart3 className="w-4 h-4" />
                    Drill Down Metrics
                    <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
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
