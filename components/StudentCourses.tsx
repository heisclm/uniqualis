"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, BookOpen, Clock, CheckCircle2, AlertCircle, FileText, GraduationCap, X, Star } from "lucide-react";

export function StudentCourses({ setView }: { setView?: (view: string) => void }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [studentLevel, setStudentLevel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingLevel, setIsUpdatingLevel] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/student/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
        setStudentLevel(data.studentLevel);
      }
    } catch (error) {
      console.error("Failed to fetch courses", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleUpdateLevel = async (level: number) => {
    setIsUpdatingLevel(true);
    try {
      const res = await fetch('/api/student/level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingLevel(false);
    }
  };

  const getCourseStatus = (status: string) => {
    if (status === 'COMPLETED') {
      return { 
        label: "Evaluated", 
        icon: <CheckCircle2 className="w-3.5 h-3.5" />, 
        badgeClasses: "bg-emerald-50 text-emerald-700 border border-emerald-200" 
      };
    }
    
    return { 
      label: "Action Required", 
      icon: <FileText className="w-3.5 h-3.5" />, 
      badgeClasses: "bg-amber-50 text-amber-700 border border-amber-200" 
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] w-full">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            Active Enrollments
          </h1>
          <p className="text-slate-500 mt-2 text-base max-w-2xl">
            An overview of your registered courses and their quality assurance evaluation status.
          </p>
        </div>
        <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-3 w-full md:w-auto">
          <label className="text-sm font-semibold text-slate-600 ml-1 whitespace-nowrap">Current Level:</label>
          <select 
            value={studentLevel || ""} 
            onChange={(e) => handleUpdateLevel(Number(e.target.value))}
            disabled={isUpdatingLevel}
            className="flex-1 md:w-40 h-10 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
          >
            <option value="" disabled>Select Level...</option>
            <option value="100">100 Level</option>
            <option value="200">200 Level</option>
            <option value="300">300 Level</option>
            <option value="400">400 Level</option>
            <option value="500">500 Level</option>
          </select>
          {isUpdatingLevel && <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />}
        </div>
      </div>

      <div className="min-h-[400px]">
        {!studentLevel ? (
          <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Please select your academic level</h3>
            <p className="text-slate-500 mt-1 max-w-sm">
              Choose your current level from the dropdown above to view your enrolled courses.
            </p>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No active enrollments found</h3>
            <p className="text-slate-500 mt-1 max-w-sm">
              You are not currently enrolled in any courses for the active academic semester.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map((course) => {
              const statusUI = getCourseStatus(course.status);
              
              return (
                <div key={course.enrollmentId} className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex justify-between items-start mb-6 gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 flex flex-col items-center justify-center text-blue-700 border border-blue-100/50 shrink-0 shadow-sm relative">
                       <span className="text-sm font-bold tracking-wider">{course.code.substring(0, 3)}</span>
                       <span className="text-lg font-black leading-none">{course.code.substring(3)}</span>
                    </div>
                    <div className="shrink-0">
                      {course.status === 'COMPLETED' ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusUI.badgeClasses}`}>
                          {statusUI.icon}
                          <span className="hidden sm:inline">Evaluated</span>
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusUI.badgeClasses}`}>
                          {statusUI.icon}
                          <span className="hidden sm:inline">Pending</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg leading-snug mb-3 line-clamp-2">{course.title}</h3>
                    <div className="flex flex-col gap-2 text-xs font-medium text-slate-500">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-slate-400" /></div>
                         <span className="truncate">{course.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-slate-400" /></div>
                         <span>{course.academicYear} • Semester {course.semester}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    {course.status === 'COMPLETED' ? (
                      <button 
                        disabled
                        className="w-full inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-400 rounded-xl text-sm font-bold cursor-not-allowed border border-slate-200/50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Completed
                      </button>
                    ) : (
                      <button 
                        onClick={() => setView ? setView('evaluate') : null}
                        className="w-full inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                      >
                        <FileText className="w-4 h-4" />
                        Evaluate Course
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
