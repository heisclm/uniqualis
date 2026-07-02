"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Search, Filter, MessageSquare, CheckCircle2, Clock, AlertCircle, FileText, ChevronRight, User, BookOpen } from "lucide-react";

type ActionPlan = {
  id: string;
  lecturerName: string;
  course: string;
  term: string;
  submittedAt: string;
  status: "Pending Review" | "Approved" | "Needs Revision";
  originalFeedbackSummary: string;
  actionPlanText: string;
  officialNotes?: string;
};

export function QAActionPlans() {
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [activeFilter, setActiveFilter] = useState<"All" | "Pending Review" | "Approved" | "Needs Revision">("Pending Review");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/qa-action-plans');
        if (res.ok) {
          const data = await res.json();
          // Map backend status to frontend status
          const mappedData = data.map((d: any) => ({
            ...d,
            status: d.status === "PENDING_REVIEW" ? "Pending Review" : d.status === "APPROVED" ? "Approved" : "Needs Revision"
          }));
          setPlans(mappedData);
        }
      } catch (error) {
        console.error("Failed to fetch QA action plans:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handlePlanUpdate = async (updated: ActionPlan) => {
    try {
      const apiStatus = updated.status === "Pending Review" ? "PENDING_REVIEW" : updated.status === "Approved" ? "APPROVED" : "NEEDS_REVISION";
      const res = await fetch(`/api/qa-action-plans/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: apiStatus, officialNotes: updated.officialNotes }),
      });
      if (res.ok) {
        setPlans(plans.map(p => p.id === updated.id ? updated : p));
        setSelectedPlan(updated);
      }
    } catch (error) {
      console.error("Failed to update QA action plan:", error);
    }
  };

  const filteredPlans = plans.filter(plan => {
    if (activeFilter !== "All" && plan.status !== activeFilter) return false;
    if (searchQuery && !plan.lecturerName.toLowerCase().includes(searchQuery.toLowerCase()) && !plan.course.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-80px)] overflow-y-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
            QA Action Plans
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            Review and track closed-loop quality assurance plans submitted by faculty members in response to course evaluations.
          </p>
        </div>
      </div>

      {selectedPlan ? (
        <ActionPlanDetail 
          plan={selectedPlan} 
          onBack={() => setSelectedPlan(null)} 
          onUpdate={handlePlanUpdate}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          {/* Filters & Search */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
              {["Pending Review", "All", "Approved", "Needs Revision"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    activeFilter === filter 
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" 
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search faculty or course..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* List */}
          {loading ? (
             <div className="p-12 text-center text-slate-500">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
               <p>Loading action plans...</p>
             </div>
          ) : (
          <div className="divide-y divide-slate-100">
            {filteredPlans.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>No action plans found matching your criteria.</p>
              </div>
            ) : (
              filteredPlans.map(plan => (
                <div 
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className="p-5 hover:bg-emerald-50/50 transition-colors cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                      plan.status === 'Pending Review' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                      plan.status === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                      'bg-rose-50 border-rose-200 text-rose-600'
                    }`}>
                      {plan.status === 'Pending Review' ? <Clock className="w-5 h-5" /> :
                       plan.status === 'Approved' ? <CheckCircle2 className="w-5 h-5" /> :
                       <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{plan.lecturerName}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">{plan.course}</span>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-1 max-w-xl">
                        {plan.actionPlanText}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 md:flex-col md:items-end md:gap-1 text-sm pl-14 md:pl-0">
                    <span className="text-slate-400 font-medium whitespace-nowrap">
                      {new Date(plan.submittedAt).toLocaleDateString()}
                    </span>
                    <span className={`font-semibold ${
                      plan.status === 'Pending Review' ? 'text-amber-600' :
                      plan.status === 'Approved' ? 'text-emerald-600' :
                      'text-rose-600'
                    }`}>
                      {plan.status}
                    </span>
                  </div>
                  
                  <div className="hidden md:flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              ))
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionPlanDetail({ plan, onBack, onUpdate }: { plan: ActionPlan, onBack: () => void, onUpdate: (plan: ActionPlan) => void }) {
  const [notes, setNotes] = useState(plan.officialNotes || "");

  const handleStatusChange = (newStatus: ActionPlan["status"]) => {
    onUpdate({ ...plan, status: newStatus, officialNotes: notes });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors mb-4"
          >
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to Plans
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-slate-900">{plan.lecturerName}</h2>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
              plan.status === 'Pending Review' ? 'bg-amber-50 border-amber-200 text-amber-700' :
              plan.status === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
              'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              {plan.status}
            </span>
          </div>
          <p className="text-slate-500 flex items-center gap-2 text-sm font-medium">
            <BookOpen className="w-4 h-4" /> {plan.course} ({plan.term})
            <span className="text-slate-300">|</span>
            Submitted: {new Date(plan.submittedAt).toLocaleDateString()}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button 
            onClick={() => handleStatusChange("Needs Revision")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" /> Request Revision
          </button>
          <button 
            onClick={() => handleStatusChange("Approved")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve Plan
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Context & The Plan */}
        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Context: Evaluation Summary</h3>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-slate-700 text-sm leading-relaxed relative">
              <MessageSquare className="w-8 h-8 text-slate-200 absolute top-4 right-4" />
              &quot;{plan.originalFeedbackSummary}&quot;
            </div>
          </section>
          
          <section>
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">Submitted Action Plan</h3>
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 text-slate-800 leading-relaxed shadow-inner">
              {plan.actionPlanText}
            </div>
          </section>
        </div>

        {/* Right Column: Official Response */}
        <div className="lg:border-l border-slate-100 lg:pl-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Dean / QA Notes</h3>
          <p className="text-sm text-slate-500 mb-4">
            Leave private notes or feedback that will be sent to the lecturer along with your decision.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g., This looks great, but please ensure you communicate these changes clearly in your week 1 syllabus..."
            className="w-full h-48 p-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all shadow-sm"
          ></textarea>
        </div>
      </div>
    </div>
  );
}


