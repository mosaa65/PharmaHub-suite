import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { CrudTable } from "@/components/crud-table";

export const Route = createFileRoute("/_authenticated/suppliers")({
  component: Suppliers,
});

function Suppliers() {
  const { t } = useI18n();
  return (
    <div>
      <PageHeader title={t("suppliers")} icon={<Building2 className="h-5 w-5" />} />
      <CrudTable
        table="suppliers"
        queryKey="suppliers"
        addLabel={t("addSupplier")}
        searchableColumns={["name", "phone", "email"]}
        fields={[
          { key: "name", label: t("name"), required: true },
          { key: "phone", label: t("phone") },
          { key: "email", label: t("email") },
          { key: "address", label: t("address") },
          { key: "balance", label: t("balance"), type: "number" },
          { key: "rating", label: t("rating"), type: "number" },
          { key: "notes", label: t("notes"), type: "textarea", hideInList: true },
        ]}
      />
    </div>
  );
}
