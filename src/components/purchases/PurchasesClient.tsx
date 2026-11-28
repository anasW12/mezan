"use client";

import React, { useDeferredValue, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import { deletePurchaseAction } from "@/actions/accounting";
import { formatNumber } from "@/lib/utils";
import type { PurchaseInvoiceRow } from "@/types";

interface PurchasesClientProps {
  purchases: PurchaseInvoiceRow[];
}

export function PurchasesClient({ purchases }: PurchasesClientProps) {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseInvoiceRow | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter(
      (p) =>
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        p.itemsSummary.toLowerCase().includes(q)
    );
  }, [purchases, deferredSearch]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;

    startTransition(async () => {
      const result = await deletePurchaseAction(target.id);
      setDeleteTarget(null);

      if (!result.success) {
        showToast(result.error ?? "تعذر حذف فاتورة الشراء", "error");
        return;
      }

      showToast(
        `تم حذف فاتورة الشراء ${target.invoiceNumber} وتحديث المخزن والخزينة`
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            المشتريات
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            سجل فواتير الشراء وتحديث متوسط تكلفة البضاعة تلقائياً.
          </p>
        </div>
        <Link
          href="/purchases/new"
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>فاتورة شراء جديدة</span>
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الفاتورة أو المورد..."
              className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pe-3 ps-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="لا توجد فواتير شراء"
            description="سجّل أول فاتورة شراء لإضافة كميات جديدة للمخزن."
            actionLabel="فاتورة شراء جديدة"
            actionHref="/purchases/new"
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {filtered.map((inv) => (
                <div key={inv.id} className="space-y-2.5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        dir="ltr"
                        className="tabular-nums inline-block text-sm font-bold text-slate-900"
                      >
                        {inv.invoiceNumber}
                      </span>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {inv.date} • {inv.safeName}
                      </p>
                    </div>
                    <CurrencyDisplay
                      amount={inv.totalAmount}
                      className="text-sm font-bold"
                    />
                  </div>

                  <p className="text-sm text-slate-700">{inv.itemsSummary}</p>
                  <p className="text-xs text-slate-500">
                    المورد: {inv.supplierName}
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Link
                      href={`/purchases/${inv.id}/edit`}
                      prefetch={false}
                      aria-label={`تعديل فاتورة ${inv.invoiceNumber}`}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>تعديل</span>
                    </Link>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setDeleteTarget(inv)}
                      aria-label={`حذف فاتورة ${inv.invoiceNumber}`}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/40 px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
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
                      المورد
                    </th>
                    <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                      الأصناف
                    </th>
                    <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                      الخزينة
                    </th>
                    <th className="px-6 py-3.5 text-end text-xs font-semibold text-slate-500">
                      الإجمالي
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
                        <span dir="ltr" className="inline-block">
                          {inv.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {inv.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {inv.supplierName}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {inv.itemsSummary}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {inv.safeName}
                      </td>
                      <td className="px-6 py-4 text-end text-sm">
                        <CurrencyDisplay amount={inv.totalAmount} />
                      </td>
                      <td className="px-6 py-4 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/purchases/${inv.id}/edit`}
                            prefetch={false}
                            aria-label={`تعديل فاتورة ${inv.invoiceNumber}`}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>تعديل</span>
                          </Link>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setDeleteTarget(inv)}
                            aria-label={`حذف فاتورة ${inv.invoiceNumber}`}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3.5 text-sm text-slate-500 sm:px-6 sm:py-4">
          <span>عرض {formatNumber(filtered.length)} فواتير شراء</span>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`حذف فاتورة الشراء ${deleteTarget?.invoiceNumber ?? ""}؟`}
        description="سيتم حذف الفاتورة وإعادة قيمتها للخزينة وخصم كمياتها من المخزن (يشترط توفر الكميات حالياً في المخزن)."
        onConfirm={handleDelete}
        onCancel={() => !isPending && setDeleteTarget(null)}
      />
    </div>
  );
}
