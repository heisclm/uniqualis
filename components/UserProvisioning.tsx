"use client";

import { useState, useEffect } from "react";
import { UserPlus, ShieldCheck, Mail, AlertTriangle, Loader2, CheckCircle, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import { z } from "zod";

const provisionSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(["LECTURER", "OFFICIAL", "ADMIN"]),
  facultyId: z.string().optional(),
  departmentId: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.role === "LECTURER" && !data.departmentId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select a department for the lecturer.",
      path: ["departmentId"]
    });
  }
  if (data.role === "OFFICIAL" && !data.facultyId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select a faculty for the official.",
      path: ["facultyId"]
    });
  }
});

export function UserProvisioning() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("LECTURER");
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [provisionedAccounts, setProvisionedAccounts] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAccounts, setIsFetchingAccounts] = useState(true);
  const [revokingIds, setRevokingIds] = useState<Set<string>>(new Set());

  const fetchProvisioned = async () => {
    setIsFetchingAccounts(true);
    try {
      const res = await fetch('/api/admin/provision');
      if (res.ok) {
        const data = await res.json();
        setProvisionedAccounts(data.provisionedAccounts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingAccounts(false);
    }
  };

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProvisioned();
  }, []);

  const handleRevoke = async (id: string) => {
    setRevokingIds(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/admin/provision?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Authorization revoked successfully.");
        setProvisionedAccounts(prev => prev.filter(acc => acc.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to revoke authorization");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setRevokingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const validateForm = () => {
    try {
      provisionSchema.parse({ email, role, facultyId, departmentId });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        (err as any).errors.forEach((e: any) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    const toastId = toast.loading("Provisioning account...");
    
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

      toast.success(data.message || "Account provisioned successfully.", { id: toastId });
      setEmail("");
      setErrors({});
      fetchProvisioned();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
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
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-[60px] group-hover:bg-emerald-500/30 transition-all duration-700"></div>
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

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wide ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                }}
                placeholder="staff@university.edu"
                className={`w-full bg-slate-50/50 border ${errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'} text-slate-900 rounded-xl pl-11 pr-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400`}
              />
            </div>
            {errors.email ? (
              <p className="text-[11px] font-semibold text-red-500 ml-1 mt-1">{errors.email}</p>
            ) : (
              <p className="text-[11px] font-medium text-slate-500 ml-1 uppercase tracking-wide">The user must sign up using exactly this email.</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-900 uppercase tracking-wide ml-1">System Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setErrors({});
                  }}
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
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
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-900 uppercase tracking-wide ml-1">Faculty</label>
                  <div className="relative">
                    <select
                      value={facultyId}
                      onChange={(e) => {
                        setFacultyId(e.target.value);
                        setDepartmentId(""); // Reset department when faculty changes
                      }}
                      className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                    >
                      <option value="" disabled>Select Faculty to Filter...</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-900 uppercase tracking-wide ml-1">Department</label>
                  <div className="relative">
                    <select
                      value={departmentId}
                      onChange={(e) => {
                        setDepartmentId(e.target.value);
                        if (errors.departmentId) setErrors(prev => ({ ...prev, departmentId: "" }));
                      }}
                      className={`w-full bg-slate-50/50 border ${errors.departmentId ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'} text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all appearance-none`}
                      disabled={!facultyId}
                    >
                      <option value="" disabled>Select Department</option>
                      {departments.filter(d => d.facultyId === facultyId || (d.faculty && d.faculty.id === facultyId)).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                  {errors.departmentId && <p className="text-[11px] font-semibold text-red-500 ml-1 mt-1">{errors.departmentId}</p>}
                </div>
              </>
            )}

            {role === 'OFFICIAL' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-900 uppercase tracking-wide ml-1">Faculty</label>
                <div className="relative">
                  <select
                    value={facultyId}
                    onChange={(e) => {
                      setFacultyId(e.target.value);
                      if (errors.facultyId) setErrors(prev => ({ ...prev, facultyId: "" }));
                    }}
                    className={`w-full bg-slate-50/50 border ${errors.facultyId ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'} text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all appearance-none`}
                  >
                    <option value="" disabled>Select Faculty</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
                {errors.facultyId && <p className="text-[11px] font-semibold text-red-500 ml-1 mt-1">{errors.facultyId}</p>}
              </div>
            )}
          </div>

          <div className="pt-6 flex justify-end border-t border-slate-100">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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

      <motion.div variants={itemVariants} className="mt-8 bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Pending Authorizations</h2>
          <p className="text-sm text-slate-500 mt-1">Accounts provisioned but not yet claimed via registration.</p>
        </div>
        <div className="p-0 sm:p-6 md:p-8">
          {isFetchingAccounts ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          ) : provisionedAccounts.length === 0 ? (
            <div className="text-center p-8 text-slate-500 text-sm">
              No pending authorizations.
            </div>
          ) : (
            <div className="overflow-x-auto w-full pb-4">
              <div className="min-w-[700px]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50/50">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Assignment</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 rounded-r-lg font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {provisionedAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{account.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            account.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                            account.role === 'OFFICIAL' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {account.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {account.department?.name || account.faculty?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(account.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            disabled={revokingIds.has(account.id)}
                            onClick={() => handleRevoke(account.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {revokingIds.has(account.id) ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Revoking...</>
                            ) : (
                              <><Trash2 className="w-3.5 h-3.5" /> Revoke</>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
