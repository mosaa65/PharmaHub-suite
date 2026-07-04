import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings2, Save, Store, Receipt, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

type SettingMap = Record<string, string>;

async function fetchSettings(): Promise<SettingMap> {
  const { data } = await supabase.from("pharmacy_settings").select("key, value");
  const map: SettingMap = {};
  (data ?? []).forEach((r: any) => { map[r.key] = r.value ?? ""; });
  return map;
}

async function saveSettings(updates: SettingMap) {
  const rows = Object.entries(updates).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
  for (const row of rows) {
    await supabase.from("pharmacy_settings").upsert(row, { onConflict: "key" });
  }
}

function SettingsPage() {
  const { t } = useI18n();
  const tab = useRouterState({ select: (s) => new URLSearchParams(s.location.searchStr).get("tab") ?? "pharmacy" });
  const qc = useQueryClient();
  const { data: stored = {} } = useQuery({ queryKey: ["pharmacy-settings"], queryFn: fetchSettings });
  const [form, setForm] = useState<SettingMap>({});

  useEffect(() => {
    if (Object.keys(stored).length > 0) setForm(stored);
  }, [stored]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const saveMut = useMutation({
    mutationFn: () => saveSettings(form),
    onSuccess: () => {
      toast.success(t("settingsSaved"));
      qc.invalidateQueries({ queryKey: ["pharmacy-settings"] });
    },
    onError: () => toast.error(t("error")),
  });

  return (
    <div>
      <PageHeader
        title={t("settings")}
        icon={<Settings2 className="h-5 w-5" />}
        actions={
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="gap-2 gradient-primary">
            <Save className="h-4 w-4" />
            {t("saveSettings")}
          </Button>
        }
      />

      <Tabs value={tab} className="space-y-4">
        <TabsList className="bg-card/80 backdrop-blur border border-border/60 p-1 rounded-xl flex-wrap h-auto">
          <TabsTrigger value="pharmacy" className="gap-2 rounded-lg">
            <Store className="h-4 w-4" /> {t("pharmacyInfo")}
          </TabsTrigger>
          <TabsTrigger value="tax" className="gap-2 rounded-lg">
            <Receipt className="h-4 w-4" /> {t("taxRate")}
          </TabsTrigger>
          <TabsTrigger value="print" className="gap-2 rounded-lg">
            <Printer className="h-4 w-4" /> {t("print")}
          </TabsTrigger>
        </TabsList>

        {/* Pharmacy Info */}
        <TabsContent value="pharmacy">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              {t("pharmacyInfo")}
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">{t("pharmacyName")} *</Label>
                <Input
                  value={form.pharmacy_name ?? ""}
                  onChange={(e) => set("pharmacy_name", e.target.value)}
                  placeholder="صيدليتي"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">{t("pharmacyNameEn")}</Label>
                <Input
                  value={form.pharmacy_name_en ?? ""}
                  onChange={(e) => set("pharmacy_name_en", e.target.value)}
                  placeholder="My Pharmacy"
                  dir="ltr"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block">{t("pharmacyAddress")}</Label>
                <Input
                  value={form.pharmacy_address ?? ""}
                  onChange={(e) => set("pharmacy_address", e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">{t("pharmacyPhone")}</Label>
                <Input
                  value={form.pharmacy_phone ?? ""}
                  onChange={(e) => set("pharmacy_phone", e.target.value)}
                  type="tel"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">{t("pharmacyEmail")}</Label>
                <Input
                  value={form.pharmacy_email ?? ""}
                  onChange={(e) => set("pharmacy_email", e.target.value)}
                  type="email"
                  dir="ltr"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tax Settings */}
        <TabsContent value="tax">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {t("taxRate")}
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">{t("vatNumber")}</Label>
                <Input
                  value={form.vat_number ?? ""}
                  onChange={(e) => set("vat_number", e.target.value)}
                  placeholder="300000000000000"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  يظهر على الفاتورة الضريبية ويُستخدم في توليد رمز QR المتوافق مع هيئة الزكاة
                </p>
              </div>
              <div>
                <Label className="mb-1.5 block">{t("taxRate")} (%)</Label>
                <Input
                  value={form.tax_rate ?? "15"}
                  onChange={(e) => set("tax_rate", e.target.value)}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">{t("currency")}</Label>
                <Input
                  value={form.currency ?? "ج.م"}
                  onChange={(e) => set("currency", e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-sm font-medium text-primary mb-1">⚡ QR Code الضريبي</p>
              <p className="text-xs text-muted-foreground">
                سيتم توليد QR Code تلقائياً في كل فاتورة يحتوي على: اسم الصيدلية، الرقم الضريبي، التاريخ، إجمالي الفاتورة، ومبلغ الضريبة — متوافق مع معيار ZATCA.
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Print Settings */}
        <TabsContent value="print">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              {t("print")}
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">{t("paperSizeSettings")}</Label>
                <Select
                  value={form.paper_size ?? "80mm"}
                  onValueChange={(v) => set("paper_size", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm — حرارية صغيرة</SelectItem>
                    <SelectItem value="80mm">80mm — حرارية قياسية</SelectItem>
                    <SelectItem value="a4">A4 — طابعة عادية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block">{t("receiptFooter")}</Label>
                <Textarea
                  value={form.receipt_footer ?? ""}
                  onChange={(e) => set("receipt_footer", e.target.value)}
                  rows={3}
                  placeholder="شكراً لزيارتكم"
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
