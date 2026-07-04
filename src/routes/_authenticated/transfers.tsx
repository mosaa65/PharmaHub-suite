import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Plus, Warehouse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/transfers")({
  component: Transfers,
});

function Transfers() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [openWh, setOpenWh] = useState(false);
  const [openTr, setOpenTr] = useState(false);
  const [whForm, setWhForm] = useState({ name: "", location: "" });
  const [trForm, setTrForm] = useState({
    from_warehouse_id: "",
    to_warehouse_id: "",
    product_id: "",
    quantity: "",
    notes: "",
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const { data } = await supabase.from("warehouses").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-select"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, quantity")
        .order("name")
        .limit(500);
      return data ?? [];
    },
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ["stock-transfers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stock_transfers")
        .select(
          "id, quantity, notes, created_at, from:warehouses!stock_transfers_from_warehouse_id_fkey(name), to:warehouses!stock_transfers_to_warehouse_id_fkey(name), products(name)",
        )
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const addWh = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("warehouses").insert({
        name: whForm.name,
        location: whForm.location || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("success"));
      setOpenWh(false);
      setWhForm({ name: "", location: "" });
      qc.invalidateQueries({ queryKey: ["warehouses"] });
    },
    onError: (e: any) => toast.error(e?.message ?? t("error")),
  });

  const addTr = useMutation({
    mutationFn: async () => {
      const q = Number(trForm.quantity);
      if (!trForm.product_id || !trForm.from_warehouse_id || !trForm.to_warehouse_id || !q)
        throw new Error("Fill all fields");
      if (trForm.from_warehouse_id === trForm.to_warehouse_id)
        throw new Error("Source and destination must differ");
      const { error } = await supabase.from("stock_transfers").insert({
        from_warehouse_id: trForm.from_warehouse_id,
        to_warehouse_id: trForm.to_warehouse_id,
        product_id: trForm.product_id,
        quantity: q,
        notes: trForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("success"));
      setOpenTr(false);
      setTrForm({
        from_warehouse_id: "",
        to_warehouse_id: "",
        product_id: "",
        quantity: "",
        notes: "",
      });
      qc.invalidateQueries({ queryKey: ["stock-transfers"] });
    },
    onError: (e: any) => toast.error(e?.message ?? t("error")),
  });

  return (
    <div>
      <PageHeader
        title={t("transfers")}
        icon={<ArrowLeftRight className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpenWh(true)} className="gap-2">
              <Warehouse className="h-4 w-4" />
              {t("addWarehouse")}
            </Button>
            <Button onClick={() => setOpenTr(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("newTransfer")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">{t("warehouses")}</h3>
          <div className="space-y-2">
            {warehouses.map((w: any) => (
              <div
                key={w.id}
                className="rounded-xl border border-border p-3 hover:bg-muted/40 transition"
              >
                <div className="font-medium">{w.name}</div>
                {w.location && (
                  <div className="text-xs text-muted-foreground mt-0.5">{w.location}</div>
                )}
              </div>
            ))}
            {!warehouses.length && (
              <div className="text-center text-muted-foreground py-6 text-sm">
                {t("noData")}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">{t("recentTransfers")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-start font-semibold px-3 py-2">{t("date")}</th>
                  <th className="text-start font-semibold px-3 py-2">{t("product")}</th>
                  <th className="text-start font-semibold px-3 py-2">{t("from")}</th>
                  <th className="text-start font-semibold px-3 py-2">{t("to")}</th>
                  <th className="text-start font-semibold px-3 py-2">{t("quantity")}</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((r: any) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="px-3 py-2.5">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-medium">{r.products?.name ?? "—"}</td>
                    <td className="px-3 py-2.5">{r.from?.name ?? "—"}</td>
                    <td className="px-3 py-2.5">{r.to?.name ?? "—"}</td>
                    <td className="px-3 py-2.5 font-semibold">{Number(r.quantity)}</td>
                  </tr>
                ))}
                {!transfers.length && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t("noData")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog open={openWh} onOpenChange={setOpenWh}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addWarehouse")}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addWh.mutate();
            }}
            className="space-y-3"
          >
            <div>
              <Label className="text-xs">{t("name")} *</Label>
              <Input
                value={whForm.name}
                onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">{t("address")}</Label>
              <Input
                value={whForm.location}
                onChange={(e) => setWhForm({ ...whForm, location: e.target.value })}
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenWh(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={addWh.isPending}>
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openTr} onOpenChange={setOpenTr}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("newTransfer")}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTr.mutate();
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("from")} *</Label>
                <Select
                  value={trForm.from_warehouse_id}
                  onValueChange={(v) => setTrForm({ ...trForm, from_warehouse_id: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w: any) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t("to")} *</Label>
                <Select
                  value={trForm.to_warehouse_id}
                  onValueChange={(v) => setTrForm({ ...trForm, to_warehouse_id: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w: any) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">{t("product")} *</Label>
              <Select
                value={trForm.product_id}
                onValueChange={(v) => setTrForm({ ...trForm, product_id: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({Number(p.quantity ?? 0)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("quantity")} *</Label>
              <Input
                type="number"
                min={1}
                value={trForm.quantity}
                onChange={(e) => setTrForm({ ...trForm, quantity: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">{t("notes")}</Label>
              <Input
                value={trForm.notes}
                onChange={(e) => setTrForm({ ...trForm, notes: e.target.value })}
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenTr(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={addTr.isPending}>
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
