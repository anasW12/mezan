import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import { formatDate, serializeSafe } from "@/lib/serializers";
import { getExpensesByCompany } from "@/services/accounting.service";
import { getSafesByCompany } from "@/services/settings.service";
import { ExpensesClient } from "@/components/expenses/ExpensesClient";
import type { ExpenseRow } from "@/types";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const { companyId } = tenantWhere(session);
  const [expenses, safes] = await Promise.all([
    getExpensesByCompany(companyId),
    getSafesByCompany(companyId),
  ]);

  const serialized: ExpenseRow[] = expenses.map((exp) => ({
    id: exp.id,
    date: formatDate(exp.createdAt),
    category: exp.category,
    description: exp.description ?? exp.category,
    safeName: exp.safe.name,
    amount: exp.amount.toNumber(),
  }));

  return (
    <ExpensesClient
      expenses={serialized}
      safes={safes.map(serializeSafe)}
    />
  );
}
