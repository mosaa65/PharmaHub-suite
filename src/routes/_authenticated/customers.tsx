import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { CrudTable } from "@/components/crud-table";

export const Route = createFileRoute("/_authenticated/customers")({
  component: Customers,
});

function Customers() {
  const { t } = useI18n();
  return (
    <div>
      <PageHeader title={t("customers")} icon={<Users className="h-5 w-5" />} />
      <CrudTable
        table="customers"
        queryKey="customers"
        addLabel={t("addCustomer")}
        searchableColumns={["name", "phone", "email"]}
        fields={[
          { key: "name", label: t("name"), required: true },
          { key: "phone", label: t("phone") },
          { key: "email", label: t("email") },
          { key: "balance", label: t("balance"), type: "number" },
          { key: "points", label: t("points"), type: "number" },
          { key: "notes", label: t("notes"), type: "textarea", hideInList: true },
        ]}
      />
    </div>
  );
}
