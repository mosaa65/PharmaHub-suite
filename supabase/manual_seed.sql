-- Manual demo seed for Supabase SQL editor
-- Use this if you do not have the DB password for CLI-based seeding.
-- Run this file inside the Supabase dashboard SQL editor.

DELETE FROM public.product_batches
WHERE product_id IN (
  SELECT id FROM public.products
  WHERE barcode IN (
    '6221234567011','6221234567012','6221234567013','6221234567014','6221234567015',
    '6221234567016','6221234567017','6221234567018','6221234567019','6221234567020',
    '6221234567021','6221234567022','6221234567023','6221234567024','6221234567025'
  )
);

DELETE FROM public.prescriptions
WHERE doctor_name IN ('Dr. Hany Khalil', 'Dr. Rania Adel', 'Dr. Tarek Sami');

DELETE FROM public.suppliers
WHERE name IN ('Al Noor Medical Supply', 'Green Line Pharma', 'Delta Care Distribution');

DELETE FROM public.customers
WHERE name IN ('Ahmed Ali', 'Mona Hassan', 'Omar Youssef', 'Sara Mahmoud', 'Khaled Nabil');

INSERT INTO public.suppliers (name, phone, email, address, balance, rating, notes) VALUES
  ('Al Noor Medical Supply', '+201000000001', 'orders@alnoor.example', 'Cairo, Egypt', 12450, 5, 'Fast moving OTC and chronic meds'),
  ('Green Line Pharma', '+201000000002', 'sales@greenline.example', 'Giza, Egypt', 8200, 4, 'Monthly replenishment partner'),
  ('Delta Care Distribution', '+201000000003', 'hello@deltacare.example', 'Alexandria, Egypt', 5600, 4, 'Specialty and antibiotics');

INSERT INTO public.customers (name, phone, email, balance, points, notes) VALUES
  ('Ahmed Ali', '+201010100001', 'ahmed.ali@example.com', 0, 120, 'Chronic diabetes patient'),
  ('Mona Hassan', '+201010100002', 'mona.hassan@example.com', 15, 48, 'Prefers WhatsApp notifications'),
  ('Omar Youssef', '+201010100003', 'omar.youssef@example.com', 0, 72, 'Regular blood pressure follow up'),
  ('Sara Mahmoud', '+201010100004', 'sara.mahmoud@example.com', 0, 35, 'Family account'),
  ('Khaled Nabil', '+201010100005', 'khaled.nabil@example.com', 12, 18, 'Occasional OTC buyer');

INSERT INTO public.products (name, name_en, barcode, category, price, cost, quantity, min_stock, notes)
VALUES
  ('بانادول أدفانس', 'Panadol Advance', '6221234567011', 'Analgesic', 35, 22, 120, 20, 'Fever and pain relief'),
  ('أوجمنتين 1 جم', 'Augmentin 1g', '6221234567012', 'Antibiotic', 128, 86, 60, 10, 'Prescription only'),
  ('بروفين 400', 'Brufen 400', '6221234567013', 'NSAID', 28, 16, 95, 15, 'Pain and inflammation'),
  ('كونكور 5', 'Concor 5', '6221234567014', 'Cardiac', 65, 41, 70, 12, 'Beta blocker'),
  ('جلوكوفاج 850', 'Glucophage 850', '6221234567015', 'Antidiabetic', 42, 27, 110, 20, 'Metformin'),
  ('ليزك 10', 'Lyrica 75', '6221234567016', 'Neurology', 155, 108, 30, 8, 'Neuropathic pain'),
  ('أوميز 20', 'Omez 20', '6221234567017', 'Gastro', 24, 12, 140, 25, 'Gastric protection'),
  ('زيرتك', 'Zyrtec', '6221234567018', 'Allergy', 38, 21, 85, 15, 'Antihistamine'),
  ('فولتارين جل', 'Voltaren Gel', '6221234567019', 'Topical', 58, 35, 75, 10, 'Topical pain relief'),
  ('إيزوماك', 'Esomac', '6221234567020', 'Gastro', 47, 29, 92, 15, 'PPI'),
  ('أموكلان', 'Amoclan', '6221234567021', 'Antibiotic', 74, 49, 55, 10, 'Amoxicillin clavulanate'),
  ('فيتامين د3', 'Vitamin D3', '6221234567022', 'Supplement', 30, 14, 180, 30, 'Chronic supplementation'),
  ('أسبوسيد', 'Aspocid', '6221234567023', 'Cardiac', 18, 8, 200, 40, 'Low-dose aspirin'),
  ('سيمفاستاتين', 'Simvastatin', '6221234567024', 'Lipid', 31, 17, 65, 12, 'Cholesterol control'),
  ('ميتفورمين XR', 'Metformin XR', '6221234567025', 'Antidiabetic', 52, 33, 88, 15, 'Extended release')
ON CONFLICT (barcode) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  cost = EXCLUDED.cost,
  quantity = EXCLUDED.quantity,
  min_stock = EXCLUDED.min_stock,
  notes = EXCLUDED.notes;

INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-PAN-2401', '2025-01-10', '2027-01-10', 60, 22, 'Main warehouse' FROM public.products WHERE barcode = '6221234567011';
INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-PAN-2402', '2025-04-12', '2027-04-12', 60, 23, 'Main warehouse' FROM public.products WHERE barcode = '6221234567011';
INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-AUG-2401', '2025-02-01', '2027-02-01', 60, 86, 'Cold storage' FROM public.products WHERE barcode = '6221234567012';
INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-BRU-2401', '2025-03-15', '2027-03-15', 95, 16, 'Shelf A' FROM public.products WHERE barcode = '6221234567013';
INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-CON-2401', '2025-02-20', '2027-02-20', 70, 41, 'Shelf B' FROM public.products WHERE barcode = '6221234567014';
INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-GLU-2401', '2025-01-28', '2027-01-28', 110, 27, 'Fridge' FROM public.products WHERE barcode = '6221234567015';
INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-LYR-2401', '2025-04-08', '2026-10-08', 30, 108, 'Controlled stock' FROM public.products WHERE barcode = '6221234567016';
INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-OME-2401', '2025-05-12', '2027-05-12', 140, 12, 'Shelf A' FROM public.products WHERE barcode = '6221234567017';
INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-ZYR-2401', '2025-03-05', '2027-03-05', 85, 21, 'Shelf C' FROM public.products WHERE barcode = '6221234567018';
INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-VOL-2401', '2025-02-11', '2027-02-11', 75, 35, 'Topical shelf' FROM public.products WHERE barcode = '6221234567019';
INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-ESO-2401', '2025-01-20', '2027-01-20', 92, 29, 'Shelf A' FROM public.products WHERE barcode = '6221234567020';
INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-AMO-2401', '2025-02-25', '2027-02-25', 55, 49, 'Antibiotic shelf' FROM public.products WHERE barcode = '6221234567021';
INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-VIT-2401', '2025-01-01', '2028-01-01', 180, 14, 'Supplements' FROM public.products WHERE barcode = '6221234567022';
INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-ASP-2401', '2025-01-18', '2027-01-18', 200, 8, 'Heart health' FROM public.products WHERE barcode = '6221234567023';
INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-SIM-2401', '2025-04-03', '2027-04-03', 65, 17, 'Shelf B' FROM public.products WHERE barcode = '6221234567024';
INSERT INTO public.product_batches (product_id, batch_number, manufacture_date, expiry_date, quantity, cost, notes)
SELECT id, 'BN-MET-2401', '2025-03-19', '2027-03-19', 88, 33, 'Chronic meds' FROM public.products WHERE barcode = '6221234567025';

INSERT INTO public.prescriptions (doctor_name, diagnosis, patient_age, patient_weight, status, notes)
VALUES
  ('Dr. Hany Khalil', 'Type 2 diabetes', 54, 84, 'active', 'Metformin and lifestyle advice'),
  ('Dr. Rania Adel', 'Hypertension', 61, 76, 'active', 'Monitor BP and adjust dose'),
  ('Dr. Tarek Sami', 'Seasonal allergy', 29, 68, 'active', 'Cetirizine and nasal saline');
