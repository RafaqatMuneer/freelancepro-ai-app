import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Brain, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  UserCheck, 
  Code, 
  Target, 
  Lightbulb, 
  ListChecks, 
  ShieldAlert, 
  Compass,
  FileText,
  RotateCcw,
  Copy,
  Check,
  Edit3,
  RefreshCw,
  Save,
  Send,
  Zap,
  ArrowRight,
  Loader2,
  Users,
  UserPlus,
  Building2,
  UserX
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { analyzeJobPosting, generateProposalAI } from "../services/aiService";
import { createProposal, updateProposal, getUserClients, createClientRecord } from "../services/firestoreService";
import { JobAnalysis, ProposalStatus, ClientRecord, ClientStatus } from "../types";

interface NewProposalViewProps {
  onSavedSuccess?: () => void;
  initialClientId?: string | null;
  onClearInitialClient?: () => void;
}

export function NewProposalView({ onSavedSuccess, initialClientId, onClearInitialClient }: NewProposalViewProps) {
  const { userProfile, currentUser } = useAuth();

  // Client Selection / Link State
  const [userClients, setUserClients] = useState<ClientRecord[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId || null);
  const [clientSelectionMode, setClientSelectionMode] = useState<'select' | 'create' | 'none'>('select');

  // New Client Inline Form State
  const [inlineClientName, setInlineClientName] = useState("");
  const [inlineProject, setInlineProject] = useState("");
  const [inlineStatus, setInlineStatus] = useState<ClientStatus>("Lead");
  const [inlineNotes, setInlineNotes] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const [createClientError, setCreateClientError] = useState<string | null>(null);

  // Proposal Input States
  const [clientName, setClientName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // AI Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI Proposal Generation State
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [proposalText, setProposalText] = useState<string>("");
  const [keyPersonalizationPoints, setKeyPersonalizationPoints] = useState<string[]>([]);
  const [recommendedQuestions, setRecommendedQuestions] = useState<string[]>([]);
  const [proposalErrorMsg, setProposalErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditingProposal, setIsEditingProposal] = useState(false);
  
  // Real Firestore Persistence State
  const [isSaving, setIsSaving] = useState(false);
  const [savedProposalId, setSavedProposalId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Fetch clients for current user
  const loadUserClients = async () => {
    if (!currentUser?.uid) return;
    setLoadingClients(true);
    try {
      const list = await getUserClients(currentUser.uid);
      setUserClients(list);

      // If initialClientId is provided, auto-select
      if (initialClientId) {
        const found = list.find(c => c.id === initialClientId);
        if (found && found.id) {
          setSelectedClientId(found.id);
          setClientName(found.clientName);
          if (!jobTitle) setJobTitle(found.project);
          setClientSelectionMode('select');
        }
      }
    } catch (err) {
      console.error("Error loading user clients for selection:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    loadUserClients();
  }, [currentUser, initialClientId]);

  // Handle existing client selection
  const handleSelectClient = (clientIdVal: string) => {
    if (!clientIdVal) {
      setSelectedClientId(null);
      setClientName("");
      return;
    }
    const found = userClients.find(c => c.id === clientIdVal);
    if (found && found.id) {
      setSelectedClientId(found.id);
      setClientName(found.clientName);
      if (!jobTitle.trim()) {
        setJobTitle(found.project);
      }
    }
  };

  // Handle inline client creation
  const handleSaveInlineClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) {
      setCreateClientError("You must be logged in to create a client.");
      return;
    }
    if (!inlineClientName.trim()) {
      setCreateClientError("Client Name is required.");
      return;
    }
    if (!inlineProject.trim()) {
      setCreateClientError("Project is required.");
      return;
    }

    setCreatingClient(true);
    setCreateClientError(null);

    try {
      const newId = await createClientRecord(currentUser.uid, {
        clientName: inlineClientName.trim(),
        project: inlineProject.trim(),
        status: inlineStatus,
        notes: inlineNotes.trim()
      });

      // Reload clients
      const updatedList = await getUserClients(currentUser.uid);
      setUserClients(updatedList);

      setSelectedClientId(newId);
      setClientName(inlineClientName.trim());
      if (!jobTitle.trim()) {
        setJobTitle(inlineProject.trim());
      }

      setClientSelectionMode('select');
      setInlineClientName("");
      setInlineProject("");
      setInlineNotes("");
      setInlineStatus("Lead");
    } catch (err: any) {
      console.error("Error creating inline client:", err);
      setCreateClientError(err.message || "Failed to create client.");
    } finally {
      setCreatingClient(false);
    }
  };

  // Helper function to prefill sample job for easy testing
  const handleLoadSampleJob = () => {
    setClientName("ABC Automation");
    setJobTitle("n8n AI Workflow Automation");
    setJobDescription(
      `We are looking for a freelancer to build an AI-powered automation workflow using n8n. The workflow should collect information from incoming sources, process the information using an AI model, generate a structured summary, and send the final result to our team. The freelancer should have experience with n8n, APIs, AI integrations, and workflow automation. We would also like the solution to be reliable and easy to maintain.`
    );
    setErrorMsg(null);
    setProposalErrorMsg(null);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);
    setSavedProposalId(null);
  };

  const handleReset = () => {
    setSelectedClientId(null);
    if (onClearInitialClient) onClearInitialClient();
    setClientName("");
    setJobTitle("");
    setJobDescription("");
    setAnalysis(null);
    setProposalText("");
    setKeyPersonalizationPoints([]);
    setRecommendedQuestions([]);
    setErrorMsg(null);
    setProposalErrorMsg(null);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);
    setSavedProposalId(null);
    setIsEditingProposal(false);
  };

  // Analyze Job Description Handler
  const handleAnalyzeJob = async () => {
    if (!jobTitle.trim()) {
      setErrorMsg("Please enter a Job Title.");
      return;
    }
    if (!jobDescription.trim()) {
      setErrorMsg("Please enter a Job Description.");
      return;
    }

    setErrorMsg(null);
    setProposalErrorMsg(null);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);
    setAnalyzing(true);

    try {
      const result = await analyzeJobPosting(jobTitle, jobDescription, clientName, userProfile);
      setAnalysis(result);
    } catch (err: any) {
      console.error("Job analysis error:", err);
      setErrorMsg(err.message || "Failed to analyze job description with Gemini AI. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate Personalized Proposal Handler
  const handleGenerateProposal = async () => {
    if (!analysis) {
      setProposalErrorMsg("Please click 'Analyze Job Posting' first before generating a personalized proposal.");
      return;
    }

    if (!jobTitle.trim() || !jobDescription.trim()) {
      setProposalErrorMsg("Job Title and Job Description are required before generating a proposal.");
      return;
    }

    setProposalErrorMsg(null);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);
    setGeneratingProposal(true);

    try {
      const result = await generateProposalAI(
        jobTitle,
        jobDescription,
        clientName,
        userProfile,
        analysis
      );

      setProposalText(result.proposal);
      setKeyPersonalizationPoints(result.key_personalization_points || []);
      setRecommendedQuestions(result.recommended_questions || []);
      setIsEditingProposal(false);

      // Smooth scroll to generated proposal section
      setTimeout(() => {
        const el = document.getElementById("generated-proposal-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);

    } catch (err: any) {
      console.error("Proposal generation error:", err);
      setProposalErrorMsg(err.message || "Failed to generate personalized proposal with Gemini AI.");
    } finally {
      setGeneratingProposal(false);
    }
  };

  // Copy Proposal Handler
  const handleCopyProposal = () => {
    if (!proposalText) return;
    navigator.clipboard.writeText(proposalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Save Proposal Handler (Real Firestore Persistence & Validation)
  const handleSaveProposal = async () => {
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    // Save Validation Checks
    if (!currentUser?.uid) {
      setSaveErrorMsg("You must be logged in to save proposals.");
      return;
    }

    if (!jobTitle.trim()) {
      setSaveErrorMsg("Job Title is required before saving.");
      return;
    }

    if (!jobDescription.trim()) {
      setSaveErrorMsg("Job Description is required before saving.");
      return;
    }

    if (!analysis) {
      setSaveErrorMsg("Job Analysis is missing. Please analyze the job posting first.");
      return;
    }

    if (!proposalText || !proposalText.trim()) {
      setSaveErrorMsg("Proposal text is empty. Please generate or enter a proposal before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const proposalPayload = {
        clientId: selectedClientId || undefined,
        clientName: clientName.trim() || "Direct Client",
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim(),
        analysis: {
          job_summary: jobSummary,
          key_requirements: keyRequirements,
          required_skills: requiredSkills,
          client_needs: clientNeeds,
          responsibilities: responsibilities,
          matching_skills: matchingSkills,
          skill_gaps: skillGaps,
          clarification_questions: clarificationQuestions,
          recommended_approach: recommendedApproach
        },
        generatedProposal: proposalText.trim(),
        clarificationQuestions: recommendedQuestions.length > 0 ? recommendedQuestions : clarificationQuestions,
        status: "Draft" as ProposalStatus,
      };

      if (savedProposalId) {
        // Update existing saved proposal
        await updateProposal(savedProposalId, proposalPayload);
        setSaveSuccessMsg("Proposal updated successfully in Firestore!");
      } else {
        // Create new proposal in Firestore
        const newId = await createProposal(currentUser.uid, proposalPayload);
        setSavedProposalId(newId);
        setSaveSuccessMsg("Proposal saved successfully!");
      }

      if (onSavedSuccess) {
        setTimeout(() => {
          onSavedSuccess();
        }, 1200);
      }
    } catch (err: any) {
      console.error("Error saving proposal to Firestore:", err);
      setSaveErrorMsg(err.message || "Failed to save proposal to Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  // Safe Extractors for Job Analysis output
  const jobSummary = analysis?.job_summary || analysis?.jobSummary || "";
  const keyRequirements = analysis?.key_requirements || analysis?.keyRequirements || [];
  const requiredSkills = analysis?.required_skills || analysis?.requiredSkills || [];
  const clientNeeds = analysis?.client_needs || analysis?.clientNeeds || [];
  const responsibilities = analysis?.responsibilities || [];
  const matchingSkills = analysis?.matching_skills || analysis?.matchingSkills || analysis?.suggestedFreelancerSkills || [];
  const skillGaps = analysis?.skill_gaps || analysis?.skillGaps || analysis?.missingOrGapSkills || [];
  const clarificationQuestions = analysis?.clarification_questions || analysis?.clarificationQuestions || [];
  const recommendedApproach = analysis?.recommended_approach || analysis?.recommendedApproach || analysis?.summary || "";

  return (
    <div id="new-proposal-view" className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Powered by Gemini 3.6 Flash
          </div>
          <h2 className="text-xl font-bold text-slate-900">AI Proposal Generator & Job Analyzer</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Analyze freelance job postings and generate highly tailored proposals grounded strictly in your verified profile skills.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile: <strong>{userProfile?.name || 'Active Freelancer'}</strong> ({userProfile?.skills?.length || 0} skills)</span>
          </div>

          <button
            type="button"
            onClick={handleLoadSampleJob}
            className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Load Sample Job (n8n)</span>
          </button>
        </div>
      </div>

      {/* General Error Message */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* CLIENT SELECTION WORKFLOW SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" /> Client Relationship Association
          </h3>

          <span className="text-xs text-slate-500 font-medium">
            {selectedClientId ? (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Client Linked
              </span>
            ) : (
              <span className="text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                Not Linked
              </span>
            )}
          </span>
        </div>

        {/* 3 Option Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setClientSelectionMode('select')}
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              clientSelectionMode === 'select'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Option 1: Select Existing Client</span>
          </button>

          <button
            type="button"
            onClick={() => setClientSelectionMode('create')}
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              clientSelectionMode === 'create'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-4 h-4 text-indigo-600" />
            <span>Option 2: Create New Client</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setClientSelectionMode('none');
              setSelectedClientId(null);
            }}
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              clientSelectionMode === 'none'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <UserX className="w-4 h-4 text-slate-500" />
            <span>Option 3: Continue Without Client</span>
          </button>
        </div>

        {/* OPTION 1: SELECT EXISTING CLIENT */}
        {clientSelectionMode === 'select' && (
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Client from Your Client Records
            </label>
            {loadingClients ? (
              <p className="text-xs text-slate-400">Loading clients...</p>
            ) : userClients.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs space-y-2">
                <p className="font-semibold">No existing clients found in your Firestore database.</p>
                <button
                  type="button"
                  onClick={() => setClientSelectionMode('create')}
                  className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Switch to Create New Client
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedClientId || ""}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">-- Choose a Client --</option>
                  {userClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clientName} - {c.project} ({c.status})
                    </option>
                  ))}
                </select>

                {selectedClientId && (
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Selected: <strong>{clientName}</strong>. Client ID and project info are attached to this proposal.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* OPTION 2: CREATE NEW CLIENT INLINE */}
        {clientSelectionMode === 'create' && (
          <form onSubmit={handleSaveInlineClient} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-indigo-600" /> Create & Link New Client
            </h4>

            {createClientError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{createClientError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Client Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inlineClientName}
                  onChange={(e) => setInlineClientName(e.target.value)}
                  placeholder="e.g. Acme Automation"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Project <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inlineProject}
                  onChange={(e) => setInlineProject(e.target.value)}
                  placeholder="e.g. n8n AI Workflow"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={inlineStatus}
                  onChange={(e) => setInlineStatus(e.target.value as ClientStatus)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Lead">Lead</option>
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Notes (Optional)</label>
              <input
                type="text"
                value={inlineNotes}
                onChange={(e) => setInlineNotes(e.target.value)}
                placeholder="e.g. Initial outreach regarding automation workflow"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={creatingClient}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{creatingClient ? "Saving Client..." : "Save & Select Client"}</span>
              </button>
            </div>
          </form>
        )}

        {/* OPTION 3: CONTINUE WITHOUT CLIENT */}
        {clientSelectionMode === 'none' && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 italic">
            This proposal will be created without linking to a specific Client record. You can optionally enter a custom Client/Company Name below.
          </div>
        )}
      </div>

      {/* Input Form Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" /> Job Details & Requirements Input
          </h3>

          {(clientName || jobTitle || jobDescription) && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear Form
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Client / Company Name
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. ABC Automation / Sarah Jenkins"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. n8n AI Workflow Automation"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Job Description / Scope *
          </label>
          <textarea
            rows={5}
            required
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste full job description, scope, requirements, or client instructions here..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 resize-y"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            id="analyze-job-btn"
            type="button"
            onClick={handleAnalyzeJob}
            disabled={analyzing || !jobTitle.trim() || !jobDescription.trim()}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Brain className={`w-4 h-4 text-indigo-400 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? "Gemini AI is Analyzing Job..." : "Analyze Job Posting"}</span>
          </button>

          <button
            id="generate-proposal-direct-btn"
            type="button"
            onClick={handleGenerateProposal}
            disabled={generatingProposal || !analysis || !jobTitle.trim() || !jobDescription.trim()}
            title={!analysis ? "Analyze the job posting first to enable proposal generation" : ""}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className={`w-4 h-4 text-indigo-200 ${generatingProposal ? 'animate-spin' : ''}`} />
            <span>{generatingProposal ? "Generating Proposal with Gemini..." : "Generate Personalized Proposal"}</span>
          </button>
        </div>
      </div>

      {/* AI Structured Analysis Output */}
      {analysis && (
        <div id="ai-job-analysis-results" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">Analysis Stage</div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                <span>AI Job Analysis Results</span>
              </h3>
            </div>

            <button
              type="button"
              onClick={handleGenerateProposal}
              disabled={generatingProposal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 text-indigo-200 ${generatingProposal ? 'animate-spin' : ''}`} />
              <span>{generatingProposal ? "Generating Proposal..." : "Generate Personalized Proposal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Job Summary */}
          {jobSummary && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>1. Job Summary</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {jobSummary}
              </p>
            </div>
          )}

          {/* Grid for Requirements, Skills, Needs, Responsibilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 2. Key Requirements */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
                <ListChecks className="w-4 h-4 text-indigo-600" />
                <span>2. Key Requirements</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {keyRequirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Required Skills */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
                <Code className="w-4 h-4 text-indigo-600" />
                <span>3. Required Skills</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map((sk, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium rounded-lg"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* 4. Client Needs */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
                <Target className="w-4 h-4 text-teal-600" />
                <span>4. Client Needs</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {clientNeeds.map((need, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                    <span>{need}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 5. Responsibilities */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
                <ListChecks className="w-4 h-4 text-blue-600" />
                <span>5. Responsibilities</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Profile Match & Skill Gaps Comparison Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 6. Your Skill Match */}
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>6. Your Skill Match</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  From Profile
                </span>
              </div>
              <p className="text-xs text-emerald-900/80">
                Skills found in your actual profile that directly align with this job:
              </p>
              <div className="flex flex-wrap gap-2">
                {matchingSkills.length > 0 ? (
                  matchingSkills.map((sk, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No exact matching skills found in your listed profile.</span>
                )}
              </div>
            </div>

            {/* 7. Potential Skill Gaps */}
            <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>7. Potential Skill Gaps</span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  Not in Profile
                </span>
              </div>
              <p className="text-xs text-amber-900/80">
                Required skills mentioned in the job that are not explicitly listed in your profile:
              </p>
              <div className="flex flex-wrap gap-2">
                {skillGaps.length > 0 ? (
                  skillGaps.map((gap, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-medium rounded-lg flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      {gap}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-700 font-medium">No major skill gaps identified! Your profile aligns well.</span>
                )}
              </div>
            </div>
          </div>

          {/* 8. Clarification Questions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>8. Clarification Questions (3-5 Suggested Questions)</span>
            </div>
            <p className="text-xs text-slate-500">
              High-value questions to ask the client during initial discovery to clarify ambiguous requirements:
            </p>
            <ol className="space-y-2.5">
              {clarificationQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-800">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-medium pt-0.5">{q}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 9. Recommended Approach */}
          {recommendedApproach && (
            <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-md space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>9. Recommended Approach</span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed font-medium">
                {recommendedApproach}
              </p>
            </div>
          )}
        </div>
      )}

      {/* SAVE ERROR NOTICE */}
      {saveErrorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{saveErrorMsg}</span>
        </div>
      )}

      {/* SAVE SUCCESS NOTICE */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
          {onSavedSuccess && (
            <button
              onClick={onSavedSuccess}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer shrink-0"
            >
              View in Proposal History →
            </button>
          )}
        </div>
      )}

      {/* GENERATED PROPOSAL RESULT SECTION */}
      {proposalText && (
        <div id="generated-proposal-section" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          {/* Section Header */}
          <div className="bg-slate-900 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold mb-1 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" /> Gemini 3.6 Flash Personalized Output
              </div>
              <h3 className="text-lg font-bold">Generated Proposal</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
                <span>Client: <strong className="text-white">{clientName || 'Hiring Manager'}</strong></span>
                <span>•</span>
                <span>Project: <strong className="text-white">{jobTitle}</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditingProposal(!isEditingProposal)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isEditingProposal 
                    ? 'bg-amber-400 text-amber-950 hover:bg-amber-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingProposal ? 'Editing Proposal' : 'Edit'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyProposal}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Proposal'}</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateProposal}
                disabled={generatingProposal}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generatingProposal ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>

              <button
                type="button"
                onClick={handleSaveProposal}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSaving ? "Saving..." : "Save Proposal"}</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Proposal Text Editor / Viewer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>Proposal Message Content</span>
                <span className="text-[11px] font-normal text-slate-400">
                  {isEditingProposal ? 'Editing Mode Active' : 'Click "Edit" to modify before sending or saving'}
                </span>
              </div>

              {isEditingProposal ? (
                <textarea
                  rows={14}
                  value={proposalText}
                  onChange={(e) => setProposalText(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-2 border-indigo-500 rounded-xl text-xs sm:text-sm font-sans text-slate-900 leading-relaxed focus:outline-none resize-y"
                />
              ) : (
                <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                  {proposalText}
                </div>
              )}
            </div>

            {/* Personalization Highlights */}
            {keyPersonalizationPoints.length > 0 && (
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <span>Personalization Highlights</span>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-indigo-950">
                  {keyPersonalizationPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Questions */}
            {recommendedQuestions.length > 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Recommended Questions to Ask Client</span>
                </div>
                <ol className="space-y-2 text-xs text-slate-700">
                  {recommendedQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 font-medium">{q}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Generated based on verified profile: <strong>{userProfile?.name || 'Freelancer'}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyProposal}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Proposal'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveProposal}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSaving ? "Saving..." : "Save Proposal"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
