"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Settings as SettingsIcon, Bell, Shield, Sliders, Database, Key, Check, Smartphone, Monitor, Globe, Link, User } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";

const settingsSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name too long"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name too long"),
  email: z.string().email("Invalid email address"),
  title: z.string().optional(),
  officeHours: z.string().optional(),
  shortBio: z.string().optional(),
  notifyWeeklyDigest: z.boolean().optional(),
  notifyLowAverage: z.boolean().optional(),
  notifyEvalWindow: z.boolean().optional(),
  notifySubmissionReceipt: z.boolean().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function Settings({ 
  userRole = "ADMIN", 
  user 
}: { 
  userRole?: string;
  user?: { id?: string; firstName: string; lastName: string; email: string; profileImageUrl?: string | null } | null;
}) {
  const [activeTab, setActiveTab] = useState(userRole === "ADMIN" ? "general" : "account");
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Password update state
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty, isSubmitting }, control, watch } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      title: "Dr.",
      officeHours: "",
      shortBio: "",
      notifyWeeklyDigest: true,
      notifyLowAverage: true,
      notifyEvalWindow: true,
      notifySubmissionReceipt: true,
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setDbUser(data);
          reset({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            title: data.title || "Dr.",
            officeHours: data.officeHours || "",
            shortBio: data.shortBio || "",
            notifyWeeklyDigest: data.notifyWeeklyDigest ?? true,
            notifyLowAverage: data.notifyLowAverage ?? true,
            notifyEvalWindow: data.notifyEvalWindow ?? true,
            notifySubmissionReceipt: data.notifySubmissionReceipt ?? true,
          });
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        toast.error("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset]);

  const handleUpdatePassword = async () => {
    if (pwdNew !== pwdConfirm) {
      toast.error("New passwords do not match.");
      return;
    }
    if (!pwdCurrent || !pwdNew) {
      toast.error("Please fill all password fields.");
      return;
    }
    setIsUpdatingPwd(true);
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwdCurrent, newPassword: pwdNew }),
      });
      if (res.ok) {
        toast.success("Password updated successfully");
        setPwdCurrent("");
        setPwdNew("");
        setPwdConfirm("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update password");
      }
    } catch (err) {
      toast.error("An error occurred while updating password.");
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Settings updated successfully");
        reset(data); // reset to make isDirty false again
        // Force reload to update TopBar and Sidebar user info
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to update settings");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("An error occurred while saving.");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const allTabs = [
    { id: "account", label: "Account Profile", icon: <User className="w-4 h-4" />, roles: ["STUDENT", "LECTURER", "OFFICIAL", "ADMIN"] },
    { id: "general", label: "System Configuration", icon: <Sliders className="w-4 h-4" />, roles: ["ADMIN"] },
    { id: "security", label: "Account & Security", icon: <Shield className="w-4 h-4" />, roles: ["ADMIN", "STUDENT", "LECTURER", "OFFICIAL"] },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" />, roles: ["ADMIN", "STUDENT", "LECTURER", "OFFICIAL"] },
    { id: "data", label: "Data Export", icon: <Database className="w-4 h-4" />, roles: ["ADMIN", "LECTURER"] },
  ];

  const tabs = allTabs.filter(tab => tab.roles.includes(userRole));

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          {tabs.find(t => t.id === activeTab)?.label || "Settings"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account preferences and configurations.</p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Navigation */}
        <motion.div variants={itemVariants} className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                activeTab === tab.id 
                  ? "bg-white text-blue-600 shadow-sm border border-blue-100" 
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-700 border border-transparent"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Settings Content */}
        <motion.form onSubmit={handleSubmit(onSubmit)} variants={itemVariants} className="flex-1 bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-200/60 min-h-[500px]">
          
          {loading ? (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <div className="h-6 w-40 bg-slate-100 rounded-lg mb-4 animate-pulse"></div>
                <div className="flex flex-col sm:flex-row gap-8 items-start">
                  <div className="shrink-0 flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-full bg-slate-100 animate-pulse border-4 border-white shadow-md"></div>
                    <div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div>
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="h-3 w-20 bg-slate-100 rounded animate-pulse"></div>
                        <div className="h-11 w-full bg-slate-50 rounded-xl animate-pulse border border-slate-100"></div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-3 w-20 bg-slate-100 rounded animate-pulse"></div>
                        <div className="h-11 w-full bg-slate-50 rounded-xl animate-pulse border border-slate-100"></div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-3 w-24 bg-slate-100 rounded animate-pulse"></div>
                      <div className="h-11 w-full bg-slate-50 rounded-xl animate-pulse border border-slate-100"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100">
                <div className="h-6 w-48 bg-slate-100 rounded-lg mb-4 animate-pulse"></div>
                <div className="h-24 w-full bg-slate-50 rounded-2xl animate-pulse border border-slate-100"></div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "account" && (
                <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-4">Personal Details</h3>
                <div className="flex flex-col sm:flex-row gap-8 items-start">
                  <div className="shrink-0 flex flex-col items-center gap-3">
                    <div className="w-24 h-24 relative rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                      {dbUser?.profileImageUrl || user?.profileImageUrl ? (
                        <Image src={dbUser?.profileImageUrl || user?.profileImageUrl} alt="Profile" fill className="object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-2xl font-bold text-slate-400 uppercase">
                          {user?.firstName?.charAt(0) || "U"}{user?.lastName?.charAt(0) || "S"}
                        </span>
                      )}
                    </div>
                    <label className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">
                      Change Avatar
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          if (file.size > 2 * 1024 * 1024) {
                            toast.error("Image must be smaller than 2MB");
                            return;
                          }
                          
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const base64String = reader.result as string;
                            try {
                              const res = await fetch('/api/settings', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ profileImageUrl: base64String }),
                              });
                              if (res.ok) {
                                toast.success("Avatar updated");
                                setDbUser({ ...dbUser, profileImageUrl: base64String });
                                // Force reload to update TopBar if needed
                                window.location.reload();
                              } else {
                                toast.error("Failed to update avatar");
                              }
                            } catch (err) {
                              toast.error("Error updating avatar");
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                  
                  <div className="flex-1 space-y-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">First Name</label>
                        <input type="text" {...register("firstName")} className={`w-full h-11 px-4 rounded-xl border ${errors.firstName ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'} text-sm focus:ring-2 outline-none transition-all`} />
                        {errors.firstName && <span className="text-xs text-red-500">{errors.firstName.message}</span>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Name</label>
                        <input type="text" {...register("lastName")} className={`w-full h-11 px-4 rounded-xl border ${errors.lastName ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'} text-sm focus:ring-2 outline-none transition-all`} />
                        {errors.lastName && <span className="text-xs text-red-500">{errors.lastName.message}</span>}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact Email</label>
                      <input type="email" {...register("email")} className={`w-full h-11 px-4 rounded-xl border ${errors.email ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'} text-sm focus:ring-2 outline-none transition-all`} />
                      {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {userRole === "STUDENT" && (
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-4">Institutional Records</h3>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Student ID</span>
                      <span className="font-mono text-sm text-slate-800 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 inline-block">{dbUser?.studentIdNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Faculty / Department</span>
                      <span className="text-sm font-medium text-slate-800">{dbUser?.studentFaculty?.name || "N/A"}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    These fields are read-only as they are authoritative institutional records.
                  </p>
                </div>
              )}

              {userRole === "LECTURER" && (
                <>
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-4">Professional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</label>
                        <select {...register("title")} className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white">
                          <option value="Dr.">Dr.</option>
                          <option value="Prof.">Prof.</option>
                          <option value="Mr.">Mr.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Mx.">Mx.</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Office Hours</label>
                        <input type="text" {...register("officeHours")} placeholder="Mon/Wed 2:00 PM - 4:00 PM" className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Short Bio</label>
                      <textarea rows={3} {...register("shortBio")} placeholder="Focuses on algorithmic efficiency and data structures." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"></textarea>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-4">Institutional Records</h3>
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Employee ID</span>
                        <span className="font-mono text-sm text-slate-800 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 inline-block">{dbUser?.id?.split('-')[0] || "EMP-99382"}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Department</span>
                        <span className="text-sm font-medium text-slate-800">{dbUser?.lecturerDepartment?.name || dbUser?.officialDepartment?.name || "N/A"}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      These fields are read-only as they are authoritative institutional records.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "general" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-4">Academic Term Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Term Name</label>
                    <input type="text" defaultValue="Fall 2026" className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Default Department View</label>
                    <select className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white">
                      <option>All Departments</option>
                      <option>Computer Science</option>
                      <option>Mathematics</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-4">Evaluation Windows</h3>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Start Date</label>
                      <input type="date" defaultValue="2026-11-15" className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">End Date</label>
                      <input type="date" defaultValue="2026-12-15" className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700" />
                    </div>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer group mt-4">
                    <div className="relative flex items-start">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 flex items-center justify-center transition-all">
                        <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-800">Auto-close portal on end date</span>
                      <p className="text-xs text-slate-500 mt-0.5">Automatically disable student submissions when the window expires.</p>
                    </div>
                  </label>
                </div>
              </div>


            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-4">Password Management</h3>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Password</label>
                    <input type="password" value={pwdCurrent} onChange={(e) => setPwdCurrent(e.target.value)} placeholder="••••••••" className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">New Password</label>
                    <input type="password" value={pwdNew} onChange={(e) => setPwdNew(e.target.value)} placeholder="••••••••" className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Confirm New Password</label>
                    <input type="password" value={pwdConfirm} onChange={(e) => setPwdConfirm(e.target.value)} placeholder="••••••••" className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <button type="button" onClick={handleUpdatePassword} disabled={isUpdatingPwd} className="h-10 px-5 rounded-xl font-medium text-sm bg-slate-900 text-white shadow-md hover:bg-slate-800 transition-all disabled:opacity-50">
                    {isUpdatingPwd ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                      Two-Factor Authentication (2FA)
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wide">Enabled</span>
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-lg">Add an extra layer of security to your account by requiring a verification code in addition to your password.</p>
                  </div>
                  <button className="h-10 px-4 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">Manage 2FA</button>
                </div>
              </div>


            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-4">System Alerts</h3>
                <div className="space-y-4">
                  {(userRole === "ADMIN" || userRole === "OFFICIAL") && (
                    <>
                      <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:border-slate-200 transition-colors">
                        <div>
                          <span className="text-sm font-medium text-slate-800">Flagged Reports</span>
                          <p className="text-xs text-slate-500 mt-0.5">Email me when a report is flagged for manual review.</p>
                        </div>
                        <div className="relative shrink-0">
                          <input type="checkbox" defaultChecked className="peer sr-only" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:border-slate-200 transition-colors">
                        <div>
                          <span className="text-sm font-medium text-slate-800">Weekly QA Summary Digest</span>
                          <p className="text-xs text-slate-500 mt-0.5">Automated PDF report delivered to officials every Monday.</p>
                        </div>
                        <div className="relative shrink-0">
                          <input type="checkbox" defaultChecked className="peer sr-only" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:border-slate-200 transition-colors">
                        <div>
                          <span className="text-sm font-medium text-slate-800">Low Participation Alerts</span>
                          <p className="text-xs text-slate-500 mt-0.5">Notify when department response rate drops below 30%.</p>
                        </div>
                        <div className="relative shrink-0">
                          <input type="checkbox" className="peer sr-only" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                      </label>
                      
                      {userRole === "ADMIN" && (
                        <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:border-slate-200 transition-colors">
                          <div>
                            <span className="text-sm font-medium text-slate-800">New User Provisioning</span>
                            <p className="text-xs text-slate-500 mt-0.5">Alert when bulk user creation is completed.</p>
                          </div>
                          <div className="relative shrink-0">
                            <input type="checkbox" defaultChecked className="peer sr-only" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </div>
                        </label>
                      )}
                    </>
                  )}

                  {userRole === "STUDENT" && (
                    <>
                      <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:border-slate-200 transition-colors">
                        <div>
                          <span className="text-sm font-medium text-slate-800">Evaluation Reminders</span>
                          <p className="text-xs text-slate-500 mt-0.5">Email me when a new evaluation window opens.</p>
                        </div>
                        <div className="relative shrink-0">
                          <input type="checkbox" {...register("notifyEvalWindow")} className="peer sr-only" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                      </label>
                      <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:border-slate-200 transition-colors">
                        <div>
                          <span className="text-sm font-medium text-slate-800">Submission Receipts</span>
                          <p className="text-xs text-slate-500 mt-0.5">Email me receipt of my submission.</p>
                        </div>
                        <div className="relative shrink-0">
                          <input type="checkbox" {...register("notifySubmissionReceipt")} className="peer sr-only" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                      </label>
                    </>
                  )}
                  
                  {userRole === "LECTURER" && (
                    <>
                      <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:border-slate-200 transition-colors">
                        <div>
                          <span className="text-sm font-medium text-slate-800">Weekly Evaluation Digest</span>
                          <p className="text-xs text-slate-500 mt-0.5">Receive a weekly digest of new student evaluations.</p>
                        </div>
                        <div className="relative shrink-0">
                          <input type="checkbox" {...register("notifyWeeklyDigest")} className="peer sr-only" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                      </label>
                      <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:border-slate-200 transition-colors">
                        <div>
                          <span className="text-sm font-medium text-slate-800">Low Average Alert</span>
                          <p className="text-xs text-slate-500 mt-0.5">Alert me if a course average drops below a critical threshold (e.g., 3.0).</p>
                        </div>
                        <div className="relative shrink-0">
                          <input type="checkbox" {...register("notifyLowAverage")} className="peer sr-only" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                      </label>
                      <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:border-slate-200 transition-colors">
                        <div>
                          <span className="text-sm font-medium text-slate-800">Evaluation Window Reminders</span>
                          <p className="text-xs text-slate-500 mt-0.5">Remind me when an evaluation window for my course opens.</p>
                        </div>
                        <div className="relative shrink-0">
                          <input type="checkbox" {...register("notifyEvalWindow")} className="peer sr-only" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">Data Retention & Export</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">Configure automatic archiving for older semesters and perform bulk exports for offline storage.</p>
              </div>
              
              {userRole === "LECTURER" && (
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-4">Historical Evaluation Reports</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                      Download your official historical evaluation reports as a PDF. This utility is designed for compiling academic portfolios for tenure or promotion reviews.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-full sm:w-auto flex-1 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Academic Year</label>
                        <select className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white">
                          <option>2025 - 2026</option>
                          <option>2024 - 2025</option>
                          <option>2023 - 2024</option>
                          <option>All History</option>
                        </select>
                      </div>
                      <button className="w-full sm:w-auto h-11 px-6 mt-0 sm:mt-5 rounded-xl font-semibold text-sm bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shrink-0">
                        Generate PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          </>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3 items-center">
            <button type="button" onClick={() => reset()} className="h-10 px-5 rounded-xl font-medium text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={!isDirty || isSubmitting} className={`h-10 px-5 rounded-xl font-medium text-sm shadow-md transition-all ${
              !isDirty || isSubmitting 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.form>
      </div>

    </motion.div>
  );
}
