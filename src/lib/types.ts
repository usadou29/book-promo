// ─── Database types ───────────────────────────────────────────────

export interface Contact {
  id: string;
  email: string;
  source: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  title: string;
  book_title: string;
  cover_url: string;
  amazon_url: string;
  description: string;
  subject: string;
  status: 'draft' | 'sending' | 'completed' | 'failed';
  total_emails: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  completed_at: string | null;
}

export interface SendLog {
  id: string;
  campaign_id: string;
  contact_id: string;
  email: string;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  sent_at: string | null;
}

// ─── Form types ──────────────────────────────────────────────────

export interface CampaignFormData {
  book_title: string;
  cover_url: string;
  amazon_url: string;
  description: string;
  subject: string;
}

export interface BrevoConfig {
  api_key: string;
  sender_name: string;
  sender_email: string;
}

// ─── API types ───────────────────────────────────────────────────

export interface SendEmailsRequest {
  campaign_id: string;
  brevo_api_key: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  html_content: string;
  recipients: { email: string; contact_id: string }[];
}

export interface SendEmailsResponse {
  results: {
    email: string;
    contact_id: string;
    status: 'sent' | 'failed';
    error?: string;
  }[];
}
