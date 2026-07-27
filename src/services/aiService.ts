import { JobAnalysis, UserProfile } from "../types";

export async function analyzeJobPosting(
  jobTitle: string, 
  jobDescription: string, 
  clientName: string, 
  profile: UserProfile | null
): Promise<JobAnalysis> {
  const response = await fetch("/api/ai/analyze-job", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobTitle,
      jobDescription,
      clientName,
      freelancerProfile: profile
    })
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to analyze job description with Gemini AI.");
  }

  return data.analysis;
}

export interface GeneratedProposalResponse {
  proposal: string;
  key_personalization_points?: string[];
  recommended_questions?: string[];
}

export async function generateProposalAI(
  jobTitle: string,
  jobDescription: string,
  clientName: string,
  profile: UserProfile | null,
  analysis: JobAnalysis | null
): Promise<GeneratedProposalResponse> {
  const response = await fetch("/api/ai/generate-proposal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobTitle,
      jobDescription,
      clientName,
      freelancerProfile: profile,
      jobAnalysis: analysis
    })
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to generate proposal with Gemini AI.");
  }

  return {
    proposal: data.proposal || data.proposalText || "",
    key_personalization_points: data.key_personalization_points || [],
    recommended_questions: data.recommended_questions || []
  };
}

function runClientSideAnalysis(jobTitle: string, jobDescription: string, profile: UserProfile | null): JobAnalysis {
  const descLower = jobDescription.toLowerCase();
  const techTerms = ["React", "TypeScript", "Node.js", "Python", "Tailwind", "Figma", "UI/UX", "API", "Database", "WordPress", "SEO", "Copywriting", "Marketing", "E-commerce", "n8n", "AI", "Automation"];
  
  const foundInDesc = techTerms.filter(t => descLower.includes(t.toLowerCase()));
  if (foundInDesc.length === 0) {
    foundInDesc.push("Technical Execution", "Clear Communication", "Quality Assurance");
  }

  const userSkills = profile?.skills || ["Web Development", "Problem Solving"];
  const matched = userSkills.filter(s => descLower.includes(s.toLowerCase()));
  const missing = foundInDesc.filter(req => !userSkills.some(s => s.toLowerCase().includes(req.toLowerCase())));

  return {
    job_summary: `The client needs an experienced specialist to execute ${jobTitle} efficiently and deliver high-quality project outcomes.`,
    key_requirements: [
      `Execute core deliverables for ${jobTitle} according to client specifications`,
      "Provide regular progress updates and milestone deliverables",
      "Deliver a tested, reliable solution ready for production maintainability"
    ],
    required_skills: foundInDesc,
    client_needs: [
      `Solve operational bottlenecks associated with ${jobTitle}`,
      "Needs a proactive, communicative freelancer who takes initiative",
      "Requires clean handover and maintainable post-launch documentation"
    ],
    responsibilities: [
      `Gather project details and technical specs for ${jobTitle}`,
      "Build and test core functionality using best practices",
      "Provide project handover and client walkthrough"
    ],
    matching_skills: matched.length > 0 ? matched : userSkills.slice(0, 3),
    skill_gaps: missing.length > 0 ? missing : ["Specialized Domain Knowledge"],
    clarification_questions: [
      "What is your target completion timeline or preferred launch date?",
      "Are there existing design files, brand guidelines, or API credentials to reference?",
      "What is the primary metric or team workflow this solution connects to?"
    ],
    recommended_approach: `Highlight your proven track record in ${matched.length > 0 ? matched.join(', ') : 'project execution'} and articulate a clear milestone roadmap.`,
    
    // Legacy aliases
    keyRequirements: [
      `Execute core deliverables for ${jobTitle} according to client specifications`,
      "Provide regular progress updates and milestone deliverables",
      "Deliver a tested, reliable solution ready for production maintainability"
    ],
    requiredSkills: foundInDesc,
    clientNeeds: [
      `Solve operational bottlenecks associated with ${jobTitle}`,
      "Needs a proactive, communicative freelancer who takes initiative"
    ],
    suggestedFreelancerSkills: matched.length > 0 ? matched : userSkills.slice(0, 3),
    missingOrGapSkills: missing,
    clarificationQuestions: [
      "What is your target completion timeline or preferred launch date?",
      "Are there existing design files, brand guidelines, or API credentials to reference?",
      "What is the primary metric or team workflow this solution connects to?"
    ],
    summary: `Highlight your proven track record in ${matched.length > 0 ? matched.join(', ') : 'project execution'}.`
  };
}

function runClientSideProposal(
  jobTitle: string, 
  jobDescription: string, 
  clientName: string, 
  profile: UserProfile | null, 
  analysis: JobAnalysis | null
): string {
  const name = profile?.name || 'Freelancer';
  const title = profile?.title || 'Freelance Professional';
  const client = clientName || 'Hiring Manager';
  const skillsStr = profile?.skills ? profile.skills.join(', ') : 'modern development and problem solving';

  return `Dear ${client},

I read your posting for **${jobTitle}** with great interest. With my background as a **${title}**, I am confident in my ability to deliver the exact results you need for this project.

### Understanding Your Project Needs
Based on your job description, your key priorities are:
${analysis?.clientNeeds?.map(n => `- ${n}`).join('\n') || `- Delivering high quality solutions for ${jobTitle}\n- Ensuring clear communication and timely updates`}

### My Proposed Action Plan
1. **Discovery & Alignment**: Clarify all requirements, establish milestones, and agree on project expectations.
2. **Execution & Development**: Build the solution using modern standards, ensuring clean code and optimal performance.
3. **Quality Assurance**: Thoroughly test all deliverables across target platforms and user scenarios.
4. **Final Handover**: Deliver complete documentation and provide post-launch walkthrough.

### Why Choose Me
- **Verified Skills**: Strong proficiency in ${skillsStr}.
- **Client-Centric Approach**: Focused on solving your business challenges without unnecessary overhead.
- **Reliable Communication**: Daily/weekly updates keeping you informed at every step.

### Clarification Questions
To make sure we hit the ground running, I have a couple of brief questions:
${analysis?.clarificationQuestions?.map((q, i) => `${i + 1}. ${q}`).join('\n') || '1. What is your preferred timeline for project completion?\n2. Are there any specific brand guidelines to follow?'}

I look forward to discussing how we can work together on this!

Best regards,  
**${name}**  
*${title}*`;
}
