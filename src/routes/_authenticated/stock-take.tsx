import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Save, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/stock-take")({
  component: StockTake,
});

function StockTake() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [actual, setActual] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["stock-take-products", search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, name, barcode, quantity, category")
        .order("name")
        .limit(200);
      if (search) q = q.or(`name.ilike.%${search}%,barcode.ilike.%${search}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const lines = products
        .map((p: any) => ({
          p,
          actual: actual[p.id] === "" || actual[p.id] === undefined ? null : Number(actual[p.id]),
        }))
        .filter((x) => x.actual !== null && !Number.isNaN(x.actual));
      if (!lines.length) throw new Error("Enter at least one quantity");

      const { data: take, error } = await supabase
        .from("stock_takes")
        .insert({ notes })
        .select("id")
        .single();
      if (error) throw error;

      await supabase.from("stock_take_items").insert(
        lines.map((x) => ({
          stock_take_id: take.id,
          product_id: x.p.id,
          system_qty: Number(x.p.quantity ?? 0),
          actual_qty: x.actual!,
          difference: x.actual! - Number(x.p.quantity ?? 0),
        })),
      );

      for (const x of lines) {
        await supabase.from("products").update({ quantity: x.actual! }).eq("id", x.p.id);
      }
    },
    onSuccess: () => {
      toast.success(t("success"));
      setActual({});
      setNotes("");
      qc.invalidateQueries({ queryKey: ["stock-take-products"] });
    },
    onError: (e: any) => toast.error(e?.message ?? t("error")),
  });

  return (
    <div>
      <PageHeader
        title={t("stockTake")}
        icon={<ClipboardCheck className="h-5 w-5" />}
        actions={
          <Button onClick={() => submit.mutate()} disabled={submit.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {t("saveStockTake")}
          </Button>
        }
      />

      <Card className="p-4 mb-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search")}
              className="ps-10"
            />
          </div>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notes")}
          />
        </div>
      </Card>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-start font-semibold px-3 py-2">{t("name")}</th>
                <th className="text-start font-semibold px-3 py-2">{t("barcode")}</th>
                <th className="text-start font-semibold px-3 py-2">{t("systemQty")}</th>
                <th className="text-start font-semibold px-3 py-2">{t("actualQty")}</th>
                <th className="text-start font-semibold px-3 py-2">{t("difference")}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => {
                const a = actual[p.id];
                const diff =
                  a === "" || a === undefined ? null : Number(a) - Number(p.quantity ?? 0);
                return (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="px-3 py-2.5 font-medium">{p.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{p.barcode ?? "—"}</td>
                    <td className="px-3 py-2.5">{Number(p.quantity ?? 0)}</td>
                    <td className="px-3 py-2.5">
                      <Input
                        type="number"
                        value={a ?? ""}
                        onChange={(e) => setActual({ ...actual, [p.id]: e.target.value })}
                        className="w-24 h-9"
                        placeholder="—"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      {diff === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={`font-semibold ${
                            diff === 0
                              ? "text-muted-foreground"
                              : diff > 0
                                ? "text-success"
                                : "text-destructive"
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!products.length && (
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
  );
}
