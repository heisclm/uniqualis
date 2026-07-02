"use client";

import { useState, useEffect } from "react";
import { Loader2, Bell, AlertCircle, CheckCircle2, Clock, MessageSquare, ShieldAlert, ChevronRight } from "lucide-react";
import { DashboardMetrics } from "@/components/lecturer/DashboardMetrics";

interface FeedbackItem {
  id: string;
  sentimentScore: string;
  themes: string[];
  ratingQualitative: string;
  createdAt: string;
  isFlagged: boolean;
  course: {
    title: string;
    code: string;
  };
}

interface TermContext {
  academicYear: string;
  semester: string;
}

export function LecturerDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({ 
    averageRating: "0.0", 
    totalEvaluations: 0, 
    pendingResponses: 0, 
    recentFeedback: [] as FeedbackItem[],
    activeTerm: null as string | null,
    isEvalWindowActive: false
  });

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
            recentFeedback: json.recentFeedback || [],
            activeTerm: json.activeTerm,
            isEvalWindowActive: json.isEvalWindowActive
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
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  const { averageRating, totalEvaluations: totalStudents, pendingResponses: pendingEvals, recentFeedback, activeTerm, isEvalWindowActive } = data;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Mission Control</h1>
          <p className="text-sm text-slate-500 mt-1">An immediate, high-level snapshot of your current operational state.</p>
        </div>
        {activeTerm && (
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">Active Context</span>
            <span className="text-sm text-slate-800 font-bold">{activeTerm}</span>
          </div>
        )}
      </div>

      {/* Action Required Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isEvalWindowActive && activeTerm && (
          <div className="bg-amber-50 rounded-2xl p-4 md:p-5 border border-amber-200/60 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Evaluation Window Active</h3>
              <p className="text-sm text-amber-700 mt-0.5">The evaluation window for <span className="font-semibold">{activeTerm}</span> is currently active. Remind your students to participate.</p>
            </div>
          </div>
        )}

        <div className="bg-teal-50 rounded-2xl p-4 md:p-5 border border-teal-200/60 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-teal-900">Pending Feedback Responses</h3>
            <p className="text-sm text-teal-700 mt-0.5">You have <span className="font-semibold">{pendingEvals} unread</span> qualitative feedback comments waiting for your formal response.</p>
          </div>
        </div>
      </div>

      {/* Quick Stats via DashboardMetrics */}
      <DashboardMetrics 
        averageRating={averageRating} 
        totalEvaluations={totalStudents} 
        pendingResponses={pendingEvals} 
      />

      {/* Actionable Feedback Feed */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-400" />
          Actionable Feedback Feed
        </h2>
        
        <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {recentFeedback && recentFeedback.length > 0 ? (
              recentFeedback.map((feedback) => (
                <div key={feedback.id} className={`p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors ${feedback.isFlagged ? 'bg-red-50/30' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${feedback.isFlagged ? 'bg-red-100 border border-red-200' : 'bg-slate-50 border border-slate-100'}`}>
                    {feedback.isFlagged ? (
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800">{feedback.course.code} - {feedback.course.title}</h4>
                      <span className="text-xs text-slate-500">{new Date(feedback.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <p className="text-sm text-slate-600 font-medium mt-1">&quot;{feedback.ratingQualitative}&quot;</p>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {feedback.sentimentScore && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          feedback.sentimentScore === 'POSITIVE' ? 'bg-emerald-100 text-emerald-700' :
                          feedback.sentimentScore === 'NEGATIVE' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {feedback.sentimentScore}
                        </span>
                      )}
                      {feedback.themes.map((theme, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                  {feedback.isFlagged && (
                    <button className="text-sm text-teal-600 font-semibold hover:text-teal-700 flex items-center whitespace-nowrap active:scale-95 transition-transform">
                      Reply
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5 text-slate-300" />
                </div>
                No actionable feedback at this time.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
