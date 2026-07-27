export type ProposalStatus = 'Draft' | 'Proposal Sent' | 'In Discussion' | 'Won' | 'Lost';

export type ClientStatus = 'Lead' | 'Active' | 'On Hold' | 'Completed' | 'Inactive';

export interface UserProfile {
  uid?: string;
  name: string;
  email: string;
  title: string;
  bio: string;
  skills: string[];
  experience: string;
  services: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobAnalysis {
  // Primary structured AI analysis output fields
  job_summary?: string;
  jobSummary?: string;
  
  key_requirements?: string[];
  keyRequirements?: string[];
  
  required_skills?: string[];
  requiredSkills?: string[];
  
  client_needs?: string[];
  clientNeeds?: string[];
  
  responsibilities?: string[];
  
  matching_skills?: string[];
  matchingSkills?: string[];
  suggestedFreelancerSkills?: string[]; // Legacy alias
  
  skill_gaps?: string[];
  skillGaps?: string[];
  missingOrGapSkills?: string[]; // Legacy alias
  
  clarification_questions?: string[];
  clarificationQuestions?: string[];
  
  recommended_approach?: string;
  recommendedApproach?: string;
  summary?: string; // Legacy alias
}

export interface Proposal {
  id?: string;
  userId: string;
  clientId?: string;
  clientName: string;
  jobTitle: string;
  jobDescription: string;
  analysis?: JobAnalysis | null;
  generatedProposal: string;
  clarificationQuestions?: string[] | string;
  status: ProposalStatus;
  followUpDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientRecord {
  id?: string;
  userId: string;
  clientName: string;
  project: string;
  status: ClientStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
