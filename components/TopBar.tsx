import { useState, useEffect, useRef } from "react";
import { Bell, Search, Menu, UserCircle, ChevronRight, Check } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Detect scroll on the nearest scrollable ancestor (the content div)
  useEffect(() => {
    const scrollable = document.querySelector('main > div');
    if (!scrollable) return;
    const onScroll = () => setIsScrolled(scrollable.scrollTop > 8);
    scrollable.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollable.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    
    if (isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          if (data.notifications) {
            setNotifications(data.notifications);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch notifications:", err);
      }
    };
    
    fetchNotifications();
    // Set up polling every 30 seconds for live notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      });
      if (id) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      } else {
        setNotifications([]);
        setIsNotificationOpen(false);
      }
    } catch (err) {
      console.warn("Failed to mark notification as read", err);
    }
  };

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

  const getProfileGradient = () => {
    switch(userRole) {
      case 'STUDENT': return 'from-emerald-600 to-teal-600 shadow-emerald-200';
      case 'LECTURER': return 'from-teal-500 to-emerald-600 shadow-teal-200';
      case 'OFFICIAL': return 'from-emerald-600 to-teal-700 shadow-emerald-200';
      case 'ADMIN':
      default: return 'from-emerald-600 to-indigo-600 shadow-emerald-200';
    }
  };

  const getThemeColor = () => {
    switch(userRole) {
      case 'STUDENT': return { border: 'border-emerald-500/50', ring: 'focus:ring-emerald-500/10', text: 'text-emerald-600', hoverText: 'hover:text-emerald-600', hoverTextHover: 'hover:text-emerald-700', bg: 'bg-emerald-500', shadow: 'shadow-[0_0_8px_rgba(16,185,129,0.6)]' };
      case 'LECTURER': return { border: 'border-teal-500/50', ring: 'focus:ring-teal-500/10', text: 'text-teal-600', hoverText: 'hover:text-teal-600', hoverTextHover: 'hover:text-teal-700', bg: 'bg-teal-500', shadow: 'shadow-[0_0_8px_rgba(20,184,166,0.6)]' };
      case 'OFFICIAL': return { border: 'border-emerald-500/50', ring: 'focus:ring-emerald-500/10', text: 'text-emerald-600', hoverText: 'hover:text-emerald-600', hoverTextHover: 'hover:text-emerald-700', bg: 'bg-emerald-600', shadow: 'shadow-[0_0_8px_rgba(5,150,105,0.6)]' };
      case 'ADMIN':
      default: return { border: 'border-emerald-500/50', ring: 'focus:ring-emerald-500/10', text: 'text-emerald-600', hoverText: 'hover:text-emerald-600', hoverTextHover: 'hover:text-emerald-700', bg: 'bg-emerald-500', shadow: 'shadow-[0_0_8px_rgba(16,185,129,0.6)]' };
    }
  };

  const theme = getThemeColor();

  return (
    <header
      className={`
        flex items-center justify-between
        px-4 md:px-6 lg:px-8 py-4
        sticky top-0 z-30
        w-full gap-3 sm:gap-4
        transition-all duration-300 ease-in-out
        ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-2xl border-b border-slate-200/70 shadow-[0_1px_20px_rgba(0,0,0,0.08)]'
            : 'bg-white/60 backdrop-blur-xl border-b border-white/50 shadow-[0_4px_30px_rgb(0,0,0,0.02)]'
        }
      `}
    >
      
      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
        {/* Mobile Menu Button */}
        <button 
          onClick={toggleSidebar}
          className="lg:hidden shrink-0 w-10 h-10 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center text-slate-500 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100/50 hover:bg-white/90 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title / Breadcrumb (Hidden on very small screens) */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 text-sm font-medium whitespace-nowrap min-w-0 overflow-hidden text-ellipsis">
          <span className="text-slate-400 shrink-0 hidden md:inline">Workspace</span>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 hidden md:inline" />
          <span className="text-slate-800 font-semibold tracking-tight capitalize truncate max-w-[140px] md:max-w-[200px] lg:max-w-none">{getPageTitle()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 md:gap-3 lg:gap-4 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`w-10 h-10 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center text-slate-500 shadow-sm border border-slate-200/50 hover:bg-white/80 ${theme.hoverText} transition-colors relative`}
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className={`absolute top-2.5 right-2.5 w-2 h-2 ${theme.bg} rounded-full border border-white animate-pulse`}></span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <div className="fixed top-20 left-4 right-4 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.12)] border border-slate-200/50 overflow-hidden z-50">
                <div className="p-4 border-b border-slate-200/50 flex items-center justify-between bg-white/50">
                  <h3 className="font-semibold text-slate-800">Notifications</h3>
                    {notifications.length > 0 && (
                      <button onClick={() => markAsRead()} className={`text-xs ${theme.text} ${theme.hoverTextHover} font-semibold transition-colors`}>
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[60vh] sm:max-h-[350px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-slate-100/50">
                        {notifications.map(notif => (
                          <div key={notif.id} className="p-4 hover:bg-slate-50/80 transition-colors flex gap-3 group items-start cursor-pointer" onClick={() => markAsRead(notif.id)}>
                            <div className={`mt-1 w-2 h-2 rounded-full ${theme.bg} shrink-0 ${theme.shadow}`}></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                              <span className="text-[10px] text-slate-400 mt-2 block font-medium uppercase tracking-wider">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-200/50 rounded-full h-fit text-slate-400 hover:text-slate-700"
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-slate-50/50 rounded-full flex items-center justify-center mb-3 border border-slate-100/50">
                          <Bell className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">You&apos;re all caught up!</p>
                        <p className="text-xs text-slate-400 mt-1">Check back later for updates</p>
                      </div>
                    )}
                  </div>
                </div>
            )}
          </div>
        </div>
        
        <div className="h-6 w-px bg-slate-200/50 hidden sm:block mx-1"></div>

        <button className="flex items-center gap-2.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/60 backdrop-blur-md border border-slate-200/50 text-slate-700 shadow-sm text-sm font-medium hover:bg-white/90 transition-all whitespace-nowrap">
          {user?.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profileImageUrl} alt="Profile" className="w-7 h-7 rounded-full object-cover border border-white shadow-sm" />
          ) : user ? (
            <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getProfileGradient()} flex items-center justify-center text-xs font-bold text-white tracking-wider shadow-sm`}>
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
          ) : (
            <UserCircle className="w-6 h-6 text-slate-400" />
          )}
          <span className="hidden sm:inline-block font-semibold tracking-tight">
            {user ? `${user.firstName.charAt(0)}. ${user.lastName}` : "Profile"}
          </span>
        </button>
      </div>
    </header>
  );
}
