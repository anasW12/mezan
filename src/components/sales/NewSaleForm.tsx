"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import { createSaleAction, updateSaleAction } from "@/actions/accounting";
import {
  calculateSalePreviewNumbers,
  toDateInputString,
} from "@/lib/accounting-math";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type {
  PaymentStatus,
  Product,
  SafeAccount,
  SalesInvoiceFormInitialData,
  TaxType,
} from "@/types";

interface SaleLine {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface NewSaleFormProps {
  products: Product[];
  safes: SafeAccount[];
  initialData?: SalesInvoiceFormInitialData;
}

export function NewSaleForm({
  products,
  safes,
  initialData,
}: NewSaleFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(initialData);

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    initialData?.paymentStatus ?? "PAID"
  );
  const [safeId, setSafeId] = useState(
    initialData?.safeId ?? safes[0]?.id ?? ""
  );
  const [customerName, setCustomerName] = useState(
    initialData?.customerName ?? ""
  );
  const [invoiceDate, setInvoiceDate] = useState(
    () => initialData?.invoiceDate ?? toDateInputString(new Date())
  );
  const [directCost, setDirectCost] = useState(
    String(initialData?.directCost ?? 0)
  );
  const [taxType, setTaxType] = useState<TaxType>(
    initialData?.taxType ?? "PERCENTAGE"
  );
  const [taxValue, setTaxValue] = useState(
    String(initialData?.taxValue ?? 0)
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [lines, setLines] = useState<SaleLine[]>(() => {
    if (initialData && initialData.items.length > 0) {
      return initialData.items.map((item, idx) => ({
        id: `s-edit-${idx}-${item.productId}`,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));
    }

    return products.length > 0
      ? [
          {
            id: "s-1",
            productId: products[0].id,
            quantity: 1,
            unitPrice: products[0].sellingPrice,
          },
        ]
      : [];
  });

  const restoredQtyByProduct = useMemo(() => {
    const map = new Map<string, number>();
    if (initialData) {
      for (const item of initialData.items) {
        map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity);
      }
    }
    return map;
  }, [initialData]);

  const numericTaxValue = useMemo(
    () => Math.max(0, Number(taxValue) || 0),
    [taxValue]
  );

  const { subtotal, taxAmount, totalAmount } = useMemo(
    () => calculateSalePreviewNumbers(lines, taxType, numericTaxValue),
    [lines, taxType, numericTaxValue]
  );

  if (products.length === 0 || safes.length === 0) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <EmptyState
          title="أضف منتجاتك أولاً قبل البيع"
          description="يجب أن يحتوي المخزن على منتج واحد على الأقل لتسجيل فاتورة بيع جديدة."
          actionLabel="الانتقال إلى المخزن"
          actionHref="/inventory"
        />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      lines.length === 0 ||
      lines.some((l) => l.quantity <= 0 || l.unitPrice < 0)
    ) {
      showToast("يرجى إضافة منتج واحد على الأقل بكمية وسعر صحيحين", "error");
      return;
    }

    if (taxType === "PERCENTAGE" && numericTaxValue > 100) {
      showToast("نسبة الضريبة لا يمكن أن تتجاوز ١٠٠٪", "error");
      return;
    }

    startTransition(async () => {
      const payload = {
        paymentStatus,
        safeId: paymentStatus === "PAID" ? safeId : undefined,
        customerName: customerName.trim() || undefined,
        directCost: Math.max(0, Number(directCost) || 0),
        taxType,
        taxValue: numericTaxValue,
        notes: notes.trim() || undefined,
        invoiceDate: invoiceDate || undefined,
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: Math.max(1, Math.round(l.quantity)),
          unitPrice: Math.max(0, Number(l.unitPrice) || 0),
        })),
      };

      const result = initialData
        ? await updateSaleAction({ id: initialData.id, ...payload })
        : await createSaleAction(payload);

      if (!result.success) {
        showToast(
          result.error ??
            (isEdit ? "تعذر تعديل فاتورة البيع" : "تعذر حفظ فاتورة البيع"),
          "error"
        );
        return;
      }

      showToast(
        isEdit
          ? "تم تعديل فاتورة البيع وتحديث المخزن والخزينة بنجاح"
          : paymentStatus === "PAID"
            ? "تم حفظ فاتورة البيع وإضافة المبلغ للخزينة"
            : "تم حفظ الفاتورة في فلوس تحت التحصيل"
      );
      router.push("/sales");
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {isEdit
            ? `تعديل فاتورة بيع ${initialData?.invoiceNumber ?? ""}`
            : "فاتورة بيع جديدة"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? "عدّل البنود أو الضريبة أو حالة الدفع؛ سيتم استعادة الكميات السابقة والتحقق من المخزون وتحديث الخزينة ذرياً."
            : "يتم خصم الكمية من المخزن وتثبيت تكلفة البضاعة وقت البيع تلقائياً."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            حالة الدفع
          </label>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setPaymentStatus("PAID")}
              className={cn(
                "rounded-md px-2 py-2.5 text-xs font-medium transition-colors sm:text-sm",
                paymentStatus === "PAID"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              مدفوع (كاش للخزينة)
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus("PENDING_COLLECTION")}
              className={cn(
                "rounded-md px-2 py-2.5 text-xs font-medium transition-colors sm:text-sm",
                paymentStatus === "PENDING_COLLECTION"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              تحت التحصيل (COD)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              العميل (اختياري)
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="مثال: عميل أونلاين"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              تاريخ الفاتورة
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              الخزينة المستلمة
            </label>
            <select
              disabled={paymentStatus === "PENDING_COLLECTION"}
              value={safeId}
              onChange={(e) => setSafeId(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {safes.map((safe) => (
                <option key={safe.id} value={safe.id}>
                  {safe.name} ({formatCurrency(safe.balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              تكلفة مباشرة (شحن وتغليف)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={directCost}
                onChange={(e) => setDirectCost(e.target.value)}
                className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white pe-12 ps-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-slate-400">
                ج.م
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">
            المنتجات
          </h3>
          <div className="space-y-3">
            <div className="hidden grid-cols-12 gap-3 text-xs font-medium text-slate-500 sm:grid">
              <span className="col-span-5">المنتج (المتاح)</span>
              <span className="col-span-3">الكمية</span>
              <span className="col-span-3">سعر البيع (ج.م)</span>
              <span className="col-span-1" />
            </div>

            {lines.map((line, idx) => (
              <div
                key={line.id}
                className="grid grid-cols-12 gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/40 p-3 sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
              >
                <div className="col-span-12 sm:col-span-5">
                  <label className="mb-1 block text-xs font-medium text-slate-600 sm:hidden">
                    المنتج (المتاح)
                  </label>
                  <select
                    value={line.productId}
                    onChange={(e) => {
                      const selected = products.find(
                        (p) => p.id === e.target.value
                      );
                      setLines((prev) =>
                        prev.map((item, i) =>
                          i === idx
                            ? {
                                ...item,
                                productId: e.target.value,
                                unitPrice: selected
                                  ? selected.sellingPrice
                                  : item.unitPrice,
                              }
                            : item
                        )
                      );
                    }}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {products.map((p) => {
                      const availableStock =
                        p.stockQuantity +
                        (restoredQtyByProduct.get(p.id) ?? 0);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} (متاح: {formatNumber(availableStock)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="col-span-5 sm:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-slate-600 sm:hidden">
                    الكمية
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setLines((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, quantity: val } : item
                        )
                      );
                    }}
                    placeholder="الكمية"
                    className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="col-span-5 sm:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-slate-600 sm:hidden">
                    سعر البيع (ج.م)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setLines((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, unitPrice: val } : item
                        )
                      );
                    }}
                    placeholder="سعر البيع"
                    className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="col-span-2 flex items-end justify-end sm:col-span-1">
                  <button
                    type="button"
                    disabled={lines.length === 1}
                    onClick={() =>
                      setLines((prev) => prev.filter((l) => l.id !== line.id))
                    }
                    aria-label="حذف السطر"
                    className="flex h-10 w-10 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setLines((prev) => [
                ...prev,
                {
                  id: `s-${Date.now()}`,
                  productId: products[0].id,
                  quantity: 1,
                  unitPrice: products[0].sellingPrice,
                },
              ])
            }
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة منتج آخر</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              الضريبة (اختياري)
            </label>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setTaxType("PERCENTAGE")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    taxType === "PERCENTAGE"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  نسبة مئوية (%)
                </button>
                <button
                  type="button"
                  onClick={() => setTaxType("FIXED")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    taxType === "FIXED"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  مبلغ ثابت
                </button>
              </div>
              <div className="relative min-w-[120px] flex-1">
                <input
                  type="number"
                  min="0"
                  max={taxType === "PERCENTAGE" ? 100 : undefined}
                  step="0.01"
                  value={taxValue}
                  onChange={(e) => setTaxValue(e.target.value)}
                  placeholder="0"
                  className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white pe-10 ps-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-slate-400">
                  {taxType === "PERCENTAGE" ? "%" : "ج.م"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              ملاحظات (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي تفاصيل إضافية حول فاتورة البيع..."
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="flex flex-col items-stretch justify-between gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>
                المجموع الفرعي:{" "}
                <span className="tabular-nums font-medium text-slate-700">
                  {formatCurrency(subtotal)}
                </span>
              </span>
              <span>
                الضريبة{" "}
                {taxType === "PERCENTAGE"
                  ? `(${formatNumber(numericTaxValue)}%)`
                  : "(ثابتة)"}
                :{" "}
                <span className="tabular-nums font-medium text-slate-700">
                  {formatCurrency(taxAmount)}
                </span>
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start">
              <span className="text-sm font-medium text-slate-600">
                الإجمالي النهائي للفاتورة:
              </span>
              <CurrencyDisplay amount={totalAmount} className="text-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <button
              type="submit"
              disabled={isPending}
              className="min-h-[44px] rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {isPending
                ? "جاري الحفظ..."
                : isEdit
                  ? "حفظ التعديلات"
                  : "حفظ الفاتورة"}
            </button>
            <Link
              href="/sales"
              className="flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              إلغاء
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
