import React, { useState, useEffect } from "react";
import { UserCheck, Save, Sparkles, CheckCircle2, AlertCircle, Plus, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function ProfileView() {
  const { userProfile, updateProfileData, currentUser } = useAuth();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [services, setServices] = useState("");

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setTitle(userProfile.title || "");
      setBio(userProfile.bio || "");
      setSkillsList(userProfile.skills || []);
      setExperience(userProfile.experience || "");
      setServices(userProfile.services || "");
    }
  }, [userProfile]);

  const handleAddSkill = () => {
    if (!skillsInput.trim()) return;
    const newSkills = skillsInput
      .split(",")
      .map(s => s.trim())
      .filter(s => s && !skillsList.includes(s));
    setSkillsList([...skillsList, ...newSkills]);
    setSkillsInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsList(skillsList.filter(s => s !== skillToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await updateProfileData({
        name,
        email: currentUser?.email || "",
        title,
        bio,
        skills: skillsList,
        experience,
        services,
      });
      setSuccessMsg("Profile saved successfully! AI proposal generation will now use your updated skills.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Save profile error:", err);
      setErrorMsg(err.message || "Failed to save profile to Firestore.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="profile-view" className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" /> Freelancer Profile
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            The AI engine checks this profile against client job postings. Keep your verified skills accurate—AI will never make up fake claims!
          </p>
        </div>

        <button
          id="profile-save-top-btn"
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Profile"}</span>
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya Lin"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Professional Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Professional Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Full Stack Developer & UI Designer"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Professional Bio / Summary
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Brief overview of your background, work ethos, and focus areas..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 resize-y"
          />
        </div>

        {/* Skills Tag Management */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Verified Skills & Technologies
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Add skill (e.g. React, Python, Figma) and press Enter or click Add"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[50px]">
            {skillsList.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No skills added yet. Type a skill above and click Add.</span>
            ) : (
              skillsList.map((skill, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-rose-600 text-indigo-400 font-bold"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Relevant Experience & Background
          </label>
          <textarea
            rows={3}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Describe your past freelance achievements, years of experience, or academic background..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 resize-y"
          />
        </div>

        {/* Services Offered */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Services Offered
          </label>
          <input
            type="text"
            value={services}
            onChange={(e) => setServices(e.target.value)}
            placeholder="e.g. Web Development, API Integration, Technical Documentation, Code Reviews"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Bottom Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            id="profile-save-bottom-btn"
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving to Firestore..." : "Save Profile Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
