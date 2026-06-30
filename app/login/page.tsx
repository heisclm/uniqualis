"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, UserPlus, LogIn, ArrowRight, UserCircle, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type AuthMode = "LOGIN" | "STUDENT_SIGNUP" | "STAFF_SIGNUP";

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>("LOGIN");
  
  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Signup State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentIdNumber, setStudentIdNumber] = useState("");
  const [facultyId, setFacultyId] = useState("");
  
  const [faculties, setFaculties] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch faculties for signup
  useEffect(() => {
    fetch('/api/public/faculties')
      .then(res => res.json())
      .then(data => {
        if (data.faculties) {
          setFaculties(data.faculties);
          if (data.faculties.length > 0) {
            setFacultyId(data.faculties[0].id);
          }
        }
      })
      .catch(err => console.error("Failed to load faculties", err));
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    
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
          body.facultyId = facultyId;
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
    }
  };

  const getSubtitle = () => {
    switch (authMode) {
      case "LOGIN": return "Enter your credentials to access your portal.";
      case "STUDENT_SIGNUP": return "Create your student account to participate in course evaluations.";
      case "STAFF_SIGNUP": return "Register using your provisioned email from the QA department.";
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Panel: Branding & Context (Hidden on Mobile) */}
        <div className="hidden md:flex w-full md:w-5/12 bg-indigo-600 p-10 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-64 h-64 bg-indigo-800/30 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex items-center gap-3 mb-12">
            <Image src="/logo.png" alt="UniQualis Logo" width={40} height={40} className="shrink-0" />
            <span className="text-2xl font-bold tracking-tight">UniQualis</span>
          </div>

          <div className="relative z-10 mb-12 md:mb-0">
            <h2 className="text-3xl font-bold mb-4 leading-tight">University Quality Assurance System</h2>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6">
              Securely access evaluation modules, performance analytics, and administrative oversight tools tailored to your academic role.
            </p>
            <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <p className="text-xs text-indigo-50 leading-relaxed font-medium">
                <span className="block font-bold text-white mb-1">Administrative Access:</span>
                Lecturers, Officials, and System Admins must have their emails provisioned by the QA department prior to registration.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-4 text-xs font-medium text-indigo-200">
            <span>Enterprise-Grade Security</span>
            <span className="w-1 h-1 rounded-full bg-indigo-300"></span>
            <span>v2.5.0</span>
          </div>
        </div>

        {/* Right Panel: Auth Form */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 md:p-12 bg-white flex flex-col justify-center min-h-[100dvh] md:min-h-0 md:max-h-[90vh] overflow-y-auto">
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

            {authMode !== "LOGIN" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Faculty</label>
                      <select
                        required
                        value={facultyId}
                        onChange={(e) => setFacultyId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        <option value="" disabled>Select your faculty</option>
                        {faculties.map((fac) => (
                          <option key={fac.id} value={fac.id}>
                            {fac.name}
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
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {authMode === "STAFF_SIGNUP" && (
                <p className="text-xs text-slate-500 ml-1 mt-1">Must match the email provided by your QA administrator.</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1 mb-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                {authMode === "LOGIN" && <a href="#" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Forgot password?</a>}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={authMode === "LOGIN" ? "Enter your password" : "Create a strong password"}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {authMode === "LOGIN" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {authMode === "LOGIN" ? "Sign In Securely" : "Create Account"}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            {authMode === "LOGIN" ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => { setAuthMode("STUDENT_SIGNUP"); setErrorMessage(""); }}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 hover:border-indigo-200 w-full sm:w-auto justify-center"
                >
                  <UserCircle className="w-4 h-4" />
                  Student Registration
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode("STAFF_SIGNUP"); setErrorMessage(""); }}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 hover:border-indigo-200 w-full sm:w-auto justify-center"
                >
                  <Briefcase className="w-4 h-4" />
                  Staff Registration
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <p className="text-sm text-slate-500">Already have an account?</p>
                <button
                  type="button"
                  onClick={() => { setAuthMode("LOGIN"); setErrorMessage(""); }}
                  className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Sign In instead
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
