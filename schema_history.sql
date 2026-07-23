-- =============================================
-- Dhaniar Finance - Transaction History Schema
-- Jalankan SQL ini di Supabase SQL Editor
-- =============================================

-- TRANSACTION HISTORY TABLE
-- Menyimpan riwayat penghapusan untuk restore dalam 30 hari
CREATE TABLE IF NOT EXISTS transaction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('deleted', 'restored')),
    original_data JSONB,
    deleted_by VARCHAR(10) CHECK (deleted_by IN ('suami', 'istri')),
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    restored_by VARCHAR(10) CHECK (restored_by IN ('suami', 'istri')),
    restored_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_transaction_history_tx_id ON transaction_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_action ON transaction_history(action);
CREATE INDEX IF NOT EXISTS idx_transaction_history_restored ON transaction_history(restored_at);

-- Disable RLS for this table (since we disabled RLS on all tables)
-- But keep it consistent
ALTER TABLE transaction_history DISABLE ROW LEVEL SECURITY;