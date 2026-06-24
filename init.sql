-- ============================================================
-- Raja Asset Management - Cloud SQL PostgreSQL Init Script
-- Run once on a fresh Cloud SQL instance
-- ============================================================

-- Create tables

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  asset_id TEXT NOT NULL UNIQUE,
  name TEXT,
  subsidiary TEXT,
  category TEXT,
  date TEXT,
  val TEXT,
  condition TEXT,
  condition_level TEXT,
  status TEXT,
  status_level TEXT,
  asset_book TEXT,
  serial_number TEXT,
  asset_type TEXT,
  prorate_convention TEXT,
  asset_units INTEGER DEFAULT 1,
  category_segment_1 TEXT,
  category_segment_2 TEXT,
  category_segment_3 TEXT,
  key_segment_1 TEXT,
  key_segment_2 TEXT,
  key_segment_3 TEXT,
  amortization_start_date TEXT,
  depreciation_method TEXT,
  life_in_months INTEGER,
  cost_clearing_account_1 TEXT,
  cost_clearing_account_2 TEXT,
  cost_clearing_account_3 TEXT,
  cost_clearing_account_4 TEXT,
  cost_clearing_account_5 TEXT,
  cost_clearing_account_6 TEXT,
  cost_clearing_account_7 TEXT,
  cost_clearing_account_8 TEXT,
  listed TEXT,
  listed_status TEXT,
  asset_number TEXT,
  asset_description TEXT,
  asset_cost TEXT,
  date_placed_in_service TEXT,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance (
  id SERIAL PRIMARY KEY,
  maintenance_id TEXT NOT NULL UNIQUE,
  asset_id TEXT,
  sub TEXT,
  type TEXT,
  date TEXT,
  cost TEXT,
  estimated_cost TEXT,
  actual_cost TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
