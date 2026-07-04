import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Package, Building2, ShieldCheck } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/finance")({
  component: Finance,
});

function Finance() {
  const { t, lang } = useI18n();

  const { data: salesData } = useQuery({
    queryKey: ["finance-sales"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const { data } = await supabase
        .from("sales")
        .select("total, paid, subtotal, discount, tax, created_at")
        .gte("created_at", since);
      return data ?? [];
    },
  });

  const { data: purchasesData } = useQuery({
    queryKey: ["finance-purchases"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const { data } = await supabase
        .from("purchases")
        .select("total, paid, created_at")
        .gte("created_at", since);
      return data ?? [];
    },
  });

  const { data: saleItemsData } = useQuery({
    queryKey: ["finance-sale-items"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const { data } = await supabase
        .from("sale_items")
        .select("quantity, price, product_id, products(cost)")
        .gte("created_at", since);
      return data ?? [];
    },
  });

  const { data: supplierBalances } = useQuery({
    queryKey: ["finance-supplier-balances"],
    queryFn: async () => {
      const { data } = await supabase
        .from("suppliers")
        .select("name, balance")
        .gt("balance", 0)
        .order("balance", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const { data: topProductsData } = useQuery({
    queryKey: ["finance-top-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sale_items")
        .select("product_name, quantity, price")
        .limit(500);
      const agg: Record<string, { qty: number; revenue: number }> = {};
      (data ?? []).forEach((r: any) => {
        if (!agg[r.product_name]) agg[r.product_name] = { qty: 0, revenue: 0 };
        agg[r.product_name].qty += Number(r.quantity);
        agg[r.product_name].revenue += Number(r.quantity) * Number(r.price);
      });
      return Object.entries(agg)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 8)
        .map(([name, v]) => ({ name, qty: v.qty, revenue: Number(v.revenue.toFixed(2)) }));
    },
  });

  const { data: insuranceClaims } = useQuery({
    queryKey: ["finance-insurance-claims"],
    queryFn: async () => {
      const { data } = await supabase
        .from("insurance_claims")
        .select("company_name, claim_amount, status, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  // Calculate financial summary
  const revenue = (salesData ?? []).reduce((s, r: any) => s + Number(r.total ?? 0), 0);
  const collected = (salesData ?? []).reduce((s, r: any) => s + Number(r.paid ?? 0), 0);
  const expenses = (purchasesData ?? []).reduce((s, r: any) => s + Number(r.total ?? 0), 0);
  const taxCollected = (salesData ?? []).reduce((s, r: any) => s + Number(r.tax ?? 0), 0);

  // COGS: sum of (qty × product.cost) for all sale items
  const cogs = (saleItemsData ?? []).reduce((s: number, r: any) => {
    const cost = Number(r.products?.cost ?? 0);
    return s + Number(r.quantity) * cost;
  }, 0);

  const grossProfit = revenue - cogs;
  const netProfit = revenue - expenses;

  const loc = lang === "ar" ? "ar-EG" : "en-US";
  const fmt = (n: number) =>
    `${n.toLocaleString(loc, { minimumFractionDigits: 2 })} ${t("currency")}`;

  const stats = [
    { label: t("todayRevenue") + " (30 " + t("daysLeft") + ")", value: revenue, icon: TrendingUp, color: "text-primary", bg: "from-primary/15 to-primary/5" },
    { label: t("paid"), value: collected, icon: DollarSign, color: "text-sky-600", bg: "from-sky-500/15 to-sky-500/5" },
    { label: t("cogs"), value: cogs, icon: Package, color: "text-amber-600", bg: "from-amber-500/15 to-amber-500/5" },
    { label: t("grossProfit"), value: grossProfit, icon: TrendingUp, color: grossProfit >= 0 ? "text-emerald-600" : "text-rose-600", bg: grossProfit >= 0 ? "from-emerald-500/15 to-emerald-500/5" : "from-rose-500/15 to-rose-500/5" },
    { label: t("cogs") + " (مشتريات)", value: expenses, icon: TrendingDown, color: "text-rose-600", bg: "from-rose-500/15 to-rose-500/5" },
    { label: t("netProfit"), value: netProfit, icon: Wallet, color: netProfit >= 0 ? "text-emerald-600" : "text-rose-600", bg: "from-muted/40 to-muted/20" },
    { label: t("taxAmount") + " (مُحصَّل)", value: taxCollected, icon: DollarSign, color: "text-purple-600", bg: "from-purple-500/15 to-purple-500/5" },
  ];

  return (
    <div>
      <PageHeader title={t("finance")} icon={<Wallet className="h-5 w-5" />} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <Card key={i} className={`p-5 bg-gradient-to-br ${s.bg}`}>
            <s.icon className={`h-5 w-5 ${s.color} mb-3`} />
            <div className={`text-xl font-extrabold ${s.color}`}>{fmt(s.value)}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Top Products by Revenue */}
        <Card className="p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {t("topSelling")} — الإيرادات
          </h3>
          {!topProductsData?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("noData")}</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                    formatter={(v: any) => [`${Number(v).toFixed(2)} ${t("currency")}`, t("total")]}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[0, 8, 8, 0]} name={t("total")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Supplier Balances */}
        <Card className="p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-rose-500" />
            {t("supplierLedger")}
          </h3>
          {!supplierBalances?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">لا توجد مديونيات</p>
          ) : (
            <div className="space-y-2">
              {supplierBalances.map((s: any, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-rose-500 shrink-0" />
                    <span className="font-medium text-sm">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-600">{fmt(Math.abs(Number(s.balance)))}</span>
                    <Badge variant="outline" className="bg-rose-500/15 text-rose-600 border-rose-500/30 text-[10px]">
                      {t("outstanding")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Profit Summary Card */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">ملخص الأرباح والخسائر — آخر 30 يوم</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">إجمالي الإيرادات</div>
            <div className="text-2xl font-extrabold text-primary">{fmt(revenue)}</div>
          </div>
          <div className="p-4 rounded-xl bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">تكلفة البضاعة المباعة (COGS)</div>
            <div className="text-2xl font-extrabold text-amber-600">{fmt(cogs)}</div>
          </div>
          <div className={`p-4 rounded-xl ${grossProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"}`}>
            <div className="text-xs text-muted-foreground mb-1">هامش الربح الإجمالي</div>
            <div className={`text-2xl font-extrabold ${grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {fmt(grossProfit)}
              {revenue > 0 && (
                <span className="text-sm font-normal ms-1">({((grossProfit / revenue) * 100).toFixed(1)}%)</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Pending Insurance Claims */}
      {insuranceClaims && insuranceClaims.length > 0 && (
        <Card className="p-5 mt-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            مطالبات التأمين المعلقة
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-xs text-muted-foreground border-b border-border">
                  <th className="text-start font-semibold px-4 py-2">{t("insuranceCompany")}</th>
                  <th className="text-start font-semibold px-4 py-2">{t("insuranceClaim")}</th>
                  <th className="text-start font-semibold px-4 py-2">{t("date")}</th>
                  <th className="text-start font-semibold px-4 py-2">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {insuranceClaims.map((claim: any, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-2 font-medium">{claim.company_name}</td>
                    <td className="px-4 py-2 font-bold text-blue-600">{fmt(claim.claim_amount)}</td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">
                      {new Date(claim.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">
                        معلق
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
              {t("insuranceClaim")}: {fmt((insuranceClaims as any[]).reduce((s, c) => s + Number(c.claim_amount), 0))}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              إجمالي المطالبات التأمينية المعلقة التي يجب تحصيلها من شركات التأمين
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
