import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Clock, AlertCircle, Bell, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";

export function StudentDashboard({ setView }: { setView: (view: string) => void }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [studentLevel, setStudentLevel] = useState<number | null>(null);
  const [systemSetting, setSystemSetting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/student/courses');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.courses)) {
            setCourses(data.courses);
            setStudentLevel(data.studentLevel);
            if (data.systemSetting) {
              setSystemSetting(data.systemSetting);
            }
          } else if (Array.isArray(data)) {
            setCourses(data);
          } else {
            setCourses([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const calculateDaysRemaining = () => {
    if (!systemSetting || !systemSetting.evalWindowEndDate || !systemSetting.evalWindowStartDate) return 0;
    const startDate = new Date(systemSetting.evalWindowStartDate);
    const endDate = new Date(systemSetting.evalWindowEndDate);
    const today = new Date();
    
    if (today < startDate) return 0; // Not started yet
    
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const isWindowActive = () => {
    if (!systemSetting || !systemSetting.evalWindowEndDate || !systemSetting.evalWindowStartDate) return false;
    const startDate = new Date(systemSetting.evalWindowStartDate);
    const endDate = new Date(systemSetting.evalWindowEndDate);
    const today = new Date();
    return today >= startDate && today <= endDate;
  };

  const stats = {
    completed: courses.filter(c => c.status === 'COMPLETED').length,
    total: courses.length,
    pending: courses.filter(c => c.status === 'PENDING').length,
    daysRemaining: calculateDaysRemaining()
  };

  const pendingEvaluations = courses.filter(c => c.status === 'PENDING').slice(0, 3); // Get up to 3 pending

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications?all=true');
        if (res.ok) {
          const data = await res.json();
          if (data.notifications) {
             setNotifications(data.notifications.slice(0, 5));
          }
        }
      } catch (err) {}
    };
    fetchNotifications();
  }, []);

  const recentActivity = notifications.length > 0 ? notifications : [
    { id: 1, type: "announcement", title: "Current Evaluation Window Open", date: "Recently", read: true },
    { id: 2, type: "system", title: "Please ensure you evaluate all your courses", date: "Recently", read: true },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Command Center</h1>
          <p className="text-sm text-slate-500 mt-1">Your overview of pending actions and recent updates.</p>
        </div>
        {systemSetting?.currentTermName && (
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">Active Context</span>
            <span className="text-sm text-slate-800 font-bold">{systemSetting.currentTermName}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Evaluations Progress</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{stats.completed}</span>
                <span className="text-sm font-medium text-slate-500">/ {stats.total} Completed</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </motion.div>
          
          <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Action</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{stats.pending}</span>
                <span className="text-sm font-medium text-slate-500">To Evaluate</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <AlertCircle className="w-6 h-6" />
            </div>
          </motion.div>
          
          <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Time Remaining</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{stats.daysRemaining}</span>
                <span className="text-sm font-medium text-slate-500">Days Left</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Clock className="w-6 h-6" />
            </div>
          </motion.div>
        </div>

        {/* Action Required */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Action Required</h2>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[200px] flex flex-col justify-between">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 animate-pulse shrink-0"></div>
                  <div className="flex-1 space-y-3 mt-1">
                    <div className="w-1/3 h-5 bg-slate-100 rounded-md animate-pulse"></div>
                    <div className="w-1/2 h-4 bg-slate-100 rounded-md animate-pulse"></div>
                  </div>
                </div>
                <div className="w-full sm:w-32 h-10 bg-slate-100 rounded-xl animate-pulse ml-auto"></div>
              </div>
            ) : !studentLevel ? (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-8 text-center flex flex-col items-center justify-center h-[200px]">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-900">Academic Level Not Set</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Please set your academic level in the courses tab to view pending evaluations.</p>
                <button onClick={() => setView('courses')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                  Go to Courses
                </button>
              </div>
            ) : pendingEvaluations.length > 0 ? pendingEvaluations.map((evalItem) => (
              <div key={evalItem.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-orange-50 text-orange-600`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{evalItem.title} ({evalItem.code})</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{evalItem.lecturers.map((l: any) => l.name).join(', ')}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className={`w-3.5 h-3.5 text-orange-500`} />
                      <span className={`text-xs font-medium text-orange-600`}>
                        Pending Evaluation
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setView('evaluate')} className={`w-full sm:w-auto h-10 px-5 flex items-center justify-center rounded-xl font-medium text-sm transition-all shadow-sm bg-emerald-600 text-white hover:bg-emerald-700`}>
                  Evaluate
                </button>
              </div>
            )) : (
              <div className="bg-slate-50/50 rounded-[2rem] border-2 border-slate-200/60 border-dashed p-8 text-center h-[200px] flex flex-col items-center justify-center transition-colors hover:bg-slate-50">
                <div className="w-16 h-16 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-full flex items-center justify-center mb-4 text-emerald-500 relative">
                  <div className="absolute inset-0 rounded-full border border-emerald-100 animate-[spin_4s_linear_infinite]"></div>
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-display font-bold text-slate-800">You&apos;re all caught up!</h3>
                <p className="text-sm text-slate-500 mt-1">You have completed all pending evaluations for the semester.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Recent Activity</h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {recentActivity.map((activity) => {
                const isRead = activity.isRead !== undefined ? activity.isRead : activity.read;
                return (
                <div key={activity.id} className={`p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-default ${!isRead ? 'bg-emerald-50/30' : ''}`}>
                  <div className={`mt-0.5 shrink-0 ${!isRead ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-sm ${!isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {activity.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : activity.date}</p>
                  </div>
                </div>
              )})}
            </div>
            <button className="w-full p-3 text-sm font-medium text-emerald-600 hover:bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-1 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
