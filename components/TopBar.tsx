import { useState, useEffect } from "react";
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
        console.error("Failed to fetch notifications:", err);
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
      console.error("Failed to mark notification as read", err);
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
          <div className="relative">
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-500 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 hover:bg-slate-50 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border border-white"></span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden z-50">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">Notifications</h3>
                  {notifications.length > 0 && (
                    <button onClick={() => markAsRead()} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {notifications.map(notif => (
                        <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-3 group">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 mt-2 block">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <button 
                            onClick={() => markAsRead(notif.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-200 rounded-full h-fit text-slate-400 hover:text-slate-700"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-5 h-5 text-slate-300" />
                      </div>
                      <p className="text-sm text-slate-500">You&apos;re all caught up!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
