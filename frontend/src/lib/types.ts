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
  resumeUrl: string | null;
  certifications: { id: string; name: string; provider: string | null; examDate: string | null }[];
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

export type FeedbackStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";

export interface AdminStats {
  totals: {
    users: number;
    newUsers: number;
    admins: number;
    suspended: number;
    projects: number;
    certifications: number;
    attempts: number;
    openFeedback: number;
    comments: number;
    questions: number;
  };
  signups: { date: string; count: number }[];
  latestUsers: { id: string; name: string; email: string; role: Role; createdAt: string }[];
  latestFeedback: AdminFeedback[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  suspended: boolean;
  createdAt: string;
  slug: string | null;
  school: string | null;
  projects: number;
  certifications: number;
  attempts: number;
  comments: number;
}

export interface AdminFeedback {
  id: string;
  type: FeedbackType;
  status: FeedbackStatus;
  message: string;
  createdAt: string;
  userName: string;
  userEmail?: string;
}

export interface AdminQuestion extends InterviewQuestion {
  createdAt: string;
  attempts: number;
}

export interface AdminComment {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  profileSlug: string;
  profileName: string;
}
