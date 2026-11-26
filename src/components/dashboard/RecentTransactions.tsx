import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { cn } from "@/lib/utils";
import type { AuditLogEntry, TransactionActionType } from "@/types";

export const AUDIT_ACTION_BADGES: Record<
  TransactionActionType,
  { label: string; className: string }
> = {
  SALE_CREATED: {
    label: "بيع",
    className: "bg-emerald-50 text-emerald-700",
  },
  PURCHASE_CREATED: {
    label: "شراء",
    className: "bg-blue-50 text-blue-700",
  },
  EXPENSE_CREATED: {
    label: "مصروف",
    className: "bg-rose-50 text-rose-700",
  },
  WITHDRAWAL_CREATED: {
    label: "مسحوبات",
    className: "bg-slate-100 text-slate-600",
  },
  SALE_COLLECTED: {
    label: "تحصيل",
    className: "bg-sky-50 text-sky-700",
  },
  PRODUCT_ADDED: {
    label: "منتج جديد",
    className: "bg-teal-50 text-teal-700",
  },
  PRODUCT_UPDATED: {
    label: "تحديث مخزن",
    className: "bg-amber-50 text-amber-700",
  },
  SAFE_ADJUSTED: {
    label: "تسوية خزينة",
    className: "bg-indigo-50 text-indigo-700",
  },
  ASSET_ADDED: {
    label: "أصل ثابت",
    className: "bg-purple-50 text-purple-700",
  },
};

export function RecentTransactions({
  transactions,
}: {
  transactions: AuditLogEntry[];
}) {
  return (
    <section
      aria-label="آخر ١٠ حركات"
      className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800">آخر ١٠ حركات</h2>
        <Link
          href="/audit-logs"
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
        >
          <span>عرض السجل الكامل</span>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50/70">
            <tr>
              <th className="px-6 py-3 text-start text-xs font-medium text-slate-400">
                الوقت
              </th>
              <th className="px-6 py-3 text-start text-xs font-medium text-slate-400">
                النوع
              </th>
              <th className="px-6 py-3 text-start text-xs font-medium text-slate-400">
                الوصف
              </th>
              <th className="px-6 py-3 text-end text-xs font-medium text-slate-400">
                المبلغ
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 10).map((tx) => {
              const badge = AUDIT_ACTION_BADGES[tx.actionType];
              return (
                <tr
                  key={tx.id}
                  className="border-b border-slate-50 transition-colors hover:bg-slate-50/60"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {tx.timeLabel}
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
                    {tx.summary}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-end text-sm">
                    <CurrencyDisplay
                      amount={tx.amount}
                      tone="auto"
                      showSign
                      className="text-sm font-medium"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
