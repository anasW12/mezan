import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import { serializeProduct, serializeSafe } from "@/lib/serializers";
import { getProductsByCompany } from "@/services/inventory.service";
import { getSafesByCompany } from "@/services/settings.service";
import { NewSaleForm } from "@/components/sales/NewSaleForm";

export default async function NewSalePage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const { companyId } = tenantWhere(session);
  const [products, safes] = await Promise.all([
    getProductsByCompany(companyId),
    getSafesByCompany(companyId),
  ]);

  return (
    <NewSaleForm
      products={products.map(serializeProduct)}
      safes={safes.map(serializeSafe)}
    />
  );
}
