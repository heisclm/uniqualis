import { useState, useEffect } from "react";
import { CheckCircle2, BookOpen, Clock, Star, Tag } from "lucide-react";

export function EvaluationHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/student/evaluations');
        if (res.ok) {
          const data = await res.json();
          setHistory(data.evaluations || []);
        }
      } catch (err) {
        console.error("Failed to fetch evaluation history", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-6 md:mt-10 px-4 pb-10 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Evaluation Receipts</h1>
        <p className="text-sm text-slate-500 mt-1">A historical ledger of the feedback you have provided. Details are read-only to maintain data integrity once submitted.</p>
      </div>

      <div className="grid gap-6">
        {history.map((evaluation) => {
          return (
            <div 
              key={evaluation.id} 
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg">{evaluation.courseLecturer.course.title} ({evaluation.courseLecturer.course.code})</h3>
                    <p className="text-sm text-slate-500 mt-1">Lecturer: {evaluation.courseLecturer.lecturer.firstName} {evaluation.courseLecturer.lecturer.lastName}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs font-medium text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      Submitted on {new Date(evaluation.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wide border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Finalized
                  </span>
                  
                  <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                    <span className="text-sm font-bold text-amber-700 mr-1">{evaluation.ratingQuantitative}</span>
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                </div>
              </div>
              
              {evaluation.themes && evaluation.themes.length > 0 && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag className="w-4 h-4 text-slate-400 mr-1" />
                    {evaluation.themes.map((theme: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-md border border-slate-200">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {history.length === 0 && (
          <div className="p-12 text-center border border-slate-200 border-dashed rounded-3xl bg-slate-50">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">You have not submitted any evaluations yet.</p>
            <p className="text-sm text-slate-400 mt-1">Your completed evaluations will appear here as receipts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
