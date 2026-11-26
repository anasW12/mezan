"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { useToast } from "@/components/shared/ToastProvider";
import { INITIAL_PRODUCTS, INITIAL_SAFES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/types";

interface SaleLine {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PAID");
  const [safeId, setSafeId] = useState(INITIAL_SAFES[0].id);
  const [directCost, setDirectCost] = useState("45");
  const [lines, setLines] = useState<SaleLine[]>([
    {
      id: "s-1",
      productId: INITIAL_PRODUCTS[0].id,
      quantity: 2,
      unitPrice: INITIAL_PRODUCTS[0].sellingPrice,
    },
  ]);

  const totalAmount = useMemo(
    () =>
      lines.reduce(
        (sum, line) => sum + (line.quantity || 0) * (line.unitPrice || 0),
        0
      ),
    [lines]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount <= 0) {
      showToast("يرجى إضافة منتج واحد على الأقل", "error");
      return;
    }
    showToast(
      paymentStatus === "PAID"
        ? "تم حفظ فاتورة البيع وإضافة المبلغ للخزينة"
        : "تم حفظ الفاتورة في فلوس تحت التحصيل"
    );
    router.push("/sales");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">فاتورة بيع جديدة</h2>
        <p className="mt-1 text-sm text-slate-500">
          يتم خصم الكمية من المخزن وتثبيت تكلفة البضاعة وقت البيع تلقائياً.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
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
                "rounded-md py-2 text-sm font-medium transition-colors",
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
                "rounded-md py-2 text-sm font-medium transition-colors",
                paymentStatus === "PENDING_COLLECTION"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              تحت التحصيل (COD)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              {INITIAL_SAFES.map((safe) => (
                <option key={safe.id} value={safe.id}>
                  {safe.name}
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
            {lines.map((line, idx) => (
              <div
                key={line.id}
                className="grid grid-cols-1 gap-3 sm:grid-cols-12"
              >
                <select
                  value={line.productId}
                  onChange={(e) => {
                    const selected = INITIAL_PRODUCTS.find(
                      (p) => p.id === e.target.value
                    );
                    const next = [...lines];
                    next[idx].productId = e.target.value;
                    if (selected) next[idx].unitPrice = selected.sellingPrice;
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
                  value={line.unitPrice}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx].unitPrice = Number(e.target.value);
                    setLines(next);
                  }}
                  placeholder="سعر البيع"
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
                  id: `s-${Date.now()}`,
                  productId: INITIAL_PRODUCTS[0].id,
                  quantity: 1,
                  unitPrice: INITIAL_PRODUCTS[0].sellingPrice,
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
              إجمالي الفاتورة:
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
              href="/sales"
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
