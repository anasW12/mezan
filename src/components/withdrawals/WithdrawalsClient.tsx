"use client";

import React, { useState, useTransition } from "react";
import { Info, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import {
  createWithdrawalAction,
  deleteWithdrawalAction,
} from "@/actions/accounting";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { SafeAccount, WithdrawalRow } from "@/types";

interface WithdrawalsClientProps {
  withdrawals: WithdrawalRow[];
  safes: SafeAccount[];
}

export function WithdrawalsClient({
  withdrawals,
  safes,
}: WithdrawalsClientProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [safeId, setSafeId] = useState(safes[0]?.id ?? "");
  const [deleteTarget, setDeleteTarget] = useState<WithdrawalRow | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!description.trim() || !numericAmount || numericAmount <= 0) {
      showToast("يرجى إدخال وصف السحب ومبلغ صحيح", "error");
      return;
    }

    startTransition(async () => {
      const result = await createWithdrawalAction({
        safeId,
        notes: description.trim(),
        amount: numericAmount,
      });

      if (!result.success) {
        showToast(result.error ?? "تعذر تسجيل المسحوبات", "error");
        return;
      }

      setDescription("");
      setAmount("");
      showToast("تم تسجيل المسحوبات الشخصية بنجاح");
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;

    startTransition(async () => {
      const result = await deleteWithdrawalAction(targetId);
      setDeleteTarget(null);

      if (!result.success) {
        showToast(result.error ?? "تعذر حذف السجل", "error");
        return;
      }

      showToast("تم إلغاء المسحوبات وإعادة المبلغ إلى الخزينة");
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          المسحوبات الشخصية
        </h2>
        <div className="mt-2 inline-flex items-start gap-2 rounded-lg border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-medium text-slate-600 sm:items-center">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500 sm:mt-0" />
          <span>
            المسحوبات الشخصية تُخصم من الخزينة ولا تؤثر على صافي ربح الشركة.
          </span>
        </div>
      </div>

      <form
        onSubmit={handleAdd}
        className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-2 md:grid-cols-12 md:items-end"
      >
        <div className="sm:col-span-2 md:col-span-5">
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

        <div className="md:col-span-3">
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

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            الخزينة
          </label>
          <select
            value={safeId}
            onChange={(e) => setSafeId(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {safes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({formatCurrency(s.balance)})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 md:col-span-2">
          <button
            type="submit"
            disabled={isPending || safes.length === 0}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            <span>{isPending ? "جاري الحفظ..." : "تسجيل سحب"}</span>
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
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {withdrawals.map((row) => (
                <div key={row.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-slate-400">{row.date}</span>
                    <CurrencyDisplay
                      amount={-row.amount}
                      tone="negative"
                      className="text-sm font-semibold"
                    />
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    {row.description}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500">
                      الخزينة: {row.safeName}
                    </span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setDeleteTarget(row)}
                      aria-label={`حذف ${row.description}`}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/40 px-2.5 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
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
                          disabled={isPending}
                          onClick={() => setDeleteTarget(row)}
                          aria-label={`حذف ${row.description}`}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="border-t border-slate-100 px-4 py-3.5 text-sm text-slate-500 sm:px-6 sm:py-4">
          إجمالي السجلات: {formatNumber(withdrawals.length)}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="إلغاء المسحوبات واسترداد المبلغ؟"
        description={`سيتم حذف "${deleteTarget?.description ?? ""}" وإعادة المبلغ تلقائياً إلى الخزينة وتوثيق ذلك في سجل الحركات.`}
        onConfirm={handleDelete}
        onCancel={() => !isPending && setDeleteTarget(null)}
      />
    </div>
  );
}
