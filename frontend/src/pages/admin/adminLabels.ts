import type { BadgeTone } from "../../components/ui/Badge";
import type { FeedbackStatus, FeedbackType, InterviewCategory, Role } from "../../lib/types";

export const FEEDBACK_STATUS: Record<FeedbackStatus, { label: string; tone: BadgeTone }> = {
  NEW: { label: "New", tone: "blue" },
  IN_PROGRESS: { label: "In progress", tone: "amber" },
  RESOLVED: { label: "Resolved", tone: "green" },
};

export const FEEDBACK_TYPE: Record<FeedbackType, { label: string; tone: BadgeTone }> = {
  BUG: { label: "Bug", tone: "red" },
  FEATURE: { label: "Feature", tone: "violet" },
  COMMENT: { label: "Comment", tone: "slate" },
};

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Student",
  EMPLOYER: "Employer",
  ADMIN: "Admin",
};

export const CATEGORY_LABEL: Record<InterviewCategory, string> = {
  BEHAVIORAL: "Behavioral",
  TECHNICAL: "Technical",
  SITUATIONAL: "Situational",
};
