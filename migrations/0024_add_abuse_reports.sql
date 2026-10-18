-- Migration 0024: Add abuse reports table for phishing, malware, and abuse reports

CREATE TABLE IF NOT EXISTS abuse_reports (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  reason TEXT NOT NULL,
  email TEXT,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_abuse_reports_status ON abuse_reports(status);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_created_at ON abuse_reports(created_at);
