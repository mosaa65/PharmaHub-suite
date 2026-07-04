import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FileText,
  Plus,
  Sparkles,
  Pill,
  Check,
  X,
  Trash2,
  Loader2,
  Printer,
} from "lucide-react";

import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { analyzeInteractions } from "@/lib/clinical.functions";
import { toast } from "sonner";
import { printPrescription } from "@/lib/print-prescription";


export const Route = createFileRoute("/_authenticated/prescriptions")({
  component: Prescriptions,
});

function statusBadge(s: string, t: any) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    reviewed: "bg-sky-500/15 text-sky-600 border-sky-500/30",
    dispensed: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    cancelled: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  };
  const key = `status${s.charAt(0).toUpperCase() + s.slice(1)}`;
  return (
    <Badge variant="outline" className={`${map[s] ?? ""} rounded-full`}>
      {t(key)}
    </Badge>
  );
}

function Prescriptions() {
  const { t } = useI18n();
  const [newOpen, setNewOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("prescriptions")
        .select("*, customer:customers(name), items:prescription_items(*)")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const pendingCount = list.filter((p: any) => p.status === "pending").length;

  return (
    <div>
      <PageHeader
        title={t("prescriptions")}
        icon={<FileText className="h-5 w-5" />}
        actions={
          <Button onClick={() => setNewOpen(true)} className="gap-2 gradient-primary">
            <Plus className="h-4 w-4" /> {t("newPrescription")}
          </Button>
        }
      />

      {pendingCount > 0 && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 px-4 py-3 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 text-sm">
            <div className="font-bold">{t("pendingRxAlert")}</div>
            <div className="text-xs opacity-90">
              {pendingCount} — {t("statusPending")}
            </div>
          </div>
        </div>
      )}


      <Card className="border-border/60 overflow-hidden">
        <div className="divide-y divide-border/60">
          {isLoading && (
            <div className="p-6 text-center text-muted-foreground">
              {t("loading")}
            </div>
          )}
          {!isLoading && !list.length && (
            <div className="p-10 text-center text-muted-foreground">
              {t("noData")}
            </div>
          )}
          {list.map((p: any) => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className="w-full text-start p-4 hover:bg-accent/40 transition flex items-center gap-3"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {p.customer?.name ?? t("walkIn")}
                  {p.doctor_name && (
                    <span className="text-muted-foreground font-normal">
                      {" "}— Dr. {p.doctor_name}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {p.diagnosis ?? p.notes ?? "—"} · {p.items?.length ?? 0}{" "}
                  {t("prescriptionItems")}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {statusBadge(p.status ?? "pending", t)}
                <span className="text-[10px] text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {newOpen && (
        <NewPrescriptionDialog
          onClose={() => setNewOpen(false)}
          onCreated={(id) => {
            setNewOpen(false);
            setActiveId(id);
          }}
        />
      )}
      {activeId && (
        <PrescriptionDetailSheet
          id={activeId}
          onClose={() => setActiveId(null)}
        />
      )}
    </div>
  );
}

interface Item {
  product_id?: string;
  product_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity: number;
  instructions?: string;
}

function NewPrescriptionDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    customer_id: "",
    doctor_name: "",
    diagnosis: "",
    patient_age: "",
    patient_weight: "",
    notes: "",
  });
  const [items, setItems] = useState<Item[]>([
    { product_name: "", quantity: 1 },
  ]);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, name")
        .order("name");
      return data ?? [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name")
        .order("name");
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const valid = items.filter((i) => i.product_name.trim());
      if (!valid.length) throw new Error(t("requiredField"));
      const { data: p, error } = await supabase
        .from("prescriptions")
        .insert({
          customer_id: form.customer_id || null,
          doctor_name: form.doctor_name || null,
          diagnosis: form.diagnosis || null,
          patient_age: form.patient_age ? Number(form.patient_age) : null,
          patient_weight: form.patient_weight ? Number(form.patient_weight) : null,
          notes: form.notes || null,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;
      const { error: e2 } = await supabase.from("prescription_items").insert(
        valid.map((i) => ({ ...i, prescription_id: p.id })),
      );
      if (e2) throw e2;
      return p.id as string;
    },
    onSuccess: (id) => {
      toast.success(t("success"));
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
      onCreated(id);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateItem = (idx: number, patch: Partial<Item>) =>
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("newPrescription")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("customer")}</Label>
              <Select
                value={form.customer_id}
                onValueChange={(v) => setForm({ ...form, customer_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("walkIn")} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("doctor")}</Label>
              <Input
                value={form.doctor_name}
                onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>{t("diagnosis")}</Label>
              <Input
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("age")}</Label>
              <Input
                type="number"
                value={form.patient_age}
                onChange={(e) => setForm({ ...form, patient_age: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("weight")}</Label>
              <Input
                type="number"
                value={form.patient_weight}
                onChange={(e) =>
                  setForm({ ...form, patient_weight: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label>{t("notes")}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>{t("prescriptionItems")}</Label>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setItems([...items, { product_name: "", quantity: 1 }])}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> {t("addItem")}
              </Button>
            </div>
            <div className="space-y-3">
              {items.map((it, idx) => (
                <Card key={idx} className="p-3 border-border/60 bg-muted/30">
                  <div className="grid sm:grid-cols-6 gap-2">
                    <div className="sm:col-span-2">
                      <Select
                        value={it.product_id ?? ""}
                        onValueChange={(v) => {
                          const p = products.find((p: any) => p.id === v);
                          updateItem(idx, {
                            product_id: v,
                            product_name: p?.name ?? it.product_name,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("product")} />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        className="mt-2"
                        placeholder={t("drugName")}
                        value={it.product_name}
                        onChange={(e) =>
                          updateItem(idx, { product_name: e.target.value })
                        }
                      />
                    </div>
                    <Input
                      placeholder={t("dosage")}
                      value={it.dosage ?? ""}
                      onChange={(e) => updateItem(idx, { dosage: e.target.value })}
                    />
                    <Input
                      placeholder={t("frequency")}
                      value={it.frequency ?? ""}
                      onChange={(e) =>
                        updateItem(idx, { frequency: e.target.value })
                      }
                    />
                    <Input
                      placeholder={t("duration")}
                      value={it.duration ?? ""}
                      onChange={(e) =>
                        updateItem(idx, { duration: e.target.value })
                      }
                    />
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) =>
                          updateItem(idx, { quantity: Number(e.target.value) || 1 })
                        }
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <Input
                      className="sm:col-span-6"
                      placeholder={t("instructions")}
                      value={it.instructions ?? ""}
                      onChange={(e) =>
                        updateItem(idx, { instructions: e.target.value })
                      }
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="gradient-primary gap-2"
          >
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrescriptionDetailSheet({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeInteractions);

  const { data: p } = useQuery({
    queryKey: ["prescription", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("prescriptions")
        .select(
          "*, customer:customers(id,name), items:prescription_items(*, product:products(id,name,price,quantity))",
        )
        .eq("id", id)
        .single();
      return data;
    },
  });

  const { data: allergies = [] } = useQuery({
    queryKey: ["allergies", p?.customer?.id],
    enabled: !!p?.customer?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_allergies")
        .select("*")
        .eq("customer_id", p!.customer!.id);
      return data ?? [];
    },
  });

  const drugNames = useMemo(
    () => (p?.items ?? []).map((i: any) => i.product_name).filter(Boolean),
    [p],
  );

  const allergyHits = useMemo(() => {
    if (!allergies.length) return [];
    return allergies.filter((a: any) =>
      drugNames.some(
        (d: string) =>
          d.toLowerCase().includes(a.allergen.toLowerCase()) ||
          a.allergen.toLowerCase().includes(d.toLowerCase()),
      ),
    );
  }, [allergies, drugNames]);

  const check = useMutation({
    mutationFn: async () =>
      drugNames.length >= 2
        ? analyze({ data: { drugs: drugNames, lang } })
        : { dbMatches: [], aiText: "" },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("prescriptions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("success"));
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
      qc.invalidateQueries({ queryKey: ["prescription", id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const dispense = useMutation({
    mutationFn: async () => {
      if (!p?.items?.length) throw new Error("No items");
      const subtotal = p.items.reduce(
        (s: number, i: any) => s + Number(i.product?.price ?? 0) * i.quantity,
        0,
      );
      const { data: sale, error } = await supabase
        .from("sales")
        .insert({
          customer_id: p.customer_id,
          subtotal,
          discount: 0,
          tax: 0,
          total: subtotal,
          paid: subtotal,
          payment_method: "cash",
        })
        .select()
        .single();
      if (error) throw error;
      const rows = p.items
        .filter((i: any) => i.product?.id)
        .map((i: any) => ({
          sale_id: sale.id,
          product_id: i.product.id,
          product_name: i.product_name,
          quantity: i.quantity,
          price: i.product.price,
        }));
      if (rows.length) {
        await supabase.from("sale_items").insert(rows);
        for (const i of p.items) {
          if (!i.product?.id) continue;
          await supabase
            .from("products")
            .update({ quantity: Math.max(0, (i.product.quantity ?? 0) - i.quantity) })
            .eq("id", i.product.id);
        }
      }
      await supabase
        .from("prescriptions")
        .update({
          status: "dispensed",
          dispensed_at: new Date().toISOString(),
          sale_id: sale.id,
        })
        .eq("id", id);
    },
    onSuccess: () => {
      toast.success(t("saleCompleted"));
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("prescriptionDetails")}
          </SheetTitle>
        </SheetHeader>
        {!p ? (
          <div className="py-8 text-center text-muted-foreground">{t("loading")}</div>
        ) : (
          <div className="py-4 space-y-4">
            <Card className="p-4 border-border/60 space-y-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold">
                    {p.customer?.name ?? t("walkIn")}
                  </div>
                  {p.doctor_name && (
                    <div className="text-sm text-muted-foreground">
                      Dr. {p.doctor_name}
                    </div>
                  )}
                </div>
                {statusBadge(p.status ?? "pending", t)}
              </div>
              {p.diagnosis && (
                <div className="text-sm mt-2">
                  <span className="font-semibold">{t("diagnosis")}:</span>{" "}
                  {p.diagnosis}
                </div>
              )}
              <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                {p.patient_age && <span>{t("age")}: {p.patient_age}</span>}
                {p.patient_weight && <span>{t("weight")}: {p.patient_weight}</span>}
              </div>
              {p.notes && (
                <div className="text-xs text-muted-foreground mt-2">{p.notes}</div>
              )}
            </Card>

            {allergyHits.length > 0 && (
              <Card className="p-3 border-rose-500/30 bg-rose-500/10 text-rose-700">
                <div className="font-bold text-sm mb-1">
                  ⚠ {t("allergyMatch")}:
                </div>
                <div className="text-xs">
                  {allergyHits.map((a: any) => a.allergen).join(", ")}
                </div>
              </Card>
            )}

            <div>
              <Label className="mb-2 block">{t("prescriptionItems")}</Label>
              <div className="space-y-2">
                {p.items?.map((i: any) => (
                  <Card key={i.id} className="p-3 border-border/60">
                    <div className="flex items-start gap-2">
                      <Pill className="h-4 w-4 mt-0.5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{i.product_name}</div>
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                          {i.dosage && <span>💊 {i.dosage}</span>}
                          {i.frequency && <span>🕐 {i.frequency}</span>}
                          {i.duration && <span>📅 {i.duration}</span>}
                          <span>× {i.quantity}</span>
                        </div>
                        {i.instructions && (
                          <div className="text-xs mt-1 italic">{i.instructions}</div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="p-3 border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t("reviewClinical")}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => check.mutate()}
                  disabled={check.isPending || drugNames.length < 2}
                >
                  {check.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    t("runCheck")
                  )}
                </Button>
              </div>
              {check.data?.dbMatches?.length ? (
                <div className="space-y-1.5">
                  {check.data.dbMatches.map((m: any) => (
                    <div
                      key={m.id}
                      className="text-xs rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 p-2"
                    >
                      <b>
                        {m.drug_a} ↔ {m.drug_b}
                      </b>{" "}
                      — {m.description}
                    </div>
                  ))}
                </div>
              ) : check.data ? (
                <div className="text-xs text-emerald-600">
                  ✓ {t("noInteractions")}
                </div>
              ) : null}
              {check.data?.aiText && (
                <div className="text-xs whitespace-pre-wrap leading-relaxed bg-muted/50 rounded-lg p-2 border border-border/60">
                  {check.data.aiText}
                </div>
              )}
            </Card>

            <div className="flex gap-2 sticky bottom-0 bg-background pt-2 flex-wrap">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() =>
                  printPrescription({
                    storeName: t("appName"),
                    prescriptionId: p.id,
                    date: new Date(p.created_at),
                    status: p.status ?? "pending",
                    doctorName: p.doctor_name,
                    patientName: p.customer?.name ?? t("walkIn"),
                    patientAge: p.patient_age,
                    patientWeight: p.patient_weight,
                    diagnosis: p.diagnosis,
                    notes: p.notes,
                    items: (p.items ?? []).map((i: any) => ({
                      product_name: i.product_name,
                      dosage: i.dosage,
                      frequency: i.frequency,
                      duration: i.duration,
                      quantity: i.quantity,
                      instructions: i.instructions,
                    })),
                    allergies: allergyHits.map((a: any) => a.allergen),
                    lang,
                  })
                }
              >
                <Printer className="h-4 w-4" /> {t("printPrescription")}
              </Button>
              {p.status === "pending" && (
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => updateStatus.mutate("reviewed")}
                >
                  <Check className="h-4 w-4" /> {t("markReviewed")}
                </Button>
              )}

              {p.status !== "dispensed" && p.status !== "cancelled" && (
                <Button
                  className="flex-1 gap-2 gradient-primary"
                  onClick={() => dispense.mutate()}
                  disabled={dispense.isPending}
                >
                  {dispense.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <Pill className="h-4 w-4" />
                  {t("dispense")}
                </Button>
              )}
              {p.status !== "dispensed" && p.status !== "cancelled" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateStatus.mutate("cancelled")}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
