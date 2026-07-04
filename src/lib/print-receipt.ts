/**
 * Thermal receipt printer utility.
 * Supports 58mm, 80mm thermal rolls and A4 fallback.
 * Opens a hidden iframe, injects a print-optimized layout, then triggers print().
 */

export type PaperSize = "58mm" | "80mm" | "a4";

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  discount?: number;
}

export interface ReceiptData {
  storeName: string;
  storeTagline?: string;
  storePhone?: string;
  storeAddress?: string;
  storeVatNumber?: string;
  invoiceNo: string | number;
  date: Date;
  cashierName?: string;
  customerName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  taxAmount?: number;
  total: number;
  paid: number;
  paymentMethod: string;
  currency: string;
  footer?: string;
  lang: "ar" | "en";
}

/**
 * Generate ZATCA-compliant TLV QR code data (Base64 encoded)
 * Tags: 1=Seller, 2=VAT, 3=Timestamp, 4=Total, 5=TaxAmount
 */
function generateZatcaQR(data: ReceiptData): string {
  try {
    const encoder = new TextEncoder();
    const tlvEntry = (tag: number, value: string): Uint8Array => {
      const val = encoder.encode(value);
      return new Uint8Array([tag, val.length, ...val]);
    };
    const timestamp = data.date.toISOString();
    const totalStr = data.total.toFixed(2);
    const taxStr = (data.taxAmount ?? data.tax).toFixed(2);
    const parts = [
      tlvEntry(1, data.storeName),
      tlvEntry(2, data.storeVatNumber ?? ""),
      tlvEntry(3, timestamp),
      tlvEntry(4, totalStr),
      tlvEntry(5, taxStr),
    ];
    const total = parts.reduce((s, a) => s + a.length, 0);
    const combined = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) { combined.set(p, offset); offset += p.length; }
    return btoa(String.fromCharCode(...combined));
  } catch {
    return "";
  }
}

/**
 * Render a simple QR-like display using the Base64 string as text
 * (Full QR rendering requires a library; we display the data as a code block for now)
 */
function buildQrHtml(data: ReceiptData): string {
  if (!data.storeVatNumber && !data.taxAmount && !data.tax) return "";
  const qrData = generateZatcaQR(data);
  return `
    <div style="margin-top:8px;text-align:center">
      <div style="font-size:8px;opacity:0.7;margin-bottom:2px">${data.lang === "ar" ? "رمز QR الضريبي" : "Tax QR Code"}</div>
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" style="display:inline-block;border:1px solid #ccc;padding:2px">
        <rect width="80" height="80" fill="white"/>
        <!-- QR placeholder — integrate a QR lib for production -->
        <text x="40" y="38" text-anchor="middle" font-size="6" font-family="monospace" fill="#333">ZATCA QR</text>
        <text x="40" y="50" text-anchor="middle" font-size="4" font-family="monospace" fill="#999">${qrData.slice(0, 12)}...</text>
      </svg>
      ${data.storeVatNumber ? `<div style="font-size:8px;margin-top:2px">${data.lang === "ar" ? "الرقم الضريبي" : "VAT No"}: ${data.storeVatNumber}</div>` : ""}
    </div>
  `;
}

const PAPER_KEY = "pos.paperSize";

export function getPaperSize(): PaperSize {
  if (typeof window === "undefined") return "80mm";
  return (localStorage.getItem(PAPER_KEY) as PaperSize) || "80mm";
}

export function setPaperSize(s: PaperSize) {
  localStorage.setItem(PAPER_KEY, s);
}

const SIZES: Record<PaperSize, { width: string; pad: string; font: string; nameMax: string }> = {
  "58mm": { width: "58mm", pad: "2mm", font: "10px", nameMax: "22mm" },
  "80mm": { width: "80mm", pad: "3mm", font: "11px", nameMax: "36mm" },
  a4: { width: "190mm", pad: "10mm", font: "12px", nameMax: "auto" },
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function fmt(n: number, lang: "ar" | "en") {
  return n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildHtml(data: ReceiptData, size: PaperSize): string {
  const cfg = SIZES[size];
  const isThermal = size !== "a4";
  const dir = data.lang === "ar" ? "rtl" : "ltr";
  const L =
    data.lang === "ar"
      ? {
          invoice: "فاتورة",
          no: "رقم",
          date: "التاريخ",
          cashier: "الكاشير",
          customer: "العميل",
          item: "الصنف",
          qty: "كمية",
          price: "سعر",
          total: "إجمالي",
          subtotal: "المجموع",
          discount: "خصم",
          tax: "ضريبة",
          grand: "الإجمالي",
          paid: "المدفوع",
          change: "المتبقي",
          payment: "الدفع",
          thanks: "شكراً لزيارتكم",
        }
      : {
          invoice: "INVOICE",
          no: "No.",
          date: "Date",
          cashier: "Cashier",
          customer: "Customer",
          item: "Item",
          qty: "Qty",
          price: "Price",
          total: "Total",
          subtotal: "Subtotal",
          discount: "Discount",
          tax: "Tax",
          grand: "TOTAL",
          paid: "Paid",
          change: "Change",
          payment: "Payment",
          thanks: "Thank you for your visit",
        };

  const rows = data.items
    .map((i) => {
      const line = i.price * i.quantity - (i.discount ?? 0);
      return `
      <tr>
        <td class="name">${escapeHtml(i.name)}</td>
        <td class="num">${i.quantity}</td>
        <td class="num">${fmt(i.price, data.lang)}</td>
        <td class="num">${fmt(line, data.lang)}</td>
      </tr>`;
    })
    .join("");

  const change = Math.max(0, data.paid - data.total);
  const dateStr = data.date.toLocaleString(data.lang === "ar" ? "ar-EG" : "en-US");

  return `<!doctype html>
<html lang="${data.lang}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${L.invoice} #${data.invoiceNo}</title>
<style>
  @page { size: ${cfg.width} auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body {
    font-family: ${data.lang === "ar" ? "'Tajawal','Cairo',sans-serif" : "'Inter','Segoe UI',sans-serif"};
    font-size: ${cfg.font};
    line-height: 1.35;
    width: ${cfg.width};
    padding: ${cfg.pad};
    ${isThermal ? "" : "margin: 0 auto;"}
  }
  .center { text-align: center; }
  .store-name { font-size: ${isThermal ? "14px" : "20px"}; font-weight: 800; letter-spacing: .5px; }
  .store-meta { font-size: ${isThermal ? "9px" : "11px"}; opacity: .85; }
  .hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
  .meta { display: flex; justify-content: space-between; font-size: ${isThermal ? "9.5px" : "11px"}; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th, td { padding: 3px 2px; vertical-align: top; }
  thead th { border-bottom: 1px solid #000; font-size: ${isThermal ? "9.5px" : "11px"}; text-align: ${dir === "rtl" ? "right" : "left"}; }
  td.name { ${cfg.nameMax !== "auto" ? `max-width:${cfg.nameMax};` : ""} word-wrap: break-word; }
  .num { text-align: ${dir === "rtl" ? "left" : "right"}; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .totals { width: 100%; margin-top: 4px; }
  .totals td { padding: 2px 2px; }
  .totals .label { opacity: .85; }
  .grand td { border-top: 1px dashed #000; font-size: ${isThermal ? "13px" : "16px"}; font-weight: 800; padding-top: 5px; }
  .footer { margin-top: 8px; text-align: center; font-size: ${isThermal ? "9.5px" : "11px"}; }
  .barcode { margin-top: 6px; font-family: monospace; text-align: center; letter-spacing: 1px; font-size: ${isThermal ? "9px" : "10px"}; }
  @media print { html, body { width: ${cfg.width}; } }
</style>
</head>
<body>
  <div class="center">
    <div class="store-name">${escapeHtml(data.storeName)}</div>
    ${data.storeTagline ? `<div class="store-meta">${escapeHtml(data.storeTagline)}</div>` : ""}
    ${data.storePhone ? `<div class="store-meta">${escapeHtml(data.storePhone)}</div>` : ""}
    ${data.storeAddress ? `<div class="store-meta">${escapeHtml(data.storeAddress)}</div>` : ""}
  </div>
  <hr class="hr" />
  <div class="meta"><span>${L.no}: <b>#${data.invoiceNo}</b></span><span>${dateStr}</span></div>
  ${data.cashierName ? `<div class="meta"><span>${L.cashier}</span><span>${escapeHtml(data.cashierName)}</span></div>` : ""}
  ${data.customerName ? `<div class="meta"><span>${L.customer}</span><span>${escapeHtml(data.customerName)}</span></div>` : ""}
  <hr class="hr" />
  <table>
    <thead>
      <tr>
        <th>${L.item}</th>
        <th class="num">${L.qty}</th>
        <th class="num">${L.price}</th>
        <th class="num">${L.total}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <hr class="hr" />
  <table class="totals">
    <tr><td class="label">${L.subtotal}</td><td class="num">${fmt(data.subtotal, data.lang)} ${data.currency}</td></tr>
    ${data.discount ? `<tr><td class="label">${L.discount}</td><td class="num">-${fmt(data.discount, data.lang)} ${data.currency}</td></tr>` : ""}
    ${data.tax || data.taxAmount ? `<tr><td class="label">${L.tax} ${data.storeVatNumber ? '(15%)' : ''}</td><td class="num">+${fmt(data.taxAmount ?? data.tax, data.lang)} ${data.currency}</td></tr>` : ""}
    <tr class="grand"><td>${L.grand}</td><td class="num">${fmt(data.total, data.lang)} ${data.currency}</td></tr>
    <tr><td class="label">${L.payment} (${escapeHtml(data.paymentMethod)})</td><td class="num">${fmt(data.paid, data.lang)} ${data.currency}</td></tr>
    ${change > 0 ? `<tr><td class="label">${L.change}</td><td class="num">${fmt(change, data.lang)} ${data.currency}</td></tr>` : ""}
  </table>
  ${buildQrHtml(data)}
  <div class="barcode">*${data.invoiceNo}*</div>
  <div class="footer">${escapeHtml(data.footer ?? L.thanks)}</div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 150);
    });
    window.addEventListener('afterprint', function () { setTimeout(function () { window.close(); }, 200); });
  </script>
</body>
</html>`;
}

export function printReceipt(data: ReceiptData, size: PaperSize = getPaperSize()) {
  const html = buildHtml(data, size);
  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) {
    // popup blocked — fallback to hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 1000);
    }, 250);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
