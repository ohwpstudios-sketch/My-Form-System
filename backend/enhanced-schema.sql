-- Enhanced Database Schema for Form System with New Features

-- Submissions table (stores all form submissions)
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  email TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON string of form data
  payment_ref TEXT,
  amount REAL,
  status TEXT NOT NULL, -- 'submitted', 'paid', 'processed', 'draft'
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for submissions
CREATE INDEX IF NOT EXISTS idx_form_id ON submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_email ON submissions(email);
CREATE INDEX IF NOT EXISTS idx_payment_ref ON submissions(payment_ref);
CREATE INDEX IF NOT EXISTS idx_created_at ON submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_status ON submissions(status);

-- Form configurations table (stores form designs)
CREATE TABLE IF NOT EXISTS form_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  config TEXT NOT NULL, -- JSON string of complete form configuration
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for active forms
CREATE INDEX IF NOT EXISTS idx_active_forms ON form_configs(active, updated_at DESC);

-- Payment transactions table (detailed payment tracking)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  payment_ref TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'GHS',
  status TEXT NOT NULL, -- 'pending', 'success', 'failed'
  provider TEXT DEFAULT 'paystack',
  metadata TEXT, -- JSON string
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES submissions(id)
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payment_submission ON payments(submission_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payments(status);

-- Draft submissions table (for Save & Resume feature)
CREATE TABLE IF NOT EXISTS draft_submissions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON string of partial form data
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);

-- Index for draft cleanup
CREATE INDEX IF NOT EXISTS idx_draft_expires ON draft_submissions(expires_at);

-- File uploads table (track uploaded files)
CREATE TABLE IF NOT EXISTS file_uploads (
  id TEXT PRIMARY KEY,
  submission_id TEXT,
  field_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (submission_id) REFERENCES submissions(id)
);

-- Index for file lookups
CREATE INDEX IF NOT EXISTS idx_file_submission ON file_uploads(submission_id);

-- Form analytics table (track form performance)
CREATE TABLE IF NOT EXISTS form_analytics (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'view', 'start', 'submit', 'payment'
  metadata TEXT, -- JSON string with additional data
  created_at TEXT NOT NULL
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_form ON form_analytics(form_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON form_analytics(event_type, created_at);

-- Conditional logic triggers table (store conditional logic history)
CREATE TABLE IF NOT EXISTS conditional_triggers (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  triggered INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (submission_id) REFERENCES submissions(id)
);

-- Form versions table (version control for forms)
CREATE TABLE IF NOT EXISTS form_versions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  config TEXT NOT NULL, -- JSON string of form configuration
  created_at TEXT NOT NULL,
  created_by TEXT,
  FOREIGN KEY (form_id) REFERENCES form_configs(id)
);

-- Index for version lookup
CREATE INDEX IF NOT EXISTS idx_version_form ON form_versions(form_id, version_number DESC);

-- Webhook logs table (track webhook deliveries)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  url TEXT NOT NULL,
  status_code INTEGER,
  response TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (submission_id) REFERENCES submissions(id)
);

-- Index for webhook tracking
CREATE INDEX IF NOT EXISTS idx_webhook_submission ON webhook_logs(submission_id);

-- Email logs table (track email deliveries)
CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL, -- 'sent', 'failed', 'bounced'
  provider_response TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (submission_id) REFERENCES submissions(id)
);

-- Index for email tracking
CREATE INDEX IF NOT EXISTS idx_email_submission ON email_logs(submission_id);
CREATE INDEX IF NOT EXISTS idx_email_status ON email_logs(status, created_at);