import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { LandingView } from "./views/LandingView";
import { AuthView } from "./views/AuthView";
import { DashboardView } from "./views/DashboardView";
import { ProfileView } from "./views/ProfileView";
import { NewProposalView } from "./views/NewProposalView";
import { ProposalsView } from "./views/ProposalsView";
import { ClientsView } from "./views/ClientsView";
import { SettingsView } from "./views/SettingsView";
import { Proposal } from "./types";
import { Sparkles } from "lucide-react";

function AppContent() {
  const { currentUser, loading } = useAuth();

  const [currentView, setCurrentView] = useState("dashboard");
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  
  // Selection / Navigation states
  const [selectedProposalFromDash, setSelectedProposalFromDash] = useState<Proposal | null>(null);
  const [preselectedClientId, setPreselectedClientId] = useState<string | null>(null);
  const [selectedClientIdForClientsView, setSelectedClientIdForClientsView] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-bounce shadow-xl shadow-indigo-600/30">
          <Sparkles className="w-6 h-6 text-indigo-100" />
        </div>
        <div className="text-sm font-semibold tracking-wide text-slate-300">
          Connecting to FreelancePro AI...
        </div>
      </div>
    );
  }

  // Unauthenticated Flow
  if (!currentUser) {
    if (showAuthScreen) {
      return <AuthView onSuccess={() => setShowAuthScreen(false)} />;
    }
    return <LandingView onGetStarted={() => setShowAuthScreen(true)} />;
  }

  // Authenticated Workspace Flow
  const handleSelectProposalFromDash = (proposal: Proposal) => {
    setSelectedProposalFromDash(proposal);
    setCurrentView("proposals");
  };

  const handleCreateProposalForClient = (clientId: string) => {
    setPreselectedClientId(clientId);
    setCurrentView("new-proposal");
  };

  const handleOpenClientDetail = (clientId: string) => {
    setSelectedClientIdForClientsView(clientId);
    setCurrentView("clients");
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <DashboardView 
            setCurrentView={setCurrentView} 
            onSelectProposal={handleSelectProposalFromDash}
          />
        );
      case "new-proposal":
        return (
          <NewProposalView 
            onSavedSuccess={() => setCurrentView("proposals")}
            initialClientId={preselectedClientId}
            onClearInitialClient={() => setPreselectedClientId(null)}
          />
        );
      case "proposals":
        return (
          <ProposalsView 
            setCurrentView={setCurrentView} 
            selectedProposalFromDash={selectedProposalFromDash}
            clearSelectedProposalFromDash={() => setSelectedProposalFromDash(null)}
            onOpenClientDetail={handleOpenClientDetail}
          />
        );
      case "clients":
        return (
          <ClientsView 
            selectedClientIdFromNav={selectedClientIdForClientsView}
            clearSelectedClientIdFromNav={() => setSelectedClientIdForClientsView(null)}
            onCreateProposalForClient={handleCreateProposalForClient}
            onOpenProposalDetail={handleSelectProposalFromDash}
          />
        );
      case "profile":
        return <ProfileView />;
      case "settings":
        return <SettingsView />;
      default:
        return (
          <DashboardView 
            setCurrentView={setCurrentView} 
            onSelectProposal={handleSelectProposalFromDash}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpenMobile={isOpenMobileSidebar}
        setIsOpenMobile={setIsOpenMobileSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <Header 
          currentView={currentView}
          setCurrentView={setCurrentView}
          setIsOpenMobile={setIsOpenMobileSidebar}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
