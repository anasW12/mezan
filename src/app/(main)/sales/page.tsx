import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { toDateInputString } from "@/lib/accounting-math";
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

  const serialized: SalesInvoiceRow[] = invoices.map((inv) => {
    const totalAmount = inv.totalAmount.gt(0)
      ? inv.totalAmount.toNumber()
      : inv.totalRevenue.toNumber();
    const subtotal = inv.subtotal.gt(0)
      ? inv.subtotal.toNumber()
      : totalAmount;

    return {
      id: inv.id,
      invoiceNumber: `#S-${inv.id.slice(-5).toUpperCase()}`,
      date: formatDate(inv.createdAt),
      invoiceDateInput: toDateInputString(inv.createdAt),
      customerName: inv.customerName,
      safeName: inv.safe?.name ?? null,
      itemsSummary: formatInvoiceItemsSummary(inv.items),
      items: inv.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        lineTotal:
          Math.round(item.quantity * item.unitPrice.toNumber() * 100) / 100,
      })),
      directCost: inv.directCost.toNumber(),
      subtotal,
      taxType: inv.taxType,
      taxValue: inv.taxValue.toNumber(),
      taxAmount: inv.taxAmount.toNumber(),
      totalAmount,
      paymentStatus: inv.paymentStatus,
      notes: inv.notes,
    };
  });

  return <SalesClient sales={serialized} />;
}
