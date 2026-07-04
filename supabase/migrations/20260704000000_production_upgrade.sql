
-- ===================================================
-- PRODUCTION UPGRADE: تشغيلات الأدوية، الإعدادات، طلبات الشراء
-- ===================================================

-- 1. PRODUCT BATCHES (التشغيلات المتعددة لكل منتج)
CREATE TABLE IF NOT EXISTS public.product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_number TEXT,
  manufacture_date DATE,
  expiry_date DATE,
  quantity INT NOT NULL DEFAULT 0,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_batches_product_idx ON public.product_batches (product_id);
CREATE INDEX IF NOT EXISTS product_batches_expiry_idx ON public.product_batches (expiry_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_batches TO authenticated;
GRANT ALL ON public.product_batches TO service_role;
ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "batches_all_auth" ON public.product_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. PHARMACY SETTINGS (إعدادات الصيدلية)
CREATE TABLE IF NOT EXISTS public.pharmacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.pharmacy_settings TO authenticated;
GRANT ALL ON public.pharmacy_settings TO service_role;
ALTER TABLE public.pharmacy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select_auth" ON public.pharmacy_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_write_admin" ON public.pharmacy_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.pharmacy_settings (key, value) VALUES
  ('pharmacy_name', 'صيدليتي'),
  ('pharmacy_name_en', 'My Pharmacy'),
  ('pharmacy_address', ''),
  ('pharmacy_phone', ''),
  ('pharmacy_email', ''),
  ('vat_number', ''),
  ('tax_rate', '15'),
  ('currency', 'ج.م'),
  ('paper_size', '80mm'),
  ('receipt_footer', 'شكراً لزيارتكم — Thank you for your visit')
ON CONFLICT (key) DO NOTHING;

-- 3. PURCHASE ORDERS (طلبات الشراء)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft | sent | partial | received | cancelled
  expected_date DATE,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  received_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchase_orders_all_auth" ON public.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  ordered_qty INT NOT NULL DEFAULT 0,
  received_qty INT NOT NULL DEFAULT 0,
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  batch_number TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO authenticated;
GRANT ALL ON public.purchase_order_items TO service_role;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchase_order_items_all_auth" ON public.purchase_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER purchase_orders_touch BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Add tax_rate field to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT NULL;

-- 5. Add insurance fields to sales
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS insurance_company TEXT,
  ADD COLUMN IF NOT EXISTS insurance_copay NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS insurance_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1000;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || LPAD(nextval('public.invoice_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sales_invoice_number BEFORE INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();
