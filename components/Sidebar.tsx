import { Home, BookOpen, Bookmark, FileText, ClipboardList, Users, MessageSquare, PieChart, Settings, LogOut, ArrowRight, Activity, ShieldCheck, X, Network, UserPlus, FileBarChart, LayoutTemplate } from "lucide-react";
import { useRouter } from "next/navigation";

export function Sidebar({ 
  currentView, 
  setView, 
  isOpen, 
  setIsOpen,
  userRole,
  user
}: { 
  currentView: string, 
  setView: (v: string) => void,
  isOpen: boolean,
  setIsOpen: (v: boolean) => void,
  userRole: string,
  user?: { firstName: string; lastName: string; profileImageUrl?: string | null } | null
}) {
  const router = useRouter();
  
  const allNavItems = [
    { id: "dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" />, roles: ["ADMIN", "STUDENT", "LECTURER", "OFFICIAL"] },
    { id: "hierarchy", label: "Hierarchy", icon: <Network className="w-5 h-5" />, roles: ["ADMIN"] },
    { id: "provisioning", label: "User Access", icon: <UserPlus className="w-5 h-5" />, roles: ["ADMIN"] },
    { id: "evaluate", label: "Evaluations", icon: <FileText className="w-5 h-5" />, roles: ["STUDENT"] },
    { id: "performance-feed", label: "Performance", icon: <MessageSquare className="w-5 h-5" />, roles: ["LECTURER"] },
    { id: "courses", label: "Courses", icon: <BookOpen className="w-5 h-5" />, roles: ["STUDENT", "LECTURER"] },
    { id: "history", label: "Evaluation History", icon: <ClipboardList className="w-5 h-5" />, roles: ["STUDENT"] },
    { id: "qa-action-plans", label: "QA Action Plans", icon: <ShieldCheck className="w-5 h-5" />, roles: ["OFFICIAL"] },
    { id: "evaluation-templates", label: "Templates", icon: <LayoutTemplate className="w-5 h-5" />, roles: ["ADMIN", "OFFICIAL"] },
    { id: "analytics", label: "Analytics", icon: <PieChart className="w-5 h-5" />, roles: ["ADMIN", "OFFICIAL"] },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" />, roles: ["ADMIN", "STUDENT", "LECTURER", "OFFICIAL"] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  const getRoleLabel = () => {
    switch(userRole) {
      case 'ADMIN': return 'QA Admin';
      case 'STUDENT': return 'Student';
      case 'LECTURER': return 'Lecturer';
      case 'OFFICIAL': return 'University Official';
      default: return 'User';
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <aside className={`w-[260px] bg-slate-900 text-slate-300 h-screen fixed left-0 top-0 flex flex-col pt-8 pb-6 shadow-2xl z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand Header */}
      <div className="flex items-center justify-between px-8 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">UniQualis</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Section */}
      <div className="px-6 mb-8">
        <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-white font-semibold shadow-inner shrink-0 overflow-hidden">
              {user?.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : getRoleLabel().charAt(0)
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-white tracking-wide truncate">
                {user ? `${user.firstName.charAt(0)}. ${user.lastName}` : "User Profile"}
              </span>
              <span className="text-xs text-blue-400 font-medium truncate">{getRoleLabel()}</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)] font-medium" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <div className={`${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400 transition-colors"}`}>
                {item.icon}
              </div>
              <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 mt-auto pt-4">
        <div className="w-full h-px bg-slate-800 mb-4" />
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
        >
          <div className="flex items-center gap-3.5">
            <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-400 transition-colors" />
            <span className="text-sm font-medium tracking-wide">Log Out</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
