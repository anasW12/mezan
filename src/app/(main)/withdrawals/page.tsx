"use client";

import React, { useState } from "react";
import { Info, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import { INITIAL_SAFES, INITIAL_WITHDRAWALS } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";
import type { WithdrawalRow } from "@/types";

export default function WithdrawalsPage() {
  const { showToast } = useToast();
  const [withdrawals, setWithdrawals] =
    useState<WithdrawalRow[]>(INITIAL_WITHDRAWALS);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [safeId, setSafeId] = useState(INITIAL_SAFES[0].id);
  const [deleteTarget, setDeleteTarget] = useState<WithdrawalRow | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!description.trim() || !numericAmount || numericAmount <= 0) {
      showToast("يرجى إدخال وصف السحب ومبلغ صحيح", "error");
      return;
    }
    const safeName =
      INITIAL_SAFES.find((s) => s.id === safeId)?.name ?? "الخزينة الرئيسية";

    setWithdrawals((prev) => [
      {
        id: `wdr-${Date.now()}`,
        date: "٢٦ نوفمبر ٢٠٢٦",
        description: description.trim(),
        safeName,
        amount: numericAmount,
      },
      ...prev,
    ]);
    setDescription("");
    setAmount("");
    showToast("تم تسجيل المسحوبات الشخصية بنجاح");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          المسحوبات الشخصية
        </h2>
        <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-medium text-slate-600">
          <Info className="h-4 w-4 shrink-0 text-sky-500" />
          <span>
            المسحوبات الشخصية تُخصم من الخزينة ولا تؤثر على صافي ربح الشركة.
          </span>
        </div>
      </div>

      <form
        onSubmit={handleAdd}
        className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-12 sm:items-end"
      >
        <div className="sm:col-span-5">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            وصف السحب
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="مثال: مسحوبات شخصية للمالك"
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            المبلغ (ج.م)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            الخزينة
          </label>
          <select
            value={safeId}
            onChange={(e) => setSafeId(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {INITIAL_SAFES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>تسجيل سحب</span>
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        {withdrawals.length === 0 ? (
          <EmptyState
            title="لا توجد مسحوبات مسجلة"
            description="ستظهر هنا جميع المسحوبات الشخصية المسجلة للمالك."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    التاريخ
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    الوصف
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    الخزينة
                  </th>
                  <th className="px-6 py-3.5 text-end text-xs font-semibold text-slate-500">
                    المبلغ
                  </th>
                  <th className="px-6 py-3.5 text-end text-xs font-semibold text-slate-500">
                    إجراء
                  </th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {row.date}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {row.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {row.safeName}
                    </td>
                    <td className="px-6 py-4 text-end text-sm">
                      <CurrencyDisplay
                        amount={-row.amount}
                        tone="negative"
                        className="text-sm font-semibold"
                      />
                    </td>
                    <td className="px-6 py-4 text-end">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        aria-label={`حذف ${row.description}`}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
          إجمالي السجلات: {formatNumber(withdrawals.length)}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="هل أنت متأكد؟"
        description={`سيتم حذف "${deleteTarget?.description ?? ""}" نهائياً.`}
        onConfirm={() => {
          if (!deleteTarget) return;
          setWithdrawals((prev) => prev.filter((w) => w.id !== deleteTarget.id));
          setDeleteTarget(null);
          showToast("تم حذف السجل بنجاح");
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
