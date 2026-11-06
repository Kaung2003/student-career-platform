export type Role = "STUDENT" | "EMPLOYER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** False for accounts that only sign in with Google. */
  hasPassword: boolean;
}

export type CompanyStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Company {
  id: string;
  name: string;
  website: string;
  industry: string | null;
  location: string | null;
  description: string | null;
  status: CompanyStatus;
  reviewNote: string | null;
  createdAt: string;
}

export interface AdminCompany extends Company {
  contactName: string;
  contactEmail: string;
  emailConfirmed: boolean;
  emailMatchesWebsite: boolean;
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
  companyVisibleSince: string | null;
  projects?: Project[];
}

export interface StudentSearchResult {
  name: string;
  slug: string;
  headline: string | null;
  school: string | null;
  gradYear: number | null;
  skills: string[];
  projectCount: number;
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
  /** False when the question only exists in English (for example, one an admin added). */
  translated: boolean;
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
    pendingCompanies: number;
    failedEmails: number;
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
  outcomes: {
    students: number;
    completeProfiles: number;
    visibleStudents: number;
    approvedCompanies: number;
    companySearches: number;
    companyViews: number;
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
  verified: boolean;
  google: boolean;
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
  original: { prompt: string; tip: string | null };
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
