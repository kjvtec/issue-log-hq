-- ============================================================
-- Issue Log Tracking System - Database Schema & Storage Setup
-- ============================================================

-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.modules (
    id SERIAL PRIMARY KEY,
    core_function VARCHAR(100) NOT NULL DEFAULT 'VTec Cloud HQ',
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (core_function, name)
);

CREATE TABLE IF NOT EXISTS public.team_members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'Member',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id VARCHAR(50) UNIQUE NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT '2.Medium',
    type VARCHAR(50) NOT NULL DEFAULT 'Issue',
    core_function VARCHAR(100) NOT NULL DEFAULT 'VTec Cloud HQ',
    module VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    raise_by VARCHAR(100) NOT NULL,
    raise_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(30) NOT NULL DEFAULT 'Open',
    resolution TEXT,
    closed_by VARCHAR(100),
    closed_date TIMESTAMPTZ,
    closed_version VARCHAR(50),
    remark TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.issue_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON public.issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_core_function ON public.issues(core_function);
CREATE INDEX IF NOT EXISTS idx_issues_module ON public.issues(module);
CREATE INDEX IF NOT EXISTS idx_issues_raise_date ON public.issues(raise_date DESC);
CREATE INDEX IF NOT EXISTS idx_issue_images_issue_id ON public.issue_images(issue_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_issues_updated_at ON public.issues;
CREATE TRIGGER set_issues_updated_at
BEFORE UPDATE ON public.issues
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 2. Seed Default Modules & Team Members
INSERT INTO public.modules (core_function, name) VALUES
    ('VTec POS', 'Login'),
    ('VTec POS', 'Sale / Checkout'),
    ('VTec POS', 'Payment'),
    ('VTec POS', 'Promotion / Discount'),
    ('VTec POS', 'Cash In/Cash Out'),
    ('VTec POS', 'Shift / Close Day'),
    ('VTec POS', 'Receipt / Tax Invoice'),
    ('VTec POS', 'Hardware / Printer'),
    ('VTec Store Backoffice', 'Login'),
    ('VTec Store Backoffice', 'Cash In/Cash Out'),
    ('VTec Store Backoffice', 'Shift / End of Day'),
    ('VTec Store Backoffice', 'Product / Price'),
    ('VTec Store Backoffice', 'Stock / Inventory'),
    ('VTec Store Backoffice', 'Goods Receive'),
    ('VTec Store Backoffice', 'Staff / Permission'),
    ('VTec Store Backoffice', 'Report'),
    ('VTec Store Backoffice', 'Store Setting'),
    ('VTec HHT', 'Login'),
    ('VTec HHT', 'Stock Count'),
    ('VTec HHT', 'Goods Receive'),
    ('VTec HHT', 'Price Check'),
    ('VTec HHT', 'Transfer'),
    ('VTec HHT', 'Return / Wastage'),
    ('VTec HHT', 'Sync Data'),
    ('VTec Cloud Inventory', 'Purchase Order'),
    ('VTec Cloud Inventory', 'Goods Receive'),
    ('VTec Cloud Inventory', 'Stock Transfer'),
    ('VTec Cloud Inventory', 'Stock Adjustment'),
    ('VTec Cloud Inventory', 'Physical Count'),
    ('VTec Cloud Inventory', 'Stock Movement'),
    ('VTec Cloud Inventory', 'Warehouse Setting'),
    ('VTec Cloud Inventory', 'Inventory Report'),
    ('VTec Cloud HQ', 'Cash In/Cash Out'),
    ('VTec Cloud HQ', 'Global Setting'),
    ('VTec Cloud HQ', 'Login'),
    ('VTec Cloud HQ', 'Payment'),
    ('VTec Cloud HQ', 'Price'),
    ('VTec Cloud HQ', 'Product'),
    ('VTec Cloud HQ', 'Reason code'),
    ('VTec Cloud HQ', 'Salemode'),
    ('VTec Cloud HQ', 'Shop'),
    ('VTec Cloud HQ', 'Staff')
ON CONFLICT (core_function, name) DO NOTHING;

INSERT INTO public.team_members (name, role) VALUES
    ('Nat', 'QA / Tester'),
    ('Tukta', 'QA / Tester'),
    ('Kampon', 'Developer')
ON CONFLICT (name) DO NOTHING;

-- 3. Row Level Security (RLS) - Enable open access for internal team
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for modules" ON public.modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for issues" ON public.issues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for issue_images" ON public.issue_images FOR ALL USING (true) WITH CHECK (true);

-- 4. Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-attachments', 'issue-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for issue-attachments bucket
CREATE POLICY "Allow public read from issue-attachments" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'issue-attachments');

CREATE POLICY "Allow public insert into issue-attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'issue-attachments');

CREATE POLICY "Allow public update in issue-attachments" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'issue-attachments');

CREATE POLICY "Allow public delete from issue-attachments" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'issue-attachments');
