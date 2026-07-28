async (page) => {
  const projectRef = "nvprrfdfwqdaxcqgmbld";
  const sessionKey = `sb-${projectRef}-auth-token`;
  const now = new Date();
  const iso = (d) => d.toISOString();
  const daysAgo = (n) => new Date(now.getTime() - n * 86400000);
  const daysFromNow = (n) => new Date(now.getTime() + n * 86400000);
  const uuid = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;

  const products = [
    {
      id: uuid(1),
      name: "بانادول أدفانس",
      name_en: "Panadol Advance",
      barcode: "6221234567011",
      category: "Analgesic",
      price: 35,
      cost: 22,
      quantity: 120,
      min_stock: 20,
      expiry_date: "2027-01-10",
      notes: "Fever and pain relief",
    },
    {
      id: uuid(2),
      name: "أوجمنتين 1 جم",
      name_en: "Augmentin 1g",
      barcode: "6221234567012",
      category: "Antibiotic",
      price: 128,
      cost: 86,
      quantity: 60,
      min_stock: 10,
      expiry_date: "2027-02-01",
      notes: "Prescription only",
    },
    {
      id: uuid(3),
      name: "بروفين 400",
      name_en: "Brufen 400",
      barcode: "6221234567013",
      category: "NSAID",
      price: 28,
      cost: 16,
      quantity: 9,
      min_stock: 15,
      expiry_date: "2027-03-15",
      notes: "Pain and inflammation",
    },
    {
      id: uuid(4),
      name: "كونكور 5",
      name_en: "Concor 5",
      barcode: "6221234567014",
      category: "Cardiac",
      price: 65,
      cost: 41,
      quantity: 70,
      min_stock: 12,
      expiry_date: "2027-02-20",
      notes: "Beta blocker",
    },
    {
      id: uuid(5),
      name: "جلوكوفاج 850",
      name_en: "Glucophage 850",
      barcode: "6221234567015",
      category: "Antidiabetic",
      price: 42,
      cost: 27,
      quantity: 110,
      min_stock: 20,
      expiry_date: "2027-01-28",
      notes: "Metformin",
    },
    {
      id: uuid(6),
      name: "ليزك 10",
      name_en: "Lyrica 75",
      barcode: "6221234567016",
      category: "Neurology",
      price: 155,
      cost: 108,
      quantity: 30,
      min_stock: 8,
      expiry_date: "2026-10-08",
      notes: "Neuropathic pain",
    },
    {
      id: uuid(7),
      name: "أوميز 20",
      name_en: "Omez 20",
      barcode: "6221234567017",
      category: "Gastro",
      price: 24,
      cost: 12,
      quantity: 140,
      min_stock: 25,
      expiry_date: "2027-05-12",
      notes: "Gastric protection",
    },
    {
      id: uuid(8),
      name: "زيرتك",
      name_en: "Zyrtec",
      barcode: "6221234567018",
      category: "Allergy",
      price: 38,
      cost: 21,
      quantity: 85,
      min_stock: 15,
      expiry_date: "2027-03-05",
      notes: "Antihistamine",
    },
    {
      id: uuid(9),
      name: "فولتارين جل",
      name_en: "Voltaren Gel",
      barcode: "6221234567019",
      category: "Topical",
      price: 58,
      cost: 35,
      quantity: 75,
      min_stock: 10,
      expiry_date: "2026-09-15",
      notes: "Topical pain relief",
    },
    {
      id: uuid(10),
      name: "إيزوماك",
      name_en: "Esomac",
      barcode: "6221234567020",
      category: "Gastro",
      price: 47,
      cost: 29,
      quantity: 0,
      min_stock: 15,
      expiry_date: "2027-01-20",
      notes: "PPI",
    },
  ];

  const customers = [
    {
      id: uuid(101),
      name: "Ahmed Ali",
      phone: "+201010100001",
      email: "ahmed.ali@example.com",
      balance: 0,
      points: 120,
      notes: "Chronic diabetes patient",
    },
    {
      id: uuid(102),
      name: "Mona Hassan",
      phone: "+201010100002",
      email: "mona.hassan@example.com",
      balance: 15,
      points: 48,
      notes: "Prefers WhatsApp notifications",
    },
    {
      id: uuid(103),
      name: "Omar Youssef",
      phone: "+201010100003",
      email: "omar.youssef@example.com",
      balance: 0,
      points: 72,
      notes: "Regular blood pressure follow up",
    },
    {
      id: uuid(104),
      name: "Sara Mahmoud",
      phone: "+201010100004",
      email: "sara.mahmoud@example.com",
      balance: 0,
      points: 35,
      notes: "Family account",
    },
  ];

  const suppliers = [
    {
      id: uuid(201),
      name: "Al Noor Medical Supply",
      phone: "+201000000001",
      email: "orders@alnoor.example",
      address: "Cairo, Egypt",
      balance: 12450,
      rating: 5,
      notes: "Fast moving OTC and chronic meds",
    },
    {
      id: uuid(202),
      name: "Green Line Pharma",
      phone: "+201000000002",
      email: "sales@greenline.example",
      address: "Giza, Egypt",
      balance: 8200,
      rating: 4,
      notes: "Monthly replenishment partner",
    },
    {
      id: uuid(203),
      name: "Delta Care Distribution",
      phone: "+201000000003",
      email: "hello@deltacare.example",
      address: "Alexandria, Egypt",
      balance: 5600,
      rating: 4,
      notes: "Specialty and antibiotics",
    },
  ];

  const product_batches = [
    {
      id: uuid(301),
      product_id: products[0].id,
      batch_number: "BN-PAN-2401",
      manufacture_date: "2025-01-10",
      expiry_date: "2027-01-10",
      quantity: 60,
      cost: 22,
      notes: "Main warehouse",
    },
    {
      id: uuid(302),
      product_id: products[0].id,
      batch_number: "BN-PAN-2402",
      manufacture_date: "2025-04-12",
      expiry_date: "2027-04-12",
      quantity: 60,
      cost: 23,
      notes: "Main warehouse",
    },
    {
      id: uuid(303),
      product_id: products[1].id,
      batch_number: "BN-AUG-2401",
      manufacture_date: "2025-02-01",
      expiry_date: "2027-02-01",
      quantity: 60,
      cost: 86,
      notes: "Cold storage",
    },
    {
      id: uuid(304),
      product_id: products[5].id,
      batch_number: "BN-LYR-2401",
      manufacture_date: "2025-04-08",
      expiry_date: "2026-10-08",
      quantity: 30,
      cost: 108,
      notes: "Controlled stock",
    },
    {
      id: uuid(305),
      product_id: products[9].id,
      batch_number: "BN-ESO-2401",
      manufacture_date: "2025-01-20",
      expiry_date: "2027-01-20",
      quantity: 92,
      cost: 29,
      notes: "Shelf A",
    },
  ];

  const sales = [
    {
      id: uuid(401),
      invoice_number: "INV-2026-0708-001",
      customer_id: customers[0].id,
      cashier_id: uuid(900),
      subtotal: 163,
      discount: 0,
      tax: 0,
      total: 163,
      paid: 163,
      payment_method: "cash",
      status: "completed",
      created_at: iso(now),
    },
    {
      id: uuid(402),
      invoice_number: "INV-2026-0707-002",
      customer_id: customers[1].id,
      cashier_id: uuid(900),
      subtotal: 235,
      discount: 5,
      tax: 0,
      total: 230,
      paid: 120,
      payment_method: "credit",
      status: "completed",
      created_at: iso(daysAgo(1)),
    },
    {
      id: uuid(403),
      invoice_number: "INV-2026-0701-003",
      customer_id: null,
      cashier_id: uuid(900),
      subtotal: 90,
      discount: 0,
      tax: 13.5,
      total: 103.5,
      paid: 103.5,
      payment_method: "cash",
      status: "completed",
      created_at: iso(daysAgo(7)),
    },
  ];

  const sale_items = [
    {
      id: uuid(411),
      sale_id: sales[0].id,
      product_name: products[0].name,
      quantity: 2,
      price: 35,
      discount: 0,
      created_at: iso(now),
      products: { cost: 22 },
    },
    {
      id: uuid(412),
      sale_id: sales[0].id,
      product_name: products[7].name,
      quantity: 1,
      price: 38,
      discount: 0,
      created_at: iso(now),
      products: { cost: 21 },
    },
    {
      id: uuid(413),
      sale_id: sales[0].id,
      product_name: products[4].name,
      quantity: 1,
      price: 42,
      discount: 0,
      created_at: iso(now),
      products: { cost: 27 },
    },
    {
      id: uuid(414),
      sale_id: sales[1].id,
      product_name: products[1].name,
      quantity: 1,
      price: 128,
      discount: 5,
      created_at: iso(daysAgo(1)),
      products: { cost: 86 },
    },
    {
      id: uuid(415),
      sale_id: sales[1].id,
      product_name: products[6].name,
      quantity: 3,
      price: 24,
      discount: 0,
      created_at: iso(daysAgo(1)),
      products: { cost: 12 },
    },
    {
      id: uuid(416),
      sale_id: sales[2].id,
      product_name: products[3].name,
      quantity: 1,
      price: 65,
      discount: 0,
      created_at: iso(daysAgo(7)),
      products: { cost: 41 },
    },
    {
      id: uuid(417),
      sale_id: sales[2].id,
      product_name: products[8].name,
      quantity: 1,
      price: 25,
      discount: 0,
      created_at: iso(daysAgo(7)),
      products: { cost: 35 },
    },
  ];

  const purchase_orders = [
    {
      id: uuid(501),
      supplier_id: suppliers[0].id,
      supplier: { name: suppliers[0].name },
      status: "draft",
      expected_date: iso(daysFromNow(4)),
      notes: "Restock chronic meds",
      total_amount: 5300,
      created_by: uuid(900),
      created_at: iso(daysAgo(2)),
      items: [],
    },
    {
      id: uuid(502),
      supplier_id: suppliers[1].id,
      supplier: { name: suppliers[1].name },
      status: "sent",
      expected_date: iso(daysFromNow(2)),
      notes: "Antibiotic replenishment",
      total_amount: 2100,
      created_by: uuid(900),
      created_at: iso(daysAgo(5)),
      items: [],
    },
  ];

  const purchase_order_items = [
    {
      id: uuid(511),
      order_id: purchase_orders[0].id,
      product_id: products[0].id,
      product_name: products[0].name,
      ordered_qty: 100,
      received_qty: 20,
      unit_cost: 22,
      batch_number: "",
      expiry_date: "",
    },
    {
      id: uuid(512),
      order_id: purchase_orders[0].id,
      product_id: products[4].id,
      product_name: products[4].name,
      ordered_qty: 80,
      received_qty: 30,
      unit_cost: 27,
      batch_number: "",
      expiry_date: "",
    },
    {
      id: uuid(513),
      order_id: purchase_orders[1].id,
      product_id: products[1].id,
      product_name: products[1].name,
      ordered_qty: 40,
      received_qty: 0,
      unit_cost: 86,
      batch_number: "",
      expiry_date: "",
    },
  ];
  purchase_orders[0].items = purchase_order_items.filter(
    (i) => i.order_id === purchase_orders[0].id,
  );
  purchase_orders[1].items = purchase_order_items.filter(
    (i) => i.order_id === purchase_orders[1].id,
  );

  const purchases = [
    {
      id: uuid(521),
      supplier_id: suppliers[0].id,
      suppliers: { name: suppliers[0].name },
      total: 2500,
      paid: 1500,
      status: "partial",
      created_at: iso(daysAgo(3)),
    },
    {
      id: uuid(522),
      supplier_id: suppliers[1].id,
      suppliers: { name: suppliers[1].name },
      total: 1200,
      paid: 1200,
      status: "received",
      created_at: iso(daysAgo(8)),
    },
  ];

  const warehouses = [
    { id: uuid(601), name: "Main Warehouse", location: "Ground floor" },
    { id: uuid(602), name: "Cold Storage", location: "Back room" },
  ];

  const stock_transfers = [
    {
      id: uuid(611),
      quantity: 20,
      notes: "Rebalance stock",
      created_at: iso(daysAgo(1)),
      from: { name: warehouses[0].name },
      to: { name: warehouses[1].name },
      products: { name: products[0].name },
    },
    {
      id: uuid(612),
      quantity: 12,
      notes: "Fefo transfer",
      created_at: iso(daysAgo(4)),
      from: { name: warehouses[1].name },
      to: { name: warehouses[0].name },
      products: { name: products[5].name },
    },
  ];

  const stock_takes = [{ id: uuid(701), notes: "Monthly stock take", created_at: iso(daysAgo(6)) }];

  const stock_take_items = [
    {
      id: uuid(711),
      stock_take_id: stock_takes[0].id,
      product_id: products[0].id,
      system_qty: 120,
      actual_qty: 118,
      difference: -2,
    },
    {
      id: uuid(712),
      stock_take_id: stock_takes[0].id,
      product_id: products[3].id,
      system_qty: 70,
      actual_qty: 70,
      difference: 0,
    },
  ];

  const sale_returns = [
    {
      id: uuid(801),
      sale_id: sales[1].id,
      total_amount: 24,
      reason: "Customer changed mind",
      created_at: iso(daysAgo(2)),
      sale_return_items: [
        { quantity: 1, unit_price: 24, subtotal: 24, products: { name: products[6].name } },
      ],
    },
  ];

  const sale_return_items = [
    {
      id: uuid(811),
      return_id: sale_returns[0].id,
      product_id: products[6].id,
      quantity: 1,
      unit_price: 24,
      subtotal: 24,
      products: { name: products[6].name },
    },
  ];

  const customer_allergies = [
    { id: uuid(901), customer_id: customers[1].id, allergen: "Aspirin", severity: "moderate" },
  ];

  const drug_interactions = [
    {
      id: uuid(911),
      drug_a: "Aspirin",
      drug_b: "Ibuprofen",
      severity: "moderate",
      description: "May increase bleeding risk",
      recommendation: "Avoid concurrent use when possible",
    },
    {
      id: uuid(912),
      drug_a: "Amoxicillin",
      drug_b: "Methotrexate",
      severity: "severe",
      description: "Can increase methotrexate toxicity",
      recommendation: "Review dose or choose alternative",
    },
  ];

  const pharmacy_settings = [
    { key: "pharmacy_name", value: "صيدليتي" },
    { key: "pharmacy_name_en", value: "PharmaLove Pharmacy" },
    { key: "pharmacy_address", value: "Downtown, Cairo" },
    { key: "pharmacy_phone", value: "+201000000000" },
    { key: "pharmacy_email", value: "info@pharmalove.example" },
    { key: "vat_number", value: "300000000000000" },
    { key: "tax_rate", value: "15" },
    { key: "currency", value: "ج.م" },
    { key: "paper_size", value: "80mm" },
    { key: "receipt_footer", value: "Thank you for visiting" },
  ];

  const profiles = [
    {
      id: uuid(900),
      full_name: "PharmaLove Showcase",
      phone: "+201099999999",
      created_at: iso(daysAgo(20)),
      user_roles: [{ role: "admin" }],
    },
    {
      id: uuid(902),
      full_name: "Maha Pharmacist",
      phone: "+201099999998",
      created_at: iso(daysAgo(45)),
      user_roles: [{ role: "pharmacist" }],
    },
  ];

  const prescriptions = [
    {
      id: uuid(1001),
      customer_id: customers[0].id,
      customer: { name: customers[0].name },
      doctor_name: "Dr. Hany Khalil",
      diagnosis: "Type 2 diabetes",
      patient_age: 54,
      patient_weight: 84,
      notes: "Metformin and lifestyle advice",
      status: "pending",
      medication: "Metformin XR",
      is_chronic: true,
      last_filled: iso(daysAgo(34)),
      refill_interval_days: 30,
      created_at: iso(daysAgo(3)),
      items: [
        {
          id: uuid(1011),
          prescription_id: uuid(1001),
          product_name: "Metformin XR",
          dosage: "850 mg",
          frequency: "BID",
          duration: "30 days",
          quantity: 1,
          instructions: "After meals",
        },
      ],
    },
    {
      id: uuid(1002),
      customer_id: customers[1].id,
      customer: { name: customers[1].name },
      doctor_name: "Dr. Rania Adel",
      diagnosis: "Hypertension",
      patient_age: 61,
      patient_weight: 76,
      notes: "Monitor BP and adjust dose",
      status: "reviewed",
      medication: "Concor 5",
      is_chronic: true,
      last_filled: iso(daysAgo(12)),
      refill_interval_days: 30,
      created_at: iso(daysAgo(7)),
      items: [
        {
          id: uuid(1012),
          prescription_id: uuid(1002),
          product_name: "Concor 5",
          dosage: "5 mg",
          frequency: "OD",
          duration: "30 days",
          quantity: 1,
          instructions: "Morning",
        },
        {
          id: uuid(1013),
          prescription_id: uuid(1002),
          product_name: "Aspirin",
          dosage: "81 mg",
          frequency: "OD",
          duration: "30 days",
          quantity: 1,
          instructions: "With food",
        },
      ],
    },
  ];

  const insurance_claims = [
    {
      id: uuid(1101),
      company_name: "Delta Insurance",
      claim_amount: 485.5,
      status: "pending",
      created_at: iso(daysAgo(4)),
    },
  ];

  const tableMap = {
    products,
    customers,
    suppliers,
    sales,
    sale_items,
    purchases,
    purchase_orders,
    purchase_order_items,
    product_batches,
    pharmacies: pharmacy_settings,
    pharmacy_settings,
    stock_takes,
    stock_take_items,
    warehouses,
    stock_transfers,
    sale_returns,
    sale_return_items,
    customer_allergies,
    drug_interactions,
    profiles,
    user_roles: profiles.flatMap((p) => p.user_roles.map((r) => ({ user_id: p.id, role: r.role }))),
    prescriptions,
    prescription_items: prescriptions.flatMap((p) =>
      p.items.map((i) => ({ ...i, prescription_id: p.id })),
    ),
    insurance_claims,
  };

  const contentRange = (total) => `0-${Math.max(total - 1, 0)}/${total}`;

  await page.evaluate(
    ({ sessionKey, projectRef }) => {
      localStorage.setItem(
        sessionKey,
        JSON.stringify({
          access_token: "fake-access-token",
          refresh_token: "fake-refresh-token",
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: {
            id: "11111111-1111-1111-1111-111111111111",
            email: "showcase@example.com",
            role: "authenticated",
          },
        }),
      );
      localStorage.setItem("lang", "ar");
      document.documentElement.lang = "ar";
      document.documentElement.dir = "rtl";
    },
    { sessionKey, projectRef },
  );

  await page.route("**/nvprrfdfwqdaxcqgmbld.supabase.co/**", async (route) => {
    const req = route.request();
    const requestUrl = req.url();
    const pathname = requestUrl.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-expose-headers": "content-range",
      "content-type": "application/json; charset=utf-8",
    };

    if (pathname.endsWith("/auth/v1/user")) {
      await route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({
          id: "11111111-1111-1111-1111-111111111111",
          email: "showcase@example.com",
          role: "authenticated",
          app_metadata: { provider: "email", providers: ["email"] },
          user_metadata: { full_name: "PharmaLove Showcase" },
        }),
      });
      return;
    }

    if (!pathname.includes("/rest/v1/")) {
      await route.continue();
      return;
    }

    const table = pathname.split("/rest/v1/")[1];
    const rows = tableMap[table] ?? [];
    const method = req.method();

    if (method === "GET" || method === "HEAD") {
      const data = Array.isArray(rows) ? rows : [];
      const countHeader = contentRange(data.length);
      await route.fulfill({
        status: 200,
        headers: { ...headers, "content-range": countHeader },
        body: method === "HEAD" ? "" : JSON.stringify(data),
      });
      return;
    }

    if (method === "POST") {
      let body = {};
      try {
        body = req.postDataJSON();
      } catch {
        body = {};
      }
      const created = {
        id: uuid(Math.floor(Math.random() * 9000) + 2000),
        created_at: iso(new Date()),
        ...body,
      };
      await route.fulfill({
        status: 201,
        headers,
        body: JSON.stringify([created]),
      });
      return;
    }

    if (method === "PATCH" || method === "DELETE") {
      await route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify([]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      headers,
      body: JSON.stringify(rows),
    });
  });

  await page.goto("http://127.0.0.1:8080/dashboard");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);
  return {
    url: page.url(),
    title: await page.title(),
    products: products.length,
    customers: customers.length,
    sales: sales.length,
    ready: true,
  };
};
