-- Migration: Add collected_by column to transactions table if not exists
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS collected_by VARCHAR;