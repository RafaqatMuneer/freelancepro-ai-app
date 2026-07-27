import React from "react";
import { 
  LayoutDashboard, 
  UserCheck, 
  FilePlus, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Sparkles,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export function Sidebar({ currentView, setCurrentView, isOpenMobile, setIsOpenMobile }: SidebarProps) {
  const { userProfile, logout, currentUser } = useAuth();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "new-proposal", label: "New Proposal", icon: FilePlus, badge: "AI Powered" },
    { id: "proposals", label: "Proposals", icon: FileText },
    { id: "clients", label: "Clients", icon: Users },
    { id: "profile", label: "My Profile", icon: UserCheck },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setCurrentView(id);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          id="mobile-sidebar-backdrop"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div id="sidebar-brand" className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavClick("dashboard")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight leading-none">FreelancePro <span className="text-indigo-400">AI</span></h1>
              <span className="text-[11px] text-slate-400 font-medium">Smart Client Assistant</span>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div id="sidebar-user-card" className="p-4 mx-3 my-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-900/80 text-indigo-300 font-bold flex items-center justify-center border border-indigo-500/30 text-sm shrink-0">
              {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : (currentUser?.email?.charAt(0).toUpperCase() || "U")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || "User"}
              </p>
              <p className="text-[11px] text-indigo-300 font-medium truncate">
                {userProfile?.title || "Freelancer"}
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-emerald-400 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Firebase Verified
            </span>
            <span className="text-slate-400">UID: {currentUser?.uid?.substring(0, 6)}...</span>
          </div>
        </div>

        {/* Navigation Section */}
        <div id="sidebar-navigation" className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] uppercase tracking-wider font-bold text-slate-400">
            Main Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-indigo-700 text-indigo-100" : "bg-indigo-950 text-indigo-300 border border-indigo-800/50"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div id="sidebar-footer" className="p-3 border-t border-slate-800 space-y-2">
          <button
            id="sidebar-logout-btn"
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
          
          <div className="px-3 py-2 text-[11px] text-slate-500 text-center border-t border-slate-800/60">
            FreelancePro AI v1.0
          </div>
        </div>
      </aside>
    </>
  );
}
