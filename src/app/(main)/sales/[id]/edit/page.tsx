import React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { toDateInputString } from "@/lib/accounting-math";
import { tenantWhere } from "@/lib/tenant";
import { serializeProduct, serializeSafe } from "@/lib/serializers";
import { getSaleInvoiceByIdForCompany } from "@/services/accounting.service";
import { getProductsByCompany } from "@/services/inventory.service";
import { getSafesByCompany } from "@/services/settings.service";
import { NewSaleForm } from "@/components/sales/NewSaleForm";
import type { SalesInvoiceFormInitialData } from "@/types";

interface EditSalePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSalePage({ params }: EditSalePageProps) {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const { id } = await params;
  const { companyId } = tenantWhere(session);
  const [invoice, products, safes] = await Promise.all([
    getSaleInvoiceByIdForCompany(companyId, id),
    getProductsByCompany(companyId),
    getSafesByCompany(companyId),
  ]);

  if (!invoice) {
    notFound();
  }

  const totalAmount = invoice.totalAmount.gt(0)
    ? invoice.totalAmount.toNumber()
    : invoice.totalRevenue.toNumber();

  const initialData: SalesInvoiceFormInitialData = {
    id: invoice.id,
    invoiceNumber: `#S-${invoice.id.slice(-5).toUpperCase()}`,
    paymentStatus: invoice.paymentStatus,
    safeId: invoice.safeId,
    customerName: invoice.customerName ?? "",
    directCost: invoice.directCost.toNumber(),
    taxType: invoice.taxType,
    taxValue: invoice.taxValue.toNumber(),
    notes: invoice.notes ?? "",
    invoiceDate: toDateInputString(invoice.createdAt),
    totalAmount,
    items: invoice.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
    })),
  };

  return (
    <NewSaleForm
      products={products.map(serializeProduct)}
      safes={safes.map(serializeSafe)}
      initialData={initialData}
    />
  );
}
