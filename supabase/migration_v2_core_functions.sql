-- ============================================================
-- Migration v2: Add Core Functions (5 Main Groups) Support
-- Safe to run multiple times (idempotent)
-- ============================================================

-- 1. Add core_function column to issues (defaults existing rows to 'VTec Cloud HQ')
ALTER TABLE public.issues
ADD COLUMN IF NOT EXISTS core_function VARCHAR(100) NOT NULL DEFAULT 'VTec Cloud HQ';

UPDATE public.issues
SET core_function = 'VTec Cloud HQ'
WHERE core_function IS NULL OR core_function = '';

CREATE INDEX IF NOT EXISTS idx_issues_core_function ON public.issues(core_function);

-- 2. Add core_function column to modules and allow duplicate module names across different Core Functions
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS core_function VARCHAR(100) NOT NULL DEFAULT 'VTec Cloud HQ';

UPDATE public.modules
SET core_function = 'VTec Cloud HQ'
WHERE core_function IS NULL OR core_function = '';

-- Drop old unique constraint on name alone if present, then add composite unique (core_function, name)
ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_name_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'modules_core_function_name_key'
    ) THEN
        ALTER TABLE public.modules ADD CONSTRAINT modules_core_function_name_key UNIQUE (core_function, name);
    END IF;
END $$;

-- 3. Seed default Sub-modules for all 5 Core Functions
INSERT INTO public.modules (core_function, name) VALUES
    -- 1. VTec POS
    ('VTec POS', 'Login'),
    ('VTec POS', 'Sale / Checkout'),
    ('VTec POS', 'Payment'),
    ('VTec POS', 'Promotion / Discount'),
    ('VTec POS', 'Cash In/Cash Out'),
    ('VTec POS', 'Shift / Close Day'),
    ('VTec POS', 'Receipt / Tax Invoice'),
    ('VTec POS', 'Hardware / Printer'),
    -- 2. VTec Store Backoffice
    ('VTec Store Backoffice', 'Login'),
    ('VTec Store Backoffice', 'Cash In/Cash Out'),
    ('VTec Store Backoffice', 'Shift / End of Day'),
    ('VTec Store Backoffice', 'Product / Price'),
    ('VTec Store Backoffice', 'Stock / Inventory'),
    ('VTec Store Backoffice', 'Goods Receive'),
    ('VTec Store Backoffice', 'Staff / Permission'),
    ('VTec Store Backoffice', 'Report'),
    ('VTec Store Backoffice', 'Store Setting'),
    -- 3. VTec HHT
    ('VTec HHT', 'Login'),
    ('VTec HHT', 'Stock Count'),
    ('VTec HHT', 'Goods Receive'),
    ('VTec HHT', 'Price Check'),
    ('VTec HHT', 'Transfer'),
    ('VTec HHT', 'Return / Wastage'),
    ('VTec HHT', 'Sync Data'),
    -- 4. VTec Cloud Inventory
    ('VTec Cloud Inventory', 'Purchase Order'),
    ('VTec Cloud Inventory', 'Goods Receive'),
    ('VTec Cloud Inventory', 'Stock Transfer'),
    ('VTec Cloud Inventory', 'Stock Adjustment'),
    ('VTec Cloud Inventory', 'Physical Count'),
    ('VTec Cloud Inventory', 'Stock Movement'),
    ('VTec Cloud Inventory', 'Warehouse Setting'),
    ('VTec Cloud Inventory', 'Inventory Report'),
    -- 5. VTec Cloud HQ
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
