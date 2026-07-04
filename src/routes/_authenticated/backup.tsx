import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Database, FileSpreadsheet, FileText, Download, HardDriveDownload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportToExcel, exportToPdf, downloadJson } from "@/lib/export";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/backup")({
  component: Backup,
});

const tables = [
  "products",
  "customers",
  "suppliers",
  "sales",
  "sale_items",
  "purchases",
  "purchase_items",
  "prescriptions",
  "sale_returns",
  "stock_takes",
  "warehouses",
  "stock_transfers",
] as const;

function Backup() {
  const { t } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);

  const fetchTable = async (tbl: string) => {
    const { data, error } = await supabase.from(tbl as any).select("*").limit(5000);
    if (error) throw error;
    return data ?? [];
  };

  const onExcel = async (tbl: string) => {
    setBusy(tbl + ":xlsx");
    try {
      const rows = await fetchTable(tbl);
      if (!rows.length) {
        toast.info(t("noData"));
        return;
      }
      exportToExcel(rows as any, `${tbl}-${new Date().toISOString().slice(0, 10)}`, tbl);
      toast.success(t("success"));
    } catch (e: any) {
      toast.error(e?.message ?? t("error"));
    } finally {
      setBusy(null);
    }
  };

  const onPdf = async (tbl: string) => {
    setBusy(tbl + ":pdf");
    try {
      const rows = await fetchTable(tbl);
      if (!rows.length) {
        toast.info(t("noData"));
        return;
      }
      const cols = Object.keys(rows[0] as any).slice(0, 6);
      const body = (rows as any[]).map((r) =>
        cols.map((c) => {
          const v = r[c];
          if (v === null || v === undefined) return "";
          if (typeof v === "object") return JSON.stringify(v).slice(0, 30);
          return String(v).slice(0, 40);
        }),
      );
      exportToPdf(tbl, cols, body, `${tbl}-${new Date().toISOString().slice(0, 10)}`);
      toast.success(t("success"));
    } catch (e: any) {
      toast.error(e?.message ?? t("error"));
    } finally {
      setBusy(null);
    }
  };

  const onFullBackup = async () => {
    setBusy("full");
    try {
      const dump: Record<string, unknown> = { exportedAt: new Date().toISOString() };
      for (const tbl of tables) {
        dump[tbl] = await fetchTable(tbl);
      }
      downloadJson(dump, `pharmacy-backup-${new Date().toISOString().slice(0, 10)}`);
      toast.success(t("backupReady"));
    } catch (e: any) {
      toast.error(e?.message ?? t("error"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("backupExport")}
        icon={<Database className="h-5 w-5" />}
        actions={
          <Button onClick={onFullBackup} disabled={busy === "full"} className="gap-2">
            <HardDriveDownload className="h-4 w-4" />
            {t("fullBackup")}
          </Button>
        }
      />

      <Card className="p-4 mb-4 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground">
            <Download className="h-5 w-5" />
          </div>
          <div className="text-sm text-muted-foreground">{t("backupDesc")}</div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((tbl) => (
          <Card key={tbl} className="p-4 transition hover:shadow-soft">
            <div className="font-semibold mb-3 capitalize">{tbl.replace("_", " ")}</div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExcel(tbl)}
                disabled={busy?.startsWith(tbl)}
                className="flex-1 gap-1.5"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPdf(tbl)}
                disabled={busy?.startsWith(tbl)}
                className="flex-1 gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                PDF
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
