"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Plus, Search } from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import { INITIAL_SALES } from "@/lib/mock-data";
import { cn, formatNumber } from "@/lib/utils";
import type { PaymentStatus, SalesInvoiceRow } from "@/types";

export default function SalesPage() {
  const { showToast } = useToast();
  const [sales, setSales] = useState<SalesInvoiceRow[]>(INITIAL_SALES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PaymentStatus>(
    "ALL"
  );

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      const q = search.trim();
      const matchesSearch =
        !q || s.invoiceNumber.includes(q) || s.itemsSummary.includes(q);
      const matchesStatus =
        statusFilter === "ALL" || s.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sales, search, statusFilter]);

  const handleSettleCod = (id: string, invoiceNumber: string) => {
    setSales((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, paymentStatus: "PAID" } : inv
      )
    );
    showToast(`تم تحصيل فاتورة ${invoiceNumber} وإضافتها إلى الخزينة`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            المبيعات والتحصيل
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            متابعة الفواتير المدفوعة ومبالغ الدفع عند الاستلام (تحت التحصيل).
          </p>
        </div>
        <Link
          href="/sales/new"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          <span>فاتورة بيع جديدة</span>
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث برقم الفاتورة أو المنتج..."
              className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pe-3 ps-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            {(
              [
                { key: "ALL", label: "الكل" },
                { key: "PAID", label: "مدفوع" },
                { key: "PENDING_COLLECTION", label: "تحت التحصيل" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === tab.key
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
            title="لا توجد فواتير مبيعات"
            description="أنشئ أول فاتورة بيع لتتبع الأرباح والمخزون وتحصيلات COD."
            actionLabel="فاتورة بيع جديدة"
            actionHref="/sales/new"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    رقم الفاتورة
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    التاريخ
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    المنتجات
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    تكلفة مباشرة
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    الإجمالي
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    الحالة
                  </th>
                  <th className="px-6 py-3.5 text-end text-xs font-semibold text-slate-500">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/50"
                  >
                    <td className="tabular-nums px-6 py-4 text-sm font-semibold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {inv.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {inv.itemsSummary}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <CurrencyDisplay
                        amount={inv.directCost}
                        className="text-sm font-normal text-slate-600"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <CurrencyDisplay amount={inv.totalAmount} />
                    </td>
                    <td className="px-6 py-4">
                      {inv.paymentStatus === "PAID" ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          مدفوع
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          تحت التحصيل
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-end">
                      {inv.paymentStatus === "PENDING_COLLECTION" ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleSettleCod(inv.id, inv.invoiceNumber)
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>تحصيل</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">مكتمل</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
          <span>عرض {formatNumber(filtered.length)} فواتير</span>
          <div className="flex items-center gap-1">
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              ١
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
