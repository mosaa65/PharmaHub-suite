import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "screenshots");
const EDGE = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = 9333;
const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false };
const BASE = "http://127.0.0.1:8080";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function globToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const rx = "^" + escaped.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*") + "$";
  return new RegExp(rx);
}

class CdpConnection {
  constructor(wsUrl) {
    console.log("ws", wsUrl);
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.events = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.onopen = () => {
        console.log("ws open");
        resolve();
      };
      this.ws.onerror = (err) => {
        console.log("ws error", err?.message || err);
        reject(err);
      };
      this.ws.onclose = (ev) => {
        console.log("ws close", ev.code, ev.reason);
      };
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id) {
        const p = this.pending.get(msg.id);
        if (p) {
          this.pending.delete(msg.id);
          if (msg.error) p.reject(new Error(msg.error.message || "CDP error"));
          else p.resolve(msg.result);
        }
        return;
      }
      const handlers = this.events.get(msg.method) || [];
      for (const h of handlers) h(msg.params || {});
    };
  }

  on(method, handler) {
    const list = this.events.get(method) || [];
    list.push(handler);
    this.events.set(method, list);
  }

  async send(method, params = {}, sessionId) {
    await this.ready;
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return await new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

class PageShim {
  constructor(cdp, sessionId) {
    this.cdp = cdp;
    this.sessionId = sessionId;
    this.currentUrl = "about:blank";
    this.pending = new Set();
    this.loadEvent = false;
    this.routeHandlers = [];
    this.fetchEnabled = false;
    this.currentTitle = "";

    cdp.on("Network.requestWillBeSent", ({ requestId, request, type }) => {
      if (type === "Document" || type === "XHR" || type === "Fetch") this.pending.add(requestId);
    });
    cdp.on("Network.loadingFinished", ({ requestId }) => this.pending.delete(requestId));
    cdp.on("Network.loadingFailed", ({ requestId }) => this.pending.delete(requestId));
    cdp.on("Page.loadEventFired", () => {
      this.loadEvent = true;
    });
    cdp.on("Fetch.requestPaused", async (params) => {
      const url = params.request.url;
      const matched = this.routeHandlers.find((r) => r.rx.test(url));
      const route = {
        request: () => ({
          url: () => url,
          method: () => params.request.method,
          postDataJSON: () => {
            if (!params.request.postData) return {};
            try {
              return JSON.parse(params.request.postData);
            } catch {
              return {};
            }
          },
        }),
        fulfill: async ({ status = 200, headers = {}, body = "" }) => {
          const raw = typeof body === "string" ? body : JSON.stringify(body);
          await this.cdp.send(
            "Fetch.fulfillRequest",
            {
              requestId: params.requestId,
              responseCode: status,
              responseHeaders: Object.entries(headers).map(([name, value]) => ({
                name,
                value: String(value),
              })),
              body: Buffer.from(raw).toString("base64"),
            },
            this.sessionId,
          );
        },
        continue: async () => {
          await this.cdp.send(
            "Fetch.continueRequest",
            { requestId: params.requestId },
            this.sessionId,
          );
        },
      };

      if (matched) {
        await matched.handler(route);
      } else {
        await route.continue();
      }
    });
  }

  async init() {
    await this.cdp.send("Page.enable", {}, this.sessionId);
    await this.cdp.send("Runtime.enable", {}, this.sessionId);
    await this.cdp.send("Network.enable", {}, this.sessionId);
    await this.cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*" }] }, this.sessionId);
    await this.cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { ...VIEWPORT, screenOrientation: { type: "portraitPrimary", angle: 0 } },
      this.sessionId,
    );
  }

  async route(pattern, handler) {
    console.log("route", pattern);
    this.routeHandlers.push({ rx: globToRegExp(pattern), handler });
  }

  async evaluate(fn, arg) {
    console.log("evaluate");
    const expr = `(${fn.toString()})((${JSON.stringify(arg) ?? "undefined"}))`;
    const res = await this.cdp.send(
      "Runtime.evaluate",
      { expression: expr, awaitPromise: true, returnByValue: true },
      this.sessionId,
    );
    return res.result?.value;
  }

  async goto(url) {
    console.log("goto", url);
    this.loadEvent = false;
    this.pending.clear();
    await this.cdp.send("Page.navigate", { url }, this.sessionId);
    this.currentUrl = url;
  }

  async waitForLoadState(state = "networkidle") {
    console.log("waitForLoadState", state);
    if (state !== "networkidle") return;
    let quietSince = Date.now();
    for (;;) {
      if (this.pending.size === 0 && this.loadEvent) {
        if (Date.now() - quietSince > 1200) return;
      } else {
        quietSince = Date.now();
      }
      await sleep(250);
    }
  }

  async waitForTimeout(ms) {
    console.log("waitForTimeout", ms);
    await sleep(ms);
  }

  async url() {
    return this.currentUrl;
  }

  async title() {
    const res = await this.cdp.send(
      "Runtime.evaluate",
      { expression: "document.title", returnByValue: true },
      this.sessionId,
    );
    return res.result?.value || "";
  }

  async screenshot(filePath) {
    const res = await this.cdp.send(
      "Page.captureScreenshot",
      { format: "png", fromSurface: true },
      this.sessionId,
    );
    await writeFile(filePath, Buffer.from(res.data, "base64"));
  }

  async clickText(text) {
    const res = await this.cdp.send(
      "Runtime.evaluate",
      {
        returnByValue: true,
        awaitPromise: false,
        expression: `(() => {
          const visible = (el) => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return s && s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0' && r.width > 0 && r.height > 0;
          };
          const candidates = [...document.querySelectorAll('button, [role="button"], a, [role="option"], [data-radix-select-item], [data-state], input[type="submit"]')];
          const target = candidates.find((el) => visible(el) && ((el.innerText || el.textContent || '').trim().includes(${JSON.stringify(text)})));
          if (target) { target.click(); return true; }
          return false;
        })()`,
      },
      this.sessionId,
    );
    return Boolean(res.result?.value);
  }

  async press(key) {
    await this.cdp.send(
      "Input.dispatchKeyEvent",
      {
        type: "keyDown",
        windowsVirtualKeyCode: key === "Escape" ? 27 : 13,
        nativeVirtualKeyCode: key === "Escape" ? 27 : 13,
        key,
      },
      this.sessionId,
    );
    await this.cdp.send(
      "Input.dispatchKeyEvent",
      {
        type: "keyUp",
        windowsVirtualKeyCode: key === "Escape" ? 27 : 13,
        nativeVirtualKeyCode: key === "Escape" ? 27 : 13,
        key,
      },
      this.sessionId,
    );
  }
}

async function startBrowser() {
  console.log("starting browser");
  const userDir = path.join(ROOT, `.tmp-showcase-${Date.now()}`);
  if (!existsSync(userDir)) await mkdir(userDir, { recursive: true });
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--disable-gpu-compositing",
    "--disable-software-rasterizer",
    "--disable-features=VizDisplayCompositor,UseSkiaRenderer,UseChromeOSDirectVideoDecoder",
    "--in-process-gpu",
    "--use-angle=swiftshader",
    "--use-gl=swiftshader",
    "--enable-unsafe-swiftshader",
    "--start-maximized",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1440,900",
    "--force-device-scale-factor=1",
    `${BASE}/dashboard`,
  ];
  const proc = spawn(EDGE, args, { stdio: ["ignore", "pipe", "pipe"], detached: true });
  proc.stdout.on("data", (d) => process.stdout.write(d.toString()));
  proc.stderr.on("data", (d) => process.stdout.write(d.toString()));
  proc.unref();
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (res.ok) {
        console.log("browser ready");
        return { proc };
      }
    } catch {}
    await sleep(250);
  }
  throw new Error("Edge CDP did not start");
}

async function connectPage() {
  console.log("connecting");
  const version = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`).then((r) => r.json());
  console.log("version", version.webSocketDebuggerUrl);
  const cdp = new CdpConnection(version.webSocketDebuggerUrl);
  await cdp.ready;
  const { targetInfos = [] } = await cdp.send("Target.getTargets");
  const existing = targetInfos.find((t) => t.type === "page") || targetInfos[0];
  if (!existing) throw new Error("No browser target found");
  const { sessionId } = await cdp.send("Target.attachToTarget", {
    targetId: existing.targetId,
    flatten: true,
  });
  const page = new PageShim(cdp, sessionId);
  await page.init();
  console.log("connected");
  return { cdp, page, targetId: existing.targetId, sessionId };
}

async function runSetup(page) {
  console.log("running setup");
  const setupSource = await readFile(path.join(ROOT, "scripts", "showcase-setup.mjs"), "utf8");
  const setupFn = eval(setupSource);
  try {
    await setupFn(page);
  } catch (err) {
    console.log("setup error", err?.stack || err);
    throw err;
  }
  await page.evaluate(() => {
    localStorage.setItem("lang", "en");
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    return true;
  });
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  console.log("setup done");
}

async function clickAndWait(page, text, timeout = 1000) {
  const ok = await page.clickText(text);
  if (!ok) throw new Error(`Could not find clickable text: ${text}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(timeout);
}

async function ensureTop(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    return true;
  });
}

async function capture(page, filename) {
  console.log("capture", filename);
  await ensureTop(page);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);
  await page.screenshot(path.join(OUT, filename));
}

async function closeDialog(page) {
  await page.press("Escape");
  await page.waitForTimeout(400);
}

async function main() {
  console.log("main start");
  await mkdir(OUT, { recursive: true });
  await startBrowser();
  const { page } = await connectPage();
  await runSetup(page);

  const shots = [];
  const shot = async (name) => {
    await capture(page, name);
    shots.push(name);
  };

  await page.goto(`${BASE}/stock-take`);
  await capture(page, "017-stock-take.png");
  shots.push("017-stock-take.png");

  await page.goto(`${BASE}/transfers`);
  await shot("018-transfers.png");
  await clickAndWait(page, "Add Warehouse", 1200);
  await capture(page, "019-transfer-add-warehouse.png");
  shots.push("019-transfer-add-warehouse.png");
  await closeDialog(page);
  await clickAndWait(page, "New Transfer", 1200);
  await capture(page, "020-transfer-new-transfer.png");
  shots.push("020-transfer-new-transfer.png");
  await closeDialog(page);

  await page.goto(`${BASE}/reports`);
  await shot("021-reports.png");

  await page.goto(`${BASE}/finance`);
  await shot("022-finance.png");

  for (const [tab, file] of [
    ["triage", "023-pharmacist-triage.png"],
    ["interactions", "024-pharmacist-interactions.png"],
    ["dosage", "025-pharmacist-dosage.png"],
    ["allergy", "026-pharmacist-allergy.png"],
    ["refill", "027-pharmacist-refill.png"],
  ]) {
    await page.goto(`${BASE}/pharmacist?tab=${tab}`);
    await capture(page, file);
    shots.push(file);
  }

  await page.goto(`${BASE}/prescriptions`);
  await shot("028-prescriptions.png");
  await clickAndWait(page, "New Prescription", 1000);
  await capture(page, "029-prescription-add.png");
  shots.push("029-prescription-add.png");
  await closeDialog(page);
  await clickAndWait(page, "Prescription Details", 1000);
  await capture(page, "030-prescription-detail.png");
  shots.push("030-prescription-detail.png");
  await closeDialog(page);

  await page.goto(`${BASE}/barcode`);
  await shot("031-barcode.png");
  await page.clickText("80mm").catch(() => {});
  await page.waitForTimeout(700);
  await capture(page, "032-barcode-size-dropdown.png");
  shots.push("032-barcode-size-dropdown.png");
  await closeDialog(page);

  await page.goto(`${BASE}/backup`);
  await shot("033-backup.png");
  await page.clickText("Full Backup");
  await page.waitForTimeout(1800);
  await capture(page, "034-backup-full.png");
  shots.push("034-backup-full.png");

  await page.goto(`${BASE}/alerts`);
  await shot("035-alerts.png");

  await page.goto(`${BASE}/settings?tab=pharmacy`);
  await shot("036-settings-pharmacy.png");
  await page.goto(`${BASE}/settings?tab=tax`);
  await shot("037-settings-tax.png");
  await page.goto(`${BASE}/settings?tab=print`);
  await shot("038-settings-print.png");
  await page.clickText("80mm").catch(() => {});
  await page.waitForTimeout(700);
  await capture(page, "039-settings-print-dropdown.png");
  shots.push("039-settings-print-dropdown.png");
  await closeDialog(page);

  await page.goto(`${BASE}/staff`);
  await shot("040-staff.png");

  await page.goto(`${BASE}/inventory`);
  await shot("041-inventory.png");
  await page.clickText("Add Product");
  await capture(page, "042-inventory-add-product.png");
  shots.push("042-inventory-add-product.png");
  await closeDialog(page);
  await page.clickText("Batches").catch(async () => {
    await page.clickText("Batches");
  });
  await page.waitForTimeout(1000);
  await capture(page, "043-inventory-batches.png");
  shots.push("043-inventory-batches.png");
  await page.clickText("Add Batch");
  await capture(page, "044-inventory-add-batch.png");
  shots.push("044-inventory-add-batch.png");
  await closeDialog(page);

  await writeFile(
    path.join(ROOT, "screenshots", "index.md"),
    shots.map((s, i) => `${String(i + 1).padStart(3, "0")}. ${s}`).join("\n"),
    "utf8",
  );
  console.log("done");
}

main().catch(async (err) => {
  console.error("fatal", err);
  await writeFile(path.join(ROOT, "showcase-error.log"), `${err.stack || err}\n`, "utf8").catch(
    () => {},
  );
  process.exitCode = 1;
});
