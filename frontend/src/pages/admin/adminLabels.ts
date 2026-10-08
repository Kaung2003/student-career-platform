import type { BadgeTone } from "../../components/ui/Badge";
import type { FeedbackStatus, FeedbackType, InterviewCategory, Role } from "../../lib/types";

// Labels come from the translations (admin.feedbackStatus.*, admin.feedbackType.*, admin.role.*, interview.category.*).
export const FEEDBACK_STATUS_TONE: Record<FeedbackStatus, BadgeTone> = {
  NEW: "blue",
  IN_PROGRESS: "amber",
  RESOLVED: "green",
};

export const FEEDBACK_TYPE_TONE: Record<FeedbackType, BadgeTone> = {
  BUG: "red",
  FEATURE: "violet",
  COMMENT: "slate",
};

export const FEEDBACK_STATUSES = Object.keys(FEEDBACK_STATUS_TONE) as FeedbackStatus[];
export const FEEDBACK_TYPES = Object.keys(FEEDBACK_TYPE_TONE) as FeedbackType[];
export const ROLES: Role[] = ["STUDENT", "EMPLOYER", "ADMIN"];
export const CATEGORIES: InterviewCategory[] = ["BEHAVIORAL", "TECHNICAL", "SITUATIONAL"];
