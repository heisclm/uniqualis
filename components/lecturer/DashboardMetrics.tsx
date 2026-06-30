"use client";

import { Star, MessageSquare, Users } from "lucide-react";

interface DashboardMetricsProps {
  averageRating: string;
  totalEvaluations: number;
  pendingResponses: number;
}

export function DashboardMetrics({ averageRating, totalEvaluations, pendingResponses }: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Star className="w-7 h-7 fill-current" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Average Rating</p>
          <h3 className="text-2xl font-bold text-slate-800">{averageRating} <span className="text-sm font-medium text-slate-400">/ 5.0</span></h3>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Users className="w-7 h-7" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Total Evaluations</p>
          <h3 className="text-2xl font-bold text-slate-800">{totalEvaluations}</h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <MessageSquare className="w-7 h-7" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Pending Responses</p>
          <h3 className="text-2xl font-bold text-slate-800">{pendingResponses}</h3>
        </div>
      </div>
    </div>
  );
}
