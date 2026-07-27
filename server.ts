import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let genAI: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!genAI && apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAI;
}

// Health check route
app.get("/api/health", (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isConfigured = !!(apiKey && apiKey !== "MY_GEMINI_API_KEY");
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiConfigured: isConfigured,
  });
});

// Dedicated Gemini API test connection endpoint
app.get("/api/ai/test-connection", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(400).json({
        success: false,
        configured: false,
        error: "GEMINI_API_KEY environment variable is missing or unconfigured.",
        message: "Please configure GEMINI_API_KEY in the environment or secrets panel."
      });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.status(500).json({
        success: false,
        configured: false,
        error: "Failed to initialize Gemini AI client."
      });
    }

    // Call Gemini API using standard model gemini-3.6-flash
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Respond with exact string: 'Gemini 3.6 Flash connection verified successfully.'",
    });

    const outputText = response.text || "";

    return res.json({
      success: true,
      configured: true,
      modelUsed: "gemini-3.6-flash",
      responseSnippet: outputText.trim(),
      timestamp: new Date().toISOString(),
      message: "Gemini API connection test completed successfully!"
    });
  } catch (error: any) {
    console.error("Gemini connection test error:", error);
    return res.status(500).json({
      success: false,
      configured: true,
      error: "Gemini API call failed",
      details: error.message || String(error)
    });
  }
});

// AI Job Analysis endpoint (POST /api/ai/analyze-job)
app.post("/api/ai/analyze-job", async (req, res) => {
  try {
    const { clientName, jobTitle, jobDescription, freelancerProfile, profile } = req.body;
    const fProfile = freelancerProfile || profile;

    if (!jobTitle || typeof jobTitle !== "string" || !jobTitle.trim()) {
      return res.status(400).json({ success: false, error: "Job title is required." });
    }

    if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
      return res.status(400).json({ success: false, error: "Job description is required." });
    }

    const ai = getGenAIClient();

    if (!ai) {
      return res.status(503).json({
        success: false,
        error: "Gemini AI service is not available. Please verify GEMINI_API_KEY environment variable is configured."
      });
    }

    const profileSkills: string[] = Array.isArray(fProfile?.skills)
      ? fProfile.skills
      : typeof fProfile?.skills === "string"
        ? fProfile.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];

    const prompt = `You are FreelancePro AI, an expert, objective freelance business consultant and job posting analyst.

SYSTEM INSTRUCTIONS & STRICT RULES:
1. Analyze the client's job description carefully.
2. Identify explicit requirements stated by the client.
3. Separate explicit requirements from reasonable interpretations.
4. Do NOT invent information that is not present in the job description.
5. Use the freelancer profile ONLY to identify matching skills and potential skill gaps.
6. NEVER invent freelancer experience, certifications, projects, clients, achievements, or skills.
7. "matching_skills" MUST contain ONLY skills that are actually present in the freelancer's profile and relevant to the job.
8. "skill_gaps" should identify important required skills that are not clearly present in the freelancer profile.
9. If the freelancer profile is empty or missing, do NOT assume missing skills are present in the profile.
10. Generate 3 to 5 useful, highly specific clarification questions that the freelancer could ask the client before starting the project.
11. Clarification questions should focus on genuinely missing, ambiguous, or technical details in the job description.
12. Do NOT generate generic questions simply to fill the list.
13. "job_summary" should be concise and clear (1-2 sentences).
14. "key_requirements" should focus on concrete requirements/deliverables from the job description.
15. "client_needs" should identify the underlying business or project needs when reasonably inferable.
16. "responsibilities" should describe the specific work the freelancer is expected to perform.
17. "recommended_approach" should provide practical, strategic guidance for responding to the job.
18. If the job description is too short or unclear, identify missing information through clarification_questions instead of inventing details.

CLIENT NAME: ${clientName || "Not specified"}
JOB TITLE: ${jobTitle}
JOB DESCRIPTION:
${jobDescription}

FREELANCER PROFILE:
- Name: ${fProfile?.name || "Anonymous Freelancer"}
- Professional Title: ${fProfile?.title || "Freelance Specialist"}
- Bio: ${fProfile?.bio || "No bio provided"}
- Actual Listed Skills: ${profileSkills.length > 0 ? JSON.stringify(profileSkills) : "None listed in profile"}
- Experience Summary: ${fProfile?.experience || "Not provided"}
- Services Provided: ${fProfile?.services || "Not provided"}

Respond ONLY with a valid JSON object matching this exact schema:
{
  "job_summary": "Short summary of the client's project and objective",
  "key_requirements": ["Requirement 1", "Requirement 2"],
  "required_skills": ["Skill 1", "Skill 2"],
  "client_needs": ["Need 1", "Need 2"],
  "responsibilities": ["Responsibility 1", "Responsibility 2"],
  "matching_skills": ["Only skills present in the freelancer profile that match the job"],
  "skill_gaps": ["Required job skills NOT found in the freelancer profile"],
  "clarification_questions": ["Question 1", "Question 2", "Question 3"],
  "recommended_approach": "A concise recommendation for how the freelancer should approach the project"
}

Do NOT wrap the JSON in Markdown code fences.
Do NOT include any commentary outside the JSON object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    let rawText = response.text || "";
    rawText = rawText.trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }

    let analysisObj: any;
    try {
      analysisObj = JSON.parse(rawText);
    } catch (parseError) {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        analysisObj = JSON.parse(match[0]);
      } else {
        throw new Error("Invalid JSON returned by AI model.");
      }
    }

    const result = {
      job_summary: analysisObj.job_summary || analysisObj.jobSummary || "No summary available.",
      key_requirements: Array.isArray(analysisObj.key_requirements) ? analysisObj.key_requirements : (analysisObj.keyRequirements || []),
      required_skills: Array.isArray(analysisObj.required_skills) ? analysisObj.required_skills : (analysisObj.requiredSkills || []),
      client_needs: Array.isArray(analysisObj.client_needs) ? analysisObj.client_needs : (analysisObj.clientNeeds || []),
      responsibilities: Array.isArray(analysisObj.responsibilities) ? analysisObj.responsibilities : (analysisObj.responsibilities || []),
      matching_skills: Array.isArray(analysisObj.matching_skills) ? analysisObj.matching_skills : (analysisObj.matchingSkills || analysisObj.suggestedFreelancerSkills || []),
      skill_gaps: Array.isArray(analysisObj.skill_gaps) ? analysisObj.skill_gaps : (analysisObj.skillGaps || analysisObj.missingOrGapSkills || []),
      clarification_questions: Array.isArray(analysisObj.clarification_questions) ? analysisObj.clarification_questions : (analysisObj.clarificationQuestions || []),
      recommended_approach: analysisObj.recommended_approach || analysisObj.recommendedApproach || analysisObj.summary || "Address client core deliverables clearly."
    };

    return res.json({
      success: true,
      analysis: result
    });

  } catch (error: any) {
    console.error("Error in /api/ai/analyze-job:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to analyze job description with Gemini AI.",
      details: error.message || String(error)
    });
  }
});

// Alias for backwards compatibility (/api/ai/analyze)
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { clientName, jobTitle, jobDescription, freelancerProfile, profile } = req.body;
    const fProfile = freelancerProfile || profile;

    if (!jobTitle || !jobDescription) {
      return res.status(400).json({ error: "Job title and description are required" });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.json({
        analysis: createLocalAnalysisFallback(jobTitle, jobDescription, fProfile)
      });
    }

    // Call analyze-job logic directly
    const profileSkills: string[] = Array.isArray(fProfile?.skills)
      ? fProfile.skills
      : typeof fProfile?.skills === "string"
        ? fProfile.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];

    const prompt = `You are FreelancePro AI, an expert, objective freelance business consultant and job posting analyst.

SYSTEM INSTRUCTIONS & STRICT RULES:
1. Analyze the client's job description carefully.
2. Identify explicit requirements stated by the client.
3. Separate explicit requirements from reasonable interpretations.
4. Do NOT invent information that is not present in the job description.
5. Use the freelancer profile ONLY to identify matching skills and potential skill gaps.
6. NEVER invent freelancer experience, certifications, projects, clients, achievements, or skills.
7. "matching_skills" MUST contain ONLY skills that are actually present in the freelancer's profile and relevant to the job.
8. "skill_gaps" should identify important required skills that are not clearly present in the freelancer profile.
9. If the freelancer profile is empty or missing, do NOT assume missing skills are present in the profile.
10. Generate 3 to 5 useful, highly specific clarification questions that the freelancer could ask the client before starting the project.
11. Clarification questions should focus on genuinely missing, ambiguous, or technical details in the job description.
12. Do NOT generate generic questions simply to fill the list.
13. "job_summary" should be concise and clear (1-2 sentences).
14. "key_requirements" should focus on concrete requirements/deliverables from the job description.
15. "client_needs" should identify the underlying business or project needs when reasonably inferable.
16. "responsibilities" should describe the specific work the freelancer is expected to perform.
17. "recommended_approach" should provide practical, strategic guidance for responding to the job.
18. If the job description is too short or unclear, identify missing information through clarification_questions instead of inventing details.

CLIENT NAME: ${clientName || "Not specified"}
JOB TITLE: ${jobTitle}
JOB DESCRIPTION:
${jobDescription}

FREELANCER PROFILE:
- Name: ${fProfile?.name || "Anonymous Freelancer"}
- Professional Title: ${fProfile?.title || "Freelance Specialist"}
- Bio: ${fProfile?.bio || "No bio provided"}
- Actual Listed Skills: ${profileSkills.length > 0 ? JSON.stringify(profileSkills) : "None listed in profile"}
- Experience Summary: ${fProfile?.experience || "Not provided"}
- Services Provided: ${fProfile?.services || "Not provided"}

Respond ONLY with a valid JSON object matching this exact schema:
{
  "job_summary": "Short summary of the client's project and objective",
  "key_requirements": ["Requirement 1", "Requirement 2"],
  "required_skills": ["Skill 1", "Skill 2"],
  "client_needs": ["Need 1", "Need 2"],
  "responsibilities": ["Responsibility 1", "Responsibility 2"],
  "matching_skills": ["Only skills present in the freelancer profile that match the job"],
  "skill_gaps": ["Required job skills NOT found in the freelancer profile"],
  "clarification_questions": ["Question 1", "Question 2", "Question 3"],
  "recommended_approach": "A concise recommendation for how the freelancer should approach the project"
}

Do NOT wrap the JSON in Markdown code fences.
Do NOT include any commentary outside the JSON object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    let rawText = response.text || "";
    rawText = rawText.trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }

    let analysisObj: any;
    try {
      analysisObj = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        analysisObj = JSON.parse(match[0]);
      } else {
        return res.json({ analysis: createLocalAnalysisFallback(jobTitle, jobDescription, fProfile) });
      }
    }

    return res.json({
      success: true,
      analysis: analysisObj
    });
  } catch (error: any) {
    console.error("Error in /api/ai/analyze:", error);
    return res.status(500).json({
      error: "Failed to analyze job description",
      details: error.message
    });
  }
});

// AI Proposal Generation endpoint (POST /api/ai/generate-proposal)
app.post("/api/ai/generate-proposal", async (req, res) => {
  try {
    const { clientName, jobTitle, jobDescription, freelancerProfile, profile, jobAnalysis, analysis } = req.body;
    const fProfile = freelancerProfile || profile;
    const jAnalysis = jobAnalysis || analysis;

    if (!jobTitle || typeof jobTitle !== "string" || !jobTitle.trim()) {
      return res.status(400).json({ success: false, error: "Job title is required." });
    }
    if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
      return res.status(400).json({ success: false, error: "Job description is required." });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({
        success: false,
        error: "Gemini AI service is not available. Please verify GEMINI_API_KEY environment variable is configured."
      });
    }

    const profileSkills: string[] = Array.isArray(fProfile?.skills)
      ? fProfile.skills
      : typeof fProfile?.skills === "string"
        ? fProfile.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];

    const prompt = `You are FreelancePro AI, an expert, client-centric, highly articulate proposal writer for top freelancers.

SYSTEM INSTRUCTIONS & STRICT RULES FOR PROPOSAL GENERATION:
1. Write a personalized freelance proposal based ONLY on the information provided below.
2. Tailor the proposal specifically to the client (${clientName || "Hiring Manager"}) and their exact project requirements.
3. Do NOT generate a generic proposal template that could apply to any project.
4. Demonstrate clear comprehension of the client's actual project scope and underlying needs.
5. Mention relevant skills ONLY if they explicitly appear in the freelancer's actual profile skills list: ${JSON.stringify(profileSkills)}.
6. NEVER INVENT:
   - Skills not present in the freelancer profile
   - Certifications
   - Previous clients or company names
   - Previous projects, case studies, or portfolio items
   - Years of experience or quantitative metrics not in the profile
   - Achievements, technologies, or testimonials not in the profile
7. If a required job skill appears in "skill_gaps" (${JSON.stringify(jAnalysis?.skill_gaps || jAnalysis?.skillGaps || jAnalysis?.missingOrGapSkills || [])}), do NOT falsely claim expertise or past experience in that skill.
8. Do NOT claim the freelancer has completed similar projects unless that exact information exists in the profile.
9. Connect verified profile skills (${JSON.stringify(jAnalysis?.matching_skills || jAnalysis?.matchingSkills || [])}) naturally to the client's requirements.
10. Use a professional, confident, natural, conversational freelance tone. Avoid excessive buzzwords, promotional hype, or self-praise.
11. AVOID generic openings such as: "I am excited to apply for this opportunity." or "Dear Hiring Manager, I am writing to express my interest..."
12. START directly with a relevant, insightful observation about the client's project, workflow, or business goal.
13. Structure the proposal naturally into paragraphs covering:
    - Personalized Opening (insightful observation about their project/problem)
    - Understanding of the Project (briefly explain what the client needs solved)
    - Relevant Expertise (verified profile skills connected to project requirements)
    - Proposed Approach (practical execution steps and roadmap)
    - Clarification / Next Steps (ask 1-2 important questions from the analysis)
    - Closing (professional, warm invitation to connect and discuss)
14. CRITICAL MANDATE: Do NOT use structural headings or labels such as "Introduction", "Understanding", "Relevant Skills", "Proposed Approach", or "Closing". The final proposal text MUST read smoothly and naturally as a cohesive email or message sent to a client.
15. Keep the proposal concise, easy to scan, and focused on opening a dialogue.

CLIENT NAME: ${clientName || "Hiring Manager"}
JOB TITLE: ${jobTitle}
JOB DESCRIPTION:
${jobDescription}

FREELANCER PROFILE:
- Name: ${fProfile?.name || "Freelancer"}
- Professional Title: ${fProfile?.title || "Freelance Specialist"}
- Bio: ${fProfile?.bio || ""}
- Verified Profile Skills: ${JSON.stringify(profileSkills)}
- Experience Summary: ${fProfile?.experience || ""}
- Services Provided: ${fProfile?.services || ""}

JOB ANALYSIS RESULTS:
- Job Summary: ${jAnalysis?.job_summary || jAnalysis?.jobSummary || ""}
- Key Requirements: ${JSON.stringify(jAnalysis?.key_requirements || jAnalysis?.keyRequirements || [])}
- Required Job Skills: ${JSON.stringify(jAnalysis?.required_skills || jAnalysis?.requiredSkills || [])}
- Client Needs: ${JSON.stringify(jAnalysis?.client_needs || jAnalysis?.clientNeeds || [])}
- Responsibilities: ${JSON.stringify(jAnalysis?.responsibilities || [])}
- Matching Profile Skills: ${JSON.stringify(jAnalysis?.matching_skills || jAnalysis?.matchingSkills || [])}
- Skill Gaps: ${JSON.stringify(jAnalysis?.skill_gaps || jAnalysis?.skillGaps || jAnalysis?.missingOrGapSkills || [])}
- Clarification Questions: ${JSON.stringify(jAnalysis?.clarification_questions || jAnalysis?.clarificationQuestions || [])}
- Recommended Approach: ${jAnalysis?.recommended_approach || jAnalysis?.recommendedApproach || jAnalysis?.summary || ""}

Respond ONLY with a valid JSON object matching this exact schema:
{
  "proposal": "Complete proposal text formatted with clear paragraphs and line breaks",
  "key_personalization_points": [
    "Highlight point 1 showing how proposal was personalized based on verified profile skills and client needs",
    "Highlight point 2...",
    "Highlight point 3..."
  ],
  "recommended_questions": [
    "Key question 1 to confirm with the client",
    "Key question 2 to confirm with the client"
  ]
}

Do NOT wrap the JSON in Markdown code fences.
Do NOT include any commentary outside the JSON object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    let rawText = response.text || "";
    rawText = rawText.trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }

    let proposalObj: any;
    try {
      proposalObj = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        proposalObj = JSON.parse(match[0]);
      } else {
        throw new Error("Invalid JSON returned by proposal generation AI model.");
      }
    }

    const proposalText = proposalObj.proposal || proposalObj.proposalText || rawText;
    const keyPersonalizationPoints = Array.isArray(proposalObj.key_personalization_points)
      ? proposalObj.key_personalization_points
      : (Array.isArray(proposalObj.keyPersonalizationPoints) ? proposalObj.keyPersonalizationPoints : []);
    const recommendedQuestions = Array.isArray(proposalObj.recommended_questions)
      ? proposalObj.recommended_questions
      : (Array.isArray(proposalObj.recommendedQuestions) ? proposalObj.recommendedQuestions : []);

    return res.json({
      success: true,
      proposal: proposalText,
      proposalText: proposalText,
      key_personalization_points: keyPersonalizationPoints,
      recommended_questions: recommendedQuestions
    });

  } catch (error: any) {
    console.error("Error in /api/ai/generate-proposal:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate personalized proposal with Gemini AI.",
      details: error.message || String(error)
    });
  }
});

// Heuristic analysis helper for instant seamless offline/local operation
function createLocalAnalysisFallback(jobTitle: string, jobDescription: string, profile: any) {
  const descLower = jobDescription.toLowerCase();
  
  // Extract keywords
  const possibleSkills = ["React", "TypeScript", "Node.js", "Python", "UI/UX Design", "Figma", "Tailwind CSS", "WordPress", "SEO", "Copywriting", "API Integration", "Database Design", "Project Management"];
  const detectedSkills = possibleSkills.filter(s => descLower.includes(s.toLowerCase()));
  if (detectedSkills.length === 0) {
    detectedSkills.push("Problem Solving", "Quality Assurance", "Communication");
  }

  const userSkills: string[] = Array.isArray(profile?.skills) 
    ? profile.skills 
    : typeof profile?.skills === 'string' 
      ? profile.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

  const matchedSkills = userSkills.filter(s => descLower.includes(s.toLowerCase()));

  return {
    keyRequirements: [
      `Deliver reliable and high-quality outcomes for ${jobTitle}`,
      "Ensure clean execution adhering to specifications and timelines",
      "Provide regular progress updates and clear communication"
    ],
    requiredSkills: detectedSkills,
    clientNeeds: [
      `Resolve immediate operational pain points related to ${jobTitle}`,
      "Needs a dependable expert who can work independently without micro-management",
      "Requires timely completion with attention to detail"
    ],
    suggestedFreelancerSkills: matchedSkills.length > 0 ? matchedSkills : (userSkills.length > 0 ? userSkills.slice(0, 4) : ["Core Professional Competencies"]),
    missingOrGapSkills: [],
    clarificationQuestions: [
      `What is your preferred timeline and milestone schedule for this project?`,
      `Are there any existing design guidelines, brand assets, or technical specs I should review?`,
      `What metrics or key outcomes will define success for this engagement?`
    ],
    summary: `Tailor your pitch around high reliability and clean execution for ${jobTitle}. Emphasize how your verified background meets their immediate requirements.`
  };
}

function createLocalProposalFallback(jobTitle: string, jobDescription: string, clientName: string, profile: any, analysis: any) {
  const name = profile?.name || 'Freelancer';
  const title = profile?.title || 'Freelance Specialist';
  const client = clientName || 'Hiring Manager';
  const userSkillsStr = Array.isArray(profile?.skills) ? profile.skills.join(', ') : profile?.skills || 'relevant domain skills';

  return `Dear ${client},

I noticed your posting for **${jobTitle}** and am writing to offer my expertise. Understanding your goals and delivering a high-quality, dependable solution is my top priority.

### Understanding Your Project Needs
Based on your job description, your main objective is to effectively tackle:
${analysis?.clientNeeds?.map((need: string) => `- ${need}`).join('\n') || `- Executing the requirements for ${jobTitle}\n- Ensuring high quality and seamless delivery`}

### My Proposed Approach & Action Plan
1. **Discovery & Alignment**: Review all specifications, align on key milestones, and set up clear communication channels.
2. **Execution & Development**: Build the solution methodically according to best practices, with frequent checkpoints.
3. **Refinement & Testing**: Rigorously test and refine all deliverables to ensure complete accuracy.
4. **Final Handover & Support**: Walk through completed deliverables and provide post-launch documentation.

### Why Work With Me
As a **${title}**, I bring expertise in ${userSkillsStr}. My approach is built on clear communication, meeting deadlines, and delivering work that directly solves client problems.

### Clarification Questions
Before we kick off, I would love to clarify a few quick details:
1. What is your ideal launch target date or milestone timeline?
2. Do you have any existing brand guidelines or documentation available?

I look forward to discussing how we can make this project a success.

Best regards,  
**${name}**  
*${title}*`;
}

// Start Vite server or static handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FreelancePro AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
