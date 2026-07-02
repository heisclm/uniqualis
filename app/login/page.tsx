"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, UserPlus, LogIn, ArrowRight, UserCircle, Briefcase, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type AuthMode = "LOGIN" | "STUDENT_SIGNUP" | "STAFF_SIGNUP" | "FORGOT_PASSWORD" | "RESET_PASSWORD";

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>("LOGIN");
  
  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  
  // Signup State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentIdNumber, setStudentIdNumber] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Fetch departments for signup
  useEffect(() => {
    fetch('/api/public/departments')
      .then(res => res.json())
      .then(data => {
        if (data.departments) {
          setDepartments(data.departments);
          if (data.departments.length > 0) {
            setDepartmentId(data.departments[0].id);
          }
        }
      })
      .catch(err => console.error("Failed to load departments", err));
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    if (authMode === "FORGOT_PASSWORD") {
      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to request reset code");
        }
        
        setSuccessMessage(data.message);
        setAuthMode("RESET_PASSWORD");
      } catch (error: any) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (authMode === "RESET_PASSWORD") {
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token: resetToken, newPassword: password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Reset failed");
        }
        
        setSuccessMessage("Password reset successfully. You can now log in.");
        setAuthMode("LOGIN");
        setPassword("");
        setResetToken("");
      } catch (error: any) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    try {
      const isLogin = authMode === "LOGIN";
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      
      let body: any = { email, password };
      
      if (!isLogin) {
        body = {
          ...body,
          firstName,
          lastName,
          accountType: authMode === "STUDENT_SIGNUP" ? "STUDENT" : "STAFF",
        };
        
        if (authMode === "STUDENT_SIGNUP") {
          body.studentIdNumber = studentIdNumber;
          body.departmentId = departmentId;
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }
      
      router.push('/');
      router.refresh();
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (authMode) {
      case "LOGIN": return "Welcome Back";
      case "STUDENT_SIGNUP": return "Student Registration";
      case "STAFF_SIGNUP": return "Staff Registration";
      case "FORGOT_PASSWORD": return "Forgot Password";
      case "RESET_PASSWORD": return "Reset Password";
    }
  };

  const getSubtitle = () => {
    switch (authMode) {
      case "LOGIN": return "Enter your credentials to access your portal.";
      case "STUDENT_SIGNUP": return "Create your student account to participate in course evaluations.";
      case "STAFF_SIGNUP": return "Register using your provisioned email from the QA department.";
      case "FORGOT_PASSWORD": return "Enter your email address to receive a reset code.";
      case "RESET_PASSWORD": return "Enter the 6-digit code sent to your email and your new password.";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Premium Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none z-0"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/30 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-400/30 blur-[120px] pointer-events-none z-0"></div>

      <div className="w-full max-w-5xl bg-white/60 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/40 overflow-hidden flex flex-col md:flex-row relative z-10">
        
        {/* Left Panel: Branding & Context (Hidden on Mobile) */}
        <div className="hidden md:flex w-full md:w-5/12 bg-emerald-800/95 backdrop-blur-xl p-10 text-white flex-col justify-between relative overflow-hidden border-r border-white/20">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-64 h-64 bg-emerald-950/40 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex items-center gap-3 mb-12">
            <Image src="/logo.png" alt="UniQualis Logo" width={40} height={40} className="shrink-0" />
            <span className="text-2xl font-bold tracking-tight">UniQualis</span>
          </div>

          <div className="relative z-10 mb-12 md:mb-0">
            <h2 className="text-3xl font-bold mb-4 leading-tight">University Quality Assurance System</h2>
            <p className="text-emerald-100 text-sm leading-relaxed mb-6">
              Securely access evaluation modules, performance analytics, and administrative oversight tools tailored to your academic role.
            </p>
            <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <p className="text-xs text-emerald-50 leading-relaxed font-medium">
                <span className="block font-bold text-white mb-1">Administrative Access:</span>
                Lecturers, Officials, and System Admins must have their emails provisioned by the QA department prior to registration.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-4 text-xs font-medium text-emerald-200">
            <span>Enterprise-Grade Security</span>
            <span className="w-1 h-1 rounded-full bg-emerald-300"></span>
            <span>v2.5.0</span>
          </div>
        </div>

        {/* Right Panel: Auth Form */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 md:p-12 bg-white/40 flex flex-col justify-center min-h-[100dvh] md:min-h-0 md:max-h-[90vh] overflow-y-auto backdrop-blur-sm">
          {/* Mobile Logo */}
          <div className="flex md:hidden items-center gap-3 mb-8">
            <Image src="/logo.png" alt="UniQualis Logo" width={40} height={40} className="shrink-0" />
            <span className="text-2xl font-bold tracking-tight text-slate-900">UniQualis</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              {getTitle()}
            </h1>
            <p className="text-sm text-slate-500">
              {getSubtitle()}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {errorMessage}
              </div>
            )}
            
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-medium border border-emerald-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {successMessage}
              </div>
            )}

            {authMode !== "LOGIN" && authMode !== "FORGOT_PASSWORD" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-white/50 backdrop-blur-md border border-white/60 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-white/50 backdrop-blur-md border border-white/60 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
                    />
                  </div>
                </div>
                
                {authMode === "STUDENT_SIGNUP" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Student ID Number</label>
                      <input
                        type="text"
                        required
                        value={studentIdNumber}
                        onChange={(e) => setStudentIdNumber(e.target.value)}
                        placeholder="e.g. UGR0202210083"
                        className="w-full bg-white/50 backdrop-blur-md border border-white/60 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Department</label>
                      <select
                        required
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="w-full bg-white/50 backdrop-blur-md border border-white/60 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
                      >
                        <option value="" disabled>Select your department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={authMode === "LOGIN" ? "Institutional email" : "Enter your email address"}
                className="w-full bg-white/50 backdrop-blur-md border border-white/60 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm disabled:opacity-50"
                disabled={authMode === "RESET_PASSWORD"}
              />
              {authMode === "STAFF_SIGNUP" && (
                <p className="text-xs text-slate-500 ml-1 mt-1">Must match the email provided by your QA administrator.</p>
              )}
            </div>

            {authMode === "RESET_PASSWORD" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Reset Code</label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full bg-white/50 backdrop-blur-md border border-white/60 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
                />
              </div>
            )}

            {authMode !== "FORGOT_PASSWORD" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1 mb-1">
                  <label className="text-sm font-semibold text-slate-700">{authMode === "RESET_PASSWORD" ? "New Password" : "Password"}</label>
                  {authMode === "LOGIN" && <button type="button" onClick={(e) => { e.preventDefault(); setAuthMode("FORGOT_PASSWORD"); setErrorMessage(""); setSuccessMessage(""); }} className="text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-transparent border-none p-0 cursor-pointer">Forgot password?</button>}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={authMode === "LOGIN" ? "Enter your password" : authMode === "RESET_PASSWORD" ? "Enter new password" : "Create a strong password"}
                    className="w-full bg-white/50 backdrop-blur-md border border-white/60 text-slate-800 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-700 text-white rounded-xl font-medium hover:bg-emerald-800 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {authMode === "LOGIN" ? <LogIn className="w-4 h-4" /> : (authMode === "FORGOT_PASSWORD" || authMode === "RESET_PASSWORD") ? <ShieldCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {authMode === "LOGIN" ? "Sign In Securely" : authMode === "FORGOT_PASSWORD" ? "Send Reset Code" : authMode === "RESET_PASSWORD" ? "Reset Password" : "Create Account"}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200/50">
            {authMode === "LOGIN" ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => { setAuthMode("STUDENT_SIGNUP"); setErrorMessage(""); }}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 transition-colors bg-white/50 backdrop-blur-md px-4 py-2.5 rounded-lg border border-white/60 hover:border-emerald-200 w-full sm:w-auto justify-center shadow-sm"
                >
                  <UserCircle className="w-4 h-4" />
                  Student Registration
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode("STAFF_SIGNUP"); setErrorMessage(""); }}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 transition-colors bg-white/50 backdrop-blur-md px-4 py-2.5 rounded-lg border border-white/60 hover:border-emerald-200 w-full sm:w-auto justify-center shadow-sm"
                >
                  <Briefcase className="w-4 h-4" />
                  Staff Registration
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <p className="text-sm text-slate-500">{(authMode === "FORGOT_PASSWORD" || authMode === "RESET_PASSWORD") ? "Remember your password?" : "Already have an account?"}</p>
                <button
                  type="button"
                  onClick={() => { setAuthMode("LOGIN"); setErrorMessage(""); setSuccessMessage(""); }}
                  className="flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  {(authMode === "FORGOT_PASSWORD" || authMode === "RESET_PASSWORD") ? "Return to Sign In" : "Sign In instead"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
