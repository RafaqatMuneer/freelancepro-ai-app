import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Trash2, 
  Calendar, 
  Clock, 
  Sparkles,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUserProposals, deleteProposal, updateProposal } from "../services/firestoreService";
import { Proposal, ProposalStatus } from "../types";
import { ProposalDetailModal } from "./ProposalDetailModal";

interface ProposalsViewProps {
  setCurrentView: (view: string) => void;
  selectedProposalFromDash?: Proposal | null;
  clearSelectedProposalFromDash?: () => void;
  onOpenClientDetail?: (clientId: string) => void;
}

export function ProposalsView({ 
  setCurrentView, 
  selectedProposalFromDash, 
  clearSelectedProposalFromDash,
  onOpenClientDetail
}: ProposalsViewProps) {
  const { currentUser } = useAuth();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeModalProposal, setActiveModalProposal] = useState<Proposal | null>(selectedProposalFromDash || null);

  const fetchProposals = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const list = await getUserProposals(currentUser.uid);
      setProposals(list);
    } catch (err) {
      console.error("Error fetching proposals from Firestore:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [currentUser]);

  useEffect(() => {
    if (selectedProposalFromDash) {
      setActiveModalProposal(selectedProposalFromDash);
    }
  }, [selectedProposalFromDash]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, item: Proposal) => {
    e.stopPropagation();
    const newStatus = e.target.value as ProposalStatus;
    if (!item.id) return;

    if (!currentUser?.uid) {
      setErrorMsg("You must be logged in to update status.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    if (item.userId && item.userId !== currentUser.uid) {
      setErrorMsg("You can only update your own proposals.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    const prevStatus = item.status || "Draft";
    const nowIso = new Date().toISOString();

    // Optimistic UI update
    setProposals((prev) =>
      prev.map((p) =>
        p.id === item.id ? { ...p, status: newStatus, updatedAt: nowIso } : p
      )
    );

    try {
      await updateProposal(item.id, { status: newStatus });
      setSuccessMsg(`Status changed to "${newStatus}".`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Failed to update proposal status:", err);
      // Revert status
      setProposals((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: prevStatus } : p
        )
      );
      setErrorMsg("Failed to update status. Please try again.");
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const [deletingProposal, setDeletingProposal] = useState<Proposal | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDeleteQuick = (e: React.MouseEvent, item: Proposal) => {
    e.stopPropagation();
    if (!item.id) {
      setErrorMsg("Invalid proposal ID.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    if (!currentUser?.uid) {
      setErrorMsg("You must be logged in to delete proposals.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    if (item.userId && item.userId !== currentUser.uid) {
      setErrorMsg("You can only delete your own proposals.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    setDeletingProposal(item);
  };

  const confirmDeleteProposal = async () => {
    if (!deletingProposal || !deletingProposal.id) return;

    if (!currentUser?.uid) {
      setErrorMsg("You must be logged in to delete proposals.");
      return;
    }

    if (deletingProposal.userId && deletingProposal.userId !== currentUser.uid) {
      setErrorMsg("You can only delete your own proposals.");
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await deleteProposal(deletingProposal.id);
      setProposals((prev) => prev.filter((p) => p.id !== deletingProposal.id));
      setDeletingProposal(null);
      setSuccessMsg("Proposal deleted successfully.");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error("Technical error deleting proposal from Firestore:", err);
      setErrorMsg("Failed to delete proposal. Please try again.");
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered List
  const filteredProposals = proposals.filter((p) => {
    const matchesSearch = 
      p.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
    <div id="proposals-view" className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Saved Proposals
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review, edit, status track, and manage all proposals saved to your Firestore account.
          </p>
        </div>

        <button
          id="proposals-new-btn"
          onClick={() => setCurrentView("new-proposal")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>New Proposal</span>
        </button>
      </div>

      {/* Notifications / Feedback Banners */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search proposals by job title or client name..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Proposal Sent">Proposal Sent</option>
            <option value="In Discussion">In Discussion</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Proposals Grid / List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
          Loading proposals from Firestore...
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No proposals match your filter</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "All" ? "Try adjusting your search query or status filter." : "Get started by analyzing a job posting and generating your first proposal."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProposals.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveModalProposal(item)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      value={item.status || "Draft"}
                      onChange={(e) => handleStatusChange(e, item)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer focus:outline-none ${getStatusBadgeClass(item.status || "Draft")}`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Proposal Sent">Proposal Sent</option>
                      <option value="In Discussion">In Discussion</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                  <button
                    onClick={(e) => handleDeleteQuick(e, item)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete proposal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                  {item.jobTitle}
                </h3>
                
                <p className="text-xs font-medium text-indigo-600">
                  Client: {item.clientName || 'Direct Client'}
                </p>

                <p className="text-xs text-slate-500 line-clamp-3 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {item.generatedProposal}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {item.createdAt 
                    ? typeof item.createdAt === 'string'
                      ? new Date(item.createdAt).toLocaleDateString()
                      : (item.createdAt as any)?.toDate
                        ? (item.createdAt as any).toDate().toLocaleDateString()
                        : 'Recent'
                    : 'Recent'}
                </span>

                {item.followUpDate && (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Follow-up: {item.followUpDate}
                  </span>
                )}

                <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                  View <Eye className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {activeModalProposal && (
        <ProposalDetailModal
          proposal={activeModalProposal}
          onClose={() => {
            setActiveModalProposal(null);
            if (clearSelectedProposalFromDash) clearSelectedProposalFromDash();
          }}
          onUpdateSuccess={() => {
            fetchProposals();
          }}
          onViewClient={(clientId) => {
            setActiveModalProposal(null);
            if (onOpenClientDetail) {
              onOpenClientDetail(clientId);
            }
          }}
        />
      )}

      {/* Quick Delete Confirmation Dialog */}
      {deletingProposal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Delete Proposal</h4>
                <p className="text-xs text-slate-500 truncate max-w-xs">{deletingProposal.jobTitle}</p>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              Are you sure you want to delete this proposal?
            </p>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingProposal(null);
                  setErrorMsg(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProposal}
                disabled={isDeleting}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

