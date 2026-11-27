import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import { serializeProduct } from "@/lib/serializers";
import { getProductsByCompany } from "@/services/inventory.service";
import { InventoryClient } from "@/components/inventory/InventoryClient";

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const { companyId } = tenantWhere(session);
  const products = await getProductsByCompany(companyId);

  return <InventoryClient products={products.map(serializeProduct)} />;
}
