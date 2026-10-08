import type { StudentProfile } from "./types";
import type { MessageKey } from "../i18n/locales/en";

export interface CompletenessItem {
  label: MessageKey;
  done: boolean;
  to: string;
}

export function profileChecklist(profile: StudentProfile | null, certCount: number): CompletenessItem[] {
  return [
    { label: "checklist.headline", done: Boolean(profile?.headline), to: "/profile" },
    { label: "checklist.bio", done: Boolean(profile?.bio && profile.bio.length >= 40), to: "/profile" },
    { label: "checklist.school", done: Boolean(profile?.school), to: "/profile" },
    { label: "checklist.skills", done: (profile?.skills.length ?? 0) >= 3, to: "/profile" },
    { label: "checklist.links", done: Boolean(profile?.github || profile?.linkedin), to: "/profile" },
    { label: "checklist.resume", done: Boolean(profile?.resumeUrl), to: "/profile" },
    { label: "checklist.project", done: (profile?.projects?.length ?? 0) > 0, to: "/projects" },
    { label: "checklist.certification", done: certCount > 0, to: "/certifications" },
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
