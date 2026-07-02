import { Home, BookOpen, Bookmark, FileText, ClipboardList, Users, MessageSquare, PieChart, Settings, LogOut, ArrowRight, Activity, ShieldCheck, X, Network, UserPlus, FileBarChart, LayoutTemplate } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

  const getThemeClasses = () => {
    switch(userRole) {
      case 'STUDENT':
        return {
          sidebarBg: 'bg-emerald-950/95',
          activeBtn: 'bg-emerald-700 text-white shadow-[0_4px_12px_rgba(4,120,87,0.25)] font-medium',
          hoverIcon: 'group-hover:text-emerald-400',
          roleBadge: 'text-emerald-300',
          profileCard: 'bg-emerald-900/40 border-emerald-800/50 hover:bg-emerald-900/60',
          divider: 'bg-emerald-800/50'
        };
      case 'LECTURER':
        return {
          sidebarBg: 'bg-slate-900/95', // Use dark slate instead of teal for background to keep it professional, accents in teal
          activeBtn: 'bg-teal-600 text-white shadow-[0_4px_12px_rgba(13,148,136,0.25)] font-medium',
          hoverIcon: 'group-hover:text-teal-400',
          roleBadge: 'text-teal-400',
          profileCard: 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800',
          divider: 'bg-slate-800'
        };
      case 'OFFICIAL':
        return {
          sidebarBg: 'bg-emerald-950/95',
          activeBtn: 'bg-emerald-600 text-white shadow-[0_4px_12px_rgba(5,150,105,0.25)] font-medium',
          hoverIcon: 'group-hover:text-emerald-400',
          roleBadge: 'text-emerald-300',
          profileCard: 'bg-emerald-900/40 border-emerald-800/50 hover:bg-emerald-900/60',
          divider: 'bg-emerald-800/50'
        };
      case 'ADMIN':
      default:
        return {
          sidebarBg: 'bg-slate-900/95',
          activeBtn: 'bg-emerald-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] font-medium',
          hoverIcon: 'group-hover:text-emerald-400',
          roleBadge: 'text-emerald-400',
          profileCard: 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800',
          divider: 'bg-slate-800'
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <aside className={`w-[260px] ${theme.sidebarBg} backdrop-blur-2xl text-slate-300 h-[100dvh] fixed left-0 top-0 flex flex-col pt-8 pb-6 shadow-[4px_0_24px_rgba(0,0,0,0.15)] border-r border-white/5 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand Header */}
      <div className="flex items-center justify-between px-8 mb-10 shrink-0">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="UniQualis Logo" width={32} height={32} className="shrink-0" />
          <span className="text-xl font-bold tracking-tight text-white drop-shadow-sm">UniQualis</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Section */}
      <div className="px-5 mb-8 shrink-0">
        <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group ${theme.profileCard}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-white font-semibold shadow-inner shrink-0 overflow-hidden">
              {user?.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : getRoleLabel().charAt(0)
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white tracking-wide truncate">
                {user ? `${user.firstName.charAt(0)}. ${user.lastName}` : "User Profile"}
              </span>
              <span className={`text-xs font-medium truncate ${theme.roleBadge}`}>{getRoleLabel()}</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors shrink-0" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
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
                  ? theme.activeBtn 
                  : "text-slate-400 hover:bg-white/10 hover:text-slate-100"
              }`}
            >
              <div className={`${isActive ? "text-white" : `text-slate-400 ${theme.hoverIcon} transition-colors`}`}>
                {item.icon}
              </div>
              <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 mt-auto pt-4 shrink-0">
        <div className={`w-full h-px mb-4 ${theme.divider}`} />
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200 group"
        >
          <div className="flex items-center gap-3.5">
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
            <span className="text-sm font-medium tracking-wide">Log Out</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
