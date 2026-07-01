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
    <div className="max-w-7xl mx-auto mt-6 md:mt-10 px-4 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center justify-center md:justify-start gap-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          Evaluation Receipts
        </h1>
        <p className="text-slate-500 mt-2 text-base max-w-2xl mx-auto md:mx-0">
          A historical ledger of the feedback you have provided. Details are read-only to maintain data integrity once submitted.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.map((evaluation) => {
          return (
            <div 
              key={evaluation.id} 
              className="rounded-3xl bg-white border border-slate-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col hover:shadow-md transition-all group relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="p-6 pb-5 border-b border-slate-100 flex items-start justify-between gap-4 relative bg-slate-50/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" />
                      Finalized
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {new Date(evaluation.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-2">{evaluation.courseLecturer.course.title}</h3>
                  <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{evaluation.courseLecturer.course.code}</div>
                </div>
                
                <div className="flex flex-col items-center justify-center shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200/60">
                   <span className="text-lg font-black text-slate-800 leading-none">{evaluation.ratingQuantitative}</span>
                   <Star className="w-3 h-3 fill-amber-400 text-amber-400 mt-0.5" />
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lecturer</div>
                    <div className="text-sm font-semibold text-slate-800">{evaluation.courseLecturer.lecturer.firstName} {evaluation.courseLecturer.lecturer.lastName}</div>
                  </div>
                </div>

                {evaluation.themes && evaluation.themes.length > 0 ? (
                  <div className="mt-auto pt-5 border-t border-slate-100/80">
                    <div className="flex items-center mb-2">
                       <Tag className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identified Themes</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {evaluation.themes.map((theme: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-200/60">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                   <div className="mt-auto pt-5 border-t border-slate-100/80">
                      <div className="text-xs text-slate-400 italic">No specific themes generated.</div>
                   </div>
                )}
              </div>
            </div>
          );
        })}

        {history.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-16 text-center border border-slate-200/80 border-dashed rounded-[2rem] bg-slate-50">
            <CheckCircle2 className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No evaluations submitted yet.</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">Your completed evaluation receipts and extracted themes will appear here once you evaluate your courses.</p>
          </div>
        )}
      </div>
    </div>
  );
}
