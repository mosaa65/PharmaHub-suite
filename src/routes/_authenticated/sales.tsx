import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/sales")({
  component: SalesHistory,
});

function SalesHistory() {
  const { t, lang } = useI18n();
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const loc = lang === "ar" ? "ar-EG" : "en-US";
  const fmt = (n: number) => `${Number(n).toLocaleString(loc, { minimumFractionDigits: 2 })} ${t("currency")}`;

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales-history", search, from, to],
    queryFn: async () => {
      let q = supabase
        .from("sales")
        .select("id, invoice_number, total, paid, status, payment_method, created_at, customers(name), sale_items(id, product_name, quantity, price, discount)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (search) q = q.or(`invoice_number.ilike.%${search}%,id.ilike.%${search}%,customers.name.ilike.%${search}%`);
      if (from) q = q.gte("created_at", from);
      if (to) q = q.lte("created_at", `${to}T23:59:59`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const selected = useMemo(() => sales.find((s: any) => s.id === openId) ?? null, [sales, openId]);

  return (
    <div>
      <PageHeader title={t("salesHistory")} icon={<History className="h-5 w-5" />} />

      <div className="grid gap-3 mb-4 md:grid-cols-[1.2fr_1fr_1fr]">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} className="h-10 rounded-full" />
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 rounded-full" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 rounded-full" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-xs text-muted-foreground border-b border-border">
                  <th className="px-4 py-3 text-start">{t("invoiceNumber")}</th>
                  <th className="px-4 py-3 text-start">{t("date")}</th>
                  <th className="px-4 py-3 text-start">{t("customerName")}</th>
                  <th className="px-4 py-3 text-start">{t("total")}</th>
                  <th className="px-4 py-3 text-start">{t("invoiceStatus")}</th>
                  <th className="px-4 py-3 text-start">{t("paymentMethod")}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">{t("loading")}</td></tr>
                ) : sales.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">{t("noData")}</td></tr>
                ) : sales.map((sale: any) => (
                  <tr key={sale.id} onClick={() => setOpenId(sale.id)} className="cursor-pointer border-b border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{sale.invoice_number ?? `#${sale.id.slice(0, 8)}`}</td>
                    <td className="px-4 py-3 text-xs">{new Date(sale.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{sale.customers?.name ?? t("walkIn")}</td>
                    <td className="px-4 py-3 font-semibold">{fmt(Number(sale.total))}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="rounded-full">{sale.status}</Badge></td>
                    <td className="px-4 py-3">{sale.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4">
          {!selected ? (
            <div className="py-16 text-center text-sm text-muted-foreground">{t("salesDetails")}</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{selected.invoice_number ?? `#${selected.id.slice(0, 8)}`}</div>
                  <div className="text-xs text-muted-foreground">{new Date(selected.created_at).toLocaleString()}</div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpenId(null)}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {(selected.sale_items ?? []).map((item: any) => (
                  <div key={item.id} className="rounded-xl border border-border/60 p-3">
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.quantity} × {fmt(Number(item.price))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>{t("total")}</span><span>{fmt(Number(selected.total))}</span></div>
                <div className="flex justify-between"><span>{t("paid")}</span><span>{fmt(Number(selected.paid))}</span></div>
                <div className="flex justify-between"><span>{t("paymentMethod")}</span><span>{selected.payment_method}</span></div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
