export type Role = "STUDENT" | "EMPLOYER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  techStack: string[];
  projectUrl: string | null;
  githubUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  school: string | null;
  gradYear: number | null;
  skills: string[];
  github: string | null;
  linkedin: string | null;
  website: string | null;
  resumeUrl: string | null;
  transcriptUrl: string | null;
  projects?: Project[];
}

export type CertStatus = "PLANNING" | "IN_PROGRESS" | "COMPLETED";

export interface Certification {
  id: string;
  name: string;
  provider: string | null;
  examDate: string | null;
  status: CertStatus;
  notes: string | null;
  resourceUrl: string | null;
  createdAt: string;
}

export type InterviewCategory = "BEHAVIORAL" | "TECHNICAL" | "SITUATIONAL";

export interface InterviewQuestion {
  id: string;
  category: InterviewCategory;
  prompt: string;
  tip: string | null;
}

export interface InterviewAttempt {
  id: string;
  answer: string;
  feedback: string | null;
  createdAt: string;
  question: InterviewQuestion;
}

export type FeedbackType = "BUG" | "FEATURE" | "COMMENT";

export interface PublicPortfolio {
  userId: string;
  name: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  school: string | null;
  gradYear: number | null;
  skills: string[];
  github: string | null;
  linkedin: string | null;
  website: string | null;
  projects: Project[];
}

export interface DirectoryEntry {
  name: string;
  slug: string;
  headline: string | null;
  school: string | null;
  gradYear: number | null;
  skills: string[];
}

export interface ProfileComment {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}
