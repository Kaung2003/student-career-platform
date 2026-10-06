import type { StudentProfile } from "./types";

export interface CompletenessItem {
  label: string;
  done: boolean;
  to: string;
}

export function profileChecklist(profile: StudentProfile | null, certCount: number): CompletenessItem[] {
  return [
    { label: "Add a headline", done: Boolean(profile?.headline), to: "/profile" },
    { label: "Write a short bio", done: Boolean(profile?.bio && profile.bio.length >= 40), to: "/profile" },
    { label: "Add your school", done: Boolean(profile?.school), to: "/profile" },
    { label: "List at least 3 skills", done: (profile?.skills.length ?? 0) >= 3, to: "/profile" },
    { label: "Link GitHub or LinkedIn", done: Boolean(profile?.github || profile?.linkedin), to: "/profile" },
    { label: "Upload your resume", done: Boolean(profile?.resumeUrl), to: "/profile" },
    { label: "Add your first project", done: (profile?.projects?.length ?? 0) > 0, to: "/projects" },
    { label: "Track a certification", done: certCount > 0, to: "/certifications" },
  ];
}

export function completenessScore(items: CompletenessItem[]): number {
  if (items.length === 0) return 0;
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}

export const SKILL_SUGGESTIONS = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "React",
  "Node.js",
  "SQL",
  "Git",
  "AWS",
  "Docker",
  "Figma",
  "Communication",
  "Teamwork",
  "Problem Solving",
];
