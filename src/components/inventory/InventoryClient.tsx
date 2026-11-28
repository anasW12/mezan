"use client";

import React, { useDeferredValue, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Info,
  Lock,
  Pencil,
  Search,
  X,
} from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import { updateProductAction } from "@/actions/inventory";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Product } from "@/types";

const LOW_STOCK_THRESHOLD = 5;

interface InventoryClientProps {
  products: Product[];
}

export function InventoryClient({ products }: InventoryClientProps) {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [filter, setFilter] = useState<"ALL" | "LOW">("ALL");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();

  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stockQuantity < LOW_STOCK_THRESHOLD).length,
    [products]
  );

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchesFilter =
        filter === "ALL" || p.stockQuantity < LOW_STOCK_THRESHOLD;
      return matchesSearch && matchesFilter;
    });
  }, [products, deferredSearch, filter]);

  const totalFilteredCostValue = useMemo(
    () =>
      filtered.reduce(
        (sum, p) => sum + p.stockQuantity * p.averageCostPrice,
        0
      ),
    [filtered]
  );

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormPrice(String(product.sellingPrice));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!formName.trim()) {
      showToast("يرجى إدخال اسم المنتج", "error");
      return;
    }

    const numericPrice = Number(formPrice);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      showToast("يرجى إدخال سعر بيع صحيح", "error");
      return;
    }

    startTransition(async () => {
      const result = await updateProductAction({
        id: editingProduct.id,
        name: formName.trim(),
        sellingPrice: numericPrice,
      });

      if (!result.success) {
        showToast(result.error ?? "تعذر تحديث بيانات المنتج", "error");
        return;
      }

      showToast("تم تحديث اسم المنتج وسعر البيع بنجاح");
      setEditingProduct(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">المخزن</h2>
          <p className="mt-1 text-sm text-slate-500">
            عرض الأصناف المتوفرة، تقييم المخزون بالتكلفة، وتعديل الأسعار
            الإدارية فقط.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
        <div className="flex items-center gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            تُضاف الأصناف وتُحدّث الكميات تلقائياً عبر فواتير المشتريات وتُخصم
            تلقائياً عند تسجيل المبيعات
          </span>
        </div>
        <Link
          href="/purchases/new"
          className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
        >
          <span>تسجيل فاتورة شراء جديدة</span>
          <ArrowLeft className="h-4 w-4" />
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
              placeholder="ابحث باسم الصنف..."
              className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pe-3 ps-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={
                filter === "ALL"
                  ? "rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                  : "rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
              }
            >
              الكل ({formatNumber(products.length)})
            </button>
            <button
              type="button"
              onClick={() => setFilter("LOW")}
              className={
                filter === "LOW"
                  ? "rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700"
                  : "rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
              }
            >
              مخزون منخفض ({formatNumber(lowStockCount)})
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          products.length === 0 ? (
            <EmptyState
              title="المخزن فارغ حالياً"
              description="تُضاف الأصناف والكميات تلقائياً عبر تسجيل فواتير المشتريات."
              actionLabel="فاتورة شراء جديدة"
              actionHref="/purchases/new"
            />
          ) : (
            <EmptyState
              title="لا توجد أصناف مطابقة"
              description="جرّب تغيير نص البحث أو اختيار عرض جميع الأصناف."
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    #
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    اسم الصنف
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    الكمية المتاحة
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    متوسط سعر التكلفة
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    سعر البيع للجمهور
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    إجمالي قيمة البضاعة بالتكلفة
                  </th>
                  <th className="px-6 py-3.5 text-end text-xs font-semibold text-slate-500">
                    تعديل الأسعار
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, index) => {
                  const isOutOfStock = product.stockQuantity === 0;
                  const isLowStock =
                    product.stockQuantity > 0 &&
                    product.stockQuantity < LOW_STOCK_THRESHOLD;
                  const totalCostValue =
                    product.stockQuantity * product.averageCostPrice;

                  return (
                    <tr
                      key={product.id}
                      className="border-t border-slate-100 transition-colors hover:bg-slate-50/50"
                    >
                      <td className="tabular-nums px-6 py-4 text-sm text-slate-400">
                        {formatNumber(index + 1)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {product.name}
                        </div>
                        <div dir="ltr" className="w-fit text-xs text-slate-400">
                          {product.sku}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                            <span className="tabular-nums">
                              {formatNumber(product.stockQuantity)} قطع (نفد
                              المخزون)
                            </span>
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            <span className="tabular-nums">
                              {formatNumber(product.stockQuantity)} قطع (مخزون
                              منخفض)
                            </span>
                          </span>
                        ) : (
                          <span className="tabular-nums text-slate-700">
                            {formatNumber(product.stockQuantity)} قطعة
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="inline-flex items-center gap-1.5 text-slate-500">
                          <CurrencyDisplay
                            amount={product.averageCostPrice}
                            className="text-sm font-normal text-slate-600"
                          />
                          <Lock
                            className="h-3 w-3 text-slate-300"
                            aria-label="للقراءة فقط"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <CurrencyDisplay
                          amount={product.sellingPrice}
                          className="text-sm font-semibold text-slate-900"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <CurrencyDisplay
                          amount={totalCostValue}
                          className="text-sm font-semibold text-emerald-700"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => openEditModal(product)}
                            aria-label={`تعديل اسم وسعر ${product.name}`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>تعديل</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
          <span>
            عرض {formatNumber(filtered.length)} من{" "}
            {formatNumber(products.length)} صنف
          </span>
          <div className="flex items-center gap-2">
            <span>إجمالي قيمة البضاعة بالتكلفة:</span>
            <CurrencyDisplay
              amount={totalFilteredCostValue}
              className="text-sm font-semibold text-slate-800"
            />
          </div>
        </div>
      </div>

      {editingProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          onClick={() => !isPending && setEditingProduct(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                تعديل البيانات الإدارية للصنف
              </h3>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setEditingProduct(null)}
                aria-label="إغلاق"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  اسم الصنف <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: آيفون 17 برو"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  سعر البيع للجمهور (ج.م) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0.00"
                  className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>الكمية الحالية (للقراءة فقط):</span>
                  <span className="tabular-nums font-semibold text-slate-800">
                    {formatNumber(editingProduct.stockQuantity)} قطعة
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>متوسط سعر التكلفة (للقراءة فقط):</span>
                  <span className="tabular-nums font-semibold text-slate-800">
                    {formatCurrency(editingProduct.averageCostPrice)}
                  </span>
                </div>
                <p className="border-t border-slate-200 pt-1.5 text-[11px] text-slate-500">
                  تعديل الكمية أو التكلفة يتم حصرياً عبر تسجيل فواتير المشتريات
                  والبيع لضمان دقة الحسابات.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setEditingProduct(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
