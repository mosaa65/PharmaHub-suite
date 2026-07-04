import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { SearchAddBar } from "@/components/search-add-bar";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea";
  required?: boolean;
  hideInList?: boolean;
  format?: (v: any) => string;
}

interface Props {
  table: string;
  queryKey: string;
  searchableColumns: string[];
  fields: FieldDef[];
  addLabel: string;
}

export function CrudTable({ table, queryKey, searchableColumns, fields, addLabel }: Props) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const { data: rows = [], isLoading } = useQuery({
    queryKey: [queryKey, search],
    queryFn: async () => {
      let q = supabase.from(table as any).select("*").order("created_at", { ascending: false }).limit(100);
      if (search) q = q.or(searchableColumns.map((c) => `${c}.ilike.%${search}%`).join(","));
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const mutate = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      for (const f of fields) {
        if (form[f.key] === "" || form[f.key] === undefined) payload[f.key] = null;
        else if (f.type === "number") payload[f.key] = Number(form[f.key]);
        else payload[f.key] = form[f.key];
      }
      if (editing) {
        const { error } = await supabase.from(table as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("success"));
      setOpen(false);
      setEditing(null);
      setForm({});
      qc.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (e: any) => toast.error(e?.message ?? t("error")),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("success"));
      qc.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (e: any) => toast.error(e?.message ?? t("error")),
  });

  const startEdit = (row: any) => {
    setEditing(row);
    setForm(row);
    setOpen(true);
  };

  const startAdd = () => {
    setEditing(null);
    setForm({});
    setOpen(true);
  };

  const listFields = fields.filter((f) => !f.hideInList);

  return (
    <Card className="p-4 lg:p-5">
      <SearchAddBar
        search={search}
        onSearchChange={setSearch}
        onAdd={startAdd}
        addLabel={addLabel}
        placeholder={t("search")}
        className="mb-4"
      />

      <div className="overflow-x-auto -mx-4 lg:mx-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-start text-xs text-muted-foreground border-b border-border">
              {listFields.map((f) => (
                <th key={f.key} className="text-start font-semibold px-3 py-2.5">{f.label}</th>
              ))}
              <th className="px-3 py-2.5 text-end">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={listFields.length + 1} className="text-center py-10 text-muted-foreground">{t("loading")}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={listFields.length + 1} className="text-center py-10 text-muted-foreground">{t("noData")}</td></tr>
            ) : (
              rows.map((row: any) => (
                <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30 transition">
                  {listFields.map((f) => (
                    <td key={f.key} className="px-3 py-3 truncate max-w-[200px]">
                      {f.format ? f.format(row[f.key]) : (row[f.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-end">
                    <div className="inline-flex gap-1">
                      <button onClick={() => startEdit(row)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-accent">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm(t("confirmDelete"))) remove.mutate(row.id); }}
                        className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("edit") : addLabel}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); mutate.mutate(); }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {fields.map((f) => (
              <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                <Label className="text-xs">{f.label}{f.required && " *"}</Label>
                {f.type === "textarea" ? (
                  <textarea
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    required={f.required}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                  />
                ) : (
                  <Input
                    type={f.type ?? "text"}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    required={f.required}
                    className="mt-1 h-9"
                  />
                )}
              </div>
            ))}
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
              <Button type="submit" disabled={mutate.isPending}>{t("save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
