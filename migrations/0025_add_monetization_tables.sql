-- Migration 0025: Monetization, Advertiser Campaigns, Referrals, and API Usage

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  banner_url TEXT,
  heading TEXT,
  message TEXT,
  cpm_rate REAL DEFAULT 3.00,
  budget_limit REAL DEFAULT 100.00,
  spent_amount REAL DEFAULT 0.00,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  target_country TEXT,
  status TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_user_id ON ad_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_user_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  bonus_links_granted INTEGER DEFAULT 50,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  month_key TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  tier_name TEXT DEFAULT 'free',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_usage_user_month ON api_usage_logs(user_id, month_key);
