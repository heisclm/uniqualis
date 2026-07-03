"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle, AlertTriangle, LayoutTemplate, Loader2, ArrowRight, Bell, Zap, Clock, ShieldCheck, Download } from "lucide-react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface MetricsData {
  totalEvaluations: number;
  totalDepartments: number;
  flaggedReports: number;
  alerts?: { title: string, time: string, type: 'critical' | 'warning' | 'info' }[];
}

export function AdminDashboard({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [data, setData] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingEvaluation, setIsTogglingEvaluation] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [isExtractingSummary, setIsExtractingSummary] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/admin/metrics');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const json = await response.json();
        if (isMounted) {
           setData(json);
           setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
           setData((prev) => {
             if (!prev) setError(err.message);
             return prev;
           });
        }
      } finally {
        if (isMounted) {
           setIsLoading(false);
        }
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000); // Poll every 15s for "Live" feel
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleToggleEvaluation = async () => {
    setIsTogglingEvaluation(true);
    const toastId = toast.loading("Updating evaluation status...");
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_evaluation' })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      toast.success("Evaluation window status updated.", { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsTogglingEvaluation(false);
    }
  };

  const handleSendReminders = async () => {
    setIsSendingReminders(true);
    const toastId = toast.loading("Dispatching reminders...");
    try {
      const res = await fetch('/api/admin/notifications/reminders', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send reminders");
      }
      toast.success("Reminders dispatched successfully.", { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsSendingReminders(false);
    }
  };

  const handleExtractSummary = async () => {
    setIsExtractingSummary(true);
    const toastId = toast.loading("Generating executive summary...");
    try {
      const res = await fetch('/api/admin/reports/executive-summary');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch summary data");
      }
      const metrics = await res.json();
      
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(40, 40, 40);
      doc.text("UniQualis Executive Summary", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      
      autoTable(doc, {
        startY: 40,
        head: [['Metric', 'Total Count']],
        body: [
          ['Total Faculties', metrics.totalFaculties || 0],
          ['Total Departments', metrics.totalDepartments || 0],
          ['Total Courses', metrics.totalCourses || 0],
          ['Total Users', metrics.totalUsers || 0],
          ['Total Evaluations', metrics.totalEvaluations || 0],
          ['Active Templates', metrics.activeTemplates || 0],
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 12, cellPadding: 6 },
      });
      
      doc.save(`executive-summary-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("Executive summary generated.", { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsExtractingSummary(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full p-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full p-12">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 border border-red-100 shadow-sm">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  const { totalEvaluations, totalDepartments, flaggedReports } = data || {
    totalEvaluations: 0,
    totalDepartments: 0,
    flaggedReports: 0,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6"
    >
      
      {/* Header Area */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operational Command Center</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time system status and immediate actions.</p>
        </div>
        <div className="flex gap-3">
          <div className="h-10 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2 text-sm font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Online
          </div>
        </div>
      </motion.div>

      {/* Onboarding / First-Login Banner */}
      {totalDepartments === 0 && (
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden border border-slate-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Zap className="w-6 h-6 text-emerald-400" />
              Welcome to UniQualis
            </h2>
            <p className="text-slate-300 max-w-2xl mb-6">
              Your system is currently empty. To get started, you need to build the institution&apos;s hierarchy. 
              Begin by creating Faculties and Departments, and then provision user accounts for Deans, HODs, and Lecturers.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => onNavigate?.('hierarchy')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <LayoutTemplate className="w-5 h-5" />
                Build Hierarchy
              </button>
              <button 
                onClick={() => onNavigate?.('users')}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-colors border border-white/10 flex items-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                Provision Users
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Top 3 Stat Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col justify-between aspect-auto sm:aspect-[4/3] group hover:border-emerald-200 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-1">Active Evaluations</p>
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight">{totalEvaluations.toLocaleString()}</h2>
            </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col justify-between aspect-auto sm:aspect-[4/3] group hover:border-emerald-200 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-1">Departments Evaluated</p>
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight">{totalDepartments.toLocaleString()}</h2>
            </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col justify-between aspect-auto sm:aspect-[4/3] group hover:border-amber-200 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-1">Action Required</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold text-slate-900 tracking-tight">{flaggedReports.toLocaleString()}</h2>
                <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">alerts</span>
              </div>
            </div>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Critical Alerts Feed */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col h-[500px] w-full lg:w-1/2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                Live Alert Feed
              </h3>
              <p className="text-xs text-slate-500 mt-1">Issues requiring immediate attention.</p>
            </div>
            <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">Mark all read</button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {(data?.alerts && data.alerts.length > 0 ? data.alerts : [
              { title: "System running smoothly", time: "Just now", type: "info" }
            ]).map((alert: any, i: number) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-slate-200 transition-all group cursor-pointer">
                <div className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${alert.type === 'critical' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 leading-snug group-hover:text-emerald-600 transition-colors">{alert.title}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">{alert.time}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions Matrix */}
        <motion.div variants={itemVariants} className="bg-slate-900 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-white relative overflow-hidden flex flex-col h-auto lg:h-[500px] w-full lg:w-1/2">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>
          
          <div className="relative z-10 mb-8">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              Quick Actions
            </h3>
            <p className="text-sm text-slate-400 mt-1">Frequent administrative tasks.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 h-full">
            <button 
              disabled={isTogglingEvaluation}
              onClick={handleToggleEvaluation}
              className="flex flex-col items-start p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-emerald-600/20 hover:border-emerald-500/30 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                {isTogglingEvaluation ? <Loader2 className="w-5 h-5 animate-spin" /> : <LayoutTemplate className="w-5 h-5" />}
              </div>
              <h4 className="font-semibold text-white mb-1">Open/Close Evaluation Window</h4>
              <p className="text-xs text-slate-400 line-clamp-2">Toggle global evaluation period.</p>
            </button>
            
            <button 
              disabled={isSendingReminders}
              onClick={handleSendReminders}
              className="flex flex-col items-start p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-amber-500/20 hover:border-amber-500/30 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                {isSendingReminders ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
              </div>
              <h4 className="font-semibold text-white mb-1">Send Reminders</h4>
              <p className="text-xs text-slate-400 line-clamp-2">Dispatch automated email reminders to pending students.</p>
            </button>

            <button 
              onClick={() => onNavigate?.('reports')}
              className="flex flex-col items-start p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-white mb-1">Review Flagged Feed</h4>
              <p className="text-xs text-slate-400 line-clamp-2">Resolve pending flagged submissions manually.</p>
            </button>

            <button 
              disabled={isExtractingSummary}
              onClick={handleExtractSummary}
              className="flex flex-col items-start p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                {isExtractingSummary ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              </div>
              <h4 className="font-semibold text-white mb-1">Extract Executive Summary</h4>
              <p className="text-xs text-slate-400 line-clamp-2">Download a 1-page digest of current term metrics.</p>
            </button>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}



