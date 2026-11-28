import React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { toDateInputString } from "@/lib/accounting-math";
import { tenantWhere } from "@/lib/tenant";
import { serializeProduct, serializeSafe } from "@/lib/serializers";
import { getPurchaseInvoiceByIdForCompany } from "@/services/accounting.service";
import { getProductsByCompany } from "@/services/inventory.service";
import { getSafesByCompany } from "@/services/settings.service";
import { NewPurchaseForm } from "@/components/purchases/NewPurchaseForm";
import type { PurchaseInvoiceFormInitialData } from "@/types";

interface EditPurchasePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPurchasePage({
  params,
}: EditPurchasePageProps) {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const { id } = await params;
  const { companyId } = tenantWhere(session);
  const [invoice, products, safes] = await Promise.all([
    getPurchaseInvoiceByIdForCompany(companyId, id),
    getProductsByCompany(companyId),
    getSafesByCompany(companyId),
  ]);

  if (!invoice) {
    notFound();
  }

  const initialData: PurchaseInvoiceFormInitialData = {
    id: invoice.id,
    invoiceNumber: `#P-${invoice.id.slice(-5).toUpperCase()}`,
    safeId: invoice.safeId,
    supplierName: invoice.supplierName ?? "",
    notes: invoice.notes ?? "",
    invoiceDate: toDateInputString(invoice.createdAt),
    totalAmount: invoice.totalAmount.toNumber(),
    items: invoice.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      unitCost: item.unitCost.toNumber(),
    })),
  };

  return (
    <NewPurchaseForm
      products={products.map(serializeProduct)}
      safes={safes.map(serializeSafe)}
      initialData={initialData}
    />
  );
}
