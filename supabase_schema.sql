-- ==========================================================================
-- 🇲🇦 MOROCCO PURCHASING PIPELINE - SUPABASE DATABASE SCHEMA
-- Tailored to: Suivi_Prod-Team-Casa.xlsx
-- Bureau Casablanca - Iberian Market Portfolio (Spain & Portugal)
-- Run this script in: Supabase Studio -> SQL Editor -> New Query -> Run
-- ==========================================================================

-- 1. Create main pipeline table
CREATE TABLE IF NOT EXISTS morocco_pipeline (
    id BIGSERIAL PRIMARY KEY,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    buyer TEXT NOT NULL,
    prospector TEXT,
    supplier TEXT NOT NULL,
    supplier_type TEXT DEFAULT 'Actif',
    product TEXT,
    product_range TEXT,
    affaire_status TEXT DEFAULT 'DD',
    dd_date DATE,
    offer_date DATE,
    offer_number TEXT,
    offer_value NUMERIC(14, 2) DEFAULT 0.00,
    offer_status TEXT,
    bpa_received BOOLEAN DEFAULT false,
    bpa_date DATE,
    order_value NUMERIC(14, 2) DEFAULT 0.00,
    margin_value NUMERIC(14, 2) DEFAULT 0.00,
    margin_rate NUMERIC(6, 2) DEFAULT 0.00,
    order_date DATE,
    notes TEXT,
    team TEXT DEFAULT 'Morocco',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration support for existing tables:
ALTER TABLE morocco_pipeline ADD COLUMN IF NOT EXISTS bpa_date DATE;

-- 2. Create team activity & audit logs table (for Toby, Said, Andreea)
CREATE TABLE IF NOT EXISTS pipeline_logs (
    id BIGSERIAL PRIMARY KEY,
    deal_id BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    supplier TEXT,
    details TEXT
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE morocco_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create Public Access Policies
DROP POLICY IF EXISTS "Allow public full access on morocco_pipeline" ON morocco_pipeline;
CREATE POLICY "Allow public full access on morocco_pipeline" 
    ON morocco_pipeline FOR ALL 
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public full access on pipeline_logs" ON pipeline_logs;
CREATE POLICY "Allow public full access on pipeline_logs" 
    ON pipeline_logs FOR ALL 
    USING (true) WITH CHECK (true);

-- 5. Enable Real-time synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE morocco_pipeline;
ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_logs;

-- 6. Production Ready (Clean baseline tables)
-- Real deals and activity logs will be populated directly through the application interface.

