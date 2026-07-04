import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart, Search, Plus, Minus, Trash2, Receipt, Printer, ScanLine, Sparkles, ShieldAlert, Building2,
  Camera,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { printReceipt, getPaperSize, setPaperSize, type PaperSize, type ReceiptData } from "@/lib/print-receipt";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Html5Qrcode } from "html5-qrcode";

export const Route = createFileRoute("/_authenticated/pos")({
  component: POS,
});

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  max: number;
}

// Points config: 1 point per currency unit spent. 10 points = 1 currency unit redeemable.
const POINTS_PER_UNIT = 1;
const POINT_VALUE = 0.1;

function POS() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [payment, setPayment] = useState<"cash" | "credit" | "insurance">("cash");
  const [customerId, setCustomerId] = useState<string>("walk-in");
  const [paper, setPaper] = useState<PaperSize>("80mm");
  const [lastSale, setLastSale] = useState<ReceiptData | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [insuranceCopay, setInsuranceCopay] = useState(20); // default 20% patient pays
  const scanBufferRef = useRef<{ buf: string; last: number }>({ buf: "", last: 0 });
  const cameraRef = useRef<Html5Qrcode | null>(null);
  const cameraContainerId = "pos-camera-reader";

  useEffect(() => { setPaper(getPaperSize()); }, []);
  const onPaperChange = (v: PaperSize) => { setPaper(v); setPaperSize(v); };

  const { data: products = [] } = useQuery({
    queryKey: ["pos-products", search],
    queryFn: async () => {
      let q = supabase.from("products").select("id, name, price, quantity, barcode").gt("quantity", 0).order("name").limit(40);
      if (search) q = q.or(`name.ilike.%${search}%,barcode.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["pos-customers"],
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("id, name, points").order("name").limit(200);
      return data ?? [];
    },
  });

  // Fetch customer allergies when a specific customer is selected
  const { data: customerAllergies = [] } = useQuery({
    queryKey: ["customer-allergies", customerId],
    enabled: customerId !== "walk-in",
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_allergies")
        .select("allergen")
        .eq("customer_id", customerId);
      return (data ?? []).map((a: any) => a.allergen?.toLowerCase() ?? "");
    },
  });

  // Real-time allergy check: scan cart product names against customer allergens
  const allergyAlerts = useMemo(() => {
    if (!customerAllergies.length || !cart.length) return [];
    return cart
      .filter((item) =>
        customerAllergies.some((allergen) => item.name.toLowerCase().includes(allergen))
      )
      .map((item) => item.name);
  }, [cart, customerAllergies]);

  const selectedCustomer = useMemo(
    () => customers.find((c: any) => c.id === customerId),
    [customers, customerId],
  );

  const addToCart = (p: any) => {
    setCart((c) => {
      const existing = c.find((i) => i.id === p.id);
      if (existing) {
        if (existing.quantity >= p.quantity) {
          toast.warning(lang === "ar" ? "الحد الأقصى للمخزون" : "Stock limit reached");
          return c;
        }
        return c.map((i) => (i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...c, { id: p.id, name: p.name, price: Number(p.price), quantity: 1, max: p.quantity }];
    });
  };

  // Barcode lookup by exact match (scanner or manual entry+enter)
  const lookupAndAdd = async (code: string) => {
    const clean = code.trim();
    if (!clean) return;
    const { data } = await supabase
      .from("products")
      .select("id, name, price, quantity, barcode")
      .eq("barcode", clean)
      .maybeSingle();
    if (data && data.quantity > 0) {
      addToCart(data);
      toast.success(`✓ ${data.name}`, { duration: 1200 });
    } else {
      toast.error(lang === "ar" ? `لم يُعثر على: ${clean}` : `Not found: ${clean}`);
    }
  };

  const openCamera = () => setCameraOpen(true);

  const closeCamera = async () => {
    setCameraOpen(false);
    try {
      await cameraRef.current?.stop();
    } catch {
      // ignored: stopping can fail when the stream is already inactive
    }
    cameraRef.current = null;
  };

  useEffect(() => {
    if (!cameraOpen) return;
    let active = true;
    const start = async () => {
      try {
        const instance = new Html5Qrcode(cameraContainerId);
        cameraRef.current = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText) => {
            if (!active) return;
            await closeCamera();
            await lookupAndAdd(decodedText);
          },
          () => undefined,
        );
      } catch (error: any) {
        toast.error(error?.message ?? (lang === "ar" ? "تعذر تشغيل الكاميرا" : "Camera could not start"));
        setCameraOpen(false);
      }
    };
    void start();
    return () => {
      active = false;
      void cameraRef.current?.stop().catch(() => undefined);
      cameraRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen]);

  // Global keystroke listener for hardware barcode scanners (rapid keys + Enter)
  useEffect(() => {
    if (!scanMode) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const now = Date.now();
      if (now - scanBufferRef.current.last > 100) scanBufferRef.current.buf = "";
      scanBufferRef.current.last = now;
      if (e.key === "Enter") {
        const code = scanBufferRef.current.buf;
        scanBufferRef.current.buf = "";
        if (code.length >= 4) lookupAndAdd(code);
      } else if (e.key.length === 1) {
        scanBufferRef.current.buf += e.key;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanMode]);

  const updateQty = (id: string, delta: number) => {
    setCart((c) =>
      c.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, Math.min(i.max, i.quantity + delta)) } : i))
        .filter((i) => i.quantity > 0),
    );
  };

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const pointsDiscount = pointsUsed * POINT_VALUE;
  const total = Math.max(0, subtotal - discount - pointsDiscount + tax);
  const pointsToEarn = Math.floor(total * POINTS_PER_UNIT);

  const availablePoints = selectedCustomer?.points ?? 0;
  const maxRedeemable = Math.min(availablePoints, Math.floor(subtotal / POINT_VALUE));

  const useAllPoints = () => setPointsUsed(maxRedeemable);

  // Reset points when customer changes
  useEffect(() => { setPointsUsed(0); }, [customerId]);

  const buildReceipt = (invoiceNo: string | number, items: CartItem[]): ReceiptData => ({
    storeName: t("appName"),
    storeTagline: t("appTagline"),
    invoiceNo,
    date: new Date(),
    cashierName: user?.email ?? undefined,
    customerName: customerId === "walk-in" ? t("walkIn") : selectedCustomer?.name,
    items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
    subtotal,
    discount: discount + pointsDiscount,
    tax,
    total,
    paid: payment === "cash" ? total : 0,
    paymentMethod: payment === "cash" ? t("cash") : t("credit"),
    currency: t("currency"),
    lang,
  });

  const completeSale = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error(t("emptyCart"));
      const saleInsert = {
        customer_id: customerId === "walk-in" ? null : customerId,
        cashier_id: user?.id,
        subtotal,
        discount: discount + pointsDiscount,
        tax,
        total,
        paid: payment === "cash" ? total : 0,
        payment_method: payment,
        status: "completed",
      };
      // Insurance billing: override payment info
      const insuranceCoverageAmount = payment === "insurance"
        ? total * ((100 - insuranceCopay) / 100)
        : 0;
      const patientAmount = payment === "insurance"
        ? total * (insuranceCopay / 100)
        : (payment === "cash" ? total : 0);

      const saleInsertWithInsurance = {
        ...saleInsert,
        paid: patientAmount,
        payment_method: payment,
        insurance_company: payment === "insurance" ? insuranceCompany : null,
        insurance_copay: payment === "insurance" ? insuranceCopay : null,
        insurance_amount: payment === "insurance" ? insuranceCoverageAmount : 0,
      };

      const { data: sale, error } = await supabase.from("sales").insert(saleInsertWithInsurance).select().single();
      if (error) throw error;

      const items = cart.map((i) => ({
        sale_id: sale.id,
        product_id: i.id,
        product_name: i.name,
        quantity: i.quantity,
        price: i.price,
        discount: 0,
      }));
      const { error: itemsErr } = await supabase.from("sale_items").insert(items);
      if (itemsErr) throw itemsErr;

      // FEFO: Deduct from batches first (nearest expiry), then product quantity
      for (const i of cart) {
        let remaining = i.quantity;
        // Fetch batches ordered by expiry (FEFO)
        const { data: batches } = await supabase
          .from("product_batches")
          .select("*")
          .eq("product_id", i.id)
          .gt("quantity", 0)
          .order("expiry_date", { ascending: true, nullsFirst: false });

        if (batches && batches.length > 0) {
          for (const batch of batches) {
            if (remaining <= 0) break;
            const deduct = Math.min(batch.quantity, remaining);
            await supabase
              .from("product_batches")
              .update({ quantity: batch.quantity - deduct })
              .eq("id", batch.id);
            remaining -= deduct;
          }
        }
        // Update product total quantity
        await supabase.from("products").update({ quantity: i.max - i.quantity }).eq("id", i.id);
      }

      // Loyalty: adjust customer points (deduct used, add earned)
      let earned = 0;
      if (customerId !== "walk-in" && selectedCustomer) {
        const newPoints = Math.max(0, availablePoints - pointsUsed) + pointsToEarn;
        earned = pointsToEarn;
        await supabase.from("customers").update({ points: newPoints }).eq("id", customerId);
      }

      return { invoiceNo: (sale as any).invoice_number ?? String(sale.id).slice(0, 8), items: [...cart], earned };
    },
    onSuccess: (result) => {
      toast.success(t("saleCompleted"));
      if (result.earned > 0) {
        toast.success(`✨ ${t("pointsEarned")}: ${result.earned}`, { duration: 2500 });
      }
      const receipt = buildReceipt(result.invoiceNo, result.items);
      setLastSale(receipt);
      printReceipt(receipt, paper);
      setCart([]);
      setDiscount(0);
      setTax(0);
      setPointsUsed(0);
      setInsuranceCompany("");
      setInsuranceCopay(20);
      qc.invalidateQueries({ queryKey: ["pos-products"] });
      qc.invalidateQueries({ queryKey: ["pos-customers"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: any) => toast.error(e?.message ?? t("error")),
  });


  const fmt = (n: number) => `${n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { minimumFractionDigits: 2 })} ${t("currency")}`;

  return (
    <div>
      <PageHeader title={t("pos")} icon={<ShoppingCart className="h-5 w-5" />} />

      <div className="grid lg:grid-cols-[1fr_420px] gap-4 lg:gap-6">
        <div>
          <Card className="p-4">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`${t("search")}: ${t("name")} / ${t("barcode")}`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && search.trim()) {
                      lookupAndAdd(search.trim());
                      setSearch("");
                    }
                  }}
                  className="ps-10 h-9 sm:h-11"
                  autoFocus
                />
              </div>
              <Button
                variant={scanMode ? "default" : "outline"}
                onClick={() => setScanMode((s) => !s)}
                className="h-9 sm:h-11 gap-2"
                title={t("scanMode")}
              >
                <ScanLine className="h-4 w-4" />
                <span className="hidden sm:inline">{t("scanMode")}</span>
              </Button>
              <Button
                variant="outline"
                onClick={openCamera}
                className="h-9 sm:h-11 gap-2"
                title={lang === "ar" ? "فتح الكاميرا" : "Open camera"}
              >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">{lang === "ar" ? "فتح الكاميرا" : "Open camera"}</span>
              </Button>
            </div>
            {scanMode && (
              <div className="mb-3 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs text-primary font-medium flex items-center gap-2 animate-pulse">
                <ScanLine className="h-3.5 w-3.5" /> {t("scanModeOn")}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {products.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="text-start rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-soft transition p-3 group"
                >
                  <div className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary">{p.name}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-primary">{fmt(Number(p.price))}</span>
                    <span className="text-muted-foreground">×{p.quantity}</span>
                  </div>
                </button>
              ))}
              {products.length === 0 && (
                <div className="col-span-full text-center text-sm text-muted-foreground py-12">{t("noData")}</div>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-5 flex flex-col h-fit lg:sticky lg:top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Receipt className="h-4 w-4" /> {t("cart")}
            </h3>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-destructive">
                {t("delete")}
              </button>
            )}
          </div>

          {/* Allergy Alert Banner */}
          {allergyAlerts.length > 0 && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-400/50 bg-rose-50 dark:bg-rose-900/20 p-3 animate-fade-in">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-700 dark:text-rose-400">{t("allergyWarning")}</p>
                <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5">{allergyAlerts.join("، ")}</p>
              </div>
            </div>
          )}

          <div className="space-y-2 mb-4 max-h-[40vh] overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("emptyCart")}</p>
            ) : (
              cart.map((i) => (
                <div key={i.id} className="flex items-center gap-2 rounded-xl bg-muted/40 p-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{fmt(i.price)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(i.id, -1)} className="grid h-7 w-7 place-items-center rounded-md bg-card hover:bg-accent">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-7 text-center text-sm font-bold">{i.quantity}</span>
                    <button onClick={() => updateQty(i.id, 1)} className="grid h-7 w-7 place-items-center rounded-md bg-card hover:bg-accent">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => setCart((c) => c.filter((x) => x.id !== i.id))}
                    className="grid h-7 w-7 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <div>
              <Label className="text-xs">{t("customer")}</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">{t("walkIn")}</SelectItem>
                  {customers.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.points > 0 ? `· ${c.points}★` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {customerId !== "walk-in" && availablePoints > 0 && (
              <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-primary font-semibold">
                    <Sparkles className="h-3.5 w-3.5" /> {t("availablePoints")}
                  </span>
                  <Badge variant="secondary" className="font-bold">{availablePoints}★</Badge>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-[10px] text-muted-foreground">{t("usePoints")} (max {maxRedeemable})</Label>
                    <Input
                      type="number"
                      min="0"
                      max={maxRedeemable}
                      value={pointsUsed}
                      onChange={(e) => setPointsUsed(Math.max(0, Math.min(maxRedeemable, Number(e.target.value))))}
                      className="h-8 mt-0.5"
                    />
                  </div>
                  <Button size="sm" variant="outline" className="h-8" onClick={useAllPoints} disabled={maxRedeemable === 0}>
                    {lang === "ar" ? "الكل" : "All"}
                  </Button>
                </div>
                {pointsUsed > 0 && (
                  <div className="text-[11px] text-success font-semibold">
                    -{fmt(pointsDiscount)}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">{t("discount")}</Label>
                <Input type="number" min="0" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">{t("tax")}</Label>
                <Input type="number" min="0" value={tax} onChange={(e) => setTax(Number(e.target.value))} className="h-9 mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">{t("paymentMethod")}</Label>
                <Select value={payment} onValueChange={(v: any) => setPayment(v)}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t("cash")}</SelectItem>
                    <SelectItem value="credit">{t("credit")}</SelectItem>
                    <SelectItem value="insurance">{t("insurance")} 🏥</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{lang === "ar" ? "حجم الطابعة" : "Printer"}</Label>
                <Select value={paper} onValueChange={(v: any) => onPaperChange(v)}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm</SelectItem>
                    <SelectItem value="80mm">80mm</SelectItem>
                    <SelectItem value="a4">A4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Insurance fields */}
            {payment === "insurance" && (
              <div className="rounded-xl border border-blue-400/40 bg-blue-50 dark:bg-blue-900/20 p-3 space-y-2">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> {t("insuranceClaim")}
                </p>
                <div>
                  <Label className="text-[10px] text-muted-foreground">{t("insuranceCompany")}</Label>
                  <input
                    value={insuranceCompany}
                    onChange={(e) => setInsuranceCompany(e.target.value)}
                    placeholder={lang === "ar" ? "شركة التأمين" : "Insurance Company"}
                    className="w-full h-8 rounded-lg border border-border bg-background px-3 text-sm mt-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">{t("insuranceCopay")} — {t("patientPays")} {insuranceCopay}%</Label>
                  <input
                    type="number" min="0" max="100"
                    value={insuranceCopay}
                    onChange={(e) => setInsuranceCopay(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="w-full h-8 rounded-lg border border-border bg-background px-3 text-sm mt-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-lg bg-card text-center">
                    <p className="text-muted-foreground">{t("patientPays")}</p>
                    <p className="font-bold text-primary">{fmt(total * (insuranceCopay / 100))}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-card text-center">
                    <p className="text-muted-foreground">{t("insuranceClaim")}</p>
                    <p className="font-bold text-blue-600">{fmt(total * ((100 - insuranceCopay) / 100))}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1 text-sm pt-2">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("subtotal")}</span><span>{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-destructive"><span className="text-muted-foreground">{t("discount")}</span><span>-{fmt(discount + pointsDiscount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("tax")}</span><span>+{fmt(tax)}</span></div>
              <div className="flex justify-between font-extrabold text-lg pt-2 border-t border-border"><span>{t("total")}</span><span className="text-primary">{fmt(total)}</span></div>
              {customerId !== "walk-in" && pointsToEarn > 0 && (
                <div className="flex justify-between text-xs text-primary pt-1">
                  <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> {t("pointsEarned")}</span>
                  <span className="font-bold">+{pointsToEarn}★</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => completeSale.mutate()} disabled={cart.length === 0 || completeSale.isPending} className="flex-1 h-11 font-bold">
                {t("completeSale")}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11"
                title={lang === "ar" ? "إعادة طباعة آخر فاتورة" : "Reprint last receipt"}
                disabled={!lastSale}
                onClick={() => lastSale && printReceipt(lastSale, paper)}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={cameraOpen} onOpenChange={(open) => (open ? setCameraOpen(true) : void closeCamera())}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              {lang === "ar" ? "مسح الباركود بالكاميرا" : "Scan barcode with camera"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-black overflow-hidden">
              <div id={cameraContainerId} className="min-h-[320px] w-full" />
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{lang === "ar" ? "وجّه الكاميرا نحو الباركود" : "Point the camera at the barcode"}</span>
              <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => void closeCamera()}>
                <X className="h-4 w-4" />
                {t("close")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
