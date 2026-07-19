export interface NeedsReviewItem {
  id: string;
  subject: string | null;
  raw_email_snippet: string | null;
  reason: string | null;
  created_at: string;
}
