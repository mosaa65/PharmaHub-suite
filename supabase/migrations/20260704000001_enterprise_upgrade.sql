
-- ===================================================
-- ENTERPRISE UPGRADE: دعم الوصفات المزمنة وإعادة الصرف
-- ===================================================

-- Add chronic prescription tracking fields to prescriptions table
ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS is_chronic BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS refill_interval_days INT NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS last_filled TIMESTAMPTZ;

-- Add insurance claim table for tracking pending insurance claims
CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  claim_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  copay_percent NUMERIC(5,2) NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | paid
  submitted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.insurance_claims TO authenticated;
GRANT ALL ON public.insurance_claims TO service_role;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insurance_claims_auth" ON public.insurance_claims FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Index for fast lookup of pending claims
CREATE INDEX IF NOT EXISTS insurance_claims_status_idx ON public.insurance_claims (status);
CREATE INDEX IF NOT EXISTS insurance_claims_sale_idx ON public.insurance_claims (sale_id);
