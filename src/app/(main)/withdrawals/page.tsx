import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import { formatDate, serializeSafe } from "@/lib/serializers";
import { getWithdrawalsByCompany } from "@/services/accounting.service";
import { getSafesByCompany } from "@/services/settings.service";
import { WithdrawalsClient } from "@/components/withdrawals/WithdrawalsClient";
import type { WithdrawalRow } from "@/types";

export default async function WithdrawalsPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const { companyId } = tenantWhere(session);
  const [withdrawals, safes] = await Promise.all([
    getWithdrawalsByCompany(companyId),
    getSafesByCompany(companyId),
  ]);

  const serialized: WithdrawalRow[] = withdrawals.map((w) => ({
    id: w.id,
    date: formatDate(w.createdAt),
    description: w.notes ?? "مسحوبات شخصية",
    safeName: w.safe.name,
    amount: w.amount.toNumber(),
  }));

  return (
    <WithdrawalsClient
      withdrawals={serialized}
      safes={safes.map(serializeSafe)}
    />
  );
}
