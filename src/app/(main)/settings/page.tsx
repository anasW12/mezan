import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import { formatDate, serializeSafe } from "@/lib/serializers";
import { getCompanySettingsData } from "@/services/settings.service";
import { SettingsClient } from "@/components/settings/SettingsClient";
import type { FixedAssetRow } from "@/types";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const { companyId } = tenantWhere(session);
  const { company, safes, fixedAssets } =
    await getCompanySettingsData(companyId);

  const serializedAssets: FixedAssetRow[] = fixedAssets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    purchaseValue: asset.purchaseValue.toNumber(),
    purchaseDate: formatDate(asset.purchaseDate),
  }));

  return (
    <SettingsClient
      initialCompanyName={company?.name ?? "شركتي"}
      currency={company?.currency ?? "EGP"}
      safes={safes.map(serializeSafe)}
      fixedAssets={serializedAssets}
    />
  );
}
