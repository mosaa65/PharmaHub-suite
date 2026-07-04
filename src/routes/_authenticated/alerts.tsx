import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Calendar, PackageX, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const { t, lang } = useI18n();

  const { data } = useQuery({
    queryKey: ["alerts-center"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const in90 = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
      const [out, low, expSoon, expired] = await Promise.all([
        supabase.from("products").select("id, name, quantity").eq("quantity", 0).order("name"),
        supabase.from("products").select("id, name, quantity, min_stock").gt("quantity", 0).lte("quantity", 10).order("quantity"),
        supabase.from("products").select("id, name, expiry_date").not("expiry_date", "is", null).gt("expiry_date", today).lte("expiry_date", in90).order("expiry_date"),
        supabase.from("products").select("id, name, expiry_date").not("expiry_date", "is", null).lte("expiry_date", today).order("expiry_date"),
      ]);
      return {
        out: out.data ?? [],
        low: low.data ?? [],
        expSoon: expSoon.data ?? [],
        expired: expired.data ?? [],
      };
    },
  });

  const total = (data?.out.length ?? 0) + (data?.low.length ?? 0) + (data?.expSoon.length ?? 0) + (data?.expired.length ?? 0);

  const daysBetween = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

  const Section = ({
    title, items, icon: Icon, tone, render,
  }: any) => (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <h3 className="font-bold">{title}</h3>
        </div>
        <Badge variant="secondary" className="font-bold">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{t("noAlerts")}</p>
      ) : (
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {items.map(render)}
        </ul>
      )}
    </Card>
  );

  return (
    <div>
      <PageHeader
        title={t("alertsCenter")}
        description={`${total} ${lang === "ar" ? "تنبيه نشط" : "active alerts"}`}
        icon={<Bell className="h-5 w-5" />}
      />

      <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
        <Section
          title={t("outOfStock")}
          icon={PackageX}
          tone="bg-destructive/10 text-destructive"
          items={data?.out ?? []}
          render={(p: any) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg bg-destructive/5 px-3 py-2 text-sm">
              <Link to="/inventory" className="truncate font-medium hover:text-primary">{p.name}</Link>
              <Badge variant="destructive" className="shrink-0">0</Badge>
            </li>
          )}
        />
        <Section
          title={t("lowStockAlert")}
          icon={AlertTriangle}
          tone="bg-warning/15 text-warning"
          items={data?.low ?? []}
          render={(p: any) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg bg-warning/5 px-3 py-2 text-sm">
              <Link to="/inventory" className="truncate font-medium hover:text-primary">{p.name}</Link>
              <span className="shrink-0 text-warning font-bold">{p.quantity} / {p.min_stock}</span>
            </li>
          )}
        />
        <Section
          title={t("expiringSoon")}
          icon={Calendar}
          tone="bg-amber-400/15 text-amber-600"
          items={data?.expSoon ?? []}
          render={(p: any) => {
            const days = daysBetween(p.expiry_date);
            return (
              <li key={p.id} className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-sm">
                <Link to="/inventory" className="truncate font-medium hover:text-primary">{p.name}</Link>
                <span className="shrink-0 text-xs font-bold text-amber-700 dark:text-amber-400">
                  {days} {t("daysLeft")}
                </span>
              </li>
            );
          }}
        />
        <Section
          title={lang === "ar" ? "منتهية الصلاحية" : "Expired"}
          icon={Calendar}
          tone="bg-destructive/10 text-destructive"
          items={data?.expired ?? []}
          render={(p: any) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg bg-destructive/5 px-3 py-2 text-sm">
              <Link to="/inventory" className="truncate font-medium hover:text-primary">{p.name}</Link>
              <span className="shrink-0 text-xs font-bold text-destructive">{p.expiry_date}</span>
            </li>
          )}
        />
      </div>
    </div>
  );
}
