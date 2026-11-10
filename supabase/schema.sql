-- ============================================================
-- Issue Log Tracking System - Database Schema & Storage Setup
-- ============================================================

-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
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
INSERT INTO public.modules (name) VALUES
    ('Cash In/Cash Out'),
    ('Global Setting'),
    ('Login'),
    ('Payment'),
    ('Price'),
    ('Product'),
    ('Reason code'),
    ('Salemode'),
    ('Shop'),
    ('Staff')
ON CONFLICT (name) DO NOTHING;

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
