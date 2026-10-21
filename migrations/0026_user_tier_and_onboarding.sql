-- Migration 0026: User Tiers and Onboarding
ALTER TABLE users ADD COLUMN tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN onboarding_completed INTEGER DEFAULT 1;

-- Check constraints for tier
-- Note: SQLite doesn't support adding CHECK constraints via ALTER TABLE, 
-- but we'll enforce it at the application level.
