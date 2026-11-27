import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import { formatDate, formatInvoiceItemsSummary } from "@/lib/serializers";
import { getSalesInvoicesByCompany } from "@/services/accounting.service";
import { SalesClient } from "@/components/sales/SalesClient";
import type { SalesInvoiceRow } from "@/types";

export default async function SalesPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const { companyId } = tenantWhere(session);
  const invoices = await getSalesInvoicesByCompany(companyId);

  const serialized: SalesInvoiceRow[] = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: `#S-${inv.id.slice(-5).toUpperCase()}`,
    date: formatDate(inv.createdAt),
    customerName: inv.customerName,
    itemsSummary: formatInvoiceItemsSummary(inv.items),
    directCost: inv.directCost.toNumber(),
    totalAmount: inv.totalRevenue.toNumber(),
    paymentStatus: inv.paymentStatus,
  }));

  return <SalesClient sales={serialized} />;
}
