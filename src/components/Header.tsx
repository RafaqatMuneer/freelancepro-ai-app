import React from "react";
import { Menu, Plus, Bell, Search, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  setIsOpenMobile: (open: boolean) => void;
}

export function Header({ currentView, setCurrentView, setIsOpenMobile }: HeaderProps) {
  const { userProfile, currentUser } = useAuth();

  const getTitle = () => {
    switch (currentView) {
      case "dashboard": return "Dashboard Overview";
      case "new-proposal": return "AI Proposal Generator";
      case "proposals": return "Saved Proposals";
      case "clients": return "Client Management";
      case "profile": return "Freelancer Profile";
      case "settings": return "Account Settings";
      default: return "Dashboard";
    }
  };

  const getSubtitle = () => {
    switch (currentView) {
      case "dashboard": return "Track performance, proposals, and client pipelines.";
      case "new-proposal": return "Analyze job descriptions and create tailored proposals.";
      case "proposals": return "Review, status track, and manage your proposals.";
      case "clients": return "Manage client relationships, project statuses, and notes.";
      case "profile": return "Keep your profile up-to-date for accurate AI matching.";
      case "settings": return "Manage backend connection and account details.";
      default: return "Welcome to FreelancePro AI";
    }
  };

  return (
    <header id="app-header" className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left Title Area */}
      <div className="flex items-center space-x-3">
        <button
          id="mobile-menu-toggle"
          onClick={() => setIsOpenMobile(true)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg lg:hidden hover:bg-slate-100"
          aria-label="Open Mobile Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {getTitle()}
          </h2>
          <p className="hidden sm:block text-xs text-slate-500 font-normal">
            {getSubtitle()}
          </p>
        </div>
      </div>

      {/* Right Action Area */}
      <div className="flex items-center space-x-3">
        {currentView !== "new-proposal" && (
          <button
            id="header-new-proposal-btn"
            onClick={() => setCurrentView("new-proposal")}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Proposal</span>
            <span className="sm:hidden">New</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center border border-slate-200 text-xs">
            {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : (currentUser?.email?.charAt(0).toUpperCase() || "F")}
          </div>
          <span className="hidden md:inline-block text-xs font-medium text-slate-700">
            {userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0]}
          </span>
        </div>
      </div>
    </header>
  );
}
