"use client";

import { useState, useEffect } from "react";
import { Loader2, BookOpen, Clock, CheckCircle2, AlertCircle, FileText, GraduationCap } from "lucide-react";

export function StudentCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/student/courses');
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
        }
      } catch (error) {
        console.error("Failed to fetch courses", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
    <div className="p-6 md:p-10 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-600" />
          Active Enrollments
        </h1>
        <p className="text-slate-500 mt-2 text-base">
          A read-only overview of your registered courses and their quality assurance evaluation status.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 overflow-hidden min-h-[400px]">
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No active enrollments found.</h3>
            <p className="text-slate-500 mt-1 max-w-sm">
              You are not currently enrolled in any courses for the active academic semester. Institutional records will sync automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {courses.map((course) => {
              const statusUI = getCourseStatus(course.status);
              
              return (
                <div key={course.enrollmentId} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50/50 flex items-center justify-center text-blue-700 font-bold border border-blue-100/50 shrink-0 shadow-sm">
                      {course.code}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{course.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-medium text-slate-500">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                          {course.academicYear}
                        </span>
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                          Semester {course.semester}
                        </span>
                        <span className="flex items-center gap-1.5 px-2.5 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          {course.department}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide shadow-sm ${statusUI.badgeClasses}`}>
                      {statusUI.icon}
                      {statusUI.label}
                    </span>
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
