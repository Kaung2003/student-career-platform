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
  projects?: Project[];
}

export interface PublicPortfolio {
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
