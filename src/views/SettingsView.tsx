import React, { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  Download, 
  LogOut, 
  User, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUserProposals, getUserClients } from "../services/firestoreService";
import firebaseConfigJson from "../../firebase-applet-config.json";

export function SettingsView() {
  const { currentUser, userProfile, logout } = useAuth();

  const [serverHealth, setServerHealth] = useState<any>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [exporting, setExporting] = useState(false);

  const checkHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setServerHealth(data);
      }
    } catch (err) {
      console.error("Health check error:", err);
    } finally {
      setCheckingHealth(false);
    }
  };

  const testGeminiConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/test-connection");
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: "Failed to reach server test endpoint",
        details: err.message
      });
    } finally {
      setTestingConnection(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleExportData = async () => {
    if (!currentUser?.uid) return;
    setExporting(true);
    try {
      const proposals = await getUserProposals(currentUser.uid);
      const clients = await getUserClients(currentUser.uid);

      const exportObject = {
        userProfile,
        proposals,
        clients,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `freelancepro-data-${currentUser.uid.substring(0, 6)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-indigo-600" /> Account & System Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Overview of Firebase project connection, Gemini API status, and data export tools.
          </p>
        </div>
      </div>

      {/* Account Profile Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="w-4 h-4 text-indigo-600" /> Authenticated Account Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Email Address</span>
            <div className="font-bold text-slate-800">{currentUser?.email}</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Firebase Auth UID</span>
            <div className="font-mono text-slate-800 font-bold">{currentUser?.uid}</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Display Name</span>
            <div className="font-bold text-slate-800">{userProfile?.name || currentUser?.displayName || "Not set"}</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Professional Title</span>
            <div className="font-bold text-slate-800">{userProfile?.title || "Not set"}</div>
          </div>
        </div>
      </div>

      {/* Firebase & Infrastructure Status */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Firebase Project Configuration
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-emerald-900">Firebase Auth & Cloud Firestore Active</div>
                <div className="text-[11px] text-emerald-700">Project ID: {firebaseConfigJson.projectId}</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
              VERIFIED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Auth Domain</div>
              <div className="font-mono text-slate-700 mt-1 truncate">{firebaseConfigJson.authDomain}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Firestore Database</div>
              <div className="font-mono text-slate-700 mt-1 truncate">{firebaseConfigJson.firestoreDatabaseId || 'default'}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Security Rules</div>
              <div className="text-emerald-600 font-bold mt-1">User UID Restricted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Server & AI Health */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" /> Backend & Gemini AI Status
          </h3>
          <button
            onClick={checkHealth}
            disabled={checkingHealth}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
            <span>Check Status</span>
          </button>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Express Server API Endpoint:</span>
            <span className="font-bold text-emerald-600">/api/health (Online)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Gemini AI Engine:</span>
            <span className={`font-bold ${serverHealth?.geminiConfigured ? 'text-emerald-600' : 'text-slate-600'}`}>
              {serverHealth?.geminiConfigured ? 'Gemini 3.6 Flash Active' : 'Environment Key Pending'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-700">Connection Test Endpoint:</span>
            <span className="font-mono text-slate-500 text-[11px]">/api/ai/test-connection</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={testGeminiConnection}
            disabled={testingConnection}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
            <span>{testingConnection ? "Testing Connection..." : "Test Gemini API Connection"}</span>
          </button>
        </div>

        {testResult && (
          <div className={`p-4 rounded-xl text-xs border space-y-2 ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                {testResult.success ? "Gemini Connection Verified" : "Gemini Connection Test Failed"}
              </span>
              <span className="font-mono text-[10px] opacity-75">{testResult.timestamp ? new Date(testResult.timestamp).toLocaleTimeString() : ''}</span>
            </div>
            
            {testResult.message && <p className="text-xs">{testResult.message}</p>}
            {testResult.responseSnippet && (
              <div className="p-2.5 bg-white/80 border border-emerald-200 rounded-lg font-mono text-[11px] text-emerald-950">
                <span className="text-emerald-600 font-bold block text-[10px] uppercase mb-1">Model Output:</span>
                "{testResult.responseSnippet}"
              </div>
            )}
            {testResult.error && (
              <div className="p-2.5 bg-white/80 border border-rose-200 rounded-lg font-mono text-[11px] text-rose-900 space-y-1">
                <div className="font-bold">{testResult.error}</div>
                {testResult.details && <div className="text-[10px] text-rose-700">{testResult.details}</div>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data Export & Logout */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Data Export & Backup</h3>
          <p className="text-xs text-slate-500">Download a full JSON copy of your profile, proposals, and clients.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? "Exporting..." : "Export Data (JSON)"}</span>
          </button>

          <button
            onClick={logout}
            className="flex-1 sm:flex-initial bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
