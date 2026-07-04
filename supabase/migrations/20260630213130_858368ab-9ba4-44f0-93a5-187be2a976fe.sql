
ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS diagnosis text,
  ADD COLUMN IF NOT EXISTS patient_age integer,
  ADD COLUMN IF NOT EXISTS patient_weight numeric(6,2),
  ADD COLUMN IF NOT EXISTS dispensed_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispensed_by uuid,
  ADD COLUMN IF NOT EXISTS sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  dosage text,
  frequency text,
  duration text,
  quantity integer NOT NULL DEFAULT 1,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescription_items TO authenticated;
GRANT ALL ON public.prescription_items TO service_role;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prescription_items_all_auth" ON public.prescription_items
  TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.customer_allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  allergen text NOT NULL,
  severity text NOT NULL DEFAULT 'moderate',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_allergies TO authenticated;
GRANT ALL ON public.customer_allergies TO service_role;
ALTER TABLE public.customer_allergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_allergies_all_auth" ON public.customer_allergies
  TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.drug_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_a text NOT NULL,
  drug_b text NOT NULL,
  severity text NOT NULL DEFAULT 'moderate',
  description text,
  recommendation text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS drug_interactions_drugs_idx ON public.drug_interactions (lower(drug_a), lower(drug_b));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drug_interactions TO authenticated;
GRANT ALL ON public.drug_interactions TO service_role;
ALTER TABLE public.drug_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drug_interactions_all_auth" ON public.drug_interactions
  TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.drug_interactions (drug_a, drug_b, severity, description, recommendation) VALUES
  ('warfarin','aspirin','severe','زيادة خطر النزيف بشكل كبير','تجنّب الاستخدام المتزامن أو راقب INR بدقة'),
  ('warfarin','ibuprofen','severe','زيادة خطر النزيف الهضمي','استخدم باراسيتامول بديلاً'),
  ('amoxicillin','methotrexate','moderate','زيادة سمّية الميثوتركسات','راقب مستويات الدواء ووظائف الكلى'),
  ('ciprofloxacin','theophylline','severe','زيادة سمية الثيوفيلين','تجنّب أو خفّض جرعة الثيوفيلين'),
  ('simvastatin','clarithromycin','severe','خطر اعتلال عضلي شديد','أوقف الستاتين أثناء الكلاريثرومايسين'),
  ('metformin','contrast media','severe','خطر الحماض اللبني','أوقف الميتفورمين قبل وبعد إجراء التصوير'),
  ('paracetamol','warfarin','moderate','زيادة طفيفة في INR عند الاستخدام المزمن','راقب INR عند الاستخدام المتكرر'),
  ('ibuprofen','lisinopril','moderate','تقليل فعالية خافض الضغط وخطر على الكلى','تجنب الاستخدام المطوّل'),
  ('clopidogrel','omeprazole','moderate','تقليل فعالية كلوبيدوغريل','استخدم بانتوبرازول بديلاً');
