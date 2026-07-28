/**
 * PharmaLove Suite - Complete Visual Showcase Automation
 * Captures screenshots of every page, modal, form, and feature.
 * Run: node scripts/showcase-walkthrough.mjs
 */

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, "..", "screenshots");
const VIDEO_DIR = path.join(__dirname, "..", "recordings");

// Ensure directories exist
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
fs.mkdirSync(VIDEO_DIR, { recursive: true });

// Clean old screenshots
for (const f of fs.readdirSync(SCREENSHOTS_DIR)) {
  fs.unlinkSync(path.join(SCREENSHOTS_DIR, f));
}

const BASE_URL = "http://localhost:8080";
const CREDENTIALS = { email: "mousa.mc13@gmail.com", password: "Mm#200200" };
const VIEWPORT = { width: 1440, height: 900 };

let screenshotCounter = 0;

async function screenshot(page, name) {
  screenshotCounter++;
  const num = String(screenshotCounter).padStart(3, "0");
  const filename = `${num}-${name}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);

  // Wait for any loading indicators to disappear
  try {
    await page.waitForSelector(".animate-spin", { state: "hidden", timeout: 5000 }).catch(() => {});
    await page
      .waitForSelector("[data-loading]", { state: "hidden", timeout: 3000 })
      .catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  } catch (e) {
    /* ignore timeouts */
  }

  // Additional settle time
  await page.waitForTimeout(1500);

  await page.screenshot({
    path: filepath,
    type: "png",
    fullPage: false, // 1440x900 viewport only
  });

  console.log(`  ✅ ${filename}`);
  return filepath;
}

async function tryClick(page, selector, timeout = 3000) {
  try {
    const el = await page.waitForSelector(selector, { timeout });
    if (el) {
      await el.click();
      return true;
    }
  } catch (e) {
    /* element not found */
  }
  return false;
}

async function tryCloseModal(page) {
  // Try multiple close strategies
  await page.waitForTimeout(500);

  // Try X/close button in dialog
  const closed =
    (await tryClick(page, '[data-state="open"] button[aria-label="Close"]', 1000)) ||
    (await tryClick(page, "button:has(svg.lucide-x)", 1000)) ||
    (await tryClick(page, '[role="dialog"] button:has-text("إغلاق")', 1000)) ||
    (await tryClick(page, '[role="dialog"] button:has-text("إلغاء")', 1000)) ||
    (await tryClick(page, '[role="dialog"] button:has-text("Cancel")', 1000));

  if (!closed) {
    // Press Escape as fallback
    await page.keyboard.press("Escape");
  }

  await page.waitForTimeout(1000);
}

async function captureAddForm(page, pageName) {
  // Try various Add button selectors
  const addSelectors = [
    'button:has-text("إضافة")',
    'button:has-text("أضف")',
    'button:has-text("إضافة منتج")',
    'button:has-text("إضافة جديد")',
    'button:has-text("جديد")',
    'button:has-text("Add")',
    "button:has(svg.lucide-plus)",
  ];

  for (const sel of addSelectors) {
    try {
      const btn = await page.$(sel);
      if (btn && (await btn.isVisible())) {
        await btn.click();
        await page.waitForTimeout(2500);
        await screenshot(page, `${pageName}-add`);
        await tryCloseModal(page);
        return true;
      }
    } catch (e) {
      /* try next selector */
    }
  }
  return false;
}

async function captureEditForm(page, pageName) {
  // Look for edit buttons in table rows
  const editSelectors = [
    "button:has(svg.lucide-pencil)",
    "button:has(svg.lucide-edit)",
    "button:has(svg.lucide-pen)",
    'button[aria-label="تعديل"]',
    'button:has-text("تعديل")',
    "table tbody tr:first-child button:has(svg.lucide-pencil)",
    "table tbody tr:first-child button:has(svg.lucide-edit)",
  ];

  for (const sel of editSelectors) {
    try {
      const btn = await page.$(sel);
      if (btn && (await btn.isVisible())) {
        await btn.click();
        await page.waitForTimeout(2500);
        await screenshot(page, `${pageName}-edit`);
        await tryCloseModal(page);
        return true;
      }
    } catch (e) {
      /* try next selector */
    }
  }
  return false;
}

async function captureViewDialog(page, pageName) {
  const viewSelectors = [
    "button:has(svg.lucide-eye)",
    'button[aria-label="عرض"]',
    'button:has-text("عرض")',
    'button:has-text("التفاصيل")',
    "table tbody tr:first-child button:has(svg.lucide-eye)",
  ];

  for (const sel of viewSelectors) {
    try {
      const btn = await page.$(sel);
      if (btn && (await btn.isVisible())) {
        await btn.click();
        await page.waitForTimeout(2500);
        await screenshot(page, `${pageName}-view`);
        await tryCloseModal(page);
        return true;
      }
    } catch (e) {
      /* try next selector */
    }
  }
  return false;
}

async function captureDeleteDialog(page, pageName) {
  const deleteSelectors = [
    "button:has(svg.lucide-trash)",
    "button:has(svg.lucide-trash-2)",
    'button[aria-label="حذف"]',
    'button:has-text("حذف")',
    "table tbody tr:first-child button:has(svg.lucide-trash-2)",
    "table tbody tr:first-child button:has(svg.lucide-trash)",
  ];

  for (const sel of deleteSelectors) {
    try {
      const btn = await page.$(sel);
      if (btn && (await btn.isVisible())) {
        await btn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, `${pageName}-delete`);
        // Cancel deletion
        (await tryClick(page, 'button:has-text("إلغاء")', 2000)) ||
          (await tryClick(page, 'button:has-text("Cancel")', 2000)) ||
          (await page.keyboard.press("Escape"));
        await page.waitForTimeout(1000);
        return true;
      }
    } catch (e) {
      /* try next selector */
    }
  }
  return false;
}

async function captureFilters(page, pageName) {
  const filterSelectors = [
    "button:has(svg.lucide-filter)",
    "button:has(svg.lucide-sliders-horizontal)",
    'button:has-text("فلتر")',
    'button:has-text("تصفية")',
    'button:has-text("Filter")',
  ];

  for (const sel of filterSelectors) {
    try {
      const btn = await page.$(sel);
      if (btn && (await btn.isVisible())) {
        await btn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, `${pageName}-filters`);
        await tryCloseModal(page);
        return true;
      }
    } catch (e) {
      /* try next selector */
    }
  }
  return false;
}

async function navigateAndCapture(page, route, pageName, options = {}) {
  console.log(`\n📸 Navigating to: ${route} (${pageName})`);

  await page
    .goto(`${BASE_URL}${route}`, { waitUntil: "networkidle", timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  // Main page screenshot
  await screenshot(page, pageName);

  // Scroll down if page has more content
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  if (pageHeight > VIEWPORT.height + 100) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1500);
    await screenshot(page, `${pageName}-scrolled`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
  }

  // Capture forms and dialogs if requested
  if (!options.skipForms) {
    await captureAddForm(page, pageName);
    await captureEditForm(page, pageName);
    await captureViewDialog(page, pageName);
    await captureDeleteDialog(page, pageName);
    await captureFilters(page, pageName);
  }
}

async function captureTabs(page, tabTexts, baseName) {
  for (let i = 0; i < tabTexts.length; i++) {
    const tabText = tabTexts[i];
    try {
      const tab = await page.$(`button[role="tab"]:has-text("${tabText}")`);
      if (!tab) {
        // Try with link or other selectors
        const altTab = await page.$(`[role="tab"]:has-text("${tabText}")`);
        if (altTab) {
          await altTab.click();
        } else continue;
      } else {
        await tab.click();
      }
      await page.waitForTimeout(2500);
      await screenshot(page, `${baseName}-tab-${i + 1}`);
    } catch (e) {
      console.log(`  ⚠️ Tab "${tabText}" not found`);
    }
  }
}

// ─── MAIN ──────────────────────────────────────────────────────────

(async () => {
  console.log("🚀 PharmaLove Suite - Visual Showcase Walkthrough");
  console.log("=".repeat(50));

  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: {
      dir: VIDEO_DIR,
      size: VIEWPORT,
    },
    locale: "ar-SA",
  });

  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  try {
    // ═══════════════════════════════════════════
    // 1. LOGIN PAGE
    // ═══════════════════════════════════════════
    console.log("\n🔐 LOGIN PAGE");
    await page.goto(`${BASE_URL}/auth`, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // Ensure Arabic language
    const langBtn = await page.$('button:has-text("العربية")');
    if (langBtn) {
      // Page is in English, switch to Arabic
      await langBtn.click();
      await page.waitForTimeout(2000);
    }

    await screenshot(page, "login");

    // Fill in credentials
    await page.fill("input#email", CREDENTIALS.email);
    await page.fill("input#password", CREDENTIALS.password);
    await page.waitForTimeout(1000);
    await screenshot(page, "login-filled");

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    await page.waitForLoadState("networkidle").catch(() => {});

    console.log(`  Current URL: ${page.url()}`);

    // ═══════════════════════════════════════════
    // 2. DASHBOARD
    // ═══════════════════════════════════════════
    console.log("\n📊 DASHBOARD");
    await page
      .goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle", timeout: 15000 })
      .catch(() => {});
    await page.waitForTimeout(5000); // Wait for charts
    await page.evaluate(() => window.scrollTo(0, 0));
    await screenshot(page, "dashboard");

    // Scroll to see charts at bottom
    const dashHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    if (dashHeight > VIEWPORT.height + 100) {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
      await page.waitForTimeout(2000);
      await screenshot(page, "dashboard-middle");

      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(2000);
      await screenshot(page, "dashboard-bottom");

      await page.evaluate(() => window.scrollTo(0, 0));
    }

    // ═══════════════════════════════════════════
    // 3. POS
    // ═══════════════════════════════════════════
    console.log("\n🛒 POS");
    await navigateAndCapture(page, "/pos", "pos", { skipForms: true });

    // Try to open payment dropdown or other interactive elements
    try {
      const payDropdown =
        (await page.$('button:has-text("نقدي")')) ||
        (await page.$('button:has-text("طريقة الدفع")'));
      if (payDropdown) {
        await payDropdown.click();
        await page.waitForTimeout(1500);
        await screenshot(page, "pos-payment-dropdown");
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
      }
    } catch (e) {}

    // ═══════════════════════════════════════════
    // 4. INVENTORY
    // ═══════════════════════════════════════════
    console.log("\n📦 INVENTORY");
    await navigateAndCapture(page, "/inventory", "inventory");

    // ═══════════════════════════════════════════
    // 5. PURCHASES
    // ═══════════════════════════════════════════
    console.log("\n🚚 PURCHASES");
    await navigateAndCapture(page, "/purchases", "purchases");

    // Check for tabs
    try {
      await captureTabs(page, ["طلبات الشراء", "فواتير الشراء", "أرصدة الموردين"], "purchases");
    } catch (e) {}

    // ═══════════════════════════════════════════
    // 6. SUPPLIERS
    // ═══════════════════════════════════════════
    console.log("\n🏢 SUPPLIERS");
    await navigateAndCapture(page, "/suppliers", "suppliers");

    // ═══════════════════════════════════════════
    // 7. CUSTOMERS
    // ═══════════════════════════════════════════
    console.log("\n👥 CUSTOMERS");
    await navigateAndCapture(page, "/customers", "customers");

    // ═══════════════════════════════════════════
    // 8. PRESCRIPTIONS
    // ═══════════════════════════════════════════
    console.log("\n📋 PRESCRIPTIONS");
    await navigateAndCapture(page, "/prescriptions", "prescriptions");

    // ═══════════════════════════════════════════
    // 9. RETURNS
    // ═══════════════════════════════════════════
    console.log("\n↩️ RETURNS");
    await navigateAndCapture(page, "/returns", "returns");

    // ═══════════════════════════════════════════
    // 10. STOCK TAKE
    // ═══════════════════════════════════════════
    console.log("\n📋 STOCK TAKE");
    await navigateAndCapture(page, "/stock-take", "stock-take");

    // ═══════════════════════════════════════════
    // 11. TRANSFERS
    // ═══════════════════════════════════════════
    console.log("\n🔄 TRANSFERS");
    await navigateAndCapture(page, "/transfers", "transfers");

    // ═══════════════════════════════════════════
    // 12. PHARMACIST
    // ═══════════════════════════════════════════
    console.log("\n💊 PHARMACIST");
    await navigateAndCapture(page, "/pharmacist", "pharmacist", { skipForms: true });

    // Capture tabs
    try {
      await captureTabs(
        page,
        ["فحص التداخلات", "مستشار الجرعات", "فحص الحساسية", "متتبع إعادة الصرف"],
        "pharmacist",
      );
    } catch (e) {}

    // ═══════════════════════════════════════════
    // 13. FINANCE
    // ═══════════════════════════════════════════
    console.log("\n💰 FINANCE");
    await navigateAndCapture(page, "/finance", "finance");

    // ═══════════════════════════════════════════
    // 14. REPORTS
    // ═══════════════════════════════════════════
    console.log("\n📈 REPORTS");
    await navigateAndCapture(page, "/reports", "reports", { skipForms: true });

    // Scroll through reports
    const reportsHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    if (reportsHeight > VIEWPORT.height + 100) {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
      await page.waitForTimeout(2000);
      await screenshot(page, "reports-middle");

      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(2000);
      await screenshot(page, "reports-bottom");

      await page.evaluate(() => window.scrollTo(0, 0));
    }

    // ═══════════════════════════════════════════
    // 15. ALERTS
    // ═══════════════════════════════════════════
    console.log("\n🔔 ALERTS");
    await navigateAndCapture(page, "/alerts", "alerts");

    // ═══════════════════════════════════════════
    // 16. BACKUP
    // ═══════════════════════════════════════════
    console.log("\n💾 BACKUP");
    await navigateAndCapture(page, "/backup", "backup", { skipForms: true });

    // ═══════════════════════════════════════════
    // 17. BARCODE
    // ═══════════════════════════════════════════
    console.log("\n🏷️ BARCODE");
    await navigateAndCapture(page, "/barcode", "barcode", { skipForms: true });

    // ═══════════════════════════════════════════
    // 18. SALES HISTORY
    // ═══════════════════════════════════════════
    console.log("\n📜 SALES HISTORY");
    await navigateAndCapture(page, "/sales", "sales");

    // Try opening date picker
    try {
      const dateBtn =
        (await page.$("button:has(svg.lucide-calendar)")) ||
        (await page.$('button:has-text("التاريخ")'));
      if (dateBtn) {
        await dateBtn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, "sales-date-picker");
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
      }
    } catch (e) {}

    // ═══════════════════════════════════════════
    // 19. SETTINGS
    // ═══════════════════════════════════════════
    console.log("\n⚙️ SETTINGS");
    await navigateAndCapture(page, "/settings", "settings", { skipForms: true });

    // Capture tabs
    try {
      await captureTabs(page, ["معلومات الصيدلية", "الضرائب", "الطباعة"], "settings");
    } catch (e) {}

    // ═══════════════════════════════════════════
    // 20. STAFF
    // ═══════════════════════════════════════════
    console.log("\n👤 STAFF");
    await navigateAndCapture(page, "/staff", "staff");

    // ═══════════════════════════════════════════
    // DONE
    // ═══════════════════════════════════════════
    console.log("\n" + "=".repeat(50));
    console.log(`✅ WALKTHROUGH COMPLETE!`);
    console.log(`📸 Total screenshots: ${screenshotCounter}`);
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);

    // Generate index file
    const files = fs
      .readdirSync(SCREENSHOTS_DIR)
      .filter((f) => f.endsWith(".png"))
      .sort();

    let index = "# PharmaLove Suite - Screenshot Index\n\n";
    index += `Generated: ${new Date().toISOString()}\n\n`;
    index += `Total screenshots: ${files.length}\n\n`;
    index += "| # | Filename | Description |\n";
    index += "|---|----------|-------------|\n";

    for (const file of files) {
      const num = file.split("-")[0];
      const desc = file.replace(/^\d+-/, "").replace(".png", "").replace(/-/g, " ");
      index += `| ${num} | ${file} | ${desc} |\n`;
    }

    fs.writeFileSync(path.join(SCREENSHOTS_DIR, "INDEX.md"), index);
    console.log(`📋 Index saved to: ${path.join(SCREENSHOTS_DIR, "INDEX.md")}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await screenshot(page, "error-state").catch(() => {});
  } finally {
    // Close and save video
    await page.waitForTimeout(2000);
    await context.close();
    await browser.close();

    // Rename video file
    const videoFiles = fs.readdirSync(VIDEO_DIR).filter((f) => f.endsWith(".webm"));
    if (videoFiles.length > 0) {
      const latestVideo = videoFiles.sort().pop();
      console.log(`🎬 Video saved: ${path.join(VIDEO_DIR, latestVideo)}`);
    }
  }
})();
