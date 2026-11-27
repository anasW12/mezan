import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import { serializeProduct, serializeSafe } from "@/lib/serializers";
import { getProductsByCompany } from "@/services/inventory.service";
import { getSafesByCompany } from "@/services/settings.service";
import { NewPurchaseForm } from "@/components/purchases/NewPurchaseForm";

export default async function NewPurchasePage() {
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
    <NewPurchaseForm
      products={products.map(serializeProduct)}
      safes={safes.map(serializeSafe)}
    />
  );
}
