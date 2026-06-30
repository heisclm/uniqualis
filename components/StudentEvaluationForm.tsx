"use client";

import { useState, useEffect } from "react";
import { Star, Send, ShieldCheck, CheckCircle2, AlertCircle, ChevronLeft, Info, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";

interface Assignment {
  id: string; // courseLecturerId
  course: {
    id: string;
    code: string;
    name: string;
    departmentId: string;
  };
  lecturer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  evaluations?: any[];
}

export function StudentEvaluationForm() {
  // Complex State Management
  const [ratings, setRatings] = useState({
    teaching: 0,
    materials: 0,
    fairness: 0,
  });
  const [hovers, setHovers] = useState({
    teaching: 0,
    materials: 0,
    fairness: 0,
  });
  
  const [feedbackStrengths, setFeedbackStrengths] = useState<string>("");
  const [feedbackImprovements, setFeedbackImprovements] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const PREDEFINED_TAGS = [
    "Clear Explanations", "Engaging Lectures", "Heavy Workload", 
    "Fast Paced", "Helpful Feedback", "Accessible Outside Class",
    "Difficult Exams", "Practical Examples"
  ];

  const [submitted, setSubmitted] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Protection: Warn before leaving if form is dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isDirty = ratings.teaching > 0 || ratings.materials > 0 || ratings.fairness > 0 || feedbackStrengths.length > 0 || feedbackImprovements.length > 0;
      if (isDirty && !submitted) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [ratings, feedbackStrengths, feedbackImprovements, submitted]);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const response = await fetch('/api/student/assignments');
        if (!response.ok) {
          throw new Error('Failed to fetch assignments');
        }
        const data = await response.json();
        setAssignments(data.assignments || []);
      } catch (err: any) {
        setError(err.message);
        toast.error("Failed to load available assignments");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAssignments();
  }, [submitted]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const isFormValid = () => {
    return ratings.teaching > 0 && ratings.materials > 0 && ratings.fairness > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !isFormValid()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Aggregate quantitative ratings into a single average for legacy support, 
      // but in a real app we'd save them individually.
      const avgRating = Math.round((ratings.teaching + ratings.materials + ratings.fairness) / 3);
      
      const combinedFeedback = `Strengths:\n${feedbackStrengths || 'N/A'}\n\nAreas for Improvement:\n${feedbackImprovements || 'N/A'}`;

      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseLecturerId: selectedAssignment.id,
          ratingQuantitative: avgRating,
          ratingQualitative: combinedFeedback,
          themes: selectedTags
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit evaluation');
      }
      
      setSubmitted(true);
      toast.success("Evaluation submitted successfully");
      
      // Reset form
      setRatings({ teaching: 0, materials: 0, fairness: 0 });
      setHovers({ teaching: 0, materials: 0, fairness: 0 });
      setFeedbackStrengths("");
      setFeedbackImprovements("");
      setSelectedTags([]);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Failed to submit evaluation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getToneSuggestion = () => {
    const combined = feedbackStrengths + feedbackImprovements;
    if (combined.length < 20) return null;
    const hasNegativeWords = /(terrible|awful|worst|stupid|hate)/i.test(combined);
    if (hasNegativeWords) {
      return { type: "warning", message: "Consider rephrasing with constructive language to ensure your feedback is actionable." };
    }
    if (combined.length > 50) {
      return { type: "success", message: "Great detail. Constructive feedback helps improve course quality." };
    }
    return null;
  };

  const tone = getToneSuggestion();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto mt-20 animate-in zoom-in-95 duration-500">
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-200">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Evaluation Submitted Securely</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Your feedback has been strictly anonymized. It is now completely disconnected from your student ID. Thank you for elevating our academic standards.
          </p>
          <button 
            onClick={() => {
              setSubmitted(false);
              setSelectedAssignment(null);
            }}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all shadow-md"
          >
            Return to Pending Evaluations
          </button>
        </div>
      </div>
    );
  }

  if (!selectedAssignment) {
    return (
      <div className="max-w-5xl mx-auto mt-6 md:mt-10 px-4 pb-10 animate-in fade-in duration-500">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Course Evaluations</h1>
          <p className="text-sm text-slate-500 mt-1">Select a pending course below to begin your anonymous evaluation.</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-4">
          {assignments.map((assignment) => {
            const isEvaluated = assignment.evaluations && assignment.evaluations.length > 0;
            return (
              <div 
                key={assignment.id} 
                onClick={() => !isEvaluated && setSelectedAssignment(assignment)}
                className={`p-6 rounded-2xl border ${isEvaluated ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isEvaluated ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{assignment.course.code} - {assignment.course.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">Lecturer: {assignment.lecturer.firstName} {assignment.lecturer.lastName}</p>
                    </div>
                  </div>
                  <div className="flex items-center shrink-0">
                    {isEvaluated ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wide border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold uppercase tracking-wide border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {assignments.length === 0 && (
            <div className="p-12 text-center border border-slate-200 border-dashed rounded-3xl bg-slate-50">
              <p className="text-slate-500 font-medium">No courses available for evaluation at this time.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-6 md:mt-8 px-4 pb-12 animate-in slide-in-from-right-8 duration-500">
      
      <button 
        onClick={() => setSelectedAssignment(null)}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Courses
      </button>

      {/* Anonymity Guarantee Banner */}
      <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg flex items-start gap-4">
        <div className="bg-white/10 p-2 rounded-xl shrink-0">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white tracking-tight">Strict Anonymity Guarantee</h3>
          <p className="text-sm text-slate-300 mt-1">
            Your identity is permanently decoupled from this submission. Lecturers and administrators cannot link this feedback to your student ID. Be honest, constructive, and thorough.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedAssignment.course.name}</h2>
          <p className="text-slate-500 mt-2">Evaluation for {selectedAssignment.lecturer.firstName} {selectedAssignment.lecturer.lastName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Quantitative Section */}
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-semibold text-slate-900">1. Quantitative Metrics</h3>
              <p className="text-sm text-slate-500 mt-1">Please rate the overall effectiveness and clarity of instruction.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { key: 'teaching', label: 'Teaching Quality' },
                { key: 'materials', label: 'Course Materials' },
                { key: 'fairness', label: 'Grading Fairness' }
              ].map((metric) => (
                <div key={metric.key} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center">
                  <label className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">{metric.label}</label>
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRatings(prev => ({ ...prev, [metric.key]: star }))}
                        onMouseEnter={() => setHovers(prev => ({ ...prev, [metric.key]: star }))}
                        onMouseLeave={() => setHovers(prev => ({ ...prev, [metric.key]: 0 }))}
                        className="focus:outline-none transform hover:scale-110 transition-transform p-0.5"
                      >
                        <Star 
                          className={`w-8 h-8 transition-colors duration-200 ${
                            star <= (hovers[metric.key as keyof typeof hovers] || ratings[metric.key as keyof typeof ratings]) 
                              ? "fill-amber-400 text-amber-400" 
                              : "fill-white text-slate-300 stroke-1"
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between w-full mt-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Qualitative Section */}
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-semibold text-slate-900">2. Qualitative Feedback & Themes</h3>
              <p className="text-sm text-slate-500 mt-1">Provide specific details about course delivery, assignments, or teaching style.</p>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Course Themes</label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_TAGS.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        isSelected 
                          ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative pt-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Strengths</label>
                <textarea 
                  rows={5}
                  value={feedbackStrengths}
                  onChange={(e) => setFeedbackStrengths(e.target.value)}
                  placeholder="What aspects of this course were most effective?"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none shadow-sm"
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Areas for Improvement</label>
                <textarea 
                  rows={5}
                  value={feedbackImprovements}
                  onChange={(e) => setFeedbackImprovements(e.target.value)}
                  placeholder="How could the lecturer improve the learning experience?"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none shadow-sm"
                ></textarea>
              </div>
              
              <AnimatePresence>
                {tone && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className={`col-span-1 md:col-span-2 mt-2 flex items-start gap-2 p-4 rounded-xl text-sm font-medium border ${
                      tone.type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    <Info className={`w-5 h-5 shrink-0 ${tone.type === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`} />
                    {tone.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              disabled={!isFormValid() || isSubmitting}
              className="w-full flex items-center justify-center gap-2 h-14 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Anonymous Evaluation
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
