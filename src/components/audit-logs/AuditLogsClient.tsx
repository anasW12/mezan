"use client";

import React, { useDeferredValue, useMemo, useState } from "react";
import { Lock, Search } from "lucide-react";
import { AUDIT_ACTION_BADGES } from "@/components/dashboard/RecentTransactions";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn, formatNumber } from "@/lib/utils";
import type { AuditLogEntry, TransactionActionType } from "@/types";

interface AuditLogsClientProps {
  logs: AuditLogEntry[];
}

const FILTER_TABS: Array<{ key: "ALL" | TransactionActionType; label: string }> = [
  { key: "ALL", label: "الكل" },
  { key: "SALE_CREATED", label: "بيع" },
  { key: "PURCHASE_CREATED", label: "شراء" },
  { key: "EXPENSE_CREATED", label: "مصروف" },
  { key: "WITHDRAWAL_CREATED", label: "مسحوبات" },
  { key: "SALE_COLLECTED", label: "تحصيل" },
  { key: "SAFE_ADJUSTED", label: "تسوية خزينة" },
  { key: "PRODUCT_ADDED", label: "منتجات" },
  { key: "ASSET_ADDED", label: "أصول ثابتة" },
];

export function AuditLogsClient({ logs }: AuditLogsClientProps) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [typeFilter, setTypeFilter] = useState<"ALL" | TransactionActionType>(
    "ALL"
  );

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return logs.filter((entry) => {
      const matchesSearch = !q || entry.summary.toLowerCase().includes(q);
      const matchesType =
        typeFilter === "ALL" ||
        entry.actionType === typeFilter ||
        (typeFilter === "PRODUCT_ADDED" &&
          entry.actionType === "PRODUCT_UPDATED");
      return matchesSearch && matchesType;
    });
  }, [logs, deferredSearch, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            سجل الحركات
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            أرشيف زمني موثّق لجميع الحركات المالية والمخزنية.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-xs">
          <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>سجل للقراءة فقط (غير قابل للتعديل)</span>
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في وصف الحركة..."
              className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pe-3 ps-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTypeFilter(tab.key)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3",
                  typeFilter === tab.key
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="لا توجد حركات مسجلة"
            description="ستظهر هنا كل الحركات المالية والمخزنية تلقائياً فور تنفيذ أي عملية."
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {filtered.map((entry) => {
                const badge = AUDIT_ACTION_BADGES[entry.actionType];
                return (
                  <div key={entry.id} className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            badge.className
                          )}
                        >
                          {badge.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          {entry.dateLabel} — {entry.timeLabel}
                        </span>
                      </div>
                      <CurrencyDisplay
                        amount={entry.amount}
                        tone="auto"
                        showSign
                        className="text-sm font-semibold"
                      />
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {entry.summary}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                      التاريخ والوقت
                    </th>
                    <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                      نوع الحركة
                    </th>
                    <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                      البيان
                    </th>
                    <th className="px-6 py-3.5 text-end text-xs font-semibold text-slate-500">
                      المبلغ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => {
                    const badge = AUDIT_ACTION_BADGES[entry.actionType];
                    return (
                      <tr
                        key={entry.id}
                        className="border-t border-slate-100 transition-colors hover:bg-slate-50/50"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                          {entry.dateLabel} — {entry.timeLabel}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                              badge.className
                            )}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {entry.summary}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-end text-sm">
                          <CurrencyDisplay
                            amount={entry.amount}
                            tone="auto"
                            showSign
                            className="text-sm font-semibold"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="border-t border-slate-100 px-4 py-3.5 text-sm text-slate-500 sm:px-6 sm:py-4">
          عرض {formatNumber(filtered.length)} حركة موثّقة
        </div>
      </div>
    </div>
  );
}
