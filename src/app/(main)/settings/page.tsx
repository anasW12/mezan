import React from "react";
import { redirect } from "next/navigation";
import { auth, GOOGLE_OAUTH_SENTINEL } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";
import { formatDate, serializeSafe } from "@/lib/serializers";
import { getCompanySettingsData } from "@/services/settings.service";
import { SettingsClient } from "@/components/settings/SettingsClient";
import type { FixedAssetRow } from "@/types";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.companyId) {
    redirect("/login");
  }

  const { companyId } = tenantWhere(session);
  const [{ company, safes, fixedAssets }, userRecord] = await Promise.all([
    getCompanySettingsData(companyId),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, passwordHash: true },
    }),
  ]);

  const serializedAssets: FixedAssetRow[] = fixedAssets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    purchaseValue: asset.purchaseValue.toNumber(),
    purchaseDate: formatDate(asset.purchaseDate),
  }));

  const hasPassword = Boolean(
    userRecord?.passwordHash &&
      userRecord.passwordHash !== GOOGLE_OAUTH_SENTINEL
  );

  return (
    <SettingsClient
      initialCompanyName={company?.name ?? "شركتي"}
      currency={company?.currency ?? "EGP"}
      safes={safes.map(serializeSafe)}
      fixedAssets={serializedAssets}
      accountEmail={userRecord?.email ?? session.user.email}
      hasPassword={hasPassword}
    />
  );
}
