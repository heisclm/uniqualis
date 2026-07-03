"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Building2, Map, BookOpen, Users, Network, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";

const facultySchema = z.object({
  name: z.string().min(2, "Faculty name must be at least 2 characters")
});

const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  facultyId: z.string().min(1, "Please select a parent faculty")
});

const courseSchema = z.object({
  code: z.string().min(3, "Course code is required (e.g., CS101)"),
  title: z.string().min(2, "Course title is required"),
  departmentId: z.string().min(1, "Please select a department"),
  level: z.string().min(1, "Please select a course level")
});

const assignSchema = z.object({
  lecturerId: z.string().min(1, "Please select a lecturer"),
  courseId: z.string().min(1, "Please select a course")
});

export function HierarchyManagement() {
  const [activeTab, setActiveTab] = useState<'faculties' | 'departments' | 'courses' | 'lecturers'>('faculties');
  
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  // Forms states
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptFacultyId, setNewDeptFacultyId] = useState("");
  const [newCourseFacultyId, setNewCourseFacultyId] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDeptId, setNewCourseDeptId] = useState("");
  const [newCourseLevel, setNewCourseLevel] = useState("");
  const [assignLecturerId, setAssignLecturerId] = useState("");
  const [assignCourseId, setAssignCourseId] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for Inline Edit
  const [editingFacultyId, setEditingFacultyId] = useState<string | null>(null);
  const [editFacultyName, setEditFacultyName] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleUpdateFaculty = async (id: string) => {
    const toastId = toast.loading("Updating faculty...");
    try {
      const res = await fetch(`/api/admin/hierarchy/faculties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editFacultyName })
      });
      if (res.ok) {
        setEditingFacultyId(null);
        toast.success("Faculty updated.", { id: toastId });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update", { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred", { id: toastId });
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    const toastId = toast.loading("Deleting faculty...");
    try {
      const res = await fetch(`/api/admin/hierarchy/faculties/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Faculty deleted.", { id: toastId });
        setFaculties(f => f.filter(x => x.id !== id));
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Cannot delete faculty", { id: toastId, duration: 4000 });
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred", { id: toastId });
    }
  };

  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editDeptFacultyId, setEditDeptFacultyId] = useState("");

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editCourseCode, setEditCourseCode] = useState("");
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [editCourseDeptId, setEditCourseDeptId] = useState("");

  const handleUpdateDepartment = async (id: string) => {
    const toastId = toast.loading("Updating department...");
    try {
      const res = await fetch(`/api/admin/hierarchy/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editDeptName, facultyId: editDeptFacultyId })
      });
      if (res.ok) {
        setEditingDeptId(null);
        toast.success("Department updated.", { id: toastId });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update", { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred", { id: toastId });
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    const toastId = toast.loading("Deleting department...");
    try {
      const res = await fetch(`/api/admin/hierarchy/departments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Department deleted.", { id: toastId });
        setDepartments(d => d.filter(x => x.id !== id));
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Cannot delete department", { id: toastId, duration: 4000 });
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred", { id: toastId });
    }
  };

  const handleUpdateCourse = async (id: string) => {
    const toastId = toast.loading("Updating course...");
    try {
      const res = await fetch(`/api/admin/hierarchy/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: editCourseCode, title: editCourseTitle, departmentId: editCourseDeptId })
      });
      if (res.ok) {
        setEditingCourseId(null);
        toast.success("Course updated.", { id: toastId });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update", { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred", { id: toastId });
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    const toastId = toast.loading("Deleting course...");
    try {
      const res = await fetch(`/api/admin/hierarchy/courses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Course deleted.", { id: toastId });
        setCourses(c => c.filter(x => x.id !== id));
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Cannot delete course", { id: toastId, duration: 4000 });
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred", { id: toastId });
    }
  };

  const handleRevokeAssignment = async (courseId: string, lecturerId: string) => {
    if (confirmDeleteId !== `${courseId}-${lecturerId}`) {
      setConfirmDeleteId(`${courseId}-${lecturerId}`);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    const toastId = toast.loading("Revoking assignment...");
    try {
      const res = await fetch('/api/admin/hierarchy/course-lecturers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, lecturerId })
      });
      if (res.ok) {
        toast.success("Assignment revoked.", { id: toastId });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to revoke", { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred", { id: toastId });
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [facRes, depRes, couRes, lecRes] = await Promise.all([
        fetch('/api/admin/hierarchy/faculties'),
        fetch('/api/admin/hierarchy/departments'),
        fetch('/api/admin/hierarchy/courses'),
        fetch('/api/admin/hierarchy/lecturers')
      ]);
      
      const facData = await facRes.json();
      const depData = await depRes.json();
      const couData = await couRes.json();
      const lecData = await lecRes.json();
      
      if (facRes.ok) setFaculties(facData.faculties || []);
      if (depRes.ok) setDepartments(depData.departments || []);
      if (couRes.ok) setCourses(couData.courses || []);
      if (lecRes.ok) setLecturers(lecData.lecturers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      facultySchema.parse({ name: newFacultyName });
      setErrors({});
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setErrors({ facultyName: err.errors[0].message });
        return;
      }
    }
    try {
      const res = await fetch('/api/admin/hierarchy/faculties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFacultyName })
      });
      if (res.ok) {
        setNewFacultyName("");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      departmentSchema.parse({ name: newDeptName, facultyId: newDeptFacultyId });
      setErrors({});
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const newErrs: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) newErrs[e.path[0] as string] = e.message;
        });
        setErrors(newErrs);
        return;
      }
    }
    try {
      const res = await fetch('/api/admin/hierarchy/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeptName, facultyId: newDeptFacultyId })
      });
      if (res.ok) {
        setNewDeptName("");
        setNewDeptFacultyId("");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      courseSchema.parse({ code: newCourseCode, title: newCourseTitle, departmentId: newCourseDeptId, level: newCourseLevel });
      setErrors({});
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const newErrs: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) newErrs[e.path[0] as string] = e.message;
        });
        setErrors(newErrs);
        return;
      }
    }
    try {
      const res = await fetch('/api/admin/hierarchy/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCourseCode, title: newCourseTitle, departmentId: newCourseDeptId, level: newCourseLevel })
      });
      if (res.ok) {
        setNewCourseCode("");
        setNewCourseTitle("");
        setNewCourseDeptId("");
        setNewCourseLevel("");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      assignSchema.parse({ lecturerId: assignLecturerId, courseId: assignCourseId });
      setErrors({});
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const newErrs: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) newErrs[e.path[0] as string] = e.message;
        });
        setErrors(newErrs);
        return;
      }
    }
    try {
      const res = await fetch('/api/admin/hierarchy/course-lecturers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: assignCourseId, lecturerId: assignLecturerId })
      });
      if (res.ok) {
        setAssignCourseId("");
        setAssignLecturerId("");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full p-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Network className="w-6 h-6 text-emerald-600" />
          Institutional Hierarchy
        </h1>
      </div>

      <div className="bg-white rounded-2xl p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200/60 mb-8 inline-flex flex-wrap gap-1">
        {[
          { id: 'faculties', label: 'Faculties', icon: Building2 },
          { id: 'departments', label: 'Departments', icon: Map },
          { id: 'courses', label: 'Courses', icon: BookOpen },
          { id: 'lecturers', label: 'Lecturer Assignments', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setErrors({});
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Creation Form Column */}
        <div className="lg:col-span-4 space-y-6">
          {activeTab === 'faculties' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-6">Create New Faculty</h3>
              <form onSubmit={handleCreateFaculty} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Faculty Name</label>
                  <input
                    type="text"
                    value={newFacultyName}
                    onChange={(e) => {
                      setNewFacultyName(e.target.value);
                      if (errors.facultyName) setErrors(prev => ({ ...prev, facultyName: "" }));
                    }}
                    placeholder="e.g., Engineering & Technology"
                    className={`w-full bg-slate-50/50 border ${errors.facultyName ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'} text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400`}
                  />
                  {errors.facultyName && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.facultyName}</p>}
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add Faculty
                </button>
              </form>
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-6">Create New Department</h3>
              <form onSubmit={handleCreateDepartment} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Parent Faculty</label>
                  <div className="relative">
                    <select
                      value={newDeptFacultyId}
                      onChange={(e) => {
                        setNewDeptFacultyId(e.target.value);
                        if (errors.facultyId) setErrors(prev => ({ ...prev, facultyId: "" }));
                      }}
                      className={`w-full bg-slate-50/50 border ${errors.facultyId ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'} text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all appearance-none`}
                    >
                      <option value="" disabled>Select a Faculty...</option>
                      {faculties.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                  {errors.facultyId && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.facultyId}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Department Name</label>
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => {
                      setNewDeptName(e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                    }}
                    placeholder="e.g., Computer Science"
                    className={`w-full bg-slate-50/50 border ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'} text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400`}
                  />
                  {errors.name && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.name}</p>}
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 mt-4">
                  <Plus className="w-4 h-4" /> Add Department
                </button>
              </form>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-6">Create New Course</h3>
              <form onSubmit={handleCreateCourse} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Faculty</label>
                  <div className="relative">
                    <select
                      value={newCourseFacultyId}
                      onChange={(e) => {
                        setNewCourseFacultyId(e.target.value);
                        setNewCourseDeptId("");
                      }}
                      className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                    >
                      <option value="" disabled>Select Faculty to Filter...</option>
                      {faculties.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Department</label>
                  <div className="relative">
                    <select
                      value={newCourseDeptId}
                      onChange={(e) => {
                        setNewCourseDeptId(e.target.value);
                        if (errors.departmentId) setErrors(prev => ({ ...prev, departmentId: "" }));
                      }}
                      className={`w-full bg-slate-50/50 border ${errors.departmentId ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'} text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all appearance-none`}
                      disabled={!newCourseFacultyId}
                    >
                      <option value="" disabled>Select a Department...</option>
                      {departments.filter(d => d.facultyId === newCourseFacultyId || (d.faculty && d.faculty.id === newCourseFacultyId)).map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                  {errors.departmentId && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.departmentId}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Code</label>
                    <input
                      type="text"
                      value={newCourseCode}
                      onChange={(e) => {
                        setNewCourseCode(e.target.value);
                        if (errors.code) setErrors(prev => ({ ...prev, code: "" }));
                      }}
                      placeholder="CS101"
                      className={`w-full bg-slate-50/50 border ${errors.code ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'} text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 font-mono`}
                    />
                    {errors.code && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.code}</p>}
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Level</label>
                    <select
                      value={newCourseLevel}
                      onChange={(e) => {
                        setNewCourseLevel(e.target.value);
                        if (errors.level) setErrors(prev => ({ ...prev, level: "" }));
                      }}
                      className={`w-full bg-slate-50/50 border ${errors.level ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'} text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                    >
                      <option value="" disabled>Select...</option>
                      <option value="100">100 Level</option>
                      <option value="200">200 Level</option>
                      <option value="300">300 Level</option>
                      <option value="400">400 Level</option>
                      <option value="500">500 Level</option>
                    </select>
                    {errors.level && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.level}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Title</label>
                    <input
                      type="text"
                      value={newCourseTitle}
                      onChange={(e) => {
                        setNewCourseTitle(e.target.value);
                        if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
                      }}
                      placeholder="Algorithms"
                      className={`w-full bg-slate-50/50 border ${errors.title ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'} text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400`}
                    />
                    {errors.title && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.title}</p>}
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 mt-4">
                  <Plus className="w-4 h-4" /> Add Course
                </button>
              </form>
            </div>
          )}

          {activeTab === 'lecturers' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-6">Assign Lecturer to Course</h3>
              <form onSubmit={handleAssignLecturer} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Lecturer</label>
                  <div className="relative">
                    <select
                      value={assignLecturerId}
                      onChange={(e) => {
                        setAssignLecturerId(e.target.value);
                        if (errors.lecturerId) setErrors(prev => ({ ...prev, lecturerId: "" }));
                      }}
                      className={`w-full bg-slate-50/50 border ${errors.lecturerId ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'} text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all appearance-none`}
                    >
                      <option value="" disabled>Select a Lecturer...</option>
                      {lecturers.map(l => (
                        <option key={l.id} value={l.id}>{l.lastName}, {l.firstName} ({l.email})</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                  {errors.lecturerId && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.lecturerId}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Course</label>
                  <div className="relative">
                    <select
                      value={assignCourseId}
                      onChange={(e) => {
                        setAssignCourseId(e.target.value);
                        if (errors.courseId) setErrors(prev => ({ ...prev, courseId: "" }));
                      }}
                      className={`w-full bg-slate-50/50 border ${errors.courseId ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'} text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all appearance-none`}
                    >
                      <option value="" disabled>Select a Course...</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                  {errors.courseId && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.courseId}</p>}
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium shadow-[0_4px_12px_rgba(52,211,153,0.2)] hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 mt-4">
                  <Plus className="w-4 h-4" /> Create Assignment
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Data List Column */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 min-h-[500px]">
            {activeTab === 'faculties' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Existing Faculties ({faculties.length})</h3>
                {faculties.length === 0 ? (
                  <p className="text-sm text-slate-500">No faculties found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {faculties.map(f => (
                      <div key={f.id} className="p-5 border border-slate-200/60 rounded-2xl flex flex-col justify-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all bg-slate-50/30 group relative">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button onClick={() => { setEditingFacultyId(f.id); setEditFacultyName(f.name); }} className="p-1.5 text-slate-400 hover:text-emerald-600 bg-white rounded-md shadow-sm border border-slate-200">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleDeleteFaculty(f.id)} className={`p-1.5 bg-white rounded-md shadow-sm border ${confirmDeleteId === f.id ? 'text-red-600 bg-red-50 border-red-200' : 'text-slate-400 hover:text-red-600 border-slate-200'}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {editingFacultyId === f.id ? (
                          <div className="flex items-center gap-2 pr-16">
                            <input 
                              type="text" 
                              value={editFacultyName} 
                              onChange={(e) => setEditFacultyName(e.target.value)} 
                              className="w-full text-sm font-semibold border-b border-emerald-400 focus:outline-none bg-transparent" 
                              autoFocus 
                            />
                            <button onClick={() => handleUpdateFaculty(f.id)} className="text-xs bg-emerald-600 text-white px-2 py-1 rounded">Save</button>
                            <button onClick={() => setEditingFacultyId(null)} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between pr-16">
                            <div>
                              <p className="font-semibold text-slate-900">{f.name}</p>
                              <p className="text-xs text-slate-500 mt-1">{f._count?.departments || 0} Departments</p>
                            </div>
                            <Building2 className="w-5 h-5 text-slate-400 shrink-0" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'departments' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Existing Departments ({departments.length})</h3>
                {departments.length === 0 ? (
                  <p className="text-sm text-slate-500">No departments found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {departments.map(d => (
                      <div key={d.id} className="p-5 border border-slate-200/60 rounded-2xl flex flex-col gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all bg-slate-50/30 group relative">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button onClick={() => { setEditingDeptId(d.id); setEditDeptName(d.name); setEditDeptFacultyId(d.faculty?.id || ""); }} className="p-1.5 text-slate-400 hover:text-emerald-600 bg-white rounded-md shadow-sm border border-slate-200">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleDeleteDepartment(d.id)} className={`p-1.5 bg-white rounded-md shadow-sm border ${confirmDeleteId === d.id ? 'text-red-600 bg-red-50 border-red-200' : 'text-slate-400 hover:text-red-600 border-slate-200'}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        {editingDeptId === d.id ? (
                          <div className="flex flex-col gap-2 pr-16">
                            <input 
                              type="text" 
                              value={editDeptName} 
                              onChange={(e) => setEditDeptName(e.target.value)} 
                              className="w-full text-sm font-semibold border-b border-emerald-400 focus:outline-none bg-transparent" 
                              autoFocus 
                            />
                            <select 
                              value={editDeptFacultyId} 
                              onChange={(e) => setEditDeptFacultyId(e.target.value)}
                              className="text-xs border border-slate-200 rounded p-1"
                            >
                              <option value="" disabled>Select Faculty</option>
                              {faculties.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
                            <div className="flex gap-2 mt-1">
                              <button onClick={() => handleUpdateDepartment(d.id)} className="text-xs bg-emerald-600 text-white px-2 py-1 rounded">Save</button>
                              <button onClick={() => setEditingDeptId(null)} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="pr-16">
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">{d.faculty?.name}</p>
                              <p className="font-semibold text-slate-900 text-base">{d.name}</p>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide mt-auto">
                              <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-slate-400" /> {d._count?.courses || 0} Courses</span>
                              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" /> {d._count?.lecturers || 0} Lecturers</span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Existing Courses ({courses.length})</h3>
                {courses.length === 0 ? (
                  <p className="text-sm text-slate-500">No courses found.</p>
                ) : (
                  <div className="space-y-3">
                    {courses.map(c => (
                      <div key={c.id} className="p-4 border border-slate-200/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all bg-slate-50/30 group relative gap-4">
                        <div className="absolute top-4 right-4 md:relative md:top-0 md:right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 shrink-0 md:order-last">
                          <button onClick={() => { setEditingCourseId(c.id); setEditCourseCode(c.code); setEditCourseTitle(c.title); setEditCourseDeptId(c.department?.id || ""); }} className="p-1.5 text-slate-400 hover:text-emerald-600 bg-white rounded-md shadow-sm border border-slate-200">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleDeleteCourse(c.id)} className={`p-1.5 bg-white rounded-md shadow-sm border ${confirmDeleteId === c.id ? 'text-red-600 bg-red-50 border-red-200' : 'text-slate-400 hover:text-red-600 border-slate-200'}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {editingCourseId === c.id ? (
                          <div className="flex flex-col md:flex-row gap-3 w-full pr-12 md:pr-0">
                            <input 
                              type="text" 
                              value={editCourseCode} 
                              onChange={(e) => setEditCourseCode(e.target.value)} 
                              className="w-24 text-sm font-semibold border border-slate-200 rounded px-2 py-1 focus:outline-none font-mono" 
                            />
                            <input 
                              type="text" 
                              value={editCourseTitle} 
                              onChange={(e) => setEditCourseTitle(e.target.value)} 
                              className="flex-1 text-sm font-semibold border border-slate-200 rounded px-2 py-1 focus:outline-none" 
                            />
                            <select 
                              value={editCourseDeptId} 
                              onChange={(e) => setEditCourseDeptId(e.target.value)}
                              className="text-xs border border-slate-200 rounded px-2 py-1"
                            >
                              <option value="" disabled>Select Department</option>
                              {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button onClick={() => handleUpdateCourse(c.id)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded">Save</button>
                              <button onClick={() => setEditingCourseId(null)} className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 font-bold shrink-0 text-sm font-mono tracking-tight">
                                {c.code}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{c.title}</p>
                                <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wide font-medium">{c.department?.name}</p>
                              </div>
                            </div>
                            <div className="text-left md:text-right md:mr-4">
                              <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                                {c._count?.lecturers || 0} Assigned Lecturers
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lecturers' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Lecturers & Assignments ({lecturers.length})</h3>
                {lecturers.length === 0 ? (
                  <p className="text-sm text-slate-500">No lecturers found.</p>
                ) : (
                  <div className="space-y-4">
                    {lecturers.map(l => (
                      <div key={l.id} className="p-6 border border-slate-200/60 rounded-2xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all bg-slate-50/30">
                        <div className="flex items-center justify-between mb-5 border-b border-slate-200/60 pb-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                              {l.firstName[0]}{l.lastName[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-base">{l.lastName}, {l.firstName}</p>
                              <p className="text-sm text-slate-500">{l.email}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Assigned Courses</p>
                          <div className="flex flex-wrap gap-2">
                            {l.coursesTaught?.length > 0 ? l.coursesTaught.map((assignment: any) => (
                              <div key={assignment.id} className="group relative">
                                <span className="px-3 py-1.5 bg-white text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 shadow-sm flex items-center gap-1.5">
                                  <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                                  {assignment.course?.code} - {assignment.course?.title}
                                  <button 
                                    onClick={() => handleRevokeAssignment(assignment.courseId, l.id)}
                                    className={`ml-1 transition-colors ${confirmDeleteId === `${assignment.courseId}-${l.id}` ? 'text-red-600 bg-red-100 rounded-full p-0.5' : 'text-slate-300 hover:text-red-500'}`}
                                    title="Revoke Assignment"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </span>
                              </div>
                            )) : (
                              <span className="text-xs text-slate-400 italic">No courses assigned yet.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
