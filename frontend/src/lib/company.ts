import type { BadgeTone } from "../components/ui/Badge";
import type { CompanyStatus } from "./types";

export const COMPANY_STATUS_TONE: Record<CompanyStatus, BadgeTone> = { PENDING: "amber", APPROVED: "green", REJECTED: "red" };
