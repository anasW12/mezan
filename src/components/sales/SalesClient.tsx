"use client";

import React, { useDeferredValue, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Check,
  Eye,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import { deleteSaleAction, settleSaleAction } from "@/actions/accounting";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type { PaymentStatus, SalesInvoiceRow } from "@/types";

interface SalesClientProps {
  sales: SalesInvoiceRow[];
}

export function SalesClient({ sales }: SalesClientProps) {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<"ALL" | PaymentStatus>(
    "ALL"
  );
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalesInvoiceRow | null>(
    null
  );
  const [previewInvoice, setPreviewInvoice] = useState<SalesInvoiceRow | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return sales.filter((s) => {
      const matchesSearch =
        !q ||
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.itemsSummary.toLowerCase().includes(q) ||
        (s.customerName?.toLowerCase().includes(q) ?? false);
      const matchesStatus =
        statusFilter === "ALL" || s.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sales, deferredSearch, statusFilter]);

  const handleSettleCod = (id: string, invoiceNumber: string) => {
    setSettlingId(id);
    startTransition(async () => {
      const result = await settleSaleAction({ invoiceId: id });
      setSettlingId(null);

      if (!result.success) {
        showToast(result.error ?? "تعذر تحصيل الفاتورة", "error");
        return;
      }

      showToast(`تم تحصيل فاتورة ${invoiceNumber} وإضافتها إلى الخزينة`);
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;

    startTransition(async () => {
      const result = await deleteSaleAction(target.id);
      setDeleteTarget(null);

      if (!result.success) {
        showToast(result.error ?? "تعذر حذف فاتورة البيع", "error");
        return;
      }

      showToast(
        `تم حذف فاتورة البيع ${target.invoiceNumber} واستعادة الكميات للمخزن`
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
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

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm print:hidden">
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
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-slate-500">
                    رقم الفاتورة
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-slate-500">
                    التاريخ
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-slate-500">
                    المنتجات
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-slate-500">
                    المجموع الفرعي
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-slate-500">
                    الضريبة
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-slate-500">
                    تكلفة مباشرة
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-slate-500">
                    الإجمالي النهائي
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-slate-500">
                    الحالة
                  </th>
                  <th className="px-4 py-3.5 text-end text-xs font-semibold text-slate-500">
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
                    <td className="tabular-nums whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                      {inv.date}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      <div>{inv.itemsSummary}</div>
                      {inv.customerName && (
                        <div className="text-xs text-slate-400">
                          العميل: {inv.customerName}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      <CurrencyDisplay
                        amount={inv.subtotal}
                        className="text-sm font-normal text-slate-700"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      {inv.taxAmount > 0 ? (
                        <div>
                          <CurrencyDisplay
                            amount={inv.taxAmount}
                            className="text-sm font-normal text-slate-700"
                          />
                          <div className="text-[11px] text-slate-400">
                            {inv.taxType === "PERCENTAGE"
                              ? `${formatNumber(inv.taxValue)}%`
                              : "ثابتة"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      <CurrencyDisplay
                        amount={inv.directCost}
                        className="text-sm font-normal text-slate-600"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      <CurrencyDisplay amount={inv.totalAmount} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
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
                    <td className="whitespace-nowrap px-4 py-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        {inv.paymentStatus === "PENDING_COLLECTION" && (
                          <button
                            type="button"
                            disabled={isPending && settlingId === inv.id}
                            onClick={() =>
                              handleSettleCod(inv.id, inv.invoiceNumber)
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>
                              {isPending && settlingId === inv.id
                                ? "جاري التحصيل..."
                                : "تحصيل"}
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setPreviewInvoice(inv)}
                          aria-label={`عرض تفاصيل فاتورة ${inv.invoiceNumber}`}
                          title="تفاصيل وطباعة الفاتورة"
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <Link
                          href={`/sales/${inv.id}/edit`}
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
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
          <span>عرض {formatNumber(filtered.length)} فواتير</span>
        </div>
      </div>

      {/* Invoice Details & Print Modal */}
      {previewInvoice && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px] print:static print:bg-white print:p-0"
          onClick={() => setPreviewInvoice(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl print:max-h-none print:shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  تفاصيل فاتورة البيع {previewInvoice.invoiceNumber}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  التاريخ: {previewInvoice.date} • الحالة:{" "}
                  {previewInvoice.paymentStatus === "PAID"
                    ? "مدفوع"
                    : "تحت التحصيل (COD)"}
                </p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>طباعة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewInvoice(null)}
                  aria-label="إغلاق"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs sm:grid-cols-3">
              <div>
                <span className="text-slate-400">العميل:</span>
                <div className="mt-0.5 font-semibold text-slate-800">
                  {previewInvoice.customerName ?? "عميل مباشر"}
                </div>
              </div>
              <div>
                <span className="text-slate-400">الخزينة:</span>
                <div className="mt-0.5 font-semibold text-slate-800">
                  {previewInvoice.safeName ?? "قيد التحصيل"}
                </div>
              </div>
              <div>
                <span className="text-slate-400">تكلفة الشحن المباشرة:</span>
                <div className="tabular-nums mt-0.5 font-semibold text-slate-800">
                  {formatCurrency(previewInvoice.directCost)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-start text-xs font-semibold text-slate-500">
                      الصنف
                    </th>
                    <th className="px-4 py-2.5 text-start text-xs font-semibold text-slate-500">
                      الكمية
                    </th>
                    <th className="px-4 py-2.5 text-start text-xs font-semibold text-slate-500">
                      سعر الوحدة
                    </th>
                    <th className="px-4 py-2.5 text-end text-xs font-semibold text-slate-500">
                      الإجمالي
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewInvoice.items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {item.productName}
                      </td>
                      <td className="tabular-nums px-4 py-3 text-slate-600">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="tabular-nums px-4 py-3 text-slate-600">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="tabular-nums px-4 py-3 text-end font-semibold text-slate-900">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>المجموع الفرعي</span>
                <span className="tabular-nums font-medium text-slate-800">
                  {formatCurrency(previewInvoice.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>
                  الضريبة{" "}
                  {previewInvoice.taxValue > 0
                    ? previewInvoice.taxType === "PERCENTAGE"
                      ? `(${formatNumber(previewInvoice.taxValue)}%)`
                      : "(ثابتة)"
                    : ""}
                </span>
                <span className="tabular-nums font-medium text-slate-800">
                  {formatCurrency(previewInvoice.taxAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                <span>الإجمالي النهائي</span>
                <CurrencyDisplay
                  amount={previewInvoice.totalAmount}
                  className="text-lg"
                />
              </div>
              {previewInvoice.notes && (
                <p className="border-t border-slate-200 pt-2 text-xs text-slate-500">
                  ملاحظات: {previewInvoice.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`حذف فاتورة البيع ${deleteTarget?.invoiceNumber ?? ""}؟`}
        description="سيتم حذف الفاتورة وإعادة الكميات المباعة للمخزن وخصم قيمتها من الخزينة إذا كانت مدفوعة."
        onConfirm={handleDelete}
        onCancel={() => !isPending && setDeleteTarget(null)}
      />
    </div>
  );
}
