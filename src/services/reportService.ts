import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export type ReportTargetType = "showcase_project" | "community_post" | "ai_output";

export const REPORT_REASONS = [
  { id: "offensive", label: "Offensive, hateful or harassing" },
  { id: "sexual", label: "Sexual or explicit content" },
  { id: "dangerous", label: "Dangerous or unsafe instructions" },
  { id: "spam", label: "Spam or scam" },
  { id: "inaccurate", label: "Wrong or misleading AI output" },
  { id: "other", label: "Something else" }
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["id"];

export interface ReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
  excerpt?: string;
}

/**
 * Files a user report for community content or AI-generated output.
 * Reports are write-only from the client (see firestore.rules) and are
 * reviewed from the Firebase console. Required by Google Play's UGC and
 * AI-generated content policies.
 */
export async function submitReport(input: ReportInput): Promise<void> {
  await addDoc(collection(db, "reports"), {
    targetType: input.targetType,
    targetId: input.targetId.slice(0, 200),
    reason: input.reason,
    details: (input.details || "").slice(0, 1000),
    excerpt: (input.excerpt || "").slice(0, 2000),
    reporterUid: auth.currentUser?.uid ?? null,
    status: "open",
    createdAt: serverTimestamp()
  });
}
