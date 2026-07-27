import React, { useState, useEffect } from "react";
import { 
  X, 
  Copy, 
  Check, 
  Save, 
  Trash2, 
  Calendar, 
  Clock, 
  FileText, 
  Brain, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Target,
  Lightbulb,
  ListChecks,
  ShieldAlert,
  Compass,
  Users,
  Eye,
  ExternalLink
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Proposal, ProposalStatus, ClientRecord } from "../types";
import { updateProposal, deleteProposal } from "../services/firestoreService";
import { useAuth } from "../context/AuthContext";

interface ProposalDetailModalProps {
  proposal: Proposal;
  onClose: () => void;
  onUpdateSuccess: () => void;
  onViewClient?: (clientId: string) => void;
}

function formatDate(val: any): string {
  if (!val) return 'N/A';
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
  }
  if (typeof val === 'number') {
    return new Date(val).toLocaleString();
  }
  if (val?.toDate && typeof val.toDate === 'function') {
    return val.toDate().toLocaleString();
  }
  if (val?.seconds) {
    return new Date(val.seconds * 1000).toLocaleString();
  }
  return 'N/A';
}

export function ProposalDetailModal({ proposal, onClose, onUpdateSuccess, onViewClient }: ProposalDetailModalProps) {
  const { currentUser } = useAuth();

  const [content, setContent] = useState(proposal.generatedProposal || "");
  const [status, setStatus] = useState<ProposalStatus>(proposal.status || "Draft");
  const [followUpDate, setFollowUpDate] = useState(proposal.followUpDate || "");
  const [clientName, setClientName] = useState(proposal.clientName || "");
  const [jobTitle, setJobTitle] = useState(proposal.jobTitle || "");

  // Linked client state
  const [clientRecord, setClientRecord] = useState<ClientRecord | null>(null);
  const [loadingClientRecord, setLoadingClientRecord] = useState(false);
  const [clientExists, setClientExists] = useState<boolean | null>(null);

  const [showJobDesc, setShowJobDesc] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function resolveClient() {
      if (!proposal.clientId) {
        setClientExists(false);
        setClientRecord(null);
        return;
      }

      setLoadingClientRecord(true);
      try {
        const clientRef = doc(db, "clients", proposal.clientId);
        const snap = await getDoc(clientRef);
        if (snap.exists() && snap.data()?.userId === currentUser?.uid) {
          setClientRecord({ id: snap.id, ...snap.data() } as ClientRecord);
          setClientExists(true);
        } else {
          setClientRecord(null);
          setClientExists(false);
        }
      } catch (err) {
        console.error("Error fetching linked client:", err);
        setClientRecord(null);
        setClientExists(false);
      } finally {
        setLoadingClientRecord(false);
      }
    }

    resolveClient();
  }, [proposal.clientId, currentUser?.uid]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveChanges = async () => {
    if (!proposal.id) {
      setErrorMsg("Invalid proposal ID.");
      return;
    }

    if (!currentUser?.uid) {
      setErrorMsg("You must be logged in to update proposals.");
      return;
    }

    if (proposal.userId && proposal.userId !== currentUser.uid) {
      setErrorMsg("You can only edit your own proposals.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      await updateProposal(proposal.id, {
        generatedProposal: content,
        status,
        followUpDate,
        clientName,
        jobTitle
      });
      onUpdateSuccess();
      onClose();
    } catch (err: any) {
      console.error("Technical error updating proposal:", err);
      setErrorMsg("Failed to update proposal. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!proposal.id) {
      setErrorMsg("Invalid proposal ID.");
      return;
    }

    if (!currentUser?.uid) {
      setErrorMsg("You must be logged in to delete proposals.");
      return;
    }

    if (proposal.userId && proposal.userId !== currentUser.uid) {
      setErrorMsg("You can only delete your own proposals.");
      return;
    }
    
    setDeleting(true);
    setErrorMsg(null);
    try {
      await deleteProposal(proposal.id);
      onUpdateSuccess();
      onClose();
    } catch (err: any) {
      console.error("Technical error deleting proposal from Firestore:", err);
      setErrorMsg("Failed to delete proposal. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // Safe Extractors for Job Analysis
  const analysis = proposal.analysis;
  const jobSummary = analysis?.job_summary || analysis?.jobSummary || analysis?.summary || "";
  const keyRequirements = analysis?.key_requirements || analysis?.keyRequirements || [];
  const requiredSkills = analysis?.required_skills || analysis?.requiredSkills || [];
  const clientNeeds = analysis?.client_needs || analysis?.clientNeeds || [];
  const responsibilities = analysis?.responsibilities || [];
  const matchingSkills = analysis?.matching_skills || analysis?.matchingSkills || analysis?.suggestedFreelancerSkills || [];
  const skillGaps = analysis?.skill_gaps || analysis?.skillGaps || analysis?.missingOrGapSkills || [];
  const recommendedApproach = analysis?.recommended_approach || analysis?.recommendedApproach || "";

  // Clarification Questions
  let questions: string[] = [];
  if (Array.isArray(proposal.clarificationQuestions)) {
    questions = proposal.clarificationQuestions;
  } else if (typeof proposal.clarificationQuestions === 'string' && proposal.clarificationQuestions) {
    questions = [proposal.clarificationQuestions];
  } else if (analysis?.clarification_questions || analysis?.clarificationQuestions) {
    questions = analysis?.clarification_questions || analysis?.clarificationQuestions || [];
  }

  return (
    <div id="proposal-detail-modal" className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <span>Proposal Details & Management</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">ID: {proposal.id}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-lg mt-0.5">{jobTitle || proposal.jobTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center gap-2 px-6 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metadata & Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProposalStatus)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Draft">Draft</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="In Discussion">In Discussion</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Follow-up Reminder</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-100">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <strong>Created:</strong> {formatDate(proposal.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <strong>Updated:</strong> {formatDate(proposal.updatedAt)}
            </span>
          </div>

          {/* Linked Client Info Banner */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Client Association</div>
                {proposal.clientId ? (
                  loadingClientRecord ? (
                    <p className="text-slate-400">Loading client record...</p>
                  ) : clientExists && clientRecord ? (
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{clientRecord.clientName}</p>
                      <p className="text-slate-500 text-[11px]">Project: {clientRecord.project || 'N/A'}</p>
                    </div>
                  ) : (
                    <p className="font-semibold text-rose-600">Client no longer exists</p>
                  )
                ) : (
                  <p className="font-semibold text-slate-600">Not linked</p>
                )}
              </div>
            </div>

            {proposal.clientId && clientExists && clientRecord && onViewClient && (
              <button
                type="button"
                onClick={() => onViewClient(proposal.clientId!)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs text-white flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Client</span>
              </button>
            )}
          </div>

          {/* Job Description Accordion */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setShowJobDesc(!showJobDesc)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Original Job Description
              </span>
              {showJobDesc ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {showJobDesc && (
              <div className="p-4 text-xs text-slate-700 whitespace-pre-line leading-relaxed border-t border-slate-100 bg-slate-50/50 font-sans">
                {proposal.jobDescription || "No job description recorded."}
              </div>
            )}
          </div>

          {/* AI Job Analysis Section */}
          {analysis && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white space-y-0">
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="w-full px-4 py-3 bg-slate-900 text-white flex items-center justify-between text-xs font-bold cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  AI Job Analysis Breakdown
                </span>
                {showAnalysis ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
              </button>

              {showAnalysis && (
                <div className="p-5 space-y-4 text-xs bg-slate-900/95 text-slate-200">
                  {/* Job Summary */}
                  {jobSummary && (
                    <div className="space-y-1">
                      <div className="font-bold text-indigo-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Job Summary
                      </div>
                      <p className="text-slate-300 leading-relaxed bg-slate-800/80 p-3 rounded-lg border border-slate-800">
                        {jobSummary}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Key Requirements */}
                    {keyRequirements.length > 0 && (
                      <div className="space-y-1.5 bg-slate-800/60 p-3 rounded-lg border border-slate-800">
                        <div className="font-bold text-sky-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" /> Key Requirements
                        </div>
                        <ul className="space-y-1 text-slate-300">
                          {keyRequirements.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-sky-400">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Required Skills */}
                    {requiredSkills.length > 0 && (
                      <div className="space-y-1.5 bg-slate-800/60 p-3 rounded-lg border border-slate-800">
                        <div className="font-bold text-indigo-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                          <ListChecks className="w-3.5 h-3.5" /> Required Skills
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {requiredSkills.map((sk, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-200 border border-indigo-800 text-[11px]">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Client Needs */}
                    {clientNeeds.length > 0 && (
                      <div className="space-y-1.5 bg-slate-800/60 p-3 rounded-lg border border-slate-800">
                        <div className="font-bold text-amber-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5" /> Client Needs
                        </div>
                        <ul className="space-y-1 text-slate-300">
                          {clientNeeds.map((need, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-400">•</span>
                              <span>{need}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Responsibilities */}
                    {responsibilities.length > 0 && (
                      <div className="space-y-1.5 bg-slate-800/60 p-3 rounded-lg border border-slate-800">
                        <div className="font-bold text-purple-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5" /> Responsibilities
                        </div>
                        <ul className="space-y-1 text-slate-300">
                          {responsibilities.map((resp, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-purple-400">•</span>
                              <span>{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Matching Skills */}
                    {matchingSkills.length > 0 && (
                      <div className="space-y-1.5 bg-slate-800/60 p-3 rounded-lg border border-slate-800">
                        <div className="font-bold text-emerald-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified Profile Skill Matches
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {matchingSkills.map((sk, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-200 border border-emerald-800 text-[11px]">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skill Gaps */}
                    {skillGaps.length > 0 && (
                      <div className="space-y-1.5 bg-slate-800/60 p-3 rounded-lg border border-slate-800">
                        <div className="font-bold text-rose-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" /> Skill Gaps & Non-Claims
                        </div>
                        <ul className="space-y-1 text-slate-300">
                          {skillGaps.map((gap, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-rose-200">
                              <span className="text-rose-400">•</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Recommended Approach */}
                  {recommendedApproach && (
                    <div className="space-y-1 pt-1">
                      <div className="font-bold text-indigo-300 uppercase text-[10px] tracking-wider">
                        Recommended Strategic Approach
                      </div>
                      <p className="text-slate-300 leading-relaxed bg-slate-800/80 p-3 rounded-lg border border-slate-800">
                        {recommendedApproach}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Editable Proposal Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Saved Proposal Content</label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Text"}</span>
              </button>
            </div>

            <textarea
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm text-slate-900 font-mono leading-relaxed focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Clarification Questions */}
          {questions.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" /> Clarification Questions to Ask Client
              </div>
              <ol className="space-y-1.5 text-xs text-slate-700">
                {questions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-bold text-indigo-600 shrink-0">{idx + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setShowDeleteConfirm(true);
            }}
            disabled={deleting}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-rose-50 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{deleting ? "Deleting..." : "Delete Proposal"}</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Delete Proposal</h4>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
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
                  setShowDeleteConfirm(false);
                  setErrorMsg(null);
                }}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={deleting}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {deleting ? (
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
