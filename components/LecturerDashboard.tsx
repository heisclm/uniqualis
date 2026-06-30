"use client";

import { useState, useEffect } from "react";
import { Loader2, Bell, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { DashboardMetrics } from "@/components/lecturer/DashboardMetrics";

export function LecturerDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({ averageRating: "0.0", totalEvaluations: 0, pendingResponses: 0, recentActivity: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/lecturer/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData({
            averageRating: json.averageRating,
            totalEvaluations: json.totalEvaluations,
            pendingResponses: json.pendingResponses,
            recentActivity: json.recentActivity || []
          });
        }
      } catch (err) {
        console.error("Failed to fetch lecturer dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] w-full">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const { averageRating, totalEvaluations: totalStudents, pendingResponses: pendingEvals, recentActivity } = data;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Mission Control</h1>
          <p className="text-sm text-slate-500 mt-1">An immediate, high-level snapshot of your current operational state.</p>
        </div>
      </div>

      {/* Action Required Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50 rounded-2xl p-4 md:p-5 border border-amber-200/60 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">Evaluation Window Closing</h3>
            <p className="text-sm text-amber-700 mt-0.5">The evaluation window for <span className="font-semibold">CS101 (Intro to Computer Science)</span> closes in 2 days. Remind your students to participate.</p>
          </div>
        </div>

        <div className="bg-indigo-50 rounded-2xl p-4 md:p-5 border border-indigo-200/60 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-indigo-900">Pending Feedback Responses</h3>
            <p className="text-sm text-indigo-700 mt-0.5">You have <span className="font-semibold">5 unread</span> qualitative feedback comments waiting for your formal response.</p>
          </div>
        </div>
      </div>

      {/* Quick Stats via DashboardMetrics - adapting props temporarily */}
      <DashboardMetrics 
        averageRating={averageRating} 
        totalEvaluations={totalStudents} 
        pendingResponses={pendingEvals} 
      />

      {/* Recent Activity Feed */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-400" />
          Recent Activity Feed
        </h2>
        
        <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 overflow-hidden">
          <div className="divide-y divide-slate-100">
            <div className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-800 font-medium">New anonymous feedback received for PHY201.</p>
                <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-800 font-medium">Evaluation window for MAT302 successfully closed.</p>
                <p className="text-xs text-slate-500 mt-1">Yesterday at 11:59 PM</p>
              </div>
            </div>
            <div className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-800 font-medium">System notification: Platform maintenance scheduled for this weekend.</p>
                <p className="text-xs text-slate-500 mt-1">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// Add MessageSquare since it was missing in lucide-react import
import { MessageSquare } from "lucide-react";
