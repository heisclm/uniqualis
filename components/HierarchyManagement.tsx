"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Building2, Map, BookOpen, Users, Network, Trash2 } from "lucide-react";

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
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDeptId, setNewCourseDeptId] = useState("");
  
  const [assignLecturerId, setAssignLecturerId] = useState("");
  const [assignCourseId, setAssignCourseId] = useState("");

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
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
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
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
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/hierarchy/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCourseCode, title: newCourseTitle, departmentId: newCourseDeptId })
      });
      if (res.ok) {
        setNewCourseCode("");
        setNewCourseTitle("");
        setNewCourseDeptId("");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
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
        alert(data.error);
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
          <Network className="w-6 h-6 text-blue-600" />
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
            onClick={() => setActiveTab(tab.id as any)}
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
                    required
                    type="text"
                    value={newFacultyName}
                    onChange={(e) => setNewFacultyName(e.target.value)}
                    placeholder="e.g., Engineering & Technology"
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
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
                      required
                      value={newDeptFacultyId}
                      onChange={(e) => setNewDeptFacultyId(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
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
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Department Name</label>
                  <input
                    required
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="e.g., Computer Science"
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-4">
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
                  <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Department</label>
                  <div className="relative">
                    <select
                      required
                      value={newCourseDeptId}
                      onChange={(e) => setNewCourseDeptId(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="" disabled>Select a Department...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.faculty?.name})</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Code</label>
                    <input
                      required
                      type="text"
                      value={newCourseCode}
                      onChange={(e) => setNewCourseCode(e.target.value)}
                      placeholder="CS101"
                      className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Title</label>
                    <input
                      required
                      type="text"
                      value={newCourseTitle}
                      onChange={(e) => setNewCourseTitle(e.target.value)}
                      placeholder="Algorithms"
                      className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-4">
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
                      required
                      value={assignLecturerId}
                      onChange={(e) => setAssignLecturerId(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
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
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Course</label>
                  <div className="relative">
                    <select
                      required
                      value={assignCourseId}
                      onChange={(e) => setAssignCourseId(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
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
                      <div key={f.id} className="p-5 border border-slate-200/60 rounded-2xl flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all bg-slate-50/30">
                        <div>
                          <p className="font-semibold text-slate-900">{f.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{f._count?.departments || 0} Departments</p>
                        </div>
                        <Building2 className="w-5 h-5 text-slate-400" />
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
                      <div key={d.id} className="p-5 border border-slate-200/60 rounded-2xl flex flex-col gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all bg-slate-50/30">
                        <div>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">{d.faculty?.name}</p>
                          <p className="font-semibold text-slate-900 text-base">{d.name}</p>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-slate-400" /> {d._count?.courses || 0} Courses</span>
                          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" /> {d._count?.lecturers || 0} Lecturers</span>
                        </div>
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
                      <div key={c.id} className="p-4 border border-slate-200/60 rounded-2xl flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all bg-slate-50/30">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 font-bold shrink-0 text-sm font-mono tracking-tight">
                            {c.code}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{c.title}</p>
                            <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wide font-medium">{c.department?.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                            {c._count?.lecturers || 0} Assigned Lecturers
                          </span>
                        </div>
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
                              <span key={assignment.id} className="px-3 py-1.5 bg-white text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 shadow-sm flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                                {assignment.course?.code} - {assignment.course?.title}
                              </span>
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
