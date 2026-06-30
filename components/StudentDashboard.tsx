import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Clock, AlertCircle, Bell, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";

export function StudentDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/student/courses');
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
        }
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const stats = {
    completed: courses.filter(c => c.status === 'COMPLETED').length,
    total: courses.length,
    pending: courses.filter(c => c.status === 'PENDING').length,
    daysRemaining: 14 // Mocked for now, would typically come from an active term setting
  };

  const pendingEvaluations = courses.filter(c => c.status === 'PENDING').slice(0, 3); // Get up to 3 pending

  const recentActivity = [
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
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
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
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex justify-center items-center h-[200px]">
                 <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : pendingEvaluations.length > 0 ? pendingEvaluations.map((evalItem) => (
              <div key={evalItem.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                <Link href={`/dashboard/evaluate/${evalItem.id}`} className={`w-full sm:w-auto h-10 px-5 flex items-center justify-center rounded-xl font-medium text-sm transition-all shadow-sm bg-blue-600 text-white hover:bg-blue-700`}>
                  Evaluate
                </Link>
              </div>
            )) : (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-900">All caught up!</h3>
                <p className="text-xs text-slate-500 mt-1">You have completed all pending evaluations.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Recent Activity</h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {recentActivity.map((activity) => (
                <div key={activity.id} className={`p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-default ${!activity.read ? 'bg-blue-50/30' : ''}`}>
                  <div className={`mt-0.5 shrink-0 ${!activity.read ? 'text-blue-600' : 'text-slate-400'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-sm ${!activity.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {activity.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full p-3 text-sm font-medium text-blue-600 hover:bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-1 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
