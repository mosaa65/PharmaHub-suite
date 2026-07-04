import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Package, PieChart as PieIcon } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/reports")({
  component: Reports,
});

const PALETTE = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#059669", "#047857", "#065f46"];

function Reports() {
  const { t, lang } = useI18n();
  const loc = lang === "ar" ? "ar-EG" : "en-US";

  const { data: trend = [] } = useQuery({
    queryKey: ["sales-trend-30d"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase.from("sales").select("total, created_at").gte("created_at", since);
      const buckets: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(5, 10);
        buckets[d] = 0;
      }
      (data ?? []).forEach((r: any) => {
        const k = new Date(r.created_at).toISOString().slice(5, 10);
        if (k in buckets) buckets[k] += Number(r.total);
      });
      return Object.entries(buckets).map(([date, total]) => ({ date, total: Number(total.toFixed(2)) }));
    },
  });

  const { data: top = [] } = useQuery({
    queryKey: ["top-selling-chart"],
    queryFn: async () => {
      const { data } = await supabase.from("sale_items").select("product_name, quantity").limit(1000);
      const agg: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        agg[r.product_name] = (agg[r.product_name] ?? 0) + Number(r.quantity);
      });
      return Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, qty]) => ({ name, qty }));
    },
  });

  const { data: catShare = [] } = useQuery({
    queryKey: ["category-share"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("category, quantity");
      const agg: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        const k = r.category || (lang === "ar" ? "بدون فئة" : "Uncategorized");
        agg[k] = (agg[k] ?? 0) + Number(r.quantity);
      });
      return Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
    },
  });

  const totalRevenue = trend.reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <PageHeader title={t("reports")} icon={<BarChart3 className="h-5 w-5" />} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <TrendingUp className="h-3.5 w-3.5" /> {t("last30Days")}
          </div>
          <div className="text-2xl font-extrabold">
            {totalRevenue.toLocaleString(loc, { minimumFractionDigits: 2 })} {t("currency")}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Package className="h-3.5 w-3.5" /> {t("topProducts")}
          </div>
          <div className="text-2xl font-extrabold">{top.length}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <PieIcon className="h-3.5 w-3.5" /> {t("categoryShare")}
          </div>
          <div className="text-2xl font-extrabold">{catShare.length}</div>
        </Card>
      </div>

      <Card className="p-5 mb-6">
        <h3 className="font-bold mb-4">{t("salesTrend")} — {t("last30Days")}</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                formatter={(v: any) => [`${Number(v).toLocaleString(loc)} ${t("currency")}`, t("total")]}
              />
              <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        <Card className="p-5">
          <h3 className="font-bold mb-4">{t("topProducts")}</h3>
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">{t("noData")}</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Bar dataKey="qty" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-bold mb-4">{t("categoryShare")}</h3>
          {catShare.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">{t("noData")}</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catShare} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {catShare.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
