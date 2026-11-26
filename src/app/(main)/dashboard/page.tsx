"use client";

import React, { useState } from "react";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SecondaryStrip } from "@/components/dashboard/SecondaryStrip";
import { SmartEntryBar } from "@/components/dashboard/SmartEntryBar";
import { INITIAL_AUDIT_LOGS, INITIAL_KPIS } from "@/lib/mock-data";
import type { AIParsePreview, AuditLogEntry, KpiSummary } from "@/types";

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KpiSummary>(INITIAL_KPIS);
  const [transactions, setTransactions] =
    useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  const handleConfirmEntry = (preview: AIParsePreview) => {
    const isSale = preview.action === "SALE";
    const isPurchase = preview.action === "PURCHASE";
    const isExpense = preview.action === "EXPENSE";
    const isWithdrawal = preview.action === "WITHDRAWAL";

    setKpis((prev) => ({
      ...prev,
      cashbox: isSale
        ? prev.cashbox + preview.totalAmount
        : prev.cashbox - preview.totalAmount,
      inventoryValue: isPurchase
        ? prev.inventoryValue + preview.totalAmount
        : prev.inventoryValue,
      generalExpenses: isExpense
        ? prev.generalExpenses + preview.totalAmount
        : prev.generalExpenses,
      netProfit: isSale
        ? prev.netProfit + Math.round(preview.totalAmount * 0.4)
        : isExpense
          ? prev.netProfit - preview.totalAmount
          : prev.netProfit,
      ownerWithdrawals: isWithdrawal
        ? prev.ownerWithdrawals + preview.totalAmount
        : prev.ownerWithdrawals,
    }));

    const actionTypeMap: Record<
      AIParsePreview["action"],
      AuditLogEntry["actionType"]
    > = {
      SALE: "SALE_CREATED",
      PURCHASE: "PURCHASE_CREATED",
      EXPENSE: "EXPENSE_CREATED",
      WITHDRAWAL: "WITHDRAWAL_CREATED",
    };

    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      actionType: actionTypeMap[preview.action],
      summary: preview.arabicSummary,
      amount: isSale ? preview.totalAmount : -preview.totalAmount,
      isPositive: isSale,
      timeLabel: "الآن",
      dateLabel: "اليوم",
    };

    setTransactions((prev) => [newEntry, ...prev.slice(0, 9)]);
  };

  return (
    <div className="space-y-8">
      <KpiCards kpis={kpis} />
      <SecondaryStrip
        fundsUnderCollection={kpis.fundsUnderCollection}
        ownerWithdrawals={kpis.ownerWithdrawals}
      />
      <SmartEntryBar onConfirmEntry={handleConfirmEntry} />
      <RecentTransactions transactions={transactions} />
    </div>
  );
}
