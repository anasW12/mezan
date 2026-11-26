"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { useToast } from "@/components/shared/ToastProvider";
import { INITIAL_PRODUCTS, INITIAL_SAFES } from "@/lib/mock-data";

interface PurchaseLine {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [supplier, setSupplier] = useState("");
  const [safeId, setSafeId] = useState(INITIAL_SAFES[0].id);
  const [lines, setLines] = useState<PurchaseLine[]>([
    {
      id: "line-1",
      productId: INITIAL_PRODUCTS[0].id,
      quantity: 100,
      unitCost: INITIAL_PRODUCTS[0].averageCostPrice,
    },
    {
      id: "line-2",
      productId: INITIAL_PRODUCTS[1].id,
      quantity: 50,
      unitCost: INITIAL_PRODUCTS[1].averageCostPrice,
    },
  ]);

  const totalAmount = useMemo(
    () =>
      lines.reduce(
        (sum, line) => sum + (line.quantity || 0) * (line.unitCost || 0),
        0
      ),
    [lines]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount <= 0) {
      showToast("يرجى إضافة منتج واحد على الأقل بكمية وسعر صحيحين", "error");
      return;
    }
    showToast("تم حفظ فاتورة الشراء وتحديث المخزن والخزينة بنجاح");
    router.push("/purchases");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          فاتورة شراء جديدة
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          سيتم زيادة كميات المخزن وإعادة حساب متوسط سعر التكلفة وخصم الإجمالي
          من الخزينة.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              الخزينة المدفوع منها <span className="text-rose-500">*</span>
            </label>
            <select
              value={safeId}
              onChange={(e) => setSafeId(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {INITIAL_SAFES.map((safe) => (
                <option key={safe.id} value={safe.id}>
                  {safe.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">
            المنتجات
          </h3>

          <div className="space-y-3">
            <div className="hidden grid-cols-12 gap-3 text-xs font-medium text-slate-500 sm:grid">
              <span className="col-span-5">المنتج</span>
              <span className="col-span-3">الكمية</span>
              <span className="col-span-3">سعر الوحدة (ج.م)</span>
              <span className="col-span-1" />
            </div>

            {lines.map((line, idx) => (
              <div
                key={line.id}
                className="grid grid-cols-1 gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 sm:grid-cols-12 sm:border-0 sm:bg-transparent sm:p-0"
              >
                <select
                  value={line.productId}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx].productId = e.target.value;
                    setLines(next);
                  }}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-5"
                >
                  {INITIAL_PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx].quantity = Number(e.target.value);
                    setLines(next);
                  }}
                  placeholder="الكمية"
                  className="tabular-nums h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-3"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unitCost}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx].unitCost = Number(e.target.value);
                    setLines(next);
                  }}
                  placeholder="سعر الوحدة"
                  className="tabular-nums h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-3"
                />

                <div className="flex items-center justify-end sm:col-span-1">
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
                  id: `line-${Date.now()}`,
                  productId: INITIAL_PRODUCTS[0].id,
                  quantity: 1,
                  unitCost: INITIAL_PRODUCTS[0].averageCostPrice,
                },
              ])
            }
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة منتج آخر</span>
          </button>
        </div>

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
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              حفظ الفاتورة
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
