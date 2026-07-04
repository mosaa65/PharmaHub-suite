import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package, Plus, Pencil, Trash2, Layers, Search,
  AlertTriangle, CalendarX2, ChevronDown, ChevronUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { SearchAddBar } from "@/components/search-add-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inventory")({
  component: Inventory,
});

interface Product {
  id: string; name: string; name_en?: string; barcode?: string;
  category?: string; price: number; cost: number; quantity: number;
  min_stock: number; expiry_date?: string; notes?: string; tax_rate?: number;
}
interface Batch {
  id: string; product_id: string; batch_number?: string;
  manufacture_date?: string; expiry_date?: string; quantity: number; cost: number; notes?: string;
}

const EMPTY_PRODUCT: Partial<Product> = {
  name: "", barcode: "", category: "", price: 0, cost: 0, quantity: 0, min_stock: 10,
};
const EMPTY_BATCH: Partial<Batch> = {
  batch_number: "", quantity: 0, cost: 0,
};

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function ExpiryBadge({ days }: { days: number | null }) {
  const { t } = useI18n();
  if (days === null) return null;
  if (days < 0) return <Badge variant="outline" className="bg-rose-500/15 text-rose-600 border-rose-500/30 text-[10px]">{t("expired")}</Badge>;
  if (days <= 30) return <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">{t("expiresIn")} {days} {t("daysLeft")}</Badge>;
  return <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">{t("inStock")}</Badge>;
}

function Inventory() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [batchesFor, setBatchesFor] = useState<Product | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("name");
      return (data ?? []) as Product[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.barcode ?? "").includes(q) || (p.category ?? "").toLowerCase().includes(q),
    );
  }, [products, search]);

  const saveMut = useMutation({
    mutationFn: async (p: Partial<Product>) => {
      if (p.id) {
        const { error } = await supabase.from("products").update(p).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(p);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(t("success")); qc.invalidateQueries({ queryKey: ["products"] }); setEditProduct(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t("success")); qc.invalidateQueries({ queryKey: ["products"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const loc = lang === "ar" ? "ar-EG" : "en-US";
  const fmt = (n: number) => n.toLocaleString(loc, { minimumFractionDigits: 2 });

  return (
    <div>
      <PageHeader
        title={t("inventory")}
        icon={<Package className="h-5 w-5" />}
        actions={
          <Button onClick={() => setEditProduct(EMPTY_PRODUCT)} className="gap-2 gradient-primary">
            <Plus className="h-4 w-4" /> {t("addProduct")}
          </Button>
        }
      />

      <SearchAddBar
        search={search}
        onSearchChange={setSearch}
        onAdd={() => setEditProduct(EMPTY_PRODUCT)}
        addLabel={t("addProduct")}
        placeholder={t("search")}
        className="mb-4"
      />

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground border-b border-border">
                <th className="text-start font-semibold px-4 py-3">{t("name")}</th>
                <th className="text-start font-semibold px-4 py-3">{t("barcode")}</th>
                <th className="text-start font-semibold px-4 py-3">{t("category")}</th>
                <th className="text-start font-semibold px-4 py-3">{t("quantity")}</th>
                <th className="text-start font-semibold px-4 py-3">{t("price")}</th>
                <th className="text-start font-semibold px-4 py-3">{t("expiryDate")}</th>
                <th className="text-start font-semibold px-4 py-3">{t("batches")}</th>
                <th className="text-start font-semibold px-4 py-3">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">{t("loading")}</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">{t("noData")}</td></tr>
              )}
              {filtered.map((p) => {
                const days = daysUntil(p.expiry_date);
                const isLowStock = p.quantity <= p.min_stock;
                return (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.name}</div>
                      {p.name_en && <div className="text-xs text-muted-foreground">{p.name_en}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.barcode || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${isLowStock ? "text-amber-600" : ""}`}>
                        {p.quantity}
                        {isLowStock && <AlertTriangle className="inline h-3.5 w-3.5 ms-1 text-amber-500" />}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary">{fmt(p.price)} {t("currency")}</td>
                    <td className="px-4 py-3">
                      {p.expiry_date ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs">{new Date(p.expiry_date).toLocaleDateString()}</span>
                          <ExpiryBadge days={days} />
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBatchesFor(p)}
                        className="gap-1 text-xs h-7 px-2"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        {t("batches")}
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditProduct(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(t("confirmDelete"))) deleteMut.mutate(p.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Product Dialog */}
      {editProduct !== null && (
        <ProductDialog
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSave={(p) => saveMut.mutate(p)}
          saving={saveMut.isPending}
        />
      )}

      {/* Batches Dialog */}
      {batchesFor && (
        <BatchesDialog
          product={batchesFor}
          onClose={() => setBatchesFor(null)}
        />
      )}
    </div>
  );
}

function ProductDialog({
  product, onClose, onSave, saving,
}: {
  product: Partial<Product>;
  onClose: () => void;
  onSave: (p: Partial<Product>) => void;
  saving: boolean;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState<Partial<Product>>(product);
  const set = (k: keyof Product, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? t("edit") : t("addProduct")}</DialogTitle>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label>{t("name")} *</Label>
            <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <Label>{t("pharmacyNameEn")}</Label>
            <Input value={form.name_en ?? ""} onChange={(e) => set("name_en", e.target.value)} dir="ltr" />
          </div>
          <div>
            <Label>{t("barcode")}</Label>
            <Input value={form.barcode ?? ""} onChange={(e) => set("barcode", e.target.value)} dir="ltr" />
          </div>
          <div>
            <Label>{t("category")}</Label>
            <Input value={form.category ?? ""} onChange={(e) => set("category", e.target.value)} />
          </div>
          <div>
            <Label>{t("price")} *</Label>
            <Input type="number" value={form.price ?? 0} onChange={(e) => set("price", Number(e.target.value))} min="0" step="0.01" />
          </div>
          <div>
            <Label>{t("cost")}</Label>
            <Input type="number" value={form.cost ?? 0} onChange={(e) => set("cost", Number(e.target.value))} min="0" step="0.01" />
          </div>
          <div>
            <Label>{t("quantity")}</Label>
            <Input type="number" value={form.quantity ?? 0} onChange={(e) => set("quantity", Number(e.target.value))} min="0" />
          </div>
          <div>
            <Label>{t("minStock")}</Label>
            <Input type="number" value={form.min_stock ?? 10} onChange={(e) => set("min_stock", Number(e.target.value))} min="0" />
          </div>
          <div>
            <Label>{t("expiryDate")}</Label>
            <Input type="date" value={form.expiry_date ?? ""} onChange={(e) => set("expiry_date", e.target.value)} />
          </div>
          <div>
            <Label>{t("taxRate")} (%)</Label>
            <Input type="number" value={form.tax_rate ?? ""} onChange={(e) => set("tax_rate", e.target.value ? Number(e.target.value) : undefined)} min="0" max="100" step="0.01" placeholder="افتراضي من الإعدادات" />
          </div>
          <div className="sm:col-span-2">
            <Label>{t("notes")}</Label>
            <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
          <Button
            onClick={() => onSave(form)}
            disabled={saving || !form.name}
            className="gradient-primary"
          >
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BatchesDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState<"all" | "expired" | "near" | "active">("all");
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [newBatch, setNewBatch] = useState<Partial<Batch>>(EMPTY_BATCH);

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["batches", product.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_batches")
        .select("*")
        .eq("product_id", product.id)
        .order("expiry_date", { ascending: true, nullsFirst: false });
      return (data ?? []) as Batch[];
    },
  });

  const addMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("product_batches").insert({ ...newBatch, product_id: product.id });
      if (error) throw error;
      // Update product total quantity
      const total = batches.reduce((s, b) => s + b.quantity, 0) + (newBatch.quantity ?? 0);
      await supabase.from("products").update({ quantity: total }).eq("id", product.id);
    },
    onSuccess: () => {
      toast.success(t("success"));
      qc.invalidateQueries({ queryKey: ["batches", product.id] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setNewBatch(EMPTY_BATCH);
      setAddOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteBatchMut = useMutation({
    mutationFn: async (batch: Batch) => {
      const { error } = await supabase.from("product_batches").delete().eq("id", batch.id);
      if (error) throw error;
      const remaining = batches.filter((b) => b.id !== batch.id).reduce((s, b) => s + b.quantity, 0);
      await supabase.from("products").update({ quantity: remaining }).eq("id", product.id);
    },
    onSuccess: () => {
      toast.success(t("success"));
      qc.invalidateQueries({ queryKey: ["batches", product.id] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveBatchMut = useMutation({
    mutationFn: async (batch: Batch) => {
      const { error } = await supabase
        .from("product_batches")
        .update({
          batch_number: batch.batch_number ?? null,
          manufacture_date: batch.manufacture_date ?? null,
          expiry_date: batch.expiry_date ?? null,
          quantity: batch.quantity,
          cost: batch.cost,
          notes: batch.notes ?? null,
        })
        .eq("id", batch.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("success"));
      qc.invalidateQueries({ queryKey: ["batches", product.id] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setEditingBatch(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const loc = lang === "ar" ? "ar-EG" : "en-US";
  const filteredBatches = useMemo(() => {
    const q = batchSearch.toLowerCase();
    return batches.filter((b) => {
      const days = daysUntil(b.expiry_date);
      const status =
        days === null ? "active" :
        days < 0 ? "expired" :
        days <= 30 ? "near" : "active";
      const matchesFilter = batchFilter === "all" || batchFilter === status;
      const matchesSearch =
        !q ||
        (b.batch_number ?? "").toLowerCase().includes(q) ||
        (b.notes ?? "").toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [batches, batchFilter, batchSearch]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            {t("batchManagement")} — {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary flex items-center gap-2">
          <CalendarX2 className="h-4 w-4 shrink-0" />
          {t("fefoNote")}
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_180px] mb-4">
          <Input
            value={batchSearch}
            onChange={(e) => setBatchSearch(e.target.value)}
            placeholder={`${t("search")} / رقم التشغيلة`}
            className="h-9 rounded-full"
          />
          <Select value={batchFilter} onValueChange={(v) => setBatchFilter(v as any)}>
            <SelectTrigger className="h-9 rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="expired">{t("expired")}</SelectItem>
              <SelectItem value="near">{t("expiresIn")} 30</SelectItem>
              <SelectItem value="active">{t("inStock")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Batches List */}
        <div className="space-y-2 mb-4">
          {isLoading && <p className="text-sm text-center text-muted-foreground py-4">{t("loading")}</p>}
          {!isLoading && filteredBatches.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">{t("noBatches")}</p>
          )}
          {filteredBatches.map((b, i) => {
            const days = daysUntil(b.expiry_date);
            const isExpired = days !== null && days < 0;
            const isNear = days !== null && days >= 0 && days <= 30;
            return (
              <div
                key={b.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                  isExpired ? "border-rose-300 bg-rose-50 dark:bg-rose-900/20" :
                  isNear ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20" :
                  "border-border/60 bg-card"
                }`}
                >
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("batchNumber")}</p>
                    <p className="font-medium">{b.batch_number || `#${i + 1}`}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("quantity")}</p>
                    <p className="font-bold">{b.quantity.toLocaleString(loc)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("cost")}</p>
                    <p>{b.cost.toLocaleString(loc, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("expiryDate")}</p>
                    <p>{b.expiry_date ? new Date(b.expiry_date).toLocaleDateString() : "—"}</p>
                    <ExpiryBadge days={days} />
                  </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => setEditingBatch(b)}>
                      {t("edit")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(t("confirmDelete"))) deleteBatchMut.mutate(b);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Add Batch Form */}
        {addOpen ? (
          <Card className="p-4 border-primary/20">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" /> {t("addBatch")}
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>{t("batchNumber")}</Label>
                <Input value={newBatch.batch_number ?? ""} onChange={(e) => setNewBatch((b) => ({ ...b, batch_number: e.target.value }))} />
              </div>
              <div>
                <Label>{t("quantity")} *</Label>
                <Input type="number" min="1" value={newBatch.quantity ?? 0} onChange={(e) => setNewBatch((b) => ({ ...b, quantity: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>{t("cost")}</Label>
                <Input type="number" min="0" step="0.01" value={newBatch.cost ?? 0} onChange={(e) => setNewBatch((b) => ({ ...b, cost: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>{t("expiryDate")}</Label>
                <Input type="date" value={newBatch.expiry_date ?? ""} onChange={(e) => setNewBatch((b) => ({ ...b, expiry_date: e.target.value }))} />
              </div>
              <div>
                <Label>{t("manufactureDate")}</Label>
                <Input type="date" value={newBatch.manufacture_date ?? ""} onChange={(e) => setNewBatch((b) => ({ ...b, manufacture_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>{t("cancel")}</Button>
              <Button
                size="sm"
                disabled={!newBatch.quantity || addMut.isPending}
                onClick={() => addMut.mutate()}
                className="gradient-primary"
              >
                {t("save")}
              </Button>
            </div>
          </Card>
          ) : (
            <Button onClick={() => setAddOpen(true)} variant="outline" className="w-full gap-2">
              <Plus className="h-4 w-4" /> {t("addBatch")}
            </Button>
          )}

        {editingBatch && (
          <Card className="p-4 border-primary/20 mt-3">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Pencil className="h-4 w-4" /> {t("edit")} {editingBatch.batch_number ?? `#${editingBatch.id.slice(0, 6)}`}
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>{t("batchNumber")}</Label>
                <Input value={editingBatch.batch_number ?? ""} onChange={(e) => setEditingBatch((b) => b ? { ...b, batch_number: e.target.value } : b)} />
              </div>
              <div>
                <Label>{t("quantity")}</Label>
                <Input type="number" min="0" value={editingBatch.quantity ?? 0} onChange={(e) => setEditingBatch((b) => b ? { ...b, quantity: Number(e.target.value) } : b)} />
              </div>
              <div>
                <Label>{t("expiryDate")}</Label>
                <Input type="date" value={editingBatch.expiry_date ?? ""} onChange={(e) => setEditingBatch((b) => b ? { ...b, expiry_date: e.target.value } : b)} />
              </div>
              <div>
                <Label>{t("cost")}</Label>
                <Input type="number" min="0" step="0.01" value={editingBatch.cost ?? 0} onChange={(e) => setEditingBatch((b) => b ? { ...b, cost: Number(e.target.value) } : b)} />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setEditingBatch(null)}>{t("cancel")}</Button>
              <Button size="sm" className="gradient-primary" onClick={() => saveBatchMut.mutate(editingBatch)} disabled={saveBatchMut.isPending}>
                {t("save")}
              </Button>
            </div>
          </Card>
        )}

        <DialogFooter>
          <Button onClick={onClose}>{t("cancel")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
