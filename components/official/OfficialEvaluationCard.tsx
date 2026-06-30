"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Star, MessageSquare, AlertTriangle, ShieldCheck, CheckCircle2, Lock, FileText, BadgeCheck } from "lucide-react";
import { EvidenceDropzone } from "@/components/EvidenceDropzone";

export interface EvaluationForOfficial {
  id: string;
  ratingQuantitative: number | null;
  ratingQualitative: string | null;
  isFlagged: boolean;
  createdAt: string;
  courseLecturer: {
    course: { code: string; title: string };
    lecturer: { firstName: string; lastName: string };
  };
  lecturerResponse: {
    content: string;
    createdAt: string;
    attachments: { url: string; fileName: string; fileType: string }[];
  } | null;
  adminComments: {
    id: string;
    content: string;
    isCommendation: boolean;
    createdAt: string;
    official: { firstName: string; lastName: string };
    attachments: { url: string; fileName: string; fileType: string }[];
  }[];
}

interface OfficialEvaluationCardProps {
  evaluation: EvaluationForOfficial;
  onCommentSubmitted: () => void;
}

export function OfficialEvaluationCard({ evaluation, onCommentSubmitted }: OfficialEvaluationCardProps) {
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommendation, setIsCommendation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/official/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationId: evaluation.id,
          content: commentText,
          isCommendation,
          attachments
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit comment');
      }
      
      setIsCommenting(false);
      setCommentText("");
      setIsCommendation(false);
      setAttachments([]);
      onCommentSubmitted();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
      <div className="p-6 md:p-8">
        
        {/* Header Info */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg tracking-wide uppercase">
                {evaluation.courseLecturer.course.code}
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
            <h3 className="text-base font-bold text-slate-800 mb-1">{evaluation.courseLecturer.course.title}</h3>
            <p className="text-sm text-slate-500 font-medium">
              Lecturer: {evaluation.courseLecturer.lecturer.firstName} {evaluation.courseLecturer.lecturer.lastName}
            </p>
          </div>
          <div className="flex gap-1 items-center shrink-0">
            {evaluation.ratingQuantitative === null ? (
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

        {/* Qualitative Feedback */}
        {evaluation.ratingQualitative ? (
          <div className="bg-slate-50 rounded-2xl p-5 mb-6 text-slate-700 text-sm leading-relaxed border border-slate-100">
            &quot;{evaluation.ratingQualitative}&quot;
          </div>
        ) : (
          <div className="mb-6 text-sm text-slate-400 italic">No qualitative feedback provided.</div>
        )}

        <div className="relative pl-4 md:pl-8 border-l border-slate-100 space-y-6">
          {/* Lecturer Response Section */}
          {evaluation.lecturerResponse && (
            <div className="relative">
              <div className="absolute -left-[1.05rem] md:-left-[2.05rem] top-3 w-3 h-3 bg-indigo-200 rounded-full border-2 border-white"></div>
              <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Lecturer Response</span>
                  <span className="text-xs font-medium text-indigo-400 ml-auto">
                    {format(new Date(evaluation.lecturerResponse.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <p className="text-sm text-indigo-900/80 leading-relaxed mb-3">
                  {evaluation.lecturerResponse.content}
                </p>
                
                {evaluation.lecturerResponse.attachments?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-indigo-100">
                    <span className="text-xs font-bold text-indigo-400 uppercase w-full">Attached Evidence</span>
                    {evaluation.lecturerResponse.attachments.map((att, idx) => (
                      <a 
                        key={idx}
                        href={att.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white border border-indigo-100 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors truncate max-w-[200px]"
                      >
                        {att.fileName}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Administrative Comments */}
          {evaluation.adminComments.map((comment) => (
            <div key={comment.id} className="relative">
              <div className="absolute -left-[1.05rem] md:-left-[2.05rem] top-3 w-3 h-3 bg-emerald-200 rounded-full border-2 border-white"></div>
              <div className={`rounded-2xl p-5 border ${comment.isCommendation ? 'bg-amber-50/50 border-amber-100/50' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {comment.isCommendation ? <BadgeCheck className="w-4 h-4 text-amber-500" /> : <FileText className="w-4 h-4 text-slate-500" />}
                  <span className={`text-xs font-bold uppercase tracking-wide ${comment.isCommendation ? 'text-amber-700' : 'text-slate-700'}`}>
                    Official Note {comment.isCommendation && "(Commendation)"}
                  </span>
                  <span className="text-xs font-medium text-slate-400 ml-auto flex flex-col items-end">
                    <span>{comment.official.firstName} {comment.official.lastName}</span>
                    <span>{format(new Date(comment.createdAt), 'MMM d, yyyy')}</span>
                  </span>
                </div>
                <p className={`text-sm leading-relaxed mb-3 ${comment.isCommendation ? 'text-amber-900/80' : 'text-slate-600'}`}>
                  {comment.content}
                </p>
                {comment.attachments?.length > 0 && (
                  <div className={`flex flex-wrap gap-2 mt-4 pt-4 border-t ${comment.isCommendation ? 'border-amber-100' : 'border-slate-100'}`}>
                    <span className="text-xs font-bold text-slate-400 uppercase w-full">Attached Files</span>
                    {comment.attachments.map((att, idx) => (
                      <a 
                        key={idx}
                        href={att.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors truncate max-w-[200px]"
                      >
                        {att.fileName}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Comment Form */}
          {isCommenting ? (
            <div className="relative mt-4 animate-in fade-in slide-in-from-top-2">
              <div className="absolute -left-[1.05rem] md:-left-[2.05rem] top-3 w-3 h-3 bg-slate-200 rounded-full border-2 border-white"></div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm shadow-slate-100">
                <textarea 
                  autoFocus
                  rows={4}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Draft your administrative note or commendation..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none mb-4"
                ></textarea>
                
                <div className="flex items-center gap-2 mb-4">
                  <input 
                    type="checkbox" 
                    id={`commendation-${evaluation.id}`}
                    checked={isCommendation}
                    onChange={(e) => setIsCommendation(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor={`commendation-${evaluation.id}`} className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4 text-amber-500" />
                    Mark as Official Commendation
                  </label>
                </div>

                <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Attach Files (Optional)</p>
                  <EvidenceDropzone 
                    onUploadComplete={(attachments) => {
                      setAttachments(attachments);
                    }} 
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-3">
                  <button 
                    onClick={() => { setIsCommenting(false); setCommentText(""); setAttachments([]); setIsCommendation(false); }}
                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmitComment}
                    disabled={isSubmitting || !commentText.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-full hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Submit Note
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative mt-4">
              <div className="absolute -left-[1.05rem] md:-left-[2.05rem] top-3 w-3 h-3 bg-slate-100 rounded-full border-2 border-white"></div>
              <button 
                onClick={() => setIsCommenting(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors border border-slate-200 border-dashed"
              >
                <MessageSquare className="w-4 h-4" />
                Add Administrative Note
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
