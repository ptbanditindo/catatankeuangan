
-- =============================================
-- Dhaniar Finance PWA - Complete Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. STORES TABLE
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('pribadi', 'toko')),
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('pemasukan', 'pengeluaran')),
    amount NUMERIC(15,2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by VARCHAR(10) NOT NULL CHECK (created_by IN ('suami', 'istri')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DEBTS TABLE
CREATE TABLE IF NOT EXISTS debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('pribadi', 'toko')),
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('hutang_saya', 'hutang_orang')),
    person_name VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'belum_lunas' CHECK (status IN ('belum_lunas', 'lunas')),
    due_date DATE,
    created_by VARCHAR(10) NOT NULL CHECK (created_by IN ('suami', 'istri')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ASSETS TABLE
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('saham', 'forex', 'emas', 'dll')),
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_by VARCHAR(10) NOT NULL CHECK (created_by IN ('suami', 'istri')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REMINDERS TABLE
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2),
    due_date DATE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('tagihan', 'hutang', 'piutang')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'lunas')),
    created_by VARCHAR(10) NOT NULL CHECK (created_by IN ('suami', 'istri')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('pribadi', 'toko')),
    category VARCHAR(100) NOT NULL,
    monthly_limit NUMERIC(15,2) NOT NULL,
    created_by VARCHAR(10) NOT NULL CHECK (created_by IN ('suami', 'istri')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(scope, category)
);

-- 7. SAVING GOALS TABLE
CREATE TABLE IF NOT EXISTS saving_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    goal_name VARCHAR(255) NOT NULL,
    target_amount NUMERIC(15,2) NOT NULL,
    current_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    target_date DATE,
    created_by VARCHAR(10) NOT NULL CHECK (created_by IN ('suami', 'istri')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FINANCIAL HEALTH VIEW
CREATE OR REPLACE VIEW financial_health AS
WITH cash_flow AS (
    SELECT
        COALESCE(SUM(CASE WHEN type = 'pemasukan' THEN amount ELSE 0 END), 0) as total_pemasukan,
        COALESCE(SUM(CASE WHEN type = 'pengeluaran' THEN amount ELSE 0 END), 0) as total_pengeluaran
    FROM transactions
),
debt_summary AS (
    SELECT
        COALESCE(SUM(CASE WHEN type = 'hutang_saya' AND status = 'belum_lunas' THEN amount ELSE 0 END), 0) as total_hutang_saya,
        COALESCE(SUM(CASE WHEN type = 'hutang_orang' AND status = 'belum_lunas' THEN amount ELSE 0 END), 0) as total_piutang
    FROM debts
),
asset_summary AS (
    SELECT COALESCE(SUM(amount), 0) as total_aset
    FROM assets
),
budget_summary AS (
    SELECT
        COALESCE(SUM(monthly_limit), 0) as total_budget_limit,
        COALESCE(SUM(CASE WHEN t.type = 'pengeluaran' AND t.date >= date_trunc('month', CURRENT_DATE) THEN t.amount ELSE 0 END), 0) as total_budget_spent
    FROM budgets b
    LEFT JOIN transactions t ON t.category = b.category AND t.scope = b.scope AND t.date >= date_trunc('month', CURRENT_DATE)
),
saving_summary AS (
    SELECT
        COALESCE(SUM(target_amount), 0) as total_target,
        COALESCE(SUM(current_amount), 0) as total_saved
    FROM saving_goals
)
SELECT
    cf.total_pemasukan,
    cf.total_pengeluaran,
    (cf.total_pemasukan - cf.total_pengeluaran) as net_flow,
    ds.total_hutang_saya,
    ds.total_piutang,
    ast.total_aset,
    (cf.total_pemasukan - cf.total_pengeluaran + ast.total_aset - ds.total_hutang_saya) as net_worth,
    bs.total_budget_limit,
    bs.total_budget_spent,
    CASE WHEN bs.total_budget_limit > 0 THEN ROUND((bs.total_budget_spent / bs.total_budget_limit * 100)::numeric, 2) ELSE 0 END as budget_usage_percentage,
    ss.total_target,
    ss.total_saved,
    CASE WHEN ss.total_target > 0 THEN ROUND((ss.total_saved / ss.total_target * 100)::numeric, 2) ELSE 0 END as saving_progress_percentage
FROM cash_flow cf, debt_summary ds, asset_summary ast, budget_summary bs, saving_summary ss;

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE saving_goals ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY for authenticated users
CREATE POLICY "Allow all for authenticated" ON stores FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON debts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON assets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON reminders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON budgets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON saving_goals FOR ALL USING (auth.role() = 'authenticated');