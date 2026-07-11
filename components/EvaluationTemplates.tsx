"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, LayoutTemplate, Settings2, Trash2, Edit3, Target, Save, X, Search, FileText, Loader2, Lock, ShieldCheck, Layers } from "lucide-react";

interface Criterion {
  id?: string;
  name: string;
  type: "scale" | "qualitative" | "multiple_choice";
  options?: string; // JSON string like '["Yes", "No"]'
  rawOptions?: string;
  conditionalOnId?: string | null;
  conditionalOperator?: string | null;
  conditionalValue?: string | null;
}

interface Template {
  id?: string;
  name: string;
  departmentId: string | null;
  departmentName?: string;
  criteria: Criterion[];
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  // departmentId === null  →  Core (institution-wide, Admin-owned, locked)
  // departmentId !== null  →  Supplement (Official's dept-scoped add-on)
}

export function EvaluationTemplates({ userRole: propUserRole = "ADMIN" }: { userRole?: string }) {
  const [activeTab, setActiveTab] = useState<"list" | "builder">("list");
  const [coreTemplates, setCoreTemplates] = useState<Template[]>([]);       // departmentId = null
  const [supplementTemplates, setSupplementTemplates] = useState<Template[]>([]); // departmentId set
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [builderState, setBuilderState] = useState<Template>({
    name: "",
    departmentId: "ALL",
    status: "DRAFT",
    criteria: []
  });

  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [userRole, setUserRole] = useState<string>(propUserRole);
  const [userDepartmentId, setUserDepartmentId] = useState<string | null>(null);

  // ── helpers ────────────────────────────────────────────────────────────────
  const isCore = (t: Template) => t.departmentId === null || t.departmentId === "ALL";

  const mapTemplate = (t: any, departments: any[]): Template => ({
    id: t.id,
    name: t.name,
    departmentId: t.departmentId ?? null,
    departmentName: t.departmentId
      ? (departments.find((d: any) => d.id === t.departmentId)?.name || "Department Specific")
      : "All Departments (Core)",
    status: t.status,
    criteria: (t.criteria || []).map((c: any) => ({
      id: c.id,
      name: c.question,
      type: c.type === "SCALE" ? "scale" : c.type === "MULTIPLE_CHOICE" ? "multiple_choice" : "qualitative",
      options: c.options,
      conditionalOnId: c.conditionalOnId,
      conditionalOperator: c.conditionalOperator,
      conditionalValue: c.conditionalValue
    }))
  });

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/official/templates");
      if (res.ok) {
        const data = await res.json();
        const depts = data.departments || [];

        if (data.userRole) setUserRole(data.userRole);
        if (data.userDepartmentId) setUserDepartmentId(data.userDepartmentId);
        if (depts.length) setDepartments(depts);

        // Admin gets coreTemplates + supplementTemplates from API
        if (data.coreTemplates) {
          setCoreTemplates(data.coreTemplates.map((t: any) => mapTemplate(t, depts)));
        }
        if (data.supplementTemplates) {
          setSupplementTemplates(data.supplementTemplates.map((t: any) => mapTemplate(t, depts)));
        }

        // Official gets coreTemplate (single) + supplementTemplates
        if (data.coreTemplate) {
          setCoreTemplates([mapTemplate(data.coreTemplate, depts)]);
        }
        if (!data.coreTemplates && !data.coreTemplate) {
          setCoreTemplates([]);
        }
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = {
    bg: "bg-emerald-600", bgHover: "hover:bg-emerald-700", text: "text-emerald-600", light: "bg-emerald-50",
    border: "border-emerald-200", hoverBorder: "hover:border-emerald-300", hoverBgLight: "hover:bg-emerald-100",
    hoverBgLight50: "hover:bg-emerald-50/50", focus: "focus:ring-emerald-500/20 focus:border-emerald-500"
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  // ── criterion helpers ──────────────────────────────────────────────────────
  const addCriterion = () => {
    setBuilderState(prev => ({
      ...prev,
      criteria: [...prev.criteria, { id: `c${Date.now()}`, name: "", type: "scale" }]
    }));
  };

  const updateCriterion = (id: string | undefined, updates: Partial<Criterion>) => {
    setBuilderState(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const removeCriterion = (id: string | undefined) => {
    setBuilderState(prev => ({
      ...prev,
      criteria: prev.criteria.filter(c => c.id !== id)
    }));
  };

  // ── save ──────────────────────────────────────────────────────────────────
  const saveTemplate = async () => {
    if (!builderState.name) return;
    try {
      setIsSaving(true);
      const url    = builderState.id ? `/api/official/templates/${builderState.id}` : `/api/official/templates`;
      const method = builderState.id ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(builderState)
      });
      if (res.ok) {
        await fetchTemplates();
        setActiveTab("list");
        setBuilderState({ name: "", departmentId: "ALL", status: "DRAFT", criteria: [] });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save template.");
      }
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const editTemplate = (template: Template) => {
    setBuilderState(template);
    setActiveTab("builder");
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`/api/official/templates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Cannot delete this template.");
        return;
      }
      await fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  // ── template card (shared) ─────────────────────────────────────────────────
  const TemplateCard = ({ template, locked = false }: { template: Template; locked?: boolean }) => (
    <div
      className={`rounded-[2rem] p-6 flex flex-col group transition-all relative overflow-hidden duration-300 
        ${locked
          ? "bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-[0_4px_20px_rgba(251,191,36,0.15)]"
          : `bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${t.hoverBorder} hover:-translate-y-1`
        }`}
    >
      {/* Lock badge on Core cards */}
      {locked && (
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 bg-amber-100 border border-amber-300 rounded-full text-[10px] font-bold text-amber-700 uppercase tracking-wide">
          <Lock className="w-2.5 h-2.5" />
          Core — Locked
        </div>
      )}

      {/* Hover actions (only for editable templates) */}
      {!locked && (
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button onClick={() => editTemplate(template)} className={`p-2 ${t.light} ${t.text} rounded-lg ${t.hoverBgLight} transition-colors`}>
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => deleteTemplate(template.id!)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6
        ${locked ? "bg-amber-100 text-amber-600 border border-amber-200" : `${t.light} ${t.text}`}`}>
        {locked ? <ShieldCheck className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
      </div>

      {/* Meta badges */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
          template.status === "ACTIVE"
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : template.status === "ARCHIVED"
            ? "bg-slate-200 text-slate-500 border-slate-300"
            : "bg-slate-100 text-slate-600 border-slate-200"
        }`}>
          {template.status}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border
          ${locked ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
          {template.departmentName}
        </span>
        {!locked && template.departmentId && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border bg-violet-50 text-violet-700 border-violet-100">
            Supplement
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-tight mb-2 pr-20">{template.name}</h3>

      {/* Criteria preview */}
      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 flex-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Criteria ({template.criteria.length})</p>
        <div className="space-y-1.5">
          {template.criteria.slice(0, 3).map(c => (
            <div key={c.id} className="flex items-center gap-2 text-sm text-slate-600">
              <Target className={`w-3.5 h-3.5 shrink-0 ${locked ? "text-amber-400" : "text-slate-400"}`} />
              <span className="truncate">{c.name}</span>
              <span className="ml-auto shrink-0 text-[10px] font-medium text-slate-400 uppercase">{c.type}</span>
            </div>
          ))}
          {template.criteria.length > 3 && (
            <p className="text-xs text-slate-400 italic">+{template.criteria.length - 3} more criteria...</p>
          )}
        </div>
      </div>

      {/* Admin edit button on Core cards */}
      {locked && userRole === "ADMIN" && (
        <div className="mt-5 pt-4 border-t border-amber-100">
          <button
            onClick={() => editTemplate(template)}
            className="flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit Core Template
          </button>
        </div>
      )}

      {/* Official read-only notice */}
      {locked && userRole === "OFFICIAL" && (
        <div className="mt-5 pt-4 border-t border-amber-100 flex items-start gap-2 text-xs text-amber-600">
          <Lock className="w-3 h-3 shrink-0 mt-0.5" />
          <span>Locked by Admin. Your Supplement questions are merged with this when evaluations deploy.</span>
        </div>
      )}
    </div>
  );

  // ── section label ──────────────────────────────────────────────────────────
  const SectionLabel = ({ icon: Icon, label, sub, colour }: { icon: any; label: string; sub: string; colour: string }) => (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colour}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-slate-900">{label}</h2>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </div>
  );

  // ── list view ─────────────────────────────────────────────────────────────
  const ListView = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className={`w-8 h-8 ${t.text} animate-spin mb-4`} />
          <p className="text-slate-500 font-medium">Loading templates...</p>
        </div>
      );
    }

    // Merge-model info banner (Officials only, when a Core exists)
    const hasActiveCore = coreTemplates.some(c => c.status === "ACTIVE");

    return (
      <div className="space-y-10">

        {/* ── Merge Banner (Official only) ────────────────────────────────── */}
        {userRole === "OFFICIAL" && hasActiveCore && (
          <motion.div
            variants={itemVariants}
            className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 shadow-sm"
          >
            <div className="p-2 bg-violet-100 rounded-xl shrink-0 text-violet-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-violet-900">Base + Supplement Model is Active</p>
              <p className="text-xs text-violet-700 mt-1 leading-relaxed">
                When an evaluation is deployed, the system automatically merges the
                <strong> Core Institutional Template </strong>questions with your
                <strong> Departmental Supplement </strong>questions into one seamless form for students.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Core Templates section ──────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <SectionLabel
            icon={Lock}
            label="Core Institutional Template"
            sub={userRole === "ADMIN"
              ? "Institution-wide baseline — only one may be ACTIVE at a time"
              : "Created and locked by Admin — read-only for Officials"}
            colour="bg-amber-100 text-amber-600"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreTemplates.map(template => (
              <TemplateCard key={template.id} template={template} locked={true} />
            ))}

            {/* Admin-only: create new Core template */}
            {userRole === "ADMIN" && (
              <button
                onClick={() => {
                  setBuilderState({ id: "", name: "", departmentId: "ALL", status: "DRAFT", criteria: [] });
                  setActiveTab("builder");
                }}
                className="bg-amber-50/40 rounded-[2rem] p-6 border-2 border-dashed border-amber-200 flex flex-col items-center justify-center text-amber-500 hover:border-amber-400 hover:bg-amber-50/70 transition-all min-h-[220px]"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm">Create Core Template</span>
                <span className="text-xs text-amber-400 mt-1">Institution-wide, locked for Officials</span>
              </button>
            )}

            {coreTemplates.length === 0 && userRole === "OFFICIAL" && (
              <div className="col-span-full py-10 text-center border-2 border-dashed border-amber-200 rounded-3xl bg-amber-50/30">
                <Lock className="w-10 h-10 text-amber-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-amber-600">No active Core Template yet</p>
                <p className="text-xs text-amber-500 mt-1">The Admin has not published a Core template. Evaluations will use Standard templates until then.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Supplement / Standard Templates section ─────────────────────── */}
        <motion.div variants={itemVariants}>
          <SectionLabel
            icon={userRole === "OFFICIAL" ? Layers : FileText}
            label={userRole === "OFFICIAL" ? "My Departmental Supplements" : "Department-Specific Templates"}
            sub={userRole === "OFFICIAL"
              ? "Your custom add-on questions merged with the Core template"
              : "Departmental templates created by Officials (Supplements)"}
            colour={userRole === "OFFICIAL" ? "bg-violet-100 text-violet-600" : "bg-emerald-100 text-emerald-600"}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supplementTemplates.map(template => (
              <TemplateCard key={template.id} template={template} locked={false} />
            ))}

            <button
              onClick={() => {
                setBuilderState({
                  id: "",
                  name: "",
                  departmentId: userRole === "OFFICIAL" ? (userDepartmentId || "ALL") : "ALL",
                  status: "DRAFT",
                  criteria: []
                });
                setActiveTab("builder");
              }}
              className={`bg-slate-50/50 rounded-[2rem] p-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-500 hover:${t.text} ${t.hoverBorder} ${t.hoverBgLight50} transition-all min-h-[280px]`}
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-semibold">
                {userRole === "OFFICIAL" ? "Create Supplement" : "Create Template"}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {userRole === "OFFICIAL" ? "Add departmental questions" : "Start from scratch"}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutTemplate className={`w-6 h-6 ${t.text}`} />
            Evaluation Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {userRole === "OFFICIAL"
              ? "Manage your Departmental Supplement templates. Core Institutional Templates are set by Admin."
              : "Design and manage evaluation templates using the Base + Supplement model."}
          </p>
        </div>

        {activeTab === "list" ? (
          /* Only show the top-level "Create" button if the role supports it.
             Admins always see it; Officials click the in-section button instead. */
          userRole === "ADMIN" ? (
            <button
              onClick={() => {
                setBuilderState({ id: "", name: "", departmentId: "ALL", status: "DRAFT", criteria: [] });
                setActiveTab("builder");
              }}
              className={`h-10 px-4 rounded-xl ${t.bg} flex items-center justify-center gap-2 text-white shadow-md ${t.bgHover} transition-all font-medium text-sm active:scale-95`}
            >
              <Plus className="w-4 h-4" />
              <span>Create Template</span>
            </button>
          ) : null
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("list")}
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-50 transition-all font-medium text-sm shadow-sm"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={saveTemplate}
              disabled={!builderState.name || builderState.criteria.length === 0 || isSaving}
              className={`h-10 px-4 rounded-xl ${t.bg} flex items-center justify-center gap-2 text-white shadow-md ${t.bgHover} transition-all font-medium text-sm disabled:opacity-50 active:scale-95`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? "Saving..." : "Save Template"}</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      {activeTab === "list" ? (
        <motion.div variants={itemVariants}>
          <ListView />
        </motion.div>
      ) : (
        /* ── BUILDER ─────────────────────────────────────────────────────── */
        <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 overflow-hidden flex flex-col md:flex-row">

          {/* Sidebar */}
          <div className="w-full md:w-80 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-6 space-y-6">

            {/* Context hint for Officials */}
            {userRole === "OFFICIAL" && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-700">
                <Layers className="w-4 h-4 shrink-0 mt-0.5 text-violet-500" />
                <span>
                  You are creating a <strong>Departmental Supplement</strong>. These questions are appended after the Core template questions when students evaluate a course.
                </span>
              </div>
            )}

            {/* Context hint for Admin creating Core */}
            {userRole === "ADMIN" && (builderState.departmentId === "ALL" || !builderState.departmentId) && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  <strong>Institution-Wide = Core Template.</strong> Officials will see this as locked. Activating it auto-archives any previous active Core.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Template Name</label>
              <input
                type="text"
                value={builderState.name}
                onChange={e => setBuilderState({...builderState, name: e.target.value})}
                placeholder="e.g. End of Term Review"
                className={`w-full h-11 px-4 rounded-xl border border-slate-200 text-sm ${t.focus} outline-none transition-all shadow-sm`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Target Department</label>
              <select
                value={builderState.departmentId || "ALL"}
                onChange={e => setBuilderState({...builderState, departmentId: e.target.value})}
                className={`w-full h-11 px-4 rounded-xl border border-slate-200 text-sm ${t.focus} outline-none transition-all shadow-sm bg-white`}
                disabled={userRole === "OFFICIAL"}
              >
                {userRole !== "OFFICIAL" && (
                  <option value="ALL">All Departments (Core — Institution-Wide)</option>
                )}

                {userRole === "OFFICIAL" ? (
                  departments.filter(d => d.id === userDepartmentId).map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))
                ) : (
                  departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name} (Supplement)</option>
                  ))
                )}

                {userRole === "OFFICIAL" && !userDepartmentId && (
                  <option value="ALL" disabled>No department assigned</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Status</label>
              <select
                value={builderState.status}
                onChange={e => setBuilderState({...builderState, status: e.target.value as "ACTIVE" | "DRAFT"})}
                className={`w-full h-11 px-4 rounded-xl border border-slate-200 text-sm ${t.focus} outline-none transition-all shadow-sm bg-white`}
              >
                <option value="DRAFT">Draft (Not visible)</option>
                <option value="ACTIVE">Active (Ready to deploy)</option>
              </select>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 p-6 md:p-8 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Form Criteria</h3>
              <button
                onClick={addCriterion}
                className={`h-9 px-4 rounded-lg ${t.light} ${t.text} ${t.hoverBgLight} flex items-center justify-center gap-2 transition-colors font-medium text-sm active:scale-95`}
              >
                <Plus className="w-4 h-4" />
                Add Criterion
              </button>
            </div>

            <div className="space-y-4">
              {builderState.criteria.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Settings2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No criteria added yet.</p>
                  <p className="text-sm text-slate-400 mt-1">Start building your evaluation form by adding criteria.</p>
                </div>
              ) : (
                builderState.criteria.map((criterion, index) => (
                  <div key={criterion.id} className="flex flex-col gap-4 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow group relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={criterion.name}
                          onChange={e => updateCriterion(criterion.id, { name: e.target.value })}
                          placeholder="e.g. Rate the clarity of the course material"
                          className="w-full bg-transparent border-none text-slate-800 font-medium focus:outline-none focus:ring-0 p-0 placeholder:text-slate-400"
                        />
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <select
                          value={criterion.type}
                          onChange={e => updateCriterion(criterion.id, { type: e.target.value as "scale" | "qualitative" | "multiple_choice" })}
                          className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-600 bg-slate-50 focus:ring-2 focus:ring-slate-500/20 outline-none w-full sm:w-auto"
                        >
                          <option value="scale">Rating Scale (1-5)</option>
                          <option value="qualitative">Text Response</option>
                          <option value="multiple_choice">Multiple Choice</option>
                        </select>

                        <button
                          onClick={() => removeCriterion(criterion.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 ml-auto sm:ml-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Multiple Choice options */}
                    {criterion.type === "multiple_choice" && (
                      <div className="pl-12">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Options (Comma separated)</label>
                        <input
                          type="text"
                          value={criterion.rawOptions !== undefined ? criterion.rawOptions : (criterion.options ? JSON.parse(criterion.options).join(", ") : "")}
                          onChange={e => {
                            const val = e.target.value;
                            updateCriterion(criterion.id, {
                              rawOptions: val,
                              options: JSON.stringify(val.split(",").map(s => s.trim()).filter(Boolean))
                            });
                          }}
                          placeholder="Yes, No, Maybe"
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-500/20 outline-none"
                        />
                      </div>
                    )}

                    {/* Conditional Logic */}
                    <div className="pl-12 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings2 className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Conditional Logic (Optional)</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={criterion.conditionalOnId || ""}
                          onChange={e => updateCriterion(criterion.id, { conditionalOnId: e.target.value || null })}
                          className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-600 bg-white"
                        >
                          <option value="">Always Show</option>
                          {builderState.criteria.filter(c => c.id !== criterion.id && c.name).map((c) => (
                            <option key={c.id} value={c.id}>
                              Show if Q{builderState.criteria.findIndex(x => x.id === c.id) + 1} ({c.name.substring(0, 20)}...)
                            </option>
                          ))}
                        </select>

                        {criterion.conditionalOnId && (
                          <>
                            <select
                              value={criterion.conditionalOperator || "EQUALS"}
                              onChange={e => updateCriterion(criterion.id, { conditionalOperator: e.target.value })}
                              className="w-32 h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-600 bg-white"
                            >
                              <option value="EQUALS">Equals</option>
                              <option value="NOT_EQUALS">Not Equals</option>
                              <option value="GREATER_THAN">Greater Than</option>
                              <option value="LESS_THAN">Less Than</option>
                            </select>
                            <input
                              type="text"
                              value={criterion.conditionalValue || ""}
                              onChange={e => updateCriterion(criterion.id, { conditionalValue: e.target.value })}
                              placeholder="Value"
                              className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Preview */}
            {builderState.criteria.length > 0 && (
              <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  Preview
                </h4>
                <div className="space-y-6 opacity-70 pointer-events-none">
                  {builderState.criteria.map((c, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium text-slate-700 mb-2">{i + 1}. {c.name || "Untitled Criterion"}</p>
                      {c.type === "scale" ? (
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(n => (
                            <div key={n} className="w-10 h-10 rounded-xl border border-slate-300 flex items-center justify-center text-slate-400 font-medium">{n}</div>
                          ))}
                        </div>
                      ) : c.type === "multiple_choice" ? (
                        <div className="flex flex-col gap-2">
                          {c.options && JSON.parse(c.options).length > 0 ? (
                            JSON.parse(c.options).map((opt: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border border-slate-400" />
                                <span className="text-sm text-slate-600">{opt}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-slate-400 italic">No options defined</div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-24 rounded-xl border border-slate-300 bg-white flex items-start p-3 text-slate-400 text-sm">
                          Text response area...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
