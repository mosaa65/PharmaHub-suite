import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UserCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/staff")({
  component: Staff,
});

function Staff() {
  const { t } = useI18n();
  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, phone, created_at, user_roles(role)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader title={t("staff")} icon={<UserCircle2 className="h-5 w-5" />} />
      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-xs text-muted-foreground border-b border-border">
                <th className="text-start font-semibold px-3 py-2.5">{t("name")}</th>
                <th className="text-start font-semibold px-3 py-2.5">{t("phone")}</th>
                <th className="text-start font-semibold px-3 py-2.5">الدور</th>
                <th className="text-start font-semibold px-3 py-2.5">{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">{t("noData")}</td></tr>
              ) : (
                staff.map((u: any) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-3 py-3 font-medium">{u.full_name ?? "—"}</td>
                    <td className="px-3 py-3">{u.phone ?? "—"}</td>
                    <td className="px-3 py-3">
                      {(u.user_roles ?? []).map((r: any) => (
                        <span key={r.role} className="inline-flex rounded-full bg-primary/15 text-primary px-2 py-0.5 text-xs font-semibold me-1">
                          {r.role}
                        </span>
                      ))}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
