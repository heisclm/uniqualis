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
  evaluationTokens?: any[];
}

export function StudentEvaluationForm() {
  // Complex State Management
  const [template, setTemplate] = useState<any>(null);
  const [scaleRatings, setScaleRatings] = useState<Record<string, number>>({});
  const [scaleHovers, setScaleHovers] = useState<Record<string, number>>({});
  const [qualitativeAnswers, setQualitativeAnswers] = useState<Record<string, string>>({});
  const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState<Record<string, string>>({});
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const PREDEFINED_TAGS = [
    "Clear Explanations", "Engaging Lectures", "Heavy Workload", 
    "Fast Paced", "Helpful Feedback", "Accessible Outside Class",
    "Difficult Exams", "Practical Examples"
  ];

  const [submitted, setSubmitted] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Protection: Warn before leaving if form is dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isDirty = Object.keys(scaleRatings).length > 0 || Object.keys(qualitativeAnswers).some(k => qualitativeAnswers[k].length > 0) || Object.keys(multipleChoiceAnswers).length > 0;
      if (isDirty && !submitted) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [scaleRatings, qualitativeAnswers, multipleChoiceAnswers, submitted]);

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

  useEffect(() => {
    if (!selectedAssignment) return;
    async function fetchTemplate() {
      setIsTemplateLoading(true);
      try {
        const res = await fetch(`/api/student/evaluation-template?departmentId=${selectedAssignment?.course.departmentId}`);
        const data = await res.json();
        if (data.template) {
          setTemplate(data.template);
          const initialScales: Record<string, number> = {};
          const initialQualitative: Record<string, string> = {};
          const initialMultipleChoice: Record<string, string> = {};
          data.template.criteria.forEach((c: any) => {
            if (c.type === 'SCALE') initialScales[c.id] = 0;
            if (c.type === 'QUALITATIVE') initialQualitative[c.id] = "";
            if (c.type === 'MULTIPLE_CHOICE') initialMultipleChoice[c.id] = "";
          });
          setScaleRatings(initialScales);
          setQualitativeAnswers(initialQualitative);
          setMultipleChoiceAnswers(initialMultipleChoice);
        } else {
          setTemplate(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsTemplateLoading(false);
      }
    }
    fetchTemplate();
  }, [selectedAssignment]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const isCriterionVisible = (criterion: any) => {
    if (!criterion.conditionalOnId) return true;
    
    const dependentQuestion = template?.criteria.find((c: any) => c.id === criterion.conditionalOnId);
    if (!dependentQuestion) return true;

    let currentValue = "";
    if (dependentQuestion.type === "SCALE") currentValue = scaleRatings[dependentQuestion.id]?.toString() || "";
    else if (dependentQuestion.type === "QUALITATIVE") currentValue = qualitativeAnswers[dependentQuestion.id] || "";
    else if (dependentQuestion.type === "MULTIPLE_CHOICE") currentValue = multipleChoiceAnswers[dependentQuestion.id] || "";

    if (!currentValue) return false;

    const target = criterion.conditionalValue;
    switch (criterion.conditionalOperator) {
      case "EQUALS": return currentValue.toString().toLowerCase() === target?.toString().toLowerCase();
      case "NOT_EQUALS": return currentValue.toString().toLowerCase() !== target?.toString().toLowerCase();
      case "GREATER_THAN": return parseFloat(currentValue) > parseFloat(target);
      case "LESS_THAN": return parseFloat(currentValue) < parseFloat(target);
      default: return true;
    }
  };

  const isFormValid = () => {
    if (!template) return false;
    // Ensure all scales have been rated > 0
    const scaleCriteria = template.criteria.filter((c: any) => c.type === 'SCALE');
    const allScalesRated = scaleCriteria.every((c: any) => scaleRatings[c.id] > 0);
    
    // Adaptive logic branching: if any rating is <= 2, require explanation
    const hasLowRating = Object.values(scaleRatings).some(r => r > 0 && r <= 2);
    if (hasLowRating) {
      if (!qualitativeAnswers['low_rating_feedback'] || qualitativeAnswers['low_rating_feedback'].trim().length < 10) {
        return false;
      }
    }
    
    return allScalesRated;
  };

  const calculateProgress = () => {
    if (!template) return 0;
    
    const scaleCriteria = template.criteria.filter((c: any) => c.type === 'SCALE' && isCriterionVisible(c));
    const mcCriteria = template.criteria.filter((c: any) => c.type === 'MULTIPLE_CHOICE' && isCriterionVisible(c));
    const qualCriteria = template.criteria.filter((c: any) => c.type === 'QUALITATIVE' && isCriterionVisible(c));
    
    const totalQuestions = scaleCriteria.length + mcCriteria.length + qualCriteria.length;
    let completed = 0;
    
    completed += scaleCriteria.filter((c: any) => scaleRatings[c.id] > 0).length;
    completed += mcCriteria.filter((c: any) => multipleChoiceAnswers[c.id]).length;
    completed += qualCriteria.filter((c: any) => (qualitativeAnswers[c.id] || "").trim().length > 0).length;
    
    if (totalQuestions === 0) return 0;
    return Math.round((completed / totalQuestions) * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !isFormValid() || !template) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Fetch evaluation token
      const tokenRes = await fetch('/api/student/evaluation-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseLecturerId: selectedAssignment.id })
      });
      const tokenData = await tokenRes.json();
      
      if (!tokenRes.ok || !tokenData.token) {
        throw new Error(tokenData.error || 'Failed to acquire evaluation token');
      }

      // 2. Submit evaluation
      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseLecturerId: selectedAssignment.id,
          scaleRatings,
          qualitativeAnswers,
          multipleChoiceAnswers,
          token: tokenData.token,
          // We can omit themes for now since the API will use AI to extract them
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit evaluation');
      }
      
      setSubmitted(true);
      toast.success("Evaluation submitted successfully");
      
      // Reset form
      setScaleRatings({});
      setScaleHovers({});
      setQualitativeAnswers({});
      setMultipleChoiceAnswers({});
      setSelectedTags([]);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Failed to submit evaluation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getToneSuggestion = () => {
    const combined = Object.values(qualitativeAnswers).join(' ');
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
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto mt-20 animate-in zoom-in-95 duration-500">
        <div className="bg-white rounded-[2rem] p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500 relative">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight font-display">Evaluation Submitted Securely</h2>
          <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg">
            Your feedback has been strictly anonymized. It is now completely disconnected from your student ID. Thank you for elevating our academic standards.
          </p>
          <button 
            onClick={() => {
              setSubmitted(false);
              setSelectedAssignment(null);
            }}
            className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
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
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Course Evaluations</h1>
          <p className="text-base text-slate-500 mt-2 max-w-2xl mx-auto md:mx-0">Select a pending course below to begin your anonymous evaluation. Your honest feedback drives academic excellence.</p>
        </div>
        
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-100 flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((assignment) => {
            const isEvaluated = assignment.evaluationTokens && assignment.evaluationTokens.length > 0;
            return (
              <div 
                key={assignment.id} 
                onClick={() => !isEvaluated && setSelectedAssignment(assignment)}
                className={`p-6 sm:p-8 rounded-[2rem] border flex flex-col h-full relative overflow-hidden group ${isEvaluated ? 'bg-slate-50/50 border-slate-200/60 opacity-60 grayscale-[0.5]' : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] cursor-pointer transition-all duration-300 hover:-translate-y-1'}`}
              >
                {!isEvaluated && <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm border ${isEvaluated ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200/50 group-hover:scale-105 transition-transform'}`}>
                     <span className="text-xs font-bold tracking-wider opacity-80">{assignment.course.code.substring(0, 3)}</span>
                     <span className="text-lg font-black leading-none">{assignment.course.code.substring(3)}</span>
                  </div>
                  <div className="shrink-0">
                    {isEvaluated ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide">
                        <CheckCircle2 className="w-4 h-4" />
                        Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wide shadow-sm">
                        <AlertCircle className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-xl leading-snug mb-3 line-clamp-2">{assignment.course.name}</h3>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 w-fit px-3 py-2 rounded-xl border border-slate-100">
                     <BookOpen className="w-4 h-4 text-slate-400" />
                     <span className="truncate">Lecturer: {assignment.lecturer.firstName} {assignment.lecturer.lastName}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {assignments.length === 0 && (
            <div className="col-span-1 md:col-span-2 p-16 text-center border-2 border-slate-200 border-dashed rounded-[2rem] bg-slate-50">
              <CheckCircle2 className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <p className="text-slate-500 font-medium text-lg">No courses available for evaluation at this time.</p>
              <p className="text-slate-400 text-sm mt-2">You have completed all your pending tasks.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="max-w-3xl mx-auto mt-6 md:mt-8 px-4 sm:px-6 pb-20 animate-in slide-in-from-right-8 duration-500 overflow-hidden sm:overflow-visible">
      
      {/* Top Bar for Progress */}
      <div className="bg-white/90 backdrop-blur-md py-4 mb-8 border-b border-slate-100 -mx-4 px-4 sm:mx-0 sm:px-4 sm:rounded-2xl sm:shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={() => setSelectedAssignment(null)}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Progress</span>
            <span className="text-sm font-black text-emerald-600">{progress}%</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Header Info */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display mb-2">{selectedAssignment.course.name}</h2>
        <p className="text-lg text-slate-500 font-medium">Evaluation for {selectedAssignment.lecturer.firstName} {selectedAssignment.lecturer.lastName}</p>
      </div>

      {/* Anonymity Guarantee Banner */}
      <div className="mb-10 p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl flex items-start sm:items-center gap-5 transform hover:scale-[1.01] transition-transform">
        <div className="bg-white/10 p-3 rounded-xl shrink-0">
          <ShieldCheck className="w-7 h-7 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Strict Anonymity Guarantee
          </h3>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            Your identity is permanently decoupled from this submission. Be honest and constructive.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
        
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-12">
          
          {isTemplateLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500 font-medium">Loading evaluation criteria...</p>
            </div>
          ) : !template ? (
            <div className="p-12 text-center bg-slate-50 border border-slate-200 border-dashed rounded-3xl">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No evaluation template available for this course&apos;s department.</p>
            </div>
          ) : (
            <>
              {/* Quantitative Section */}
              {template.criteria.filter((c: any) => c.type === 'SCALE').length > 0 && (
                <div className="space-y-8">
                  <div className="border-b border-slate-100 pb-5">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 text-sm">1</span>
                      Quantitative Metrics
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 ml-11">Please rate the overall effectiveness and clarity of instruction.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {template.criteria.filter((c: any) => c.type === 'SCALE' && isCriterionVisible(c)).map((metric: any) => (
                      <div key={metric.id} className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden ${scaleRatings[metric.id] > 0 ? 'bg-emerald-50/30 border-emerald-200/50 shadow-sm' : 'bg-slate-50/50 border-slate-200 hover:border-emerald-300'}`}>
                        {scaleRatings[metric.id] > 0 && (
                          <div className="absolute top-3 right-3 text-emerald-500">
                             <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        <label className="text-sm font-bold text-slate-800 mb-6 leading-tight min-h-[2.5rem] flex items-center justify-center max-w-[90%]">{metric.question}</label>
                        <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setScaleRatings(prev => ({ ...prev, [metric.id]: star }))}
                              onMouseEnter={() => setScaleHovers(prev => ({ ...prev, [metric.id]: star }))}
                              onMouseLeave={() => setScaleHovers(prev => ({ ...prev, [metric.id]: 0 }))}
                              className="focus:outline-none focus:ring-4 focus:ring-emerald-100 rounded-full transition-transform transform active:scale-95"
                            >
                              <Star 
                                className={`w-8 h-8 sm:w-10 sm:h-10 transition-all duration-300 ${
                                  star <= (scaleHovers[metric.id] || scaleRatings[metric.id]) 
                                    ? "fill-amber-400 text-amber-400 drop-shadow-md scale-110" 
                                    : "fill-white text-slate-300 stroke-1 hover:text-slate-400"
                                }`} 
                              />
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between w-full mt-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                          <span>Poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multiple Choice Section */}
              {template.criteria.filter((c: any) => c.type === 'MULTIPLE_CHOICE').length > 0 && (
                <div className="space-y-8">
                  <div className="border-b border-slate-100 pb-5">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 text-sm">2</span>
                      Multiple Choice
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 ml-11">Select the most accurate statement.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-8">
                    {template.criteria.filter((c: any) => c.type === 'MULTIPLE_CHOICE' && isCriterionVisible(c)).map((metric: any) => {
                       const options = metric.options ? JSON.parse(metric.options) : [];
                       const isAnswered = !!multipleChoiceAnswers[metric.id];
                       return (
                         <div key={metric.id} className={`space-y-4 p-6 sm:p-8 rounded-3xl border transition-colors ${isAnswered ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50/50 border-slate-200'}`}>
                           <label className="text-base font-bold text-slate-900 block">{metric.question}</label>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             {options.map((opt: string) => {
                               const isSelected = multipleChoiceAnswers[metric.id] === opt;
                               return (
                                 <label key={opt} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2 ${isSelected ? 'bg-white border-emerald-500 shadow-md shadow-emerald-100' : 'bg-white border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/20 hover:shadow-sm'}`}>
                                   <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-emerald-500' : 'border-slate-300'}`}>
                                     {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>}
                                   </div>
                                   <input
                                     type="radio"
                                     name={metric.id}
                                     value={opt}
                                     checked={isSelected}
                                     onChange={() => setMultipleChoiceAnswers(prev => ({ ...prev, [metric.id]: opt }))}
                                     className="hidden"
                                   />
                                   <span className={`text-sm font-medium ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>{opt}</span>
                                 </label>
                               )
                             })}
                           </div>
                         </div>
                       );
                    })}
                  </div>
                </div>
              )}

              {/* Qualitative Section */}
              <div className="space-y-8">
                <div className="border-b border-slate-100 pb-5">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 text-sm">3</span>
                    Qualitative Feedback
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 ml-11">Provide specific details about course delivery, assignments, or teaching style.</p>
                </div>
                
                <div className="space-y-4 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-200">
                  <label className="text-sm font-bold text-slate-800">Quick Tags (Optional)</label>
                  <div className="flex flex-wrap gap-2.5">
                    {PREDEFINED_TAGS.map(tag => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 ${
                            isSelected 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm' 
                              : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-300 hover:bg-slate-50'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {template.criteria.filter((c: any) => c.type === 'QUALITATIVE').length > 0 && (
                  <div className="grid grid-cols-1 gap-8 relative">
                    {template.criteria.filter((c: any) => c.type === 'QUALITATIVE' && isCriterionVisible(c)).map((metric: any) => {
                      const value = qualitativeAnswers[metric.id] || "";
                      const hasContent = value.trim().length > 0;
                      return (
                        <div key={metric.id} className="space-y-3 relative group">
                          <label className="text-base font-bold text-slate-900 block">{metric.question}</label>
                          <textarea 
                            rows={5}
                            value={value}
                            onChange={(e) => setQualitativeAnswers(prev => ({ ...prev, [metric.id]: e.target.value }))}
                            placeholder="Type your detailed feedback here..."
                            className={`w-full bg-slate-50 border-2 text-slate-800 rounded-2xl px-6 py-5 text-sm md:text-base focus:outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all resize-y shadow-sm ${hasContent ? 'border-emerald-300' : 'border-slate-200 hover:border-slate-300'}`}
                          ></textarea>
                          {hasContent && (
                            <div className="absolute top-0 right-0 text-emerald-500 p-1">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                    
                    <AnimatePresence>
                      {tone && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className={`col-span-1 flex items-start gap-3 p-5 rounded-2xl text-sm font-medium border shadow-sm ${
                            tone.type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          <Info className={`w-6 h-6 shrink-0 mt-0.5 ${tone.type === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`} />
                          <span className="leading-relaxed">{tone.message}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Adaptive Logic Branching */}
                    <AnimatePresence>
                      {Object.values(scaleRatings).some(r => r > 0 && r <= 2) && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          className="col-span-1 space-y-3 pt-6 mt-6 border-t border-slate-100 overflow-hidden"
                        >
                          <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 sm:p-8">
                            <label className="text-base font-bold text-amber-900 flex items-center gap-2 mb-2">
                              <AlertCircle className="w-5 h-5" /> 
                              Actionable Feedback Required
                            </label>
                            <p className="text-sm text-amber-700 mb-4 leading-relaxed">You rated one or more metrics with a score of 2 or below. Please provide specific instances or actionable feedback to help the lecturer improve.</p>
                            <textarea 
                              rows={4}
                              value={qualitativeAnswers['low_rating_feedback'] || ""}
                              onChange={(e) => setQualitativeAnswers(prev => ({ ...prev, ['low_rating_feedback']: e.target.value }))}
                              placeholder="Please provide specific details..."
                              className="w-full bg-white border-2 border-amber-200 text-slate-800 rounded-2xl px-6 py-5 text-sm md:text-base focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all resize-y shadow-sm"
                            ></textarea>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div className="pt-8 mt-8 border-t border-slate-100">
                <button 
                  type="submit"
                  disabled={!isFormValid() || isSubmitting}
                  className="w-full flex items-center justify-center gap-3 h-16 bg-slate-900 text-white rounded-2xl text-lg font-bold hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/20 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isSubmitting ? (
                     <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      Submit Anonymous Evaluation
                    </>
                  )}
                </button>
                {!isFormValid() && (
                  <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mt-4">
                    Please complete all required fields
                  </p>
                )}
              </div>
            </>
          )}

        </form>
      </div>
    </div>
  );
}
