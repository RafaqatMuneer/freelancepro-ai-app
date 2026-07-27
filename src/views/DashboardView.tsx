import React, { useEffect, useState } from "react";
import { 
  FileText, 
  Trophy, 
  MessageSquare, 
  Clock, 
  Plus, 
  Sparkles, 
  ArrowUpRight, 
  Users, 
  ExternalLink,
  ChevronRight,
  Eye,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUserProposals, getUserClients } from "../services/firestoreService";
import { Proposal, ClientRecord } from "../types";

interface DashboardViewProps {
  setCurrentView: (view: string) => void;
  onSelectProposal: (proposal: Proposal) => void;
}

export function DashboardView({ setCurrentView, onSelectProposal }: DashboardViewProps) {
  const { userProfile, currentUser } = useAuth();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const [propsList, clientList] = await Promise.all([
          getUserProposals(currentUser.uid),
          getUserClients(currentUser.uid)
        ]);
        if (isMounted) {
          setProposals(propsList);
          setClients(clientList);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => { isMounted = false; };
  }, [currentUser]);

  // Calculate real metrics from Firestore
  const totalProposals = proposals.length;
  const wonProposals = proposals.filter(p => p.status === 'Won').length;
  const inDiscussion = proposals.filter(p => p.status === 'In Discussion').length;
  const pendingFollowups = proposals.filter(p => p.status === 'Proposal Sent' || (p.followUpDate && new Date(p.followUpDate) >= new Date())).length;

  const winRate = totalProposals > 0 ? Math.round((wonProposals / totalProposals) * 100) : 0;
  const recentProposals = proposals.slice(0, 5);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Won': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Discussion': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Proposal Sent': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Lost': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Welcome Banner */}
      <div id="dashboard-welcome-card" className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Assistant Ready</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || "Freelancer"}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Analyze new job postings, craft personalized proposals without fake claims, and track your deal pipeline with Firestore.
            </p>
          </div>

          <button
            id="dashboard-cta-new-proposal"
            onClick={() => setCurrentView("new-proposal")}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Create New Proposal</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div id="dashboard-metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Proposals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Proposals</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalProposals}</span>
            <span className="text-xs font-medium text-slate-500">Firestore verified</span>
          </div>
        </div>

        {/* Won Proposals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Won Proposals</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{wonProposals}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              {winRate}% Win Rate
            </span>
          </div>
        </div>

        {/* In Discussion */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">In Discussion</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{inDiscussion}</span>
            <span className="text-xs font-medium text-slate-500">Active negotiations</span>
          </div>
        </div>

        {/* Pending Follow-ups */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Follow-ups</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{pendingFollowups}</span>
            <span className="text-xs font-medium text-amber-600">Action items</span>
          </div>
        </div>
      </div>

      {/* Main Content Split: Recent Proposals + Clients Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Proposals Table (2 cols on desktop) */}
        <div id="dashboard-recent-proposals" className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Proposals</h3>
              <p className="text-xs text-slate-500">Your latest AI generated & saved proposals</p>
            </div>
            <button
              id="view-all-proposals-btn"
              onClick={() => setCurrentView("proposals")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({totalProposals})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-0 overflow-x-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading proposals from Firestore...</div>
            ) : recentProposals.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No proposals saved yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click below to analyze a job description and generate your first personalized proposal.
                </p>
                <button
                  onClick={() => setCurrentView("new-proposal")}
                  className="mt-2 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  <Plus className="w-4 h-4" /> Create First Proposal
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Client / Job Title</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentProposals.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="font-semibold text-slate-900 truncate max-w-xs">{item.jobTitle}</div>
                        <div className="text-[11px] text-slate-400">{item.clientName || 'Direct Client'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {item.createdAt 
                          ? typeof item.createdAt === 'string'
                            ? new Date(item.createdAt).toLocaleDateString()
                            : (item.createdAt as any)?.toDate
                              ? (item.createdAt as any).toDate().toLocaleDateString()
                              : 'Recent'
                          : 'Recent'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectProposal(item)}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Clients & Profile Summary */}
        <div className="space-y-6">
          {/* Freelancer Profile Readiness Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Profile AI Matching</h3>
              <button
                onClick={() => setCurrentView("profile")}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Edit Profile
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-800">{userProfile?.title || "Freelance Professional"}</div>
              <p className="text-xs text-slate-500 line-clamp-2">{userProfile?.bio || "No bio provided yet."}</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Verified Skills</div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {userProfile?.skills && userProfile.skills.length > 0 ? (
                  userProfile.skills.slice(0, 6).map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-amber-600 italic">Add skills to improve AI proposal quality</span>
                )}
              </div>
            </div>
          </div>

          {/* Client Pipeline Preview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> Client Pipeline
              </h3>
              <button
                onClick={() => setCurrentView("clients")}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Manage ({clients.length})
              </button>
            </div>

            {clients.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-500">No active client records in Firestore.</p>
                <button
                  onClick={() => setCurrentView("clients")}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  + Add your first client
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {clients.slice(0, 4).map((client) => (
                  <div key={client.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{client.clientName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{client.project}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {client.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
