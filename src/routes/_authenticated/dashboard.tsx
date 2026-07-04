import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Package, Users, DollarSign, AlertTriangle, Calendar, TrendingUp, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useI18n();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [products, customers, salesToday, lowStock, nearExpiry] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("sales").select("total").gte("created_at", today.toISOString()),
        supabase.from("products").select("id, name, quantity, min_stock").lte("quantity", 10).limit(5),
        supabase
          .from("products")
          .select("id, name, expiry_date")
          .not("expiry_date", "is", null)
          .lte("expiry_date", new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10))
          .limit(5),
      ]);
      const revenue = (salesToday.data ?? []).reduce((s, r: any) => s + Number(r.total ?? 0), 0);
      return {
        products: products.count ?? 0,
        customers: customers.count ?? 0,
        salesCount: salesToday.data?.length ?? 0,
        revenue,
        lowStock: lowStock.data ?? [],
        nearExpiry: nearExpiry.data ?? [],
      };
    },
  });

  const cards = [
    {
      label: t("todayRevenue"),
      value: `${(stats?.revenue ?? 0).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")} ${t("currency")}`,
      icon: DollarSign,
      tint: "from-emerald-400/20 to-emerald-500/5",
    },
    { label: t("todaySales"), value: stats?.salesCount ?? 0, icon: ShoppingCart, tint: "from-sky-400/20 to-sky-500/5" },
    { label: t("productsCount"), value: stats?.products ?? 0, icon: Package, tint: "from-amber-400/20 to-amber-500/5" },
    { label: t("customersCount"), value: stats?.customers ?? 0, icon: Users, tint: "from-violet-400/20 to-violet-500/5" },
  ];

  return (
    <div>
      <PageHeader
        title={t("dashboard")}
        description={t("appTagline")}
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {cards.map((c, i) => (
          <Card key={i} className={`p-5 bg-gradient-to-br ${c.tint} border-border/60 shadow-soft`}>
            <div className="flex items-center justify-between mb-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-card/70 text-primary shadow-soft">
                <c.icon className="h-4.5 w-4.5" />
              </div>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div className="text-2xl font-extrabold tracking-tight">{c.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4.5 w-4.5 text-warning" />
            <h3 className="font-bold">{t("lowStockAlert")}</h3>
          </div>
          {stats?.lowStock.length ? (
            <ul className="space-y-2">
              {stats.lowStock.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="shrink-0 text-warning font-bold">{p.quantity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4.5 w-4.5 text-destructive" />
            <h3 className="font-bold">{t("expiryAlert")}</h3>
          </div>
          {stats?.nearExpiry.length ? (
            <ul className="space-y-2">
              {stats.nearExpiry.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="shrink-0 text-destructive font-bold text-xs">{p.expiry_date}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h3 className="font-bold mb-4">{t("quickActions")}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Link to="/pos" className="rounded-xl p-4 bg-primary/10 hover:bg-primary/15 transition text-center">
            <ShoppingCart className="h-5 w-5 mx-auto text-primary mb-1.5" />
            <div className="text-xs font-semibold">{t("pos")}</div>
          </Link>
          <Link to="/inventory" className="rounded-xl p-4 bg-accent/40 hover:bg-accent/60 transition text-center">
            <Package className="h-5 w-5 mx-auto text-accent-foreground mb-1.5" />
            <div className="text-xs font-semibold">{t("addProduct")}</div>
          </Link>
          <Link to="/customers" className="rounded-xl p-4 bg-secondary/60 hover:bg-secondary transition text-center">
            <Users className="h-5 w-5 mx-auto mb-1.5" />
            <div className="text-xs font-semibold">{t("customers")}</div>
          </Link>
          <Link to="/reports" className="rounded-xl p-4 bg-muted/60 hover:bg-muted transition text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1.5" />
            <div className="text-xs font-semibold">{t("reports")}</div>
          </Link>
        </div>
      </Card>
    </div>
  );
}
