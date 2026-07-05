import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Undo2, Search, RotateCcw, PackageSearch, ScanLine, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/returns")({
  component: Returns,
});

function Returns() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [quickSearch, setQuickSearch] = useState("");
  const [quickQty, setQuickQty] = useState(1);
  const [quickProductId, setQuickProductId] = useState<string | null>(null);
  const [quickReason, setQuickReason] = useState("");
  const [mode, setMode] = useState<"invoice" | "quick">("invoice");
  const [expandedReturnId, setExpandedReturnId] = useState<string | null>(null);

  const fmt = (n: number) =>
    `${Number(n).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")} ${t("currency")}`;

  const { data: sales = [] } = useQuery({
    queryKey: ["sales-for-returns", search],
    queryFn: async () => {
      let q = supabase
        .from("sales")
        .select("id, total, created_at, customer_id, customers(name)")
        .order("created_at", { ascending: false })
        .limit(40);
      if (search) q = q.ilike("id", `%${search}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["sale-items", selectedSaleId],
    enabled: !!selectedSaleId,
    queryFn: async () => {
      const { data } = await supabase
        .from("sale_items")
        .select("id, product_id, quantity, unit_price, subtotal, products(name)")
        .eq("sale_id", selectedSaleId!);
      return data ?? [];
    },
  });

  const { data: recentReturns = [] } = useQuery({
    queryKey: ["recent-returns"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sale_returns")
        .select("id, sale_id, total_amount, reason, created_at, sale_return_items(quantity, unit_price, subtotal, products(name))")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const { data: quickProducts = [] } = useQuery({
    queryKey: ["quick-return-products", quickSearch],
    queryFn: async () => {
      let q = supabase.from("products").select("id, name, barcode, quantity, price").order("name").limit(30);
      if (quickSearch) q = q.or(`name.ilike.%${quickSearch}%,barcode.ilike.%${quickSearch}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const selectedQuickProduct = useMemo(
    () => quickProducts.find((p: any) => p.id === quickProductId) ?? null,
    [quickProducts, quickProductId],
  );

  const submit = useMutation({
    mutationFn: async () => {
      if (!selectedSaleId) throw new Error("No sale");
      const lines = items
        .map((it: any) => ({ it, q: Number(qtys[it.id] ?? 0) }))
        .filter((x) => x.q > 0 && x.q <= Number(x.it.quantity));
      if (!lines.length) throw new Error("Select quantities to return");

      const total = lines.reduce((s, x) => s + x.q * Number(x.it.unit_price), 0);
      const { data: ret, error } = await supabase
        .from("sale_returns")
        .insert({ sale_id: selectedSaleId, total_amount: total, reason })
        .select("id")
        .single();
      if (error) throw error;

      await supabase.from("sale_return_items").insert(
        lines.map((x) => ({
          return_id: ret.id,
          product_id: x.it.product_id,
          quantity: x.q,
          unit_price: Number(x.it.unit_price),
          subtotal: x.q * Number(x.it.unit_price),
        })),
      );

      for (const x of lines) {
        // 1. Update product total quantity
        const { data: p } = await supabase
          .from("products")
          .select("quantity")
          .eq("id", x.it.product_id)
          .single();
        if (p) {
          await supabase
            .from("products")
            .update({ quantity: Number(p.quantity ?? 0) + x.q })
            .eq("id", x.it.product_id);
        }

        // 2. Returns-to-Batch: restore to the most recent active batch
        // (latest expiry = safest to restore to, avoids contaminating expired batches)
        const { data: batches } = await supabase
          .from("product_batches")
          .select("id, quantity")
          .eq("product_id", x.it.product_id)
          .order("expiry_date", { ascending: false, nullsFirst: false })
          .limit(1);

        if (batches && batches.length > 0) {
          const batch = batches[0] as any;
          await supabase
            .from("product_batches")
            .update({ quantity: Number(batch.quantity) + x.q })
            .eq("id", batch.id);
        }
      }
    },
    onSuccess: () => {
      toast.success(t("success"));
      setSelectedSaleId(null);
      setQtys({});
      setReason("");
      setExpandedReturnId(null);
      qc.invalidateQueries({ queryKey: ["recent-returns"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => toast.error(e?.message ?? t("error")),
  });

  const quickSubmit = useMutation({
    mutationFn: async () => {
      if (!quickProductId) throw new Error("Select product");
      if (quickQty <= 0) throw new Error("Quantity required");
      const product = quickProducts.find((p: any) => p.id === quickProductId);
      if (!product) throw new Error("Product not found");
      const qty = Math.min(quickQty, Number(product.quantity ?? 0));
      const total = qty * Number(product.price ?? 0);
      const { data: ret, error } = await supabase
        .from("sale_returns")
        .insert({ sale_id: null, total_amount: total, reason: quickReason || null })
        .select("id")
        .single();
      if (error) throw error;
      await supabase.from("sale_return_items").insert({
        return_id: ret.id,
        product_id: product.id,
        quantity: qty,
        unit_price: Number(product.price ?? 0),
        subtotal: total,
      });
      await supabase.from("products").update({ quantity: Number(product.quantity ?? 0) + qty }).eq("id", product.id);
      const { data: batches } = await supabase.from("product_batches").select("id, quantity").eq("product_id", product.id).order("expiry_date", { ascending: false, nullsFirst: false }).limit(1);
      if (batches?.length) {
        const batch = batches[0] as any;
        await supabase.from("product_batches").update({ quantity: Number(batch.quantity) + qty }).eq("id", batch.id);
      }
    },
    onSuccess: () => {
      toast.success(t("success"));
      setQuickSearch("");
      setQuickQty(1);
      setQuickProductId(null);
      setQuickReason("");
      setExpandedReturnId(null);
      qc.invalidateQueries({ queryKey: ["recent-returns"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => toast.error(e?.message ?? t("error")),
  });

  return (
    <div>
      <PageHeader title={t("returns")} icon={<Undo2 className="h-5 w-5" />} />

      <Tabs value={mode} onValueChange={(v) => setMode(v as "invoice" | "quick")} className="space-y-4 mb-4">
        <TabsList className="bg-card/80 backdrop-blur border border-border/60 p-1 rounded-xl">
          <TabsTrigger value="invoice" className="rounded-lg gap-2">
            <ScanLine className="h-4 w-4" /> {t("invoice")}
          </TabsTrigger>
          <TabsTrigger value="quick" className="rounded-lg gap-2">
            <PackageSearch className="h-4 w-4" /> إرجاع سريع
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === "invoice" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-4">
          <div className="relative mb-3">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchInvoice")}
              className="ps-10"
            />
          </div>
          <div className="max-h-[480px] overflow-auto space-y-1.5">
            {sales.map((s: any) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSaleId(s.id);
                  setQtys({});
                }}
                className={`w-full text-start rounded-xl border p-3 transition ${
                  selectedSaleId === s.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex justify-between text-sm">
                  <span className="font-medium truncate">#{s.id.slice(0, 8)}</span>
                  <span className="font-semibold">{fmt(s.total)}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(s.created_at).toLocaleString()} ·{" "}
                  {s.customers?.name ?? t("walkIn")}
                </div>
              </button>
            ))}
            {!sales.length && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                {t("noData")}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          {!selectedSaleId ? (
            <div className="text-center text-muted-foreground py-16 text-sm">
              {t("selectInvoiceToReturn")}
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4 max-h-[360px] overflow-auto">
                {items.map((it: any) => (
                  <div
                    key={it.id}
                    className="flex items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{it.products?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {fmt(Number(it.unit_price))} × {Number(it.quantity)}
                      </div>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={Number(it.quantity)}
                      value={qtys[it.id] ?? ""}
                      onChange={(e) =>
                        setQtys({ ...qtys, [it.id]: Number(e.target.value) })
                      }
                      placeholder="0"
                      className="w-24 h-9"
                    />
                  </div>
                ))}
              </div>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("returnReason")}
                className="mb-3"
              />
              <Button
                onClick={() => submit.mutate()}
                disabled={submit.isPending}
                className="w-full gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {t("confirmReturn")}
              </Button>
            </>
          )}
        </Card>
        </div>
      ) : (
        <Card className="p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div>
              <div className="relative mb-3">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو الباركود"
                  className="ps-10"
                />
              </div>
              <div className="max-h-[380px] overflow-auto space-y-2">
                {quickProducts.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => setQuickProductId(p.id)}
                    className={`w-full text-start rounded-xl border p-3 transition ${
                      quickProductId === p.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{p.barcode ?? "—"}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{p.quantity}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="mb-1 block">المنتج المختار</Label>
                <Input value={selectedQuickProduct?.name ?? ""} readOnly placeholder="اختر منتجًا" />
              </div>
              <div>
                <Label className="mb-1 block">الكمية</Label>
                <Input type="number" min={1} value={quickQty} onChange={(e) => setQuickQty(Number(e.target.value))} />
              </div>
              <div>
                <Label className="mb-1 block">{t("returnReason")}</Label>
                <Input value={quickReason} onChange={(e) => setQuickReason(e.target.value)} placeholder={t("returnReason")} />
              </div>
              <Button
                onClick={() => quickSubmit.mutate()}
                disabled={quickSubmit.isPending || !quickProductId}
                className="w-full gap-2 gradient-primary"
              >
                <RotateCcw className="h-4 w-4" />
                {t("confirmReturn")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 mt-4">
        <h3 className="font-semibold mb-3">{t("recentReturns")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-start font-semibold px-3 py-2">{t("date")}</th>
                <th className="text-start font-semibold px-3 py-2">{t("invoice")}</th>
                <th className="text-start font-semibold px-3 py-2">{t("total")}</th>
                <th className="text-start font-semibold px-3 py-2">{t("notes")}</th>
              </tr>
            </thead>
            <tbody>
              {recentReturns.map((r: any) => (
                <Fragment key={r.id}>
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-3 py-2.5">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2.5">#{r.sale_id?.slice(0, 8) ?? "—"}</td>
                    <td className="px-3 py-2.5 font-semibold text-destructive">
                      {fmt(Number(r.total_amount))}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{r.reason ?? "—"}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => setExpandedReturnId((curr) => (curr === r.id ? null : r.id))}
                        >
                          {expandedReturnId === r.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedReturnId === r.id && (
                    <tr className="bg-muted/20">
                      <td colSpan={4} className="px-3 py-3">
                        <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2">
                          <div className="text-xs font-semibold text-muted-foreground">تفاصيل المرتجع</div>
                          <div className="space-y-2">
                            {(r.sale_return_items ?? []).map((item: any, idx: number) => (
                              <div key={`${r.id}-${idx}`} className="flex items-center justify-between gap-2 text-sm">
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{item.products?.name ?? "—"}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {Number(item.quantity)} × {fmt(Number(item.unit_price))}
                                  </div>
                                </div>
                                <div className="font-semibold">{fmt(Number(item.subtotal))}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!recentReturns.length && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-muted-foreground">
                    {t("noData")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
