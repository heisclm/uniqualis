"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, LayoutTemplate, Settings2, Trash2, Edit3, Target, Save, X, Search, FileText, Loader2 } from "lucide-react";

interface Criterion {
  id?: string;
  name: string;
  type: "scale" | "qualitative";
}

interface Template {
  id?: string;
  name: string;
  departmentId: string | null;
  departmentName?: string;
  criteria: Criterion[];
  status: "ACTIVE" | "DRAFT";
}

export function EvaluationTemplates() {
  const [activeTab, setActiveTab] = useState<"list" | "builder">("list");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [builderState, setBuilderState] = useState<Template>({
    name: "",
    departmentId: "ALL",
    status: "DRAFT",
    criteria: []
  });

  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [userRole, setUserRole] = useState<string>("ADMIN");
  const [userDepartmentId, setUserDepartmentId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/official/templates");
      if (res.ok) {
        const data = await res.json();
        const mapped = data.templates.map((t: any) => ({
          id: t.id,
          name: t.name,
          departmentId: t.departmentId || "ALL",
          departmentName: t.departmentId ? (data.departments?.find((d: any) => d.id === t.departmentId)?.name || "Department Specific") : "All Departments",
          status: t.status,
          criteria: t.criteria.map((c: any) => ({
            id: c.id,
            name: c.question,
            type: c.type === "SCALE" ? "scale" : "qualitative"
          }))
        }));
        setTemplates(mapped);
        if (data.departments) setDepartments(data.departments);
        if (data.userRole) setUserRole(data.userRole);
        if (data.userDepartmentId) setUserDepartmentId(data.userDepartmentId);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTemplates();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const addCriterion = () => {
    setBuilderState(prev => ({
      ...prev,
      criteria: [
        ...prev.criteria, 
        { id: `c${Date.now()}`, name: "", type: "scale" }
      ]
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

  const saveTemplate = async () => {
    if (!builderState.name) return;
    
    try {
      setIsSaving(true);
      const url = builderState.id 
        ? `/api/official/templates/${builderState.id}`
        : `/api/official/templates`;
      
      const method = builderState.id ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(builderState)
      });
      
      if (res.ok) {
        await fetchTemplates();
        setActiveTab("list");
        setBuilderState({ name: "", departmentId: "ALL", status: "DRAFT", criteria: [] });
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

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-blue-600" />
            Evaluation Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">Design and manage academic assessment frameworks and forms.</p>
        </div>
        
        {activeTab === "list" ? (
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
            className="h-10 px-4 rounded-xl bg-blue-600 flex items-center justify-center gap-2 text-white shadow-md hover:bg-blue-700 transition-all font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Template</span>
          </button>
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
              className="h-10 px-4 rounded-xl bg-blue-600 flex items-center justify-center gap-2 text-white shadow-md hover:bg-blue-700 transition-all font-medium text-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? "Saving..." : "Save Template"}</span>
            </button>
          </div>
        )}
      </motion.div>

      {activeTab === "list" ? (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && templates.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Loading templates...</p>
            </div>
          ) : (
            <>
              {templates.map((template) => (
                <div key={template.id} className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col group hover:border-blue-200 transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => editTemplate(template)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
                    <FileText className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                        template.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {template.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        {template.departmentName}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-tight mb-2 pr-12">{template.name}</h3>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Criteria Included ({template.criteria.length})</p>
                      <div className="space-y-1.5">
                        {template.criteria.slice(0, 3).map(c => (
                          <div key={c.id} className="flex items-center gap-2 text-sm text-slate-600">
                            <Target className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{c.name}</span>
                            <span className="ml-auto shrink-0 text-[10px] font-medium text-slate-400 uppercase">{c.type}</span>
                          </div>
                        ))}
                        {template.criteria.length > 3 && (
                          <p className="text-xs text-slate-400 italic">+{template.criteria.length - 3} more criteria...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => {
                  setBuilderState({ 
                    name: "", 
                    departmentId: userRole === "OFFICIAL" ? (userDepartmentId || "ALL") : "ALL", 
                    status: "DRAFT", 
                    criteria: [] 
                  });
                  setActiveTab("builder");
                }}
                className="bg-slate-50/50 rounded-3xl p-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all min-h-[300px]"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="font-semibold">Create New Template</span>
                <span className="text-xs text-slate-400 mt-1">Start from scratch</span>
              </button>
            </>
          )}
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 overflow-hidden flex flex-col md:flex-row">
          
          {/* Builder Sidebar */}
          <div className="w-full md:w-80 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-6 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Template Name</label>
              <input 
                type="text" 
                value={builderState.name}
                onChange={e => setBuilderState({...builderState, name: e.target.value})}
                placeholder="e.g. End of Term Review"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Target Department</label>
              <select 
                value={builderState.departmentId || "ALL"}
                onChange={e => setBuilderState({...builderState, departmentId: e.target.value})}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm bg-white"
                disabled={userRole === "OFFICIAL"}
              >
                {userRole !== "OFFICIAL" && (
                  <option value="ALL">All Departments (Institution-Wide)</option>
                )}
                
                {userRole === "OFFICIAL" ? (
                  departments.filter(d => d.id === userDepartmentId).map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))
                ) : (
                  departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
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
                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm bg-white"
              >
                <option value="DRAFT">Draft (Not visible)</option>
                <option value="ACTIVE">Active (Ready to deploy)</option>
              </select>
            </div>
          </div>
          
          {/* Builder Canvas */}
          <div className="flex-1 p-6 md:p-8 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Form Criteria</h3>
              <button 
                onClick={addCriterion}
                className="h-9 px-4 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center gap-2 transition-colors font-medium text-sm"
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
                  <div key={criterion.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow group relative">
                    
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
                        onChange={e => updateCriterion(criterion.id, { type: e.target.value as "scale" | "qualitative" })}
                        className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-600 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 outline-none w-full sm:w-auto"
                      >
                        <option value="scale">Rating Scale (1-5)</option>
                        <option value="qualitative">Text Response</option>
                      </select>
                      
                      <button 
                        onClick={() => removeCriterion(criterion.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 ml-auto sm:ml-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
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
                            <div key={n} className="w-10 h-10 rounded-xl border border-slate-300 flex items-center justify-center text-slate-400 font-medium">
                              {n}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-24 rounded-xl border border-slate-300 bg-white" />
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
