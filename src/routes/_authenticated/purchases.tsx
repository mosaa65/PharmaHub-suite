import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Truck, Plus, Check, X, Send, PackageCheck,
  ChevronDown, ChevronUp, AlertCircle, Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { SearchAddBar } from "@/components/search-add-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/purchases")({
  component: Purchases,
});

interface OrderItem {
  product_id?: string;
  product_name: string;
  ordered_qty: number;
  received_qty: number;
  unit_cost: number;
  batch_number?: string;
  expiry_date?: string;
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  draft: { label: "statusDraft", class: "bg-gray-500/15 text-gray-600 border-gray-500/30" },
  sent: { label: "statusSent", class: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  partial: { label: "statusPartial", class: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  received: { label: "statusReceived", class: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  cancelled: { label: "statusCancelled", class: "bg-rose-500/15 text-rose-600 border-rose-500/30" },
};

function StatusBadge({ status, t }: { status: string; t: (k: any) => string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <Badge variant="outline" className={`${cfg.class} rounded-full text-[10px]`}>
      {t(cfg.label as any)}
    </Badge>
  );
}

function Purchases() {
  const { t, lang } = useI18n();
  const tab = useRouterState({ select: (s) => new URLSearchParams(s.location.searchStr).get("tab") ?? "orders" });
  const [newOpen, setNewOpen] = useState(false);
  const [receiveId, setReceiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("purchase_orders")
        .select("*, supplier:suppliers(name), items:purchase_order_items(*)")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("purchases")
        .select("*, suppliers(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: async () => {
      const { data } = await supabase.from("suppliers").select("id, name, balance").order("name");
      return data ?? [];
    },
  });

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(
      (o: any) => (o.supplier?.name ?? "").toLowerCase().includes(q) || o.status.includes(q),
    );
  }, [orders, search]);

  const loc = lang === "ar" ? "ar-EG" : "en-US";
  const fmt = (n: number) => `${Number(n).toLocaleString(loc, { minimumFractionDigits: 2 })} ${t("currency")}`;

  return (
    <div>
      <PageHeader
        title={t("purchases")}
        icon={<Truck className="h-5 w-5" />}
      />

      <Tabs value={tab} className="space-y-4">
        <TabsList className="bg-card/80 backdrop-blur border border-border/60 p-1 rounded-xl">
          <TabsTrigger value="orders" className="gap-2 rounded-lg">
            <PackageCheck className="h-4 w-4" /> {t("purchaseOrders")}
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2 rounded-lg">
            <Truck className="h-4 w-4" /> {t("purchaseInvoices")}
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2 rounded-lg">
            <Building2 className="h-4 w-4" /> {t("supplierBalance")}
          </TabsTrigger>
        </TabsList>

        {/* Purchase Orders Tab */}
        <TabsContent value="orders">
          <SearchAddBar
            search={search}
            onSearchChange={setSearch}
            onAdd={() => setNewOpen(true)}
            addLabel={t("newPurchaseOrder")}
            placeholder={t("search")}
            className="mb-3"
          />
          <Card className="overflow-hidden">
            <div className="divide-y divide-border/60">
              {isLoading && <div className="p-6 text-center text-muted-foreground">{t("loading")}</div>}
              {!isLoading && filteredOrders.length === 0 && (
                <div className="p-10 text-center text-muted-foreground">{t("noData")}</div>
              )}
              {filteredOrders.map((o: any) => (
                <OrderRow key={o.id} order={o} onReceive={() => setReceiveId(o.id)} fmt={fmt} />
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Purchase Invoices Tab */}
        <TabsContent value="invoices">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-xs text-muted-foreground border-b border-border">
                    <th className="text-start font-semibold px-4 py-3">{t("date")}</th>
                    <th className="text-start font-semibold px-4 py-3">{t("suppliers")}</th>
                    <th className="text-start font-semibold px-4 py-3">{t("total")}</th>
                    <th className="text-start font-semibold px-4 py-3">{t("paid")}</th>
                    <th className="text-start font-semibold px-4 py-3">{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">{t("noData")}</td></tr>
                  ) : (
                    invoices.map((r: any) => (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-4 py-3">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{r.suppliers?.name ?? "—"}</td>
                        <td className="px-4 py-3 font-semibold">{fmt(r.total)}</td>
                        <td className="px-4 py-3">{fmt(r.paid)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} t={t} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Supplier Balances Tab */}
        <TabsContent value="suppliers">
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-border/60 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <p className="text-sm text-muted-foreground">{t("outstanding")}: المبالغ المدنية للموردين (الرصيد الموجب = مديونية)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-xs text-muted-foreground border-b border-border">
                    <th className="text-start font-semibold px-4 py-3">{t("suppliers")}</th>
                    <th className="text-start font-semibold px-4 py-3">{t("balance")}</th>
                    <th className="text-start font-semibold px-4 py-3">{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-10 text-muted-foreground">{t("noData")}</td></tr>
                  ) : (
                    suppliers.map((s: any) => (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className={`px-4 py-3 font-bold ${Number(s.balance) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {fmt(Math.abs(Number(s.balance)))}
                        </td>
                        <td className="px-4 py-3">
                          {Number(s.balance) > 0 ? (
                            <Badge variant="outline" className="bg-rose-500/15 text-rose-600 border-rose-500/30 rounded-full text-[10px]">
                              {t("outstanding")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 rounded-full text-[10px]">
                              مسوّى
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {newOpen && (
        <NewOrderDialog onClose={() => setNewOpen(false)} />
      )}
      {receiveId && (
        <ReceiveOrderDialog orderId={receiveId} onClose={() => setReceiveId(null)} />
      )}
    </div>
  );
}

function OrderRow({ order, onReceive, fmt }: { order: any; onReceive: () => void; fmt: (n: number) => string }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const sendMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("purchase_orders").update({ status: "sent" }).eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t("success")); qc.invalidateQueries({ queryKey: ["purchase-orders"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const cancelMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("purchase_orders").update({ status: "cancelled" }).eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t("success")); qc.invalidateQueries({ queryKey: ["purchase-orders"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="p-4 hover:bg-muted/20 transition flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
          <Truck className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{order.supplier?.name ?? "—"}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString()} · {order.items?.length ?? 0} {t("product")}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StatusBadge status={order.status} t={t} />
          <span className="text-xs font-semibold">{fmt(order.total_amount)}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          {order.status === "draft" && (
            <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => sendMut.mutate()}>
              <Send className="h-3 w-3" /> {t("sendOrder")}
            </Button>
          )}
          {(order.status === "sent" || order.status === "partial") && (
            <Button size="sm" className="gap-1 text-xs h-7 gradient-primary" onClick={onReceive}>
              <Check className="h-3 w-3" /> {t("receiveOrder")}
            </Button>
          )}
          {order.status === "draft" && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
              if (confirm(t("confirmDelete"))) cancelMut.mutate();
            }}>
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {expanded && order.items?.length > 0 && (
        <div className="border-t border-border/40 bg-muted/10 px-4 py-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-start pb-1">{t("product")}</th>
                <th className="text-start pb-1">{t("orderedQty")}</th>
                <th className="text-start pb-1">{t("receivedQty")}</th>
                <th className="text-start pb-1">{t("unitCost")}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any) => (
                <tr key={item.id} className="border-t border-border/20">
                  <td className="py-1">{item.product_name}</td>
                  <td className="py-1">{item.ordered_qty}</td>
                  <td className="py-1">{item.received_qty}</td>
                  <td className="py-1">{Number(item.unit_cost).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NewOrderDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<OrderItem[]>([{ product_name: "", ordered_qty: 1, received_qty: 0, unit_cost: 0 }]);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: async () => {
      const { data } = await supabase.from("suppliers").select("id, name").order("name");
      return data ?? [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name").order("name");
      return data ?? [];
    },
  });

  const addLine = () => setLines((l) => [...l, { product_name: "", ordered_qty: 1, received_qty: 0, unit_cost: 0 }]);
  const removeLine = (i: number) => setLines((l) => l.filter((_, idx) => idx !== i));
  const updateLine = (i: number, patch: Partial<OrderItem>) =>
    setLines((l) => l.map((line, idx) => (idx === i ? { ...line, ...patch } : line)));

  const totalAmount = lines.reduce((s, l) => s + l.ordered_qty * l.unit_cost, 0);

  const createMut = useMutation({
    mutationFn: async () => {
      const validLines = lines.filter((l) => l.product_name.trim() && l.ordered_qty > 0);
      if (!validLines.length) throw new Error(t("requiredField"));
      const { data: order, error } = await supabase
        .from("purchase_orders")
        .insert({
          supplier_id: supplierId || null,
          status: "draft",
          expected_date: expectedDate || null,
          notes: notes || null,
          total_amount: totalAmount,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      const { error: itemsErr } = await supabase.from("purchase_order_items").insert(
        validLines.map((l) => ({ ...l, order_id: order.id })),
      );
      if (itemsErr) throw itemsErr;
    },
    onSuccess: () => {
      toast.success(t("success"));
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("newPurchaseOrder")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("suppliers")}</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder={t("suppliers")} /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("expectedDate")}</Label>
              <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>{t("notes")}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">{t("product")}</Label>
              <Button variant="outline" size="sm" onClick={addLine} className="gap-1 text-xs h-7">
                <Plus className="h-3 w-3" /> {t("addLine")}
              </Button>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_80px_80px_32px] gap-2 items-end">
                  <div>
                    {i === 0 && <Label className="text-xs mb-1 block">{t("name")}</Label>}
                    <Select
                      value={line.product_id ?? ""}
                      onValueChange={(v) => {
                        const p = products.find((p: any) => p.id === v) as any;
                        updateLine(i, { product_id: v, product_name: p?.name ?? "" });
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder={t("product")} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    {i === 0 && <Label className="text-xs mb-1 block">{t("orderedQty")}</Label>}
                    <Input
                      type="number" min="1" className="h-8" value={line.ordered_qty}
                      onChange={(e) => updateLine(i, { ordered_qty: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    {i === 0 && <Label className="text-xs mb-1 block">{t("unitCost")}</Label>}
                    <Input
                      type="number" min="0" step="0.01" className="h-8" value={line.unit_cost}
                      onChange={(e) => updateLine(i, { unit_cost: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    {i === 0 && <Label className="text-xs mb-1 block">{t("expiryDate")}</Label>}
                    <Input
                      type="date" className="h-8" value={line.expiry_date ?? ""}
                      onChange={(e) => updateLine(i, { expiry_date: e.target.value })}
                    />
                  </div>
                  <div className={i === 0 ? "mt-5" : ""}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeLine(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <div className="text-sm font-bold">
              {t("total")}: {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {t("currency")}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
          <Button onClick={() => createMut.mutate()} disabled={createMut.isPending} className="gradient-primary">
            {t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReceiveOrderDialog({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data: order } = useQuery({
    queryKey: ["purchase-order", orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from("purchase_orders")
        .select("*, supplier:suppliers(id, name, balance), items:purchase_order_items(*, product:products(id, name, quantity))")
        .eq("id", orderId)
        .single();
      return data;
    },
  });

  const [received, setReceived] = useState<Record<string, { qty: number; batch: string; expiry: string; cost: number }>>({});

  const initReceived = () => {
    if (!order?.items) return;
    const init: typeof received = {};
    order.items.forEach((item: any) => {
      init[item.id] = { qty: item.ordered_qty - item.received_qty, batch: item.batch_number ?? "", expiry: item.expiry_date ?? "", cost: item.unit_cost };
    });
    setReceived(init);
  };

  const confirmMut = useMutation({
    mutationFn: async () => {
      if (!order) return;
      let allReceived = true;
      let totalReceived = 0;

      for (const item of order.items) {
        const r = received[item.id];
        if (!r || r.qty <= 0) continue;
        totalReceived += r.qty * r.cost;

        // Update order item received qty
        await supabase
          .from("purchase_order_items")
          .update({ received_qty: item.received_qty + r.qty })
          .eq("id", item.id);

        // Create a product batch
        if (item.product_id) {
          await supabase.from("product_batches").insert({
            product_id: item.product_id,
            batch_number: r.batch || null,
            expiry_date: r.expiry || null,
            quantity: r.qty,
            cost: r.cost,
          });
          // Update product total quantity
          const newQty = (item.product?.quantity ?? 0) + r.qty;
          await supabase.from("products").update({ quantity: newQty, cost: r.cost }).eq("id", item.product_id);
        }

        if (r.qty < item.ordered_qty - item.received_qty) allReceived = false;
      }

      // Update order status
      const newStatus = allReceived ? "received" : "partial";
      await supabase.from("purchase_orders").update({ status: newStatus, received_amount: totalReceived }).eq("id", orderId);

      // Record in purchases table
      await supabase.from("purchases").insert({
        supplier_id: order.supplier?.id ?? null,
        total: totalReceived,
        paid: 0,
        status: newStatus,
        notes: `من طلب شراء: ${orderId.slice(0, 8)}`,
      });

      // Update supplier balance
      if (order.supplier?.id) {
        const newBalance = (Number(order.supplier.balance) || 0) + totalReceived;
        await supabase.from("suppliers").update({ balance: newBalance }).eq("id", order.supplier.id);
      }
    },
    onSuccess: () => {
      toast.success(t("success"));
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["suppliers-list"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!order) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            {t("receiveOrderTitle")} — {order.supplier?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {order.items?.map((item: any) => {
            const remaining = item.ordered_qty - item.received_qty;
            const r = received[item.id] ?? { qty: remaining, batch: item.batch_number ?? "", expiry: item.expiry_date ?? "", cost: item.unit_cost };
            const update = (patch: Partial<typeof r>) => setReceived((s) => ({ ...s, [item.id]: { ...r, ...patch } }));
            return (
              <Card key={item.id} className="p-3">
                <div className="font-semibold mb-2">{item.product_name}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div>
                    <Label className="text-xs">{t("orderedQty")}</Label>
                    <p className="font-medium">{item.ordered_qty}</p>
                  </div>
                  <div>
                    <Label className="text-xs">{t("receivedQty")} *</Label>
                    <Input
                      type="number" min="0" max={remaining} value={r.qty}
                      onChange={(e) => update({ qty: Number(e.target.value) })}
                      className="h-7 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("batchNumber")}</Label>
                    <Input value={r.batch} onChange={(e) => update({ batch: e.target.value })} className="h-7 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">{t("expiryDate")}</Label>
                    <Input type="date" value={r.expiry} onChange={(e) => update({ expiry: e.target.value })} className="h-7 text-sm" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
          <Button onClick={() => { initReceived(); confirmMut.mutate(); }} disabled={confirmMut.isPending} className="gradient-primary gap-2">
            <Check className="h-4 w-4" /> {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
