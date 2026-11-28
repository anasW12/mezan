"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PackagePlus, Plus, Sparkles, Trash2 } from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import {
  createPurchaseAction,
  updatePurchaseAction,
} from "@/actions/accounting";
import { toDateInputString } from "@/lib/accounting-math";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type {
  Product,
  PurchaseInvoiceFormInitialData,
  SafeAccount,
} from "@/types";

const NEW_PRODUCT_OPTION = "__NEW_PRODUCT__";

interface PurchaseLine {
  id: string;
  mode: "existing" | "new";
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  sellingPrice: string;
}

interface NewPurchaseFormProps {
  products: Product[];
  safes: SafeAccount[];
  initialData?: PurchaseInvoiceFormInitialData;
}

export function NewPurchaseForm({
  products,
  safes,
  initialData,
}: NewPurchaseFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(initialData);

  const [supplier, setSupplier] = useState(initialData?.supplierName ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [invoiceDate, setInvoiceDate] = useState(
    () => initialData?.invoiceDate ?? toDateInputString(new Date())
  );
  const [safeId, setSafeId] = useState(
    initialData?.safeId ?? safes[0]?.id ?? ""
  );
  const [lines, setLines] = useState<PurchaseLine[]>(() => {
    if (initialData && initialData.items.length > 0) {
      return initialData.items.map((item, index) => ({
        id: `edit-line-${index}-${item.productId}`,
        mode: "existing",
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitCost: item.unitCost,
        sellingPrice: "",
      }));
    }

    return [
      products.length > 0
        ? {
            id: "line-1",
            mode: "existing",
            productId: products[0].id,
            productName: products[0].name,
            quantity: 1,
            unitCost: products[0].averageCostPrice,
            sellingPrice: "",
          }
        : {
            id: "line-1",
            mode: "new",
            productId: "",
            productName: "",
            quantity: 1,
            unitCost: 0,
            sellingPrice: "",
          },
    ];
  });

  const selectedSafe = useMemo(
    () => safes.find((s) => s.id === safeId) ?? safes[0] ?? null,
    [safes, safeId]
  );

  const totalAmount = useMemo(
    () =>
      lines.reduce(
        (sum, line) => sum + (line.quantity || 0) * (line.unitCost || 0),
        0
      ),
    [lines]
  );

  if (safes.length === 0) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <EmptyState
          title="أضف خزينة أولاً قبل الشراء"
          description="يجب وجود خزينة نشطة واحدة على الأقل لخصم قيمة فاتورة الشراء منها."
          actionLabel="الانتقال إلى الإعدادات"
          actionHref="/settings"
        />
      </div>
    );
  }

  const updateLine = (idx: number, patch: Partial<PurchaseLine>) => {
    setLines((prev) =>
      prev.map((line, i) => (i === idx ? { ...line, ...patch } : line))
    );
  };

  const addExistingLine = () => {
    if (products.length === 0) {
      addNewProductLine();
      return;
    }
    const first = products[0];
    setLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${prev.length}`,
        mode: "existing",
        productId: first.id,
        productName: first.name,
        quantity: 1,
        unitCost: first.averageCostPrice,
        sellingPrice: "",
      },
    ]);
  };

  const addNewProductLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${prev.length}`,
        mode: "new",
        productId: "",
        productName: "",
        quantity: 1,
        unitCost: 0,
        sellingPrice: "",
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      showToast("يرجى إضافة صنف واحد على الأقل في الفاتورة", "error");
      return;
    }

    for (const line of lines) {
      if (line.mode === "existing" && !line.productId.trim()) {
        showToast("يرجى اختيار الصنف من المخزن", "error");
        return;
      }
      if (line.mode === "new" && !line.productName.trim()) {
        showToast("يرجى كتابة اسم الصنف الجديد", "error");
        return;
      }
      if (!Number.isFinite(line.quantity) || line.quantity < 1) {
        showToast("الكمية يجب أن تكون ١ على الأقل", "error");
        return;
      }
      if (!Number.isFinite(line.unitCost) || line.unitCost < 0) {
        showToast("سعر تكلفة الوحدة لا يمكن أن يكون سالباً", "error");
        return;
      }
      if (line.mode === "new" && line.sellingPrice.trim() !== "") {
        const sp = Number(line.sellingPrice);
        if (!Number.isFinite(sp) || sp < 0) {
          showToast("سعر البيع يجب أن يكون رقماً موجباً", "error");
          return;
        }
      }
    }

    const mappedItems = lines.map((line) => {
      const qty = Math.max(1, Math.round(line.quantity));
      const cost = Math.max(0, Number(line.unitCost) || 0);

      if (line.mode === "existing") {
        return {
          productId: line.productId,
          quantity: qty,
          unitCost: cost,
        };
      }

      const sellingPrice =
        line.sellingPrice.trim() !== ""
          ? Math.max(0, Number(line.sellingPrice) || 0)
          : cost;

      return {
        productName: line.productName.trim(),
        quantity: qty,
        unitCost: cost,
        sellingPrice,
      };
    });

    startTransition(async () => {
      const payload = {
        safeId,
        supplierName: supplier.trim() || undefined,
        notes: notes.trim() || undefined,
        invoiceDate: invoiceDate || undefined,
        items: mappedItems,
      };

      const result = initialData
        ? await updatePurchaseAction({ id: initialData.id, ...payload })
        : await createPurchaseAction(payload);

      if (!result.success) {
        showToast(
          result.error ??
            (isEdit
              ? "تعذر تعديل فاتورة الشراء"
              : "تعذر حفظ فاتورة الشراء"),
          "error"
        );
        return;
      }

      showToast(
        isEdit
          ? "تم تعديل فاتورة الشراء وتحديث المخزن والخزينة بنجاح"
          : "تم حفظ فاتورة الشراء وتحديث المخزن والخزينة بنجاح"
      );
      router.push("/purchases");
    });
  };

  const effectiveSafeBalance =
    selectedSafe !== null
      ? selectedSafe.balance +
        (initialData && selectedSafe.id === initialData.safeId
          ? initialData.totalAmount
          : 0)
      : 0;

  const hasInsufficientBalance =
    selectedSafe !== null && totalAmount > effectiveSafeBalance;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {isEdit
            ? `تعديل فاتورة شراء ${initialData?.invoiceNumber ?? ""}`
            : "فاتورة شراء جديدة"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? "عدّل الأصناف أو الكميات أو الأسعار؛ سيتم عكس الفاتورة السابقة وتطبيق القيم الجديدة ذرياً على المخزن والخزينة."
            : "سجّل مشترياتك لمنتجات موجودة أو أنشئ أصنافاً جديدة تلقائياً؛ سيتم إدخال الكميات للمخزن وحساب متوسط التكلفة وخصم الإجمالي من الخزينة."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              المورد (اختياري)
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="مثال: مصنع النيل للمنسوجات"
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
              الخزينة المدفوع منها <span className="text-rose-500">*</span>
            </label>
            <select
              value={safeId}
              onChange={(e) => setSafeId(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {safes.map((safe) => (
                <option key={safe.id} value={safe.id}>
                  {safe.name} ({formatCurrency(safe.balance)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">
              بنود الفاتورة ({formatNumber(lines.length)})
            </h3>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              <span>يمكنك اختيار صنف مسجّل أو إنشاء صنف جديد مباشرة</span>
            </span>
          </div>

          <div className="space-y-4">
            {lines.map((line, idx) => {
              const selectedProduct =
                line.mode === "existing"
                  ? products.find((p) => p.id === line.productId) ?? null
                  : null;
              const lineTotal = (line.quantity || 0) * (line.unitCost || 0);

              return (
                <div
                  key={line.id}
                  className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      بند #{formatNumber(idx + 1)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">
                        الإجمالي الفرعي:{" "}
                        <span className="tabular-nums font-semibold text-slate-900">
                          {formatCurrency(lineTotal)}
                        </span>
                      </span>
                      <button
                        type="button"
                        disabled={lines.length === 1}
                        onClick={() =>
                          setLines((prev) =>
                            prev.filter((l) => l.id !== line.id)
                          )
                        }
                        aria-label="حذف السطر"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-6">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        الصنف <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={
                          line.mode === "new"
                            ? NEW_PRODUCT_OPTION
                            : line.productId
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === NEW_PRODUCT_OPTION) {
                            updateLine(idx, {
                              mode: "new",
                              productId: "",
                              productName: "",
                            });
                            return;
                          }
                          const picked = products.find((p) => p.id === val);
                          if (picked) {
                            updateLine(idx, {
                              mode: "existing",
                              productId: picked.id,
                              productName: picked.name,
                              unitCost: picked.averageCostPrice,
                              sellingPrice: "",
                            });
                          }
                        }}
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value={NEW_PRODUCT_OPTION}>
                          + إنشاء صنف جديد تلقائياً في المخزن
                        </option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (متاح: {formatNumber(p.stockQuantity)})
                          </option>
                        ))}
                      </select>
                      {selectedProduct && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          متوسط التكلفة الحالي:{" "}
                          {formatCurrency(selectedProduct.averageCostPrice)} •
                          سعر البيع:{" "}
                          {formatCurrency(selectedProduct.sellingPrice)}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        الكمية <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(idx, {
                            quantity: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        placeholder="الكمية"
                        className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        سعر التكلفة للوحدة{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitCost}
                        onChange={(e) =>
                          updateLine(idx, {
                            unitCost: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        placeholder="0.00"
                        className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {line.mode === "new" && (
                    <div className="grid grid-cols-1 gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-emerald-900">
                          اسم الصنف الجديد{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={line.productName}
                          onChange={(e) =>
                            updateLine(idx, { productName: e.target.value })
                          }
                          placeholder="مثال: آيفون 17 برو"
                          className="h-9 w-full rounded-md border border-emerald-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-emerald-900">
                          سعر البيع المبدئي للجمهور (ج.م)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.sellingPrice}
                          onChange={(e) =>
                            updateLine(idx, { sellingPrice: e.target.value })
                          }
                          placeholder={`افتراضي: ${line.unitCost || 0} (يمكنك تعديله لاحقاً)`}
                          className="tabular-nums h-9 w-full rounded-md border border-emerald-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            {products.length > 0 && (
              <button
                type="button"
                onClick={addExistingLine}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة صنف موجود</span>
              </button>
            )}
            <button
              type="button"
              onClick={addNewProductLine}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-emerald-700"
            >
              <PackagePlus className="h-4 w-4" />
              <span>إضافة صنف جديد للفاتورة</span>
            </button>
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
            placeholder="أي تفاصيل إضافية حول فاتورة الشراء..."
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {hasInsufficientBalance && selectedSafe && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
            تنبيه: إجمالي الفاتورة ({formatCurrency(totalAmount)}) يتجاوز الرصيد
            المتاح في &quot;{selectedSafe.name}&quot; (
            {formatCurrency(effectiveSafeBalance)}).
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">
              الإجمالي المخصوم من الخزينة:
            </span>
            <CurrencyDisplay amount={totalAmount} className="text-xl" />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {isPending
                ? "جاري الحفظ..."
                : isEdit
                  ? "حفظ التعديلات"
                  : "حفظ الفاتورة"}
            </button>
            <Link
              href="/purchases"
              className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              إلغاء
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
