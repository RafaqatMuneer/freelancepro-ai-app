import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Briefcase, 
  Eye,
  Search,
  Calendar,
  Clock,
  FileText,
  Tag,
  Sparkles,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUserClients, createClientRecord, updateClientRecord, deleteClientRecord, getUserProposals } from "../services/firestoreService";
import { ClientRecord, ClientStatus, Proposal } from "../types";

interface ClientsViewProps {
  selectedClientIdFromNav?: string | null;
  clearSelectedClientIdFromNav?: () => void;
  onCreateProposalForClient?: (clientId: string) => void;
  onOpenProposalDetail?: (proposal: Proposal) => void;
}

export function ClientsView({
  selectedClientIdFromNav,
  clearSelectedClientIdFromNav,
  onCreateProposalForClient,
  onOpenProposalDetail
}: ClientsViewProps) {
  const { currentUser } = useAuth();

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Success & Error Toast states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form / Modal state (Add / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);

  // View Details Modal state
  const [viewingClient, setViewingClient] = useState<ClientRecord | null>(null);

  // Delete Confirmation Dialog state
  const [deletingClient, setDeletingClient] = useState<ClientRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form input fields
  const [clientName, setClientName] = useState("");
  const [project, setProject] = useState("");
  const [status, setStatus] = useState<ClientStatus>("Lead");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchClientsAndProposals = async () => {
    if (!currentUser?.uid) {
      setClients([]);
      setProposals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [clientList, proposalList] = await Promise.all([
        getUserClients(currentUser.uid),
        getUserProposals(currentUser.uid)
      ]);
      setClients(clientList);
      setProposals(proposalList);

      // Check if nav requested opening a specific client
      if (selectedClientIdFromNav) {
        const targetClient = clientList.find(c => c.id === selectedClientIdFromNav);
        if (targetClient) {
          setViewingClient(targetClient);
        }
      }
    } catch (err: any) {
      console.error("Error fetching clients/proposals from Firestore:", err);
      setErrorMsg("Failed to load clients or proposals. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientsAndProposals();
  }, [currentUser, selectedClientIdFromNav]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingClient(null);
    setClientName("");
    setProject("");
    setStatus("Lead");
    setNotes("");
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: ClientRecord) => {
    setViewingClient(null);
    setEditingClient(client);
    setClientName(client.clientName || "");
    setProject(client.project || "");
    setStatus(client.status || "Lead");
    setNotes(client.notes || "");
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenView = (client: ClientRecord) => {
    setViewingClient(client);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) {
      setFormError("You must be logged in to save clients.");
      return;
    }

    if (!clientName.trim()) {
      setFormError("Client Name is required.");
      return;
    }

    if (!project.trim()) {
      setFormError("Project is required.");
      return;
    }

    if (!status) {
      setFormError("Status is required.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editingClient && editingClient.id) {
        await updateClientRecord(editingClient.id, {
          clientName: clientName.trim(),
          project: project.trim(),
          status,
          notes: notes.trim()
        });
        showSuccess("Client updated successfully.");
      } else {
        await createClientRecord(currentUser.uid, {
          clientName: clientName.trim(),
          project: project.trim(),
          status,
          notes: notes.trim()
        });
        showSuccess("Client added successfully.");
      }

      setIsFormOpen(false);
      await fetchClientsAndProposals();
    } catch (err: any) {
      console.error("Error saving client to Firestore:", err);
      setFormError(err?.message || "Failed to save client. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingClient || !deletingClient.id) return;
    if (!currentUser?.uid) {
      setErrorMsg("You must be logged in to delete client records.");
      return;
    }

    if (deletingClient.userId && deletingClient.userId !== currentUser.uid) {
      setErrorMsg("You can only delete your own clients.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteClientRecord(deletingClient.id);
      showSuccess("Client deleted successfully.");
      setDeletingClient(null);
      if (viewingClient?.id === deletingClient.id) {
        setViewingClient(null);
      }
      await fetchClientsAndProposals();
    } catch (err: any) {
      console.error("Error deleting client from Firestore:", err);
      setErrorMsg("Failed to delete client. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (s: ClientStatus) => {
    switch (s) {
      case 'Lead':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'On Hold':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Completed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Inactive':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return "N/A";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div id="clients-view" className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Banners */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs sm:text-sm font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Client Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage client profiles, projects, deal stages, and private engagement notes securely in Firestore.
          </p>
        </div>

        <button
          id="add-client-top-btn"
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Client</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client name, project, or notes..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Clients List / Cards Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
          Loading clients from Firestore...
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            {clients.length === 0 
              ? "No clients yet. Add your first client to start managing your freelance relationships."
              : "No clients match your filter criteria."}
          </p>
          {clients.length === 0 && (
            <button
              onClick={handleOpenAdd}
              className="mt-2 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> + Add Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm border border-indigo-100 shrink-0">
                      {client.clientName ? client.clientName.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{client.clientName}</h3>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.project || "General Engagement"}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${getStatusBadge(client.status)}`}>
                    {client.status}
                  </span>
                </div>

                {client.notes ? (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3 italic">
                    "{client.notes}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">No notes provided.</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>Created: {formatDate(client.createdAt)}</div>
                  {client.updatedAt && client.updatedAt !== client.createdAt && (
                    <div>Updated: {formatDate(client.updatedAt)}</div>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenView(client)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    title="View Client Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(client)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    title="Edit Client"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingClient(client)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    title="Delete Client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isFormOpen && (
        <div id="client-form-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>{editingClient ? "Edit Client" : "Add New Client"}</span>
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-50 text-rose-800 text-xs flex items-center gap-2 border-b border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveClient} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Client Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Acme Automation Corp"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Project <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g. n8n AI Workflow Automation"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClientStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Lead">Lead</option>
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Interested in an AI-powered automation workflow..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 resize-y"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving Client..." : "Save Client"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Client Details Modal */}
      {viewingClient && (() => {
        const relatedProposals = proposals.filter(p => p.clientId === viewingClient.id);
        return (
          <div id="view-client-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white font-bold flex items-center justify-center text-xs">
                    {viewingClient.clientName ? viewingClient.clientName.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base leading-tight">{viewingClient.clientName}</h3>
                    <p className="text-[11px] text-slate-400">Client Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingClient(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-medium text-slate-500">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(viewingClient.status)}`}>
                    {viewingClient.status}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-bold uppercase text-slate-500 mb-1">Project</span>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900">
                    {viewingClient.project || "N/A"}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold uppercase text-slate-500 mb-1">Notes</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {viewingClient.notes || <span className="text-slate-400 italic">No notes added.</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Created Date
                    </span>
                    <p className="font-semibold text-slate-800">{formatDate(viewingClient.createdAt)}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Last Updated Date
                    </span>
                    <p className="font-semibold text-slate-800">{formatDate(viewingClient.updatedAt)}</p>
                  </div>
                </div>

                {/* Related Proposals Section */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      Related Proposals ({relatedProposals.length})
                    </span>

                    {onCreateProposalForClient && (
                      <button
                        type="button"
                        onClick={() => {
                          const cId = viewingClient.id;
                          setViewingClient(null);
                          if (cId) onCreateProposalForClient(cId);
                        }}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>Create Proposal for This Client</span>
                      </button>
                    )}
                  </div>

                  {relatedProposals.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center italic">
                      No proposals linked to this client yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {relatedProposals.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-300 rounded-xl flex items-center justify-between gap-2 transition-all"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-xs truncate">{p.jobTitle}</p>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-white border-slate-200 text-slate-700 shrink-0">
                                {p.status || 'Draft'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Created: {formatDate(p.createdAt)}
                            </p>
                          </div>

                          {onOpenProposalDetail && (
                            <button
                              type="button"
                              onClick={() => {
                                setViewingClient(null);
                                onOpenProposalDetail(p);
                              }}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 hover:border-indigo-300 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setViewingClient(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
                  >
                    Close
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(viewingClient)}
                      className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Client</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingClient(viewingClient)}
                      className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Client</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Dialog */}
      {deletingClient && (() => {
        const relatedCount = proposals.filter(p => p.clientId === deletingClient.id).length;
        return (
          <div id="delete-client-modal" className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-3 bg-rose-100 rounded-full">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Delete Client</h4>
                  <p className="text-xs text-slate-500 truncate max-w-xs">{deletingClient.clientName}</p>
                </div>
              </div>

              {relatedCount > 0 ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    Warning: Client has {relatedCount} related proposal(s)
                  </p>
                  <p className="text-amber-800/90 leading-relaxed">
                    This client has existing proposals. Deleting the client will not delete the proposals, but those proposals will no longer be linked to this client.
                  </p>
                </div>
              ) : (
                <p className="text-xs font-medium text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  Are you sure you want to delete this client?
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingClient(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isDeleting ? (
                    <span>Deleting...</span>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Client</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
