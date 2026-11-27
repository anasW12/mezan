import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import { formatDate, formatInvoiceItemsSummary } from "@/lib/serializers";
import { getPurchaseInvoicesByCompany } from "@/services/accounting.service";
import { PurchasesClient } from "@/components/purchases/PurchasesClient";
import type { PurchaseInvoiceRow } from "@/types";

export default async function PurchasesPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const { companyId } = tenantWhere(session);
  const invoices = await getPurchaseInvoicesByCompany(companyId);

  const serialized: PurchaseInvoiceRow[] = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: `#P-${inv.id.slice(-5).toUpperCase()}`,
    date: formatDate(inv.createdAt),
    supplierName: inv.supplierName ?? "مورد مباشر",
    safeName: inv.safe.name,
    itemsSummary: formatInvoiceItemsSummary(inv.items),
    totalAmount: inv.totalAmount.toNumber(),
  }));

  return <PurchasesClient purchases={serialized} />;
}
