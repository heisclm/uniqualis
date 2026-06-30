"use client";

import { useState, useEffect } from "react";
import { UserPlus, ShieldCheck, Mail, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

export function UserProvisioning() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("LECTURER");
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Fetch faculties and departments for dropdowns
    const fetchStructure = async () => {
      try {
        const [facRes, depRes] = await Promise.all([
          fetch('/api/public/faculties'),
          fetch('/api/public/departments')
        ]);
        
        if (facRes.ok) {
          const data = await facRes.json();
          setFaculties(data.faculties || []);
        }
        if (depRes.ok) {
          const data = await depRes.json();
          setDepartments(data.departments || []);
        }
      } catch (err) {
        console.error("Failed to fetch university structure", err);
      }
    };
    
    fetchStructure();
  }, []);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    try {
      const payload: any = { email, role };
      if (role === 'LECTURER') payload.departmentId = departmentId;
      if (role === 'OFFICIAL') payload.facultyId = facultyId;

      const response = await fetch('/api/admin/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to provision account");
      }

      setMessage({ text: data.message || "Account provisioned successfully.", type: 'success' });
      setEmail("");
      // keep other settings for convenience if adding multiple
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 md:p-8 max-w-4xl mx-auto"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Account Provisioning</h1>
        <p className="text-slate-500 mt-1">Pre-authorize emails for lecturers, officials, and administrators to register in the system.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 overflow-hidden">
        <div className="bg-slate-900 p-6 md:p-8 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/20 rounded-full blur-[60px] group-hover:bg-blue-500/30 transition-all duration-700"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white/95">New Pre-authorization</h2>
              <p className="text-slate-400 text-sm mt-1">Grant secure system access to a new staff member.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleProvision} className="p-6 md:p-8 space-y-6">
          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wide ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@university.edu"
                className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl pl-11 pr-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>
            <p className="text-[11px] font-medium text-slate-500 ml-1 uppercase tracking-wide">The user must sign up using exactly this email.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-900 uppercase tracking-wide ml-1">System Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                >
                  <option value="LECTURER">Lecturer</option>
                  <option value="OFFICIAL">University Official (Dean/HOD)</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {role === 'LECTURER' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-900 uppercase tracking-wide ml-1">Department</label>
                <div className="relative">
                  <select
                    required
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            )}

            {role === 'OFFICIAL' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-900 uppercase tracking-wide ml-1">Faculty</label>
                <div className="relative">
                  <select
                    required
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="" disabled>Select Faculty</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 flex justify-end border-t border-slate-100">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Provisioning...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Provision Account
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
