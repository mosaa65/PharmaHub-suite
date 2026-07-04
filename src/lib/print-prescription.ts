/**
 * Prescription printer — A5 layout, works on any printer.
 */

export interface PrescriptionPrintItem {
  product_name: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  quantity: number;
  instructions?: string | null;
}

export interface PrescriptionPrintData {
  storeName: string;
  storePhone?: string;
  storeAddress?: string;
  prescriptionId: string | number;
  date: Date;
  status: string;
  doctorName?: string | null;
  patientName?: string | null;
  patientAge?: number | null;
  patientWeight?: number | null;
  diagnosis?: string | null;
  notes?: string | null;
  items: PrescriptionPrintItem[];
  allergies?: string[];
  lang: "ar" | "en";
  pharmacistName?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  reviewed: "#0ea5e9",
  dispensed: "#10b981",
  cancelled: "#ef4444",
};

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function buildHtml(d: PrescriptionPrintData): string {
  const dir = d.lang === "ar" ? "rtl" : "ltr";
  const L =
    d.lang === "ar"
      ? {
          title: "وصفة طبية",
          no: "رقم الوصفة",
          date: "التاريخ",
          status: "الحالة",
          doctor: "الطبيب",
          patient: "المريض",
          age: "العمر",
          weight: "الوزن",
          diagnosis: "التشخيص",
          items: "الأدوية الموصوفة",
          drug: "الدواء",
          dose: "الجرعة",
          freq: "التكرار",
          duration: "المدة",
          qty: "الكمية",
          instr: "تعليمات",
          notes: "ملاحظات",
          allergyWarn: "⚠ تنبيه حساسية",
          pharmacist: "الصيدلي",
          statusPending: "قيد المراجعة",
          statusReviewed: "تمت المراجعة",
          statusDispensed: "تم الصرف",
          statusCancelled: "ملغاة",
          footer: "شفاء عاجل — لا يُعاد الصرف بدون مراجعة الصيدلي",
        }
      : {
          title: "MEDICAL PRESCRIPTION",
          no: "Rx No.",
          date: "Date",
          status: "Status",
          doctor: "Doctor",
          patient: "Patient",
          age: "Age",
          weight: "Weight",
          diagnosis: "Diagnosis",
          items: "Prescribed Medications",
          drug: "Drug",
          dose: "Dose",
          freq: "Frequency",
          duration: "Duration",
          qty: "Qty",
          instr: "Instructions",
          notes: "Notes",
          allergyWarn: "⚠ Allergy Alert",
          pharmacist: "Pharmacist",
          statusPending: "Pending",
          statusReviewed: "Reviewed",
          statusDispensed: "Dispensed",
          statusCancelled: "Cancelled",
          footer: "Get well soon — no refill without pharmacist review",
        };

  const statusLabel =
    (L as any)[`status${d.status.charAt(0).toUpperCase() + d.status.slice(1)}`] ??
    d.status;
  const statusColor = STATUS_COLORS[d.status] ?? "#64748b";

  const rows = d.items
    .map(
      (i, idx) => `
    <tr>
      <td class="idx">${idx + 1}</td>
      <td class="drug"><b>${esc(i.product_name)}</b>${
        i.instructions
          ? `<div class="instr">${esc(i.instructions)}</div>`
          : ""
      }</td>
      <td>${esc(i.dosage ?? "-")}</td>
      <td>${esc(i.frequency ?? "-")}</td>
      <td>${esc(i.duration ?? "-")}</td>
      <td class="num">${i.quantity}</td>
    </tr>`,
    )
    .join("");

  const dateStr = d.date.toLocaleString(d.lang === "ar" ? "ar-EG" : "en-US");

  return `<!doctype html>
<html lang="${d.lang}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${L.title} #${d.prescriptionId}</title>
<style>
  @page { size: A5; margin: 10mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; color: #0f172a; background: #fff; }
  body {
    font-family: ${d.lang === "ar" ? "'Tajawal','Cairo',sans-serif" : "'Inter','Segoe UI',sans-serif"};
    font-size: 12px;
    line-height: 1.5;
  }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #10b981; padding-bottom: 8px; }
  .brand .name { font-size: 18px; font-weight: 800; color: #059669; }
  .brand .meta { font-size: 10px; color: #64748b; }
  .rx-badge {
    background: linear-gradient(135deg, #10b981, #34d399);
    color: #fff; padding: 6px 14px; border-radius: 999px;
    font-size: 11px; font-weight: 700; letter-spacing: .5px;
  }
  .title { text-align: center; font-size: 15px; font-weight: 800; letter-spacing: 1px; margin: 10px 0; color: #0f766e; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; padding: 8px 10px; background: #f0fdf4; border-radius: 8px; border: 1px solid #d1fae5; font-size: 11px; }
  .meta-grid b { color: #059669; }
  .status-chip { display: inline-block; padding: 2px 10px; border-radius: 999px; color: #fff; font-size: 10px; font-weight: 700; background: ${statusColor}; }
  .allergy { margin-top: 8px; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; }
  h3 { margin: 12px 0 6px; font-size: 12px; color: #0f766e; border-inline-start: 3px solid #10b981; padding-inline-start: 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { background: #ecfdf5; color: #065f46; text-align: ${dir === "rtl" ? "right" : "left"}; font-size: 10.5px; padding: 6px 5px; border-bottom: 1px solid #a7f3d0; }
  td { padding: 6px 5px; border-bottom: 1px dashed #e2e8f0; vertical-align: top; }
  td.num { text-align: center; }
  td.idx { color: #64748b; width: 20px; text-align: center; }
  td.drug .instr { color: #475569; font-size: 10px; margin-top: 2px; font-style: italic; }
  .notes { margin-top: 10px; padding: 6px 10px; background: #f8fafc; border-radius: 8px; font-size: 11px; color: #334155; }
  .sign { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 10.5px; color: #64748b; }
  .footer { text-align: center; margin-top: 14px; font-size: 10px; color: #94a3b8; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="name">${esc(d.storeName)}</div>
      ${d.storePhone ? `<div class="meta">${esc(d.storePhone)}</div>` : ""}
      ${d.storeAddress ? `<div class="meta">${esc(d.storeAddress)}</div>` : ""}
    </div>
    <div class="rx-badge">℞ ${L.title}</div>
  </div>

  <div class="title">${L.title}</div>

  <div class="meta-grid">
    <div><b>${L.no}:</b> #${esc(String(d.prescriptionId).slice(0, 8))}</div>
    <div><b>${L.date}:</b> ${dateStr}</div>
    <div><b>${L.status}:</b> <span class="status-chip">${statusLabel}</span></div>
    ${d.doctorName ? `<div><b>${L.doctor}:</b> Dr. ${esc(d.doctorName)}</div>` : "<div></div>"}
    ${d.patientName ? `<div><b>${L.patient}:</b> ${esc(d.patientName)}</div>` : "<div></div>"}
    <div>${d.patientAge ? `<b>${L.age}:</b> ${d.patientAge}` : ""} ${d.patientWeight ? ` &nbsp;<b>${L.weight}:</b> ${d.patientWeight} kg` : ""}</div>
    ${d.diagnosis ? `<div style="grid-column:1/-1"><b>${L.diagnosis}:</b> ${esc(d.diagnosis)}</div>` : ""}
  </div>

  ${
    d.allergies && d.allergies.length
      ? `<div class="allergy">${L.allergyWarn}: ${d.allergies.map(esc).join(", ")}</div>`
      : ""
  }

  <h3>${L.items}</h3>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>${L.drug}</th>
        <th>${L.dose}</th>
        <th>${L.freq}</th>
        <th>${L.duration}</th>
        <th class="num">${L.qty}</th>
      </tr>
    </thead>
    <tbody>${rows || `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:16px">—</td></tr>`}</tbody>
  </table>

  ${d.notes ? `<div class="notes"><b>${L.notes}:</b> ${esc(d.notes)}</div>` : ""}

  <div class="sign">
    <div>${L.pharmacist}: ${esc(d.pharmacistName ?? "________________")}</div>
    <div>${L.doctor}: ${d.doctorName ? "Dr. " + esc(d.doctorName) : "________________"}</div>
  </div>

  <div class="footer">${L.footer}</div>

  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.focus(); window.print(); }, 200);
    });
    window.addEventListener('afterprint', function () { setTimeout(function () { window.close(); }, 200); });
  </script>
</body>
</html>`;
}

export function printPrescription(data: PrescriptionPrintData) {
  const html = buildHtml(data);
  const w = window.open("", "_blank", "width=560,height=760");
  if (!w) {
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
      setTimeout(() => iframe.remove(), 1200);
    }, 300);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
