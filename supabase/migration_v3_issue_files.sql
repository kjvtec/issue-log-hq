-- Migration V3: Add public.issue_files table for Google Drive file uploads
-- Idempotent script for Supabase SQL Editor: https://supabase.com/dashboard/project/cnzthrnkyumhgsomszwu/sql/new

CREATE TABLE IF NOT EXISTS public.issue_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT DEFAULT 0,
    mime_type VARCHAR(150),
    drive_file_id VARCHAR(200) NOT NULL,
    web_view_link TEXT NOT NULL,
    uploaded_by VARCHAR(100) NOT NULL DEFAULT '',
    source_system VARCHAR(50) NOT NULL DEFAULT 'Issue Tracker',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_files_issue_id ON public.issue_files(issue_id);

ALTER TABLE public.issue_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for issue_files" ON public.issue_files;
CREATE POLICY "Allow all operations for issue_files" ON public.issue_files FOR ALL USING (true) WITH CHECK (true);
