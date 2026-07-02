"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Star, MessageSquare, AlertTriangle, ShieldCheck, CheckCircle2, Lock } from "lucide-react";
import { EvidenceDropzone } from "@/components/EvidenceDropzone";

export interface Evaluation {
  id: string;
  course: { code: string; title: string };
  academicDate: string;
  ratingQuantitative: number | null;
  ratingQualitative: string | null;
  isFlagged: boolean;
  createdAt: string;
  isMasked: boolean;
  _totalForCourse: number;
  responses?: {
    id: string;
    text: string | null;
    score: number | null;
    criterion: {
      question: string;
      type: string;
    }
  }[];
  lecturerResponse: {
    id: string;
    content: string;
    createdAt: string;
    attachments: { url: string; fileName: string; fileType: string }[];
  } | null;
}

interface EvaluationCardProps {
  evaluation: Evaluation;
  onResponseSubmitted: () => void;
}

export function EvaluationCard({ evaluation, onResponseSubmitted }: EvaluationCardProps) {
  const [isResponding, setIsResponding] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) return;
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/lecturer/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationId: evaluation.id,
          content: responseText,
          attachments
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit response');
      }
      
      setIsResponding(false);
      setResponseText("");
      setAttachments([]);
      onResponseSubmitted();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="p-6 md:p-8">
        
        {/* Header Info */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg tracking-wide uppercase">
                {evaluation.course.code}
              </span>
              <span className="text-sm font-medium text-slate-500">
                {format(new Date(evaluation.createdAt), 'MMM d, yyyy')}
              </span>
              {evaluation.isFlagged && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-lg">
                  <AlertTriangle className="w-3 h-3" /> Flagged for review
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-800">{evaluation.course.title}</h3>
          </div>
          <div className="flex gap-1 items-center">
            {evaluation.isMasked ? (
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1.5 rounded-lg flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Score Hidden
              </span>
            ) : (
              [1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-5 h-5 ${star <= (evaluation.ratingQuantitative || 0) ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"}`} 
                />
              ))
            )}
          </div>
        </div>

        {/* Granular Feedback */}
        {!evaluation.isMasked && evaluation.responses && evaluation.responses.length > 0 && (
          <div className="mb-6 space-y-4">
            {evaluation.responses.map(resp => (
              <div key={resp.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{resp.criterion.question}</p>
                {resp.criterion.type === 'SCALE' && resp.score !== null ? (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= resp.score! ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} 
                      />
                    ))}
                  </div>
                ) : resp.text ? (
                  <p className="text-sm text-slate-700 leading-relaxed">&quot;{resp.text}&quot;</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No response provided</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Qualitative Feedback (Legacy Support) */}
        {evaluation.isMasked ? (
          <div className="bg-slate-50/80 rounded-2xl p-6 mb-6 text-slate-500 text-sm leading-relaxed border border-slate-100 border-dashed flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200/50 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-700">Feedback Masked for Anonymity</p>
              <p className="text-slate-500 mt-0.5">This evaluation is hidden because the course batch has only {evaluation._totalForCourse} response{evaluation._totalForCourse !== 1 ? 's' : ''} (minimum 5 required).</p>
            </div>
          </div>
        ) : evaluation.ratingQualitative ? (
          <div className="bg-slate-50 rounded-2xl p-5 mb-6 text-slate-700 text-sm leading-relaxed border border-slate-100">
            &quot;{evaluation.ratingQualitative}&quot;
          </div>
        ) : (
          <div className="mb-6 text-sm text-slate-400 italic">No qualitative feedback provided.</div>
        )}

        {/* Action Plan (Closed-Loop QA) Section */}
        {evaluation.lecturerResponse ? (
          <div className="ml-4 md:ml-8 relative mt-4">
            <div className="absolute -left-4 md:-left-8 top-6 bottom-0 w-px bg-teal-100"></div>
            <div className="absolute -left-4 md:-left-8 top-6 w-4 md:w-8 h-px bg-teal-100"></div>
            
            <div className="bg-teal-50/50 rounded-2xl p-5 border border-teal-100/50 relative">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-teal-500" />
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wide">QA Action Plan Submitted</span>
                <span className="text-xs font-medium text-teal-400 ml-auto">
                  {format(new Date(evaluation.lecturerResponse.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              <p className="text-sm text-teal-900/80 leading-relaxed mb-3">
                {evaluation.lecturerResponse.content}
              </p>
              
              {evaluation.lecturerResponse.attachments?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-teal-100">
                  <span className="text-xs font-bold text-teal-400 uppercase w-full">Attached Evidence</span>
                  {evaluation.lecturerResponse.attachments.map((att, idx) => (
                    <a 
                      key={idx}
                      href={att.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white border border-teal-100 rounded-lg text-xs font-medium text-teal-600 hover:bg-teal-50 transition-colors truncate max-w-[200px]"
                    >
                      {att.fileName}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : evaluation.ratingQualitative && isResponding ? (
          <div className="ml-4 md:ml-8 mt-4 animate-in fade-in slide-in-from-top-2">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-500" />
              <span className="text-xs font-bold text-slate-700">Closed-Loop QA: Submit Action Plan</span>
            </div>
            <textarea 
              autoFocus
              rows={4}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Outline the steps you will take to address this feedback..."
              className="w-full bg-white border border-teal-200 text-slate-700 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all resize-none shadow-sm shadow-teal-100/50 mb-4"
            ></textarea>
            
            <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Attach Evidence (Optional)</p>
              <EvidenceDropzone 
                onUploadComplete={(attachments) => {
                  setAttachments(attachments);
                }} 
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-3">
              <button 
                onClick={() => { setIsResponding(false); setResponseText(""); setAttachments([]); }}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitResponse}
                disabled={isSubmitting || !responseText.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white text-sm font-medium rounded-full hover:bg-teal-700 transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Action Plan
                  </>
                )}
              </button>
            </div>
          </div>
        ) : evaluation.ratingQualitative ? (
          <div className="flex justify-end mt-4">
            <button 
              onClick={() => setIsResponding(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 hover:text-teal-700 transition-colors active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              Create Action Plan
            </button>
          </div>
        ) : null}

      </div>
    </div>
  );
}
