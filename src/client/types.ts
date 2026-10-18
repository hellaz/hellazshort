export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'owner' | 'admin' | 'user';
  mfa_enabled?: boolean;
  must_change_password?: boolean;
  created_at?: number;
  last_login?: number;
}

export interface Domain {
  id: string;
  domain_name: string;
  normalized_domain_name: string;
  routing_path: string;
  default_redirect_code: number;
  status: 'active' | 'inactive';
  created_at: number;
  updated_at: number;
  settings?: string | { routes?: string[] };
}

export interface Link {
  id: string;
  domain_id: string;
  domain_name?: string;
  slug: string;
  routing_path?: string;
  destination_url: string;
  title?: string;
  description?: string;
  status: 'active' | 'inactive' | 'expired' | 'disabled';
  clicks_count: number;
  redirect_code: number;
  expires_at?: number | null;
  password?: string | null;
  is_cloaked?: boolean;
  category?: string | null;
  tags?: string[];
  created_at: number;
  updated_at: number;
  // Redirect overrides
  redirect_rules?: {
    geo?: Record<string, string>;
    device?: Record<string, string>;
    os?: Record<string, string>;
    city?: Record<string, string>;
  };
  pixel_ids?: string[];
  og_meta?: {
    title?: string;
    description?: string;
    image?: string;
  };
  last_status_code?: number;
  last_checked_at?: number;
  response_time_ms?: number;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  links_count?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  links_count?: number;
}

export interface Pixel {
  id: string;
  name: string;
  pixel_type: 'meta' | 'ga4' | 'gtm' | 'tiktok' | 'linkedin' | 'pinterest' | 'twitter' | 'custom';
  pixel_id: string;
  custom_code?: string;
  description?: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  secret?: string; // only returned upon creation
  created_at: number;
  last_used_at?: number | null;
  expires_at?: number | null;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  username?: string;
  event_type: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  created_at: number;
}

export interface AnalyticsOverview {
  totalClicks: number;
  uniqueVisitors: number;
  timeSeries: { date: string; clicks: number }[];
  topLinks: { slug: string; destination_url: string; clicks: number }[];
  topReferrers: { referrer: string; clicks: number }[];
}

export interface RootPageSettings {
  mode: 'branded' | 'redirect' | 'html';
  redirect_url?: string;
  html?: string;
}

export interface StatusCheckSettings {
  enabled: boolean;
  interval_hours: number;
  batch_size: number;
  timeout_seconds: number;
}
