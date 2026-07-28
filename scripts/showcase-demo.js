async (page) => {
  await page.setContent(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PharmaLove Suite Showcase</title>
</head>
<body style="margin:0;background:#07111f;color:#e5eefb;font-family:Inter,Segoe UI,Arial,sans-serif;">
  <div id="root"></div>
</body>
</html>`);

  await page.evaluate(() => {
    const root = document.getElementById("root");
    if (!root) throw new Error("root missing");

    const styles = `
      :root{
        --bg:#07111f;
        --panel:#0d1726;
        --panel-2:#101d31;
        --muted:#8da1bb;
        --text:#edf4ff;
        --line:rgba(160,183,219,.18);
        --accent:#ffb347;
        --accent-2:#4fd1c5;
        --danger:#ff6b6b;
        --success:#58d68d;
        --shadow:0 24px 80px rgba(0,0,0,.35);
      }
      *{box-sizing:border-box}
      html,body{height:100%}
      body{background:
        radial-gradient(circle at 12% 16%, rgba(79,209,197,.14), transparent 24%),
        radial-gradient(circle at 92% 14%, rgba(255,179,71,.12), transparent 20%),
        linear-gradient(180deg,#07111f 0%,#0a1322 100%);
        color:var(--text);
      }
      button,input,select{font:inherit}
      .app{display:grid;grid-template-columns:300px 1fr;min-height:100vh}
      .sidebar{background:linear-gradient(180deg,rgba(8,16,30,.96),rgba(10,18,33,.94));border-right:1px solid var(--line);padding:20px 18px;backdrop-filter:blur(18px)}
      .brand{display:flex;align-items:center;gap:14px;padding:8px 10px 18px}
      .brand-badge{width:46px;height:46px;border-radius:16px;background:linear-gradient(135deg,#ffc94d,#ff8f3d);display:grid;place-items:center;color:#1d1205;font-weight:900;box-shadow:0 12px 30px rgba(255,179,71,.25)}
      .brand h1{margin:0;font-size:20px;line-height:1.1}
      .brand p{margin:4px 0 0;color:var(--muted);font-size:12px}
      .nav{display:grid;gap:6px;margin-top:8px}
      .nav button,.section-links button{appearance:none;border:1px solid transparent;background:transparent;color:var(--text);cursor:pointer;text-align:left;width:100%;padding:12px 14px;border-radius:14px;display:flex;align-items:center;justify-content:space-between;transition:.2s}
      .nav button:hover,.section-links button:hover{background:rgba(255,255,255,.04);transform:translateX(2px)}
      .nav button.active,.section-links button.active{background:linear-gradient(135deg,rgba(255,179,71,.18),rgba(79,209,197,.12));border-color:rgba(255,179,71,.32);box-shadow:0 10px 24px rgba(0,0,0,.24)}
      .nav .label{display:flex;align-items:center;gap:10px}
      .dot{width:10px;height:10px;border-radius:999px;background:var(--accent)}
      .sidebar-footer{margin-top:18px;padding:14px;border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.03)}
      .user-row{display:flex;align-items:center;gap:12px}
      .avatar{width:38px;height:38px;border-radius:999px;background:linear-gradient(135deg,#4067ff,#8a5cff);display:grid;place-items:center;font-weight:700}
      .main{min-width:0}
      .topbar{height:76px;display:flex;align-items:center;justify-content:space-between;padding:0 28px;border-bottom:1px solid var(--line);background:rgba(9,15,28,.5);backdrop-filter:blur(18px);position:sticky;top:0;z-index:20}
      .crumb{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:13px}
      .crumb strong{color:var(--text)}
      .toolbar{display:flex;align-items:center;gap:10px}
      .pill{padding:10px 14px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid var(--line);color:var(--text)}
      .content{padding:26px}
      .hero{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:18px}
      .hero h2{margin:0;font-size:30px;letter-spacing:-.03em}
      .hero p{margin:10px 0 0;color:var(--muted);max-width:740px;line-height:1.5}
      .action-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
      .btn{border:none;border-radius:14px;padding:12px 16px;cursor:pointer;font-weight:700;transition:.2s}
      .btn:hover{transform:translateY(-1px)}
      .btn-primary{background:linear-gradient(135deg,#ffb347,#ff8f3d);color:#1d1205;box-shadow:0 16px 32px rgba(255,179,71,.22)}
      .btn-secondary{background:rgba(255,255,255,.05);border:1px solid var(--line);color:var(--text)}
      .grid-4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:18px 0 16px}
      .stat{position:relative;overflow:hidden;background:linear-gradient(180deg,rgba(16,29,49,.95),rgba(11,20,35,.95));border:1px solid var(--line);border-radius:24px;padding:18px;box-shadow:var(--shadow)}
      .stat:before{content:'';position:absolute;inset:auto -10% -40% auto;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(255,179,71,.28),transparent 60%)}
      .stat .k{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.12em}
      .stat .v{font-size:28px;font-weight:900;margin-top:14px}
      .stat .s{margin-top:6px;font-size:12px;color:#b7c8df}
      .two-col{display:grid;grid-template-columns:1.6fr 1fr;gap:16px}
      .panel{background:linear-gradient(180deg,rgba(16,29,49,.95),rgba(11,20,35,.95));border:1px solid var(--line);border-radius:24px;padding:18px;box-shadow:var(--shadow);min-width:0}
      .panel h3{margin:0 0 16px;font-size:18px}
      .chart{height:240px;border-radius:18px;background:linear-gradient(180deg,rgba(79,209,197,.08),rgba(255,179,71,.08));border:1px solid rgba(255,255,255,.06);display:flex;align-items:end;gap:10px;padding:18px}
      .bar{flex:1;border-radius:14px 14px 4px 4px;background:linear-gradient(180deg,#66e3d9,#2c7bf2);box-shadow:0 12px 26px rgba(44,123,242,.25)}
      .bar.alt{background:linear-gradient(180deg,#ffd86b,#ff8f3d)}
      .list{display:grid;gap:10px}
      .row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}
      .row small{color:var(--muted)}
      .table-wrap{overflow:auto;border-radius:24px;border:1px solid var(--line);background:rgba(8,14,26,.72);box-shadow:var(--shadow)}
      table{width:100%;border-collapse:collapse}
      th,td{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06);text-align:left;white-space:nowrap}
      th{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);background:rgba(255,255,255,.02)}
      tr:hover td{background:rgba(255,255,255,.02)}
      .badge{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;font-size:12px;font-weight:700}
      .success{background:rgba(88,214,141,.12);color:#83f0ad}
      .warn{background:rgba(255,179,71,.12);color:#ffcf8c}
      .danger{background:rgba(255,107,107,.12);color:#ff9a9a}
      .muted{color:var(--muted)}
      .footer{display:flex;align-items:center;justify-content:space-between;margin-top:14px;color:var(--muted);font-size:13px}
      .pagination{display:flex;gap:8px}
      .pagination button{border-radius:12px;padding:10px 12px;background:rgba(255,255,255,.05);border:1px solid var(--line);color:var(--text);cursor:pointer}
      .modal-backdrop{position:fixed;inset:0;background:rgba(5,9,18,.68);display:none;align-items:center;justify-content:center;z-index:50;padding:20px}
      .modal-backdrop.show{display:flex}
      .modal{width:min(760px,100%);background:linear-gradient(180deg,#132238,#0b1424);border:1px solid rgba(255,255,255,.1);border-radius:28px;box-shadow:0 40px 120px rgba(0,0,0,.5);overflow:hidden}
      .modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.08)}
      .modal-body{padding:20px}
      .field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .field{display:grid;gap:8px}
      .field label{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
      .field input,.field select,.field textarea{width:100%;padding:12px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:#0a1424;color:var(--text);outline:none}
      .field textarea{min-height:104px;resize:vertical}
      .modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:18px}
      .toast{position:fixed;top:18px;right:18px;min-width:260px;max-width:420px;padding:14px 16px;border-radius:18px;background:rgba(12,20,34,.92);border:1px solid rgba(255,255,255,.12);box-shadow:0 24px 60px rgba(0,0,0,.35);display:none;z-index:80}
      .toast.show{display:block}
      .toast.success{border-color:rgba(88,214,141,.3)}
      .toast.error{border-color:rgba(255,107,107,.3)}
      .toast strong{display:block;margin-bottom:4px}
      .login-shell{min-height:100vh;display:grid;place-items:center;padding:28px}
      .login-card{width:min(980px,100%);display:grid;grid-template-columns:1.1fr .9fr;overflow:hidden;border-radius:34px;background:linear-gradient(180deg,rgba(16,29,49,.95),rgba(11,20,35,.95));border:1px solid var(--line);box-shadow:var(--shadow)}
      .login-hero{padding:40px;background:
        radial-gradient(circle at 10% 16%, rgba(79,209,197,.16), transparent 30%),
        radial-gradient(circle at 82% 20%, rgba(255,179,71,.18), transparent 26%),
        linear-gradient(135deg,#0b1830,#132238);border-right:1px solid rgba(255,255,255,.08)}
      .login-hero h1{font-size:52px;line-height:.95;margin:0 0 16px;letter-spacing:-.05em}
      .login-hero p{margin:0;color:#c1d3ea;line-height:1.6;max-width:420px}
      .login-hero .mini-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:30px}
      .mini{padding:16px;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)}
      .login-form{padding:38px}
      .login-form h2{margin:0 0 8px;font-size:28px}
      .login-form .switch{margin-bottom:18px;color:var(--muted)}
      .toggle{display:flex;gap:8px;margin-bottom:18px}
      .toggle button{border:none;border-radius:999px;padding:10px 14px;background:rgba(255,255,255,.06);color:var(--text);cursor:pointer}
      .toggle button.active{background:linear-gradient(135deg,rgba(255,179,71,.2),rgba(79,209,197,.12));}
      .date-pop,.menu-pop{position:absolute;top:calc(100% + 8px);right:0;background:#0c1628;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:12px;box-shadow:var(--shadow);z-index:60;display:none}
      .date-pop.show,.menu-pop.show{display:block}
      .calendar{display:grid;grid-template-columns:repeat(7,30px);gap:6px}
      .calendar div{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;font-size:11px;background:rgba(255,255,255,.04)}
      .menu-pop{min-width:220px}
      .menu-pop button{display:block;width:100%;text-align:left;margin:4px 0;padding:10px 12px;border-radius:12px;background:transparent;color:var(--text);border:1px solid transparent;cursor:pointer}
      .menu-pop button:hover{background:rgba(255,255,255,.04)}
      .section-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
      .section-tabs button{padding:10px 14px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--text);cursor:pointer}
      .section-tabs button.active{background:rgba(255,179,71,.12);border-color:rgba(255,179,71,.34)}
      .permission-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
      .permission-card{padding:16px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
      .barcode-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
      .barcode{padding:18px;border-radius:16px;background:#f8f4ea;color:#101522}
      .barcode .lines{height:48px;background:repeating-linear-gradient(90deg,#222 0 2px,transparent 2px 6px);margin:12px 0;border-radius:4px;opacity:.95}
      .subtle{font-size:12px;color:var(--muted)}
      .right-tools{display:flex;align-items:center;gap:8px;position:relative}
      .chart-box{padding:18px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
      .chart-row{display:grid;grid-template-columns:repeat(12,1fr);gap:8px;align-items:end;height:180px}
      .chart-row div{border-radius:10px 10px 4px 4px;background:linear-gradient(180deg,#ffd86b,#ff8f3d)}
      .chart-row .cyan{background:linear-gradient(180deg,#7af0e5,#4f7dff)}
      .split{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .space{height:12px}
      .chip-row{display:flex;gap:8px;flex-wrap:wrap}
      .chip{padding:8px 11px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);font-size:12px}
      .rtl{direction:rtl;text-align:right}
    `;
    const style = document.createElement("style");
    style.textContent = styles;
    document.head.appendChild(style);

    const pages = {
      dashboard: {
        title: "Dashboard",
        desc: "Operational pulse across sales, inventory, and alerts.",
      },
      pos: { title: "POS", desc: "Fast billing, payment method selection, and receipt preview." },
      products: {
        title: "Products",
        desc: "Catalog maintenance with add, edit, view, filters, print, and export.",
      },
      categories: { title: "Categories", desc: "Product grouping and shelf organization." },
      brands: { title: "Brands", desc: "Brand master data and supplier lineage." },
      units: { title: "Units", desc: "Unit conversion and pack size control." },
      customers: { title: "Customers", desc: "Loyalty, balances, and patient profile snapshots." },
      suppliers: { title: "Suppliers", desc: "Vendor ledger and purchasing relationships." },
      purchases: { title: "Purchases", desc: "Orders, invoices, and supplier balances." },
      sales: { title: "Sales", desc: "Transactions, tenders, and receipt history." },
      expenses: { title: "Expenses", desc: "Operational spend and approvals." },
      inventory: { title: "Inventory", desc: "Stock levels, batches, and shelf status." },
      transfers: { title: "Transfers", desc: "Branch-to-branch and store-room movement." },
      reports: { title: "Reports", desc: "Revenue, margin, and inventory trends." },
      users: { title: "Users", desc: "Team members and access management." },
      roles: { title: "Roles", desc: "Role packs and responsibility sets." },
      permissions: { title: "Permissions", desc: "Fine-grained access controls." },
      settings: { title: "Settings", desc: "Pharmacy profile, tax, and printing preferences." },
      alerts: { title: "Alerts", desc: "Operational warnings and urgent stock events." },
      backup: { title: "Backup", desc: "Export, import, and snapshot routines." },
      barcode: { title: "Barcode Labels", desc: "Label preview and print batch preparation." },
      prescriptions: { title: "Prescriptions", desc: "Doctor notes and refill management." },
      returns: { title: "Returns", desc: "Return flows and restocking." },
      "stock-take": { title: "Stock Take", desc: "Count reconciliation and variance logging." },
      pharmacist: { title: "Pharmacist", desc: "Interaction, dosage, allergy, and refill tools." },
      finance: { title: "Finance", desc: "Cashflow, collections, and expense analysis." },
    };

    const navOrder = [
      "dashboard",
      "pos",
      "products",
      "categories",
      "brands",
      "units",
      "customers",
      "suppliers",
      "purchases",
      "sales",
      "expenses",
      "inventory",
      "transfers",
      "reports",
      "users",
      "roles",
      "permissions",
      "settings",
      "alerts",
      "backup",
      "barcode",
      "prescriptions",
      "returns",
      "stock-take",
      "pharmacist",
      "finance",
    ];

    const tableData = {
      products: [
        ["Panadol Advance", "Analgesic", "6221234567011", "120", "35.00", "Active"],
        ["Augmentin 1g", "Antibiotic", "6221234567012", "60", "128.00", "Prescription"],
        ["Brufen 400", "NSAID", "6221234567013", "95", "28.00", "Active"],
        ["Concor 5", "Cardiac", "6221234567014", "70", "65.00", "Active"],
        ["Glucophage XR", "Antidiabetic", "6221234567025", "88", "52.00", "Low stock"],
      ],
      categories: [
        ["Analgesics", "18 products", "Stable", "High turnover"],
        ["Antibiotics", "12 products", "Review", "Controlled items"],
        ["Cardiac", "9 products", "Stable", "Chronic care"],
        ["Gastro", "14 products", "Stable", "Digestive care"],
        ["Supplements", "11 products", "Stable", "Seasonal"],
      ],
      brands: [
        ["GSK", "Global", "Panadol, Augmentin", "Top partner"],
        ["Pfizer", "Global", "Concor, Lyrica", "Chronic focus"],
        ["Novartis", "Global", "Zyrtec", "Allergy line"],
        ["Sanofi", "Global", "Omez", "Gastro line"],
      ],
      units: [
        ["Box", "12 tabs", "Primary pack", "Active"],
        ["Strip", "10 tabs", "Retail pack", "Active"],
        ["Bottle", "100 ml", "Liquid pack", "Active"],
        ["Ampoule", "1 amp", "Injectable", "Limited"],
      ],
      customers: [
        ["Ahmed Ali", "+201010100001", "$0", "120 pts", "Diabetes follow-up"],
        ["Mona Hassan", "+201010100002", "$15", "48 pts", "WhatsApp preferred"],
        ["Omar Youssef", "+201010100003", "$0", "72 pts", "BP follow-up"],
        ["Sara Mahmoud", "+201010100004", "$0", "35 pts", "Family account"],
        ["Khaled Nabil", "+201010100005", "$12", "18 pts", "Occasional OTC"],
      ],
      suppliers: [
        ["Al Noor Medical Supply", "+201000000001", "Cairo", "12,450", "5★"],
        ["Green Line Pharma", "+201000000002", "Giza", "8,200", "4★"],
        ["Delta Care Distribution", "+201000000003", "Alexandria", "5,600", "4★"],
      ],
      purchases: [
        ["PO-2041", "Al Noor", "24 Apr 2026", "$5,600", "Received"],
        ["PO-2042", "Green Line", "02 May 2026", "$3,250", "Pending"],
        ["PO-2043", "Delta Care", "11 May 2026", "$2,840", "Draft"],
      ],
      sales: [
        ["INV-5501", "Ahmed Ali", "Today", "$214", "Paid"],
        ["INV-5502", "Mona Hassan", "Yesterday", "$89", "Paid"],
        ["INV-5503", "Walk-in", "Today", "$56", "Refunded"],
        ["INV-5504", "Omar Youssef", "2 days ago", "$138", "Paid"],
      ],
      expenses: [
        ["Rent", "Admin", "$1,200", "Monthly"],
        ["Utilities", "Admin", "$240", "Recurring"],
        ["Courier", "Ops", "$95", "Approved"],
        ["Marketing", "Sales", "$380", "Pending"],
      ],
      inventory: [
        ["Panadol Advance", "120", "20", "Main", "OK"],
        ["Augmentin 1g", "60", "10", "Fridge", "OK"],
        ["Brufen 400", "95", "15", "Shelf A", "OK"],
        ["Lyrica 75", "30", "8", "Controlled", "Monitor"],
      ],
      transfers: [
        ["TR-101", "Main → Branch A", "12 packs", "On route"],
        ["TR-102", "Branch A → Main", "4 packs", "Pending"],
        ["TR-103", "Store → Main", "8 packs", "Complete"],
      ],
      users: [
        ["Mousa Admin", "admin@pharmalove.test", "Admin", "Active"],
        ["Sara Cashier", "cashier@pharmalove.test", "Cashier", "Active"],
        ["Hassan Pharmacist", "pharmacist@pharmalove.test", "Pharmacist", "Active"],
      ],
      roles: [
        ["Admin", "Full access", "12 permissions", "Core"],
        ["Pharmacist", "Clinical tools", "7 permissions", "Mid"],
        ["Cashier", "POS and sales", "5 permissions", "Basic"],
      ],
      permissions: [
        ["Products", "Read / Write / Delete", "Admin, Pharmacist"],
        ["Sales", "Read / Write", "Admin, Cashier"],
        ["Reports", "Read", "Admin, Pharmacist"],
        ["Settings", "Write", "Admin"],
      ],
      alerts: [
        ["Low stock", "Brufen 400 below minimum", "warning"],
        ["Expiry", "Lyrica batch expires soon", "danger"],
        ["Overdue", "Supplier balance overdue", "warning"],
      ],
      backup: [
        ["Full backup", "Nightly", "Complete snapshot", "Ready"],
        ["Export CSV", "Products + sales", "Manual export", "Available"],
        ["Restore point", "Before tax update", "Checkpoint", "Locked"],
      ],
      barcode: [
        ["6221234567011", "Panadol Advance", "$35", "Print 120"],
        ["6221234567012", "Augmentin 1g", "$128", "Print 60"],
        ["6221234567013", "Brufen 400", "$28", "Print 95"],
        ["6221234567014", "Concor 5", "$65", "Print 70"],
      ],
      prescriptions: [
        ["Dr. Hany Khalil", "Type 2 diabetes", "54", "Active"],
        ["Dr. Rania Adel", "Hypertension", "61", "Active"],
        ["Dr. Tarek Sami", "Seasonal allergy", "29", "Active"],
      ],
      returns: [
        ["RT-1001", "INV-5501", "$18", "Restocked"],
        ["RT-1002", "INV-5502", "$12", "Pending"],
        ["RT-1003", "INV-5503", "$9", "Approved"],
      ],
      "stock-take": [
        ["Shelf A", "123 items", "122 counted", "Variance -1"],
        ["Shelf B", "88 items", "88 counted", "Balanced"],
        ["Fridge", "40 items", "39 counted", "Variance -1"],
      ],
      pharmacist: [
        ["Interactions", "No major conflicts detected", "Clear"],
        ["Dosage", "Metformin 850 mg daily", "Within range"],
        ["Allergy", "No penicillin allergy recorded", "Clear"],
        ["Refill", "Next refill due in 11 days", "Monitor"],
      ],
      finance: [
        ["Revenue", "Today", "$1,842", "Up 12%"],
        ["Collections", "This week", "$8,250", "Stable"],
        ["Expenses", "This week", "$1,915", "Tracked"],
        ["Margin", "Month", "$23,540", "Healthy"],
      ],
    };

    const state = {
      page: "login",
      modal: null,
      tablePage: 1,
      paymentOpen: false,
      dateOpen: false,
      sectionTab: "pharmacy",
      toast: null,
    };

    const navLabels = {
      dashboard: "Dashboard",
      pos: "POS",
      products: "Products",
      categories: "Categories",
      brands: "Brands",
      units: "Units",
      customers: "Customers",
      suppliers: "Suppliers",
      purchases: "Purchases",
      sales: "Sales",
      expenses: "Expenses",
      inventory: "Inventory",
      transfers: "Transfers",
      reports: "Reports",
      users: "Users",
      roles: "Roles",
      permissions: "Permissions",
      settings: "Settings",
      alerts: "Alerts",
      backup: "Backup",
      barcode: "Barcode",
      prescriptions: "Prescriptions",
      returns: "Returns",
      "stock-take": "Stock Take",
      pharmacist: "Pharmacist",
      finance: "Finance",
    };

    function toast(title, msg, kind = "success") {
      state.toast = { title, msg, kind };
      render();
      clearTimeout(window.__toastTimer);
      window.__toastTimer = setTimeout(() => {
        state.toast = null;
        render();
      }, 2500);
    }

    function openModal(type) {
      state.modal = type;
      render();
    }

    function closeModal() {
      state.modal = null;
      render();
    }

    function setPage(page) {
      state.page = page;
      state.modal = null;
      state.tablePage = 1;
      state.paymentOpen = false;
      state.dateOpen = false;
      render();
    }

    function pageTitle() {
      if (state.page === "login") return "Welcome Back";
      if (state.page === "dashboard") return "Command Center";
      return pages[state.page]?.title ?? "Page";
    }

    function pageDesc() {
      if (state.page === "login") return "Sign in to explore the pharmacy operations suite.";
      return pages[state.page]?.desc ?? "";
    }

    function rowsFor(page) {
      return tableData[page] || [];
    }

    function tableMarkup(page, headers, rows, extraClass = "") {
      const start = (state.tablePage - 1) * 3;
      const slice = rows.slice(start, start + 3);
      const pageCount = Math.max(1, Math.ceil(rows.length / 3));
      const body = slice
        .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
        .join("");
      return `
        <div class="table-wrap ${extraClass}">
          <table>
            <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
        <div class="footer">
          <div>Showing ${Math.min(start + 1, rows.length)}-${Math.min(start + 3, rows.length)} of ${rows.length} records</div>
          <div class="pagination">
            <button data-page-nav="prev">Prev</button>
            <button data-page-nav="next">Next</button>
            <span class="pill">Page ${state.tablePage} / ${pageCount}</span>
          </div>
        </div>
      `;
    }

    function genericPage(page) {
      const spec = pages[page];
      const rows = rowsFor(page);
      const headers = {
        products: ["Product", "Category", "Barcode", "Qty", "Price", "Status"],
        categories: ["Name", "Products", "Status", "Notes"],
        brands: ["Brand", "Market", "Top Products", "Notes"],
        units: ["Unit", "Pack Size", "Use", "Status"],
        customers: ["Customer", "Phone", "Balance", "Points", "Notes"],
        suppliers: ["Supplier", "Phone", "City", "Balance", "Rating"],
        purchases: ["Number", "Supplier", "Date", "Amount", "Status"],
        sales: ["Invoice", "Customer", "Date", "Total", "Status"],
        expenses: ["Item", "Department", "Amount", "Status"],
        inventory: ["Item", "Qty", "Min", "Location", "Status"],
        transfers: ["Number", "Route", "Qty", "Status"],
        users: ["Name", "Email", "Role", "Status"],
        roles: ["Role", "Scope", "Permissions", "Notes"],
        permissions: ["Module", "Access", "Assigned To"],
        alerts: ["Type", "Message", "Level"],
        backup: ["Action", "Schedule", "Description", "Status"],
        barcode: ["Barcode", "Product", "Price", "Action"],
        prescriptions: ["Doctor", "Diagnosis", "Age", "Status"],
        returns: ["Return #", "Invoice", "Value", "Status"],
        "stock-take": ["Area", "System", "Counted", "Variance"],
        pharmacist: ["Tool", "Summary", "Result"],
        finance: ["Metric", "Range", "Amount", "Trend"],
      }[page] || ["Name", "Value"];

      const showActions = [
        "products",
        "customers",
        "suppliers",
        "purchases",
        "sales",
        "inventory",
        "returns",
        "users",
        "settings",
        "barcode",
      ].includes(page);
      const rowMarkup = rows
        .map(
          (row, idx) =>
            `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}${showActions ? `<td><button data-modal="view">View</button> <button data-modal="edit">Edit</button> <button data-modal="delete">Delete</button></td>` : ""}</tr>`,
        )
        .join("");
      const colHeaders = [...headers, ...(showActions ? ["Actions"] : [])];
      const stats = rows
        .slice(0, 3)
        .map(
          (r, i) => `
        <div class="stat">
          <div class="k">${spec.title} ${i + 1}</div>
          <div class="v">${r[0]}</div>
          <div class="s">${r[r.length - 1]}</div>
        </div>
      `,
        )
        .join("");
      const rightCard =
        page === "reports"
          ? `<div class="panel"><h3>Filters</h3><div class="list"><div class="row"><div><strong>Date Range</strong><br><small>Open picker</small></div><button class="btn btn-secondary" data-toggle="date">Select</button></div><div class="row"><div><strong>Channel</strong><br><small>All stores</small></div><button class="btn btn-secondary" data-toggle="menu">Open</button></div><div class="chart-box"><div class="chart-row">${Array.from({ length: 12 }, (_, i) => `<div class="${i % 3 === 0 ? "cyan" : ""}" style="height:${60 + ((i * 13) % 110)}px"></div>`).join("")}</div></div></div>`
          : page === "settings"
            ? `<div class="panel"><h3>Settings Tabs</h3><div class="section-tabs">${["pharmacy", "tax", "print"].map((t) => `<button data-tab="${t}" class="${state.sectionTab === t ? "active" : ""}">${t}</button>`).join("")}</div><div class="list"><div class="row"><div><strong>Operating Hours</strong><br><small>08:00 - 23:00</small></div><span class="badge success">Live</span></div><div class="row"><div><strong>Low Stock Alert</strong><br><small>Notify at 10 units</small></div><span class="badge warn">Enabled</span></div><div class="row"><div><strong>Print Format</strong><br><small>58mm receipt</small></div><span class="badge success">Configured</span></div></div></div>`
            : `<div class="panel"><h3>Quick Notes</h3><div class="list"><div class="row"><div><strong>Summary</strong><br><small>${spec.desc}</small></div><span class="badge success">Ready</span></div><div class="row"><div><strong>Focus</strong><br><small>Open add, edit, details, delete, filters, print, export</small></div><span class="badge warn">Documented</span></div><div class="row"><div><strong>Navigation</strong><br><small>Use sidebar and paginated table controls</small></div><span class="badge success">Stable</span></div></div></div>`;

      return `
        <div class="hero">
          <div>
            <h2>${spec.title}</h2>
            <p>${spec.desc}</p>
          </div>
          <div class="action-row">
            <button class="btn btn-primary" data-modal="add">Add</button>
            <button class="btn btn-secondary" data-modal="filters">Filters</button>
            <button class="btn btn-secondary" data-modal="print">Print Preview</button>
            <button class="btn btn-secondary" data-modal="export">Export</button>
          </div>
        </div>
        <div class="grid-4">${stats}</div>
        <div class="two-col">
          <div>
            ${page === "reports" ? `<div class="panel" style="margin-bottom:16px"><h3>Revenue Trend</h3><div class="chart">${Array.from({ length: 9 }, (_, i) => `<div class="bar ${i % 2 === 0 ? "alt" : ""}" style="height:${60 + i * 16}px"></div>`).join("")}</div></div>` : ""}
            <div class="panel"><h3>${spec.title} Table</h3>${tableMarkup(page, colHeaders, rows)}</div>
          </div>
          <div>${rightCard}</div>
        </div>
      `;
    }

    function dashboardPage() {
      return `
        <div class="hero">
          <div>
            <h2>Dashboard</h2>
            <p>High-level visibility into sales, stock pressure, expiry risk, and fast actions across the pharmacy floor.</p>
          </div>
          <div class="action-row">
            <button class="btn btn-primary" data-nav="pos">Open POS</button>
            <button class="btn btn-secondary" data-nav="reports">Open Reports</button>
          </div>
        </div>
        <div class="grid-4">
          <div class="stat"><div class="k">Today Revenue</div><div class="v">$12,480</div><div class="s">+16% vs yesterday</div></div>
          <div class="stat"><div class="k">Today Sales</div><div class="v">84</div><div class="s">Fast moving OTC and chronic meds</div></div>
          <div class="stat"><div class="k">Products</div><div class="v">1,248</div><div class="s">15 categories tracked</div></div>
          <div class="stat"><div class="k">Customers</div><div class="v">5,620</div><div class="s">120 loyalty redemptions</div></div>
        </div>
        <div class="two-col">
          <div class="panel">
            <h3>Sales Momentum</h3>
            <div class="chart">
              <div class="bar" style="height:82px"></div>
              <div class="bar alt" style="height:120px"></div>
              <div class="bar" style="height:104px"></div>
              <div class="bar alt" style="height:156px"></div>
              <div class="bar" style="height:138px"></div>
              <div class="bar alt" style="height:178px"></div>
              <div class="bar" style="height:150px"></div>
              <div class="bar alt" style="height:214px"></div>
            </div>
            <div class="space"></div>
            <div class="chip-row">
              <span class="chip">OTC basket</span>
              <span class="chip">Prescription refill</span>
              <span class="chip">Allergy season</span>
              <span class="chip">Chronic care</span>
            </div>
          </div>
          <div class="panel">
            <h3>Alerts & Risk</h3>
            <div class="list">
              <div class="row"><div><strong>Low stock</strong><br><small>Brufen 400 and Concor 5 below target.</small></div><span class="badge warn">2 items</span></div>
              <div class="row"><div><strong>Expiry watch</strong><br><small>Lyrica 75 batch expires in 90 days.</small></div><span class="badge danger">1 batch</span></div>
              <div class="row"><div><strong>Supplier balance</strong><br><small>Al Noor Medical Supply overdue by 12,450.</small></div><span class="badge warn">$12.4k</span></div>
            </div>
          </div>
        </div>
        <div class="panel" style="margin-top:16px">
          <h3>Quick Actions</h3>
          <div class="split">
            <div class="row"><div><strong>Open POS</strong><br><small>Scan, add items, and print receipt.</small></div><button class="btn btn-primary" data-nav="pos">Launch</button></div>
            <div class="row"><div><strong>Manage Inventory</strong><br><small>Review batch and shelf status.</small></div><button class="btn btn-secondary" data-nav="inventory">Open</button></div>
          </div>
        </div>
      `;
    }

    function posPage() {
      const itemCards = [
        ["Panadol Advance", "$35", "120 in stock"],
        ["Augmentin 1g", "$128", "60 in stock"],
        ["Zyrtec", "$38", "85 in stock"],
        ["Omez 20", "$24", "140 in stock"],
      ]
        .map(
          ([name, price, stock]) =>
            `<div class="mini"><strong>${name}</strong><div class="subtle">${stock}</div><div style="margin-top:12px;font-weight:900">${price}</div></div>`,
        )
        .join("");
      return `
        <div class="hero">
          <div>
            <h2>POS</h2>
            <p>Fast billing surface with payment selection, customer lookup, and a receipt-ready cart summary.</p>
          </div>
          <div class="action-row">
            <button class="btn btn-primary" data-modal="add">New Sale</button>
            <button class="btn btn-secondary" data-toggle="payment">Payment Method</button>
            <div style="position:relative">
              <button class="btn btn-secondary" data-toggle="date">Sale Date</button>
              <div class="date-pop ${state.dateOpen ? "show" : ""}">
                <div class="calendar">${Array.from({ length: 35 }, (_, i) => `<div>${i < 7 ? "SMTWTFS"[i] : i - 6}</div>`).join("")}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="two-col">
          <div class="panel">
            <h3>Product Lookup</h3>
            <div class="field"><label>Search</label><input value="Panadol" /></div>
            <div class="space"></div>
            <div class="permission-grid">${itemCards}</div>
          </div>
          <div class="panel">
            <h3>Cart & Tender</h3>
            <div class="list">
              <div class="row"><div><strong>Panadol Advance</strong><br><small>Qty 2</small></div><span>$70</span></div>
              <div class="row"><div><strong>Zyrtec</strong><br><small>Qty 1</small></div><span>$38</span></div>
              <div class="row"><div><strong>Subtotal</strong><br><small>VAT included</small></div><span>$108</span></div>
              <div class="row"><div><strong>Total</strong><br><small>Cashier payment</small></div><span style="font-size:24px;font-weight:900">$108</span></div>
            </div>
            <div class="space"></div>
            <div class="right-tools">
              <button class="btn btn-primary" data-toggle="payment">Cash / Card / Transfer</button>
              <div class="menu-pop ${state.paymentOpen ? "show" : ""}">
                <button>Cash</button>
                <button>Card</button>
                <button>Wallet Transfer</button>
                <button>Insurance</button>
              </div>
            </div>
          </div>
        </div>
        <div class="panel" style="margin-top:16px">
          <h3>Recent Bills</h3>
          <div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Customer</th><th>Time</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            <tr><td>INV-5501</td><td>Ahmed Ali</td><td>10:42</td><td>$214</td><td><span class="badge success">Paid</span></td><td><button data-modal="view">View</button> <button data-modal="print">Print</button></td></tr>
            <tr><td>INV-5502</td><td>Mona Hassan</td><td>09:15</td><td>$89</td><td><span class="badge success">Paid</span></td><td><button data-modal="view">View</button> <button data-modal="print">Print</button></td></tr>
            <tr><td>INV-5503</td><td>Walk-in</td><td>08:33</td><td>$56</td><td><span class="badge danger">Refunded</span></td><td><button data-modal="view">View</button> <button data-modal="delete">Delete</button></td></tr>
          </tbody></table></div>
        </div>
      `;
    }

    function loginPage() {
      return `
        <div class="login-shell">
          <div class="login-card">
            <div class="login-hero">
              <div class="brand" style="padding:0;margin-bottom:26px">
                <div class="brand-badge">P</div>
                <div>
                  <h1>PharmaLove Suite</h1>
                  <p>Pharmacy operations in one calm, high-contrast command surface.</p>
                </div>
              </div>
              <h1>Manage stock, sales, and clinical workflows from a single console.</h1>
              <p>Built for pharmacy teams that need a clear view of inventory, POS, purchases, and reporting with fast access to documents and controls.</p>
              <div class="mini-grid">
                <div class="mini"><strong>1,248</strong><div class="subtle">Products tracked</div></div>
                <div class="mini"><strong>84</strong><div class="subtle">Bills today</div></div>
                <div class="mini"><strong>15</strong><div class="subtle">Categories</div></div>
                <div class="mini"><strong>24/7</strong><div class="subtle">Audit ready</div></div>
              </div>
            </div>
            <div class="login-form">
              <div class="toggle">
                <button class="active">Sign in</button>
                <button>Sign up</button>
                <button>العربية / English</button>
              </div>
              <h2>Welcome back</h2>
              <div class="switch">Sign in to continue to the dashboard and document the rest of the suite.</div>
              <div class="field-grid">
                <div class="field"><label>Email</label><input value="admin@pharmalove.test" /></div>
                <div class="field"><label>Password</label><input type="password" value="••••••••" /></div>
              </div>
              <div class="space"></div>
              <button class="btn btn-primary" style="width:100%" data-login>Sign In</button>
              <div class="space"></div>
              <div class="row"><div><strong>Demo ready</strong><br><small>Seed data already loaded for the showcase.</small></div><span class="badge success">OK</span></div>
            </div>
          </div>
        </div>
      `;
    }

    function modalMarkup() {
      if (!state.modal) return "";
      const titleMap = {
        add: "Add Record",
        edit: "Edit Record",
        view: "Details / View",
        delete: "Delete Confirmation",
        filters: "Filters",
        print: "Print Preview",
        export: "Export Dialog",
      };
      return `
        <div class="modal-backdrop show" data-close>
          <div class="modal" role="dialog" aria-modal="true">
            <div class="modal-head">
              <strong>${titleMap[state.modal] || "Dialog"}</strong>
              <button class="btn btn-secondary" data-close>Close</button>
            </div>
            <div class="modal-body">
              ${
                state.modal === "delete"
                  ? `
                <div class="row"><div><strong>Confirm deletion</strong><br><small>This action will be canceled in the walkthrough after the screenshot.</small></div><span class="badge danger">Irreversible</span></div>
                <div class="modal-actions"><button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" data-toast="deleted">Confirm Delete</button></div>
              `
                  : state.modal === "filters"
                    ? `
                <div class="field-grid">
                  <div class="field"><label>Category</label><select><option>All categories</option><option>Analgesic</option><option>Antibiotic</option></select></div>
                  <div class="field"><label>Status</label><select><option>All</option><option>Active</option><option>Low stock</option></select></div>
                  <div class="field"><label>Start date</label><input value="2026-07-01" /></div>
                  <div class="field"><label>End date</label><input value="2026-07-31" /></div>
                </div>
                <div class="modal-actions"><button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" data-toast="filtered">Apply Filters</button></div>
              `
                    : state.modal === "print"
                      ? `
                <div class="panel" style="margin:0;background:linear-gradient(180deg,#f9f1e3,#fff);color:#1e2433">
                  <h3 style="margin:0 0 8px">Print Preview</h3>
                  <div class="subtle">Receipt / document ready for thermal printer and PDF export.</div>
                  <div class="space"></div>
                  <div class="row" style="background:rgba(0,0,0,.03)"><div><strong>Invoice</strong><br><small>INV-5501</small></div><span>$214</span></div>
                  <div class="space"></div>
                  <div class="row" style="background:rgba(0,0,0,.03)"><div><strong>Store footer</strong><br><small>PharmaLove Suite</small></div><span>58mm</span></div>
                </div>
                <div class="modal-actions"><button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" data-toast="printed">Print</button></div>
              `
                      : state.modal === "export"
                        ? `
                <div class="field-grid">
                  <div class="field"><label>Format</label><select><option>CSV</option><option>Excel</option><option>PDF</option></select></div>
                  <div class="field"><label>Scope</label><select><option>Current page</option><option>All data</option></select></div>
                  <div class="field"><label>Filename</label><input value="pharmalove_export" /></div>
                  <div class="field"><label>Compression</label><select><option>Lossless</option><option>Standard</option></select></div>
                </div>
                <div class="modal-actions"><button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" data-toast="exported">Export</button></div>
              `
                        : `
                <div class="field-grid">
                  <div class="field"><label>Item name</label><input value="${pages[state.page]?.title || "New Item"}" /></div>
                  <div class="field"><label>Reference</label><input value="Auto generated" /></div>
                  <div class="field"><label>Quantity</label><input value="12" /></div>
                  <div class="field"><label>Status</label><select><option>Active</option><option>Draft</option><option>Pending</option></select></div>
                  <div class="field"><label>Notes</label><textarea>Professional showcase data entry.</textarea></div>
                  <div class="field"><label>Tags</label><input value="demo, seed, ui" /></div>
                </div>
                <div class="modal-actions"><button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" data-toast="saved">Save</button></div>
              `
              }
            </div>
          </div>
        </div>
      `;
    }

    function shell(content) {
      const nav = navOrder
        .map(
          (key) =>
            `<button data-nav="${key}" class="${state.page === key ? "active" : ""}"><span class="label"><span class="dot"></span>${navLabels[key]}</span><span class="muted">›</span></button>`,
        )
        .join("");
      return `
        <div class="app">
          <aside class="sidebar">
            <div class="brand">
              <div class="brand-badge">P</div>
              <div><h1>PharmaLove Suite</h1><p>Pharmacy operations center</p></div>
            </div>
            <div class="nav">${nav}</div>
            <div class="sidebar-footer">
              <div class="user-row">
                <div class="avatar">MA</div>
                <div style="min-width:0">
                  <div style="font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Mousa Admin</div>
                  <div class="subtle">admin@pharmalove.test</div>
                </div>
              </div>
              <div class="space"></div>
              <div class="chip-row">
                <span class="chip">English</span>
                <span class="chip">RTL ready</span>
                <span class="chip">Demo seed</span>
              </div>
            </div>
          </aside>
          <main class="main">
            <div class="topbar">
              <div class="crumb"><strong>${navLabels[state.page] || "Login"}</strong><span>•</span><span>${pageDesc()}</span></div>
              <div class="toolbar">
                <div class="pill">Viewport 1440 × 900</div>
                <div class="pill">Zoom 100%</div>
                <button class="btn btn-secondary" data-toast="ok">Notifications</button>
              </div>
            </div>
            <div class="content">${content}</div>
          </main>
        </div>
        ${modalMarkup()}
        <div class="toast ${state.toast ? "show " + state.toast.kind : ""}">
          ${state.toast ? `<strong>${state.toast.title}</strong><div>${state.toast.msg}</div>` : ""}
        </div>
      `;
    }

    function render() {
      if (state.page === "login") {
        root.innerHTML = loginPage();
      } else {
        let content =
          state.page === "dashboard"
            ? dashboardPage()
            : state.page === "pos"
              ? posPage()
              : genericPage(state.page);
        if (state.page === "settings" && state.sectionTab === "tax") {
          content = content.replace(
            '<div class="row"><div><strong>Operating Hours</strong><br><small>08:00 - 23:00</small></div><span class="badge success">Live</span></div>',
            '<div class="row"><div><strong>Tax Rate</strong><br><small>VAT 14%</small></div><span class="badge warn">Configured</span></div>',
          );
        }
        root.innerHTML = shell(content);
      }
    }

    root.addEventListener("click", (event) => {
      const el = event.target.closest(
        "[data-nav],[data-modal],[data-close],[data-toast],[data-toggle],[data-login],[data-page-nav],[data-tab]",
      );
      if (!el) return;
      event.preventDefault();

      const nav = el.getAttribute("data-nav");
      const modal = el.getAttribute("data-modal");
      const close = el.hasAttribute("data-close");
      const toastKey = el.getAttribute("data-toast");
      const toggle = el.getAttribute("data-toggle");
      const pageNav = el.getAttribute("data-page-nav");
      const tab = el.getAttribute("data-tab");

      if (nav) return setPage(nav);
      if (el.hasAttribute("data-login")) return setPage("dashboard");
      if (modal) return openModal(modal);
      if (close) return closeModal();
      if (toastKey) {
        if (toastKey === "ok")
          return toast("Notification", "No new alerts. Everything is up to date.");
        if (toastKey === "saved") return toast("Saved", "Record saved successfully.");
        if (toastKey === "deleted") return toast("Cancelled", "Deletion has been canceled.");
        if (toastKey === "filtered") return toast("Filters applied", "Result list updated.");
        if (toastKey === "printed")
          return toast("Print queued", "Preview sent to the print queue.");
        if (toastKey === "exported")
          return toast("Export ready", "Download created with lossless settings.");
      }
      if (toggle === "payment") {
        state.paymentOpen = !state.paymentOpen;
        state.dateOpen = false;
        return render();
      }
      if (toggle === "date") {
        state.dateOpen = !state.dateOpen;
        state.paymentOpen = false;
        return render();
      }
      if (toggle === "menu") {
        return toast("Menu", "Dropdown opened for selection.");
      }
      if (pageNav) {
        const total = Math.max(1, Math.ceil((rowsFor(state.page).length || 1) / 3));
        if (pageNav === "next") state.tablePage = Math.min(total, state.tablePage + 1);
        if (pageNav === "prev") state.tablePage = Math.max(1, state.tablePage - 1);
        return render();
      }
      if (tab) {
        state.sectionTab = tab;
        return render();
      }
    });

    window.showcase = {
      setPage,
      openModal,
      closeModal,
      toast: (title, msg, kind) => toast(title, msg, kind),
      state,
    };
    render();
  });
};
