"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { AdminDashboard } from "@/components/AdminDashboard";
import { HierarchyManagement } from "@/components/HierarchyManagement";
import { UserProvisioning } from "@/components/UserProvisioning";
import { StudentEvaluationForm } from "@/components/StudentEvaluationForm";
import { LecturerDashboard } from "@/components/LecturerDashboard";
import { LecturerPerformance } from "@/components/LecturerPerformance";
import { LecturerCourses } from "@/components/LecturerCourses";
import { StudentDashboard } from "@/components/StudentDashboard";
import { StudentCourses } from "@/components/StudentCourses";
import { EvaluationHistory } from "@/components/EvaluationHistory";
import { OfficialDashboard } from "@/components/official/OfficialDashboard";
import { QAActionPlans } from "@/components/official/QAActionPlans";

import { Analytics } from "@/components/Analytics";
import { Settings } from "@/components/Settings";
import { EvaluationTemplates } from "@/components/EvaluationTemplates";

interface DashboardLayoutProps {
  userRole: string;
}

export function DashboardLayout({ userRole }: DashboardLayoutProps) {
  const [currentView, setCurrentView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ id?: string; firstName: string; lastName: string; email: string; profileImageUrl?: string | null } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch user data:", err);
      }
    };
    fetchUser();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden">
      {/* Dynamic Premium Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-400/20 blur-[120px] pointer-events-none"></div>

      <Sidebar 
        currentView={currentView} 
        setView={(view) => {
          setCurrentView(view);
          setIsSidebarOpen(false); // Close on mobile after selecting
        }} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        userRole={userRole}
        user={user}
      />
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <main className="flex-1 lg:ml-[260px] min-h-screen flex flex-col w-full">
        <TopBar 
          toggleSidebar={toggleSidebar} 
          currentView={currentView}
          setView={setCurrentView}
          userRole={userRole}
          user={user}
        />
        
        <div className="flex-1 overflow-x-hidden">
          {/* Admin Dashboards */}
          {currentView === "dashboard" && userRole === "ADMIN" && <AdminDashboard />}
          {currentView === "analytics" && userRole === "ADMIN" && <Analytics />}
          {currentView === "settings" && userRole === "ADMIN" && <Settings userRole={userRole} user={user} />}
          {currentView === "evaluation-templates" && userRole === "ADMIN" && <EvaluationTemplates />}
          {currentView === "hierarchy" && userRole === "ADMIN" && <HierarchyManagement />}
          {currentView === "provisioning" && userRole === "ADMIN" && <UserProvisioning />}
          
          {/* Official Dashboard */}
          {currentView === "dashboard" && userRole === "OFFICIAL" && <OfficialDashboard />}
          {currentView === "qa-action-plans" && userRole === "OFFICIAL" && <QAActionPlans />}
          {currentView === "evaluation-templates" && userRole === "OFFICIAL" && <EvaluationTemplates />}
          {currentView === "analytics" && userRole === "OFFICIAL" && <Analytics />}
          {currentView === "settings" && userRole === "OFFICIAL" && <Settings userRole={userRole} user={user} />}
          
          {/* Lecturer Dashboards */}
          {currentView === "dashboard" && userRole === "LECTURER" && <LecturerDashboard />}
          {currentView === "performance-feed" && userRole === "LECTURER" && <LecturerPerformance />}
          {currentView === "courses" && userRole === "LECTURER" && <LecturerCourses />}
          {currentView === "settings" && userRole === "LECTURER" && <Settings userRole={userRole} user={user} />}
          
          {/* Student Dashboards */}
          {currentView === "dashboard" && userRole === "STUDENT" && <StudentDashboard />}
          {currentView === "evaluate" && userRole === "STUDENT" && <StudentEvaluationForm />}
          {currentView === "courses" && userRole === "STUDENT" && <StudentCourses />}
          {currentView === "history" && userRole === "STUDENT" && <EvaluationHistory />}
          {currentView === "settings" && userRole === "STUDENT" && <Settings userRole={userRole} user={user} />}

          
          {/* Placeholder for other views */}
          {currentView !== "dashboard" && currentView !== "hierarchy" && currentView !== "analytics" && currentView !== "settings" && currentView !== "evaluation-templates" && currentView !== "evaluate" && currentView !== "performance-feed" && currentView !== "courses" && currentView !== "provisioning" && currentView !== "history" && currentView !== "qa-action-plans" && (
            <div className="flex items-center justify-center h-full text-slate-400 p-8 text-center">
              <p>The <span className="font-semibold text-slate-600 capitalize">{currentView.replace('-', ' ')}</span> module is currently under construction for {userRole}s.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
