import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import {
  serializeAuditLog,
  serializeProduct,
  serializeSafe,
} from "@/lib/serializers";
import { getDashboardData } from "@/services/dashboard.service";
import { getProductsByCompany } from "@/services/inventory.service";
import { getSafesByCompany } from "@/services/settings.service";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SecondaryStrip } from "@/components/dashboard/SecondaryStrip";
import { SmartEntryBar } from "@/components/dashboard/SmartEntryBar";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const { companyId } = tenantWhere(session);
  const [{ kpis, recentLogs }, products, safes] = await Promise.all([
    getDashboardData(companyId),
    getProductsByCompany(companyId),
    getSafesByCompany(companyId),
  ]);

  return (
    <div className="space-y-8">
      <KpiCards kpis={kpis} />
      <SecondaryStrip
        fundsUnderCollection={kpis.fundsUnderCollection}
        ownerWithdrawals={kpis.ownerWithdrawals}
      />
      <SmartEntryBar
        products={products.map(serializeProduct)}
        safes={safes.map(serializeSafe)}
      />
      <RecentTransactions transactions={recentLogs.map(serializeAuditLog)} />
    </div>
  );
}
