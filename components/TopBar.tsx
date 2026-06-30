import { Bell, Search, Menu, UserCircle, ChevronRight } from "lucide-react";

export function TopBar({ 
  toggleSidebar, 
  currentView,
  setView,
  userRole,
  user
}: { 
  toggleSidebar: () => void,
  currentView: string,
  setView: (v: string) => void,
  userRole: string,
  user?: { firstName: string; lastName: string; profileImageUrl?: string | null } | null
}) {
  const getPageTitle = () => {
    switch(currentView) {
      case 'dashboard': return 'Dashboard Overview';
      case 'hierarchy': return 'Hierarchy Management';
      case 'provisioning': return 'User Provisioning';
      case 'evaluate': return 'Pending Evaluations';
      case 'performance-feed': return 'Performance Feed';
      case 'courses': return 'My Courses';
      case 'history': return 'Evaluation History';
      case 'evaluation-templates': return 'Evaluation Templates';
      case 'analytics': return 'Analytics Hub';
      case 'settings': return 'System Settings';
      case 'reports': return 'Official Reports';
      case 'departments': return 'Departments';
      case 'users': return 'Manage Users';
      default: return 'Portal';
    }
  };

  return (
    <header className="flex items-center justify-between px-4 md:px-8 py-5 bg-[#F4F7FE]">
      
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button 
          onClick={toggleSidebar}
          className="lg:hidden w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-500 shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title / Breadcrumb (Hidden on very small screens) */}
        <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
          <span className="text-slate-400">Workspace</span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span className="text-slate-700 capitalize">{getPageTitle()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 md:gap-4 ml-auto">
        <div className="flex items-center gap-2 md:gap-3 mr-2 md:mr-4">
          <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-500 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 hover:bg-slate-50 transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-white"></span>
          </button>
          <button className="w-10 h-10 rounded-full bg-white hidden sm:flex items-center justify-center text-slate-500 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 hover:bg-slate-50 transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </div>
        
        <button className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-slate-900 text-white shadow-[0_4px_12px_rgba(15,23,42,0.2)] text-sm font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap">
          {user?.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profileImageUrl} alt="Profile" className="w-6 h-6 rounded-full object-cover border border-slate-700" />
          ) : user ? (
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white tracking-wider">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
          ) : (
            <UserCircle className="w-5 h-5" />
          )}
          <span className="hidden sm:inline-block">
            {user ? `${user.firstName.charAt(0)}. ${user.lastName}` : "Profile"}
          </span>
        </button>
      </div>
    </header>
  );
}
