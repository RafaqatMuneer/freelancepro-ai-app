import React from "react";
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Zap, Brain, Target, BarChart3 } from "lucide-react";

interface LandingViewProps {
  onGetStarted: () => void;
}

export function LandingView({ onGetStarted }: LandingViewProps) {
  return (
    <div id="landing-page" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">FreelancePro <span className="text-indigo-400">AI</span></span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              id="landing-signin-btn"
              onClick={onGetStarted}
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 transition-colors"
            >
              Sign In
            </button>
            <button
              id="landing-cta-top-btn"
              onClick={onGetStarted}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg shadow-md transition-all flex items-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tailored for Freelancers & Students Starting Out</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl">
          Turn Client Job Postings Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-teal-300">Winning Proposals</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
          Analyze complex job descriptions, extract key client requirements, generate personalized proposals without inventing fake skills, and manage client deals in one workspace.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          <button
            id="landing-hero-cta-btn"
            onClick={onGetStarted}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-base"
          >
            Start Crafting Proposals <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl hover:border-slate-600 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-800/40">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Job Requirement Analysis</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Instantly identify key deliverables, client pain points, required skills, and matching freelancer profile competencies.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl hover:border-slate-600 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-teal-950 text-teal-400 flex items-center justify-center mb-4 border border-teal-800/40">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Honest Proposal Generation</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Generates compelling pitches strictly based on your actual experience and skills. Never invents fake clients or credentials.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl hover:border-slate-600 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center mb-4 border border-amber-800/40">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Proposal & Client CRM</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Track proposals by status (Draft, Sent, In Discussion, Won, Lost) and manage client relationships seamlessly with Firestore.
            </p>
          </div>
        </div>

        {/* Security & Tech Trust */}
        <div className="mt-16 pt-8 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-center gap-6">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Firebase Auth & Firestore</span>
          <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-400" /> Server-side Gemini AI</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> User-Isolated Security Rules</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        FreelancePro AI &copy; {new Date().getFullYear()} — Built for Freelancers & Students
      </footer>
    </div>
  );
}
