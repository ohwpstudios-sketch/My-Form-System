-- schema.sql - Database schema for form submissions

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON string of form data
  payment_ref TEXT,
  amount REAL,
  status TEXT NOT NULL, -- 'submitted', 'paid', 'processed'
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email ON submissions(email);
CREATE INDEX IF NOT EXISTS idx_payment_ref ON submissions(payment_ref);
CREATE INDEX IF NOT EXISTS idx_created_at ON submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_status ON submissions(status);

-- Form configurations table (optional - alternative to KV)
CREATE TABLE IF NOT EXISTS form_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config TEXT NOT NULL, -- JSON string of form configuration
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions table (for detailed payment tracking)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  payment_ref TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'GHS',
  status TEXT NOT NULL,
  provider TEXT DEFAULT 'paystack',
  metadata TEXT, -- JSON string
  created_at TEXT NOT NULL,
  FOREIGN KEY (submission_id) REFERENCES submissions(id)
);

CREATE INDEX IF NOT EXISTS idx_payment_submission ON payments(submission_id);