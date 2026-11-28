"use client";

import React, { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import {
  createExpenseAction,
  deleteExpenseAction,
} from "@/actions/accounting";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { ExpenseRow, SafeAccount } from "@/types";

interface ExpensesClientProps {
  expenses: ExpenseRow[];
  safes: SafeAccount[];
}

export function ExpensesClient({ expenses, safes }: ExpensesClientProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [category, setCategory] = useState("تشغيل عام");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [safeId, setSafeId] = useState(safes[0]?.id ?? "");
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRow | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!description.trim() || !numericAmount || numericAmount <= 0) {
      showToast("يرجى إدخال وصف المصروف ومبلغ صحيح", "error");
      return;
    }

    startTransition(async () => {
      const result = await createExpenseAction({
        safeId,
        category: category.trim() || "تشغيل عام",
        description: description.trim(),
        amount: numericAmount,
      });

      if (!result.success) {
        showToast(result.error ?? "تعذر تسجيل المصروف", "error");
        return;
      }

      setDescription("");
      setAmount("");
      showToast("تم تسجيل المصروف وخصمه من الخزينة");
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;

    startTransition(async () => {
      const result = await deleteExpenseAction(targetId);
      setDeleteTarget(null);

      if (!result.success) {
        showToast(result.error ?? "تعذر إلغاء المصروف", "error");
        return;
      }

      showToast("تم إلغاء المصروف وإعادة المبلغ إلى الخزينة");
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          المصروفات العامة
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          تسجيل مصاريف التشغيل (الإيجار، الإعلانات، الرواتب) التي تخصم من صافي
          الربح.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-2 md:grid-cols-12 md:items-end"
      >
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            التصنيف
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="تشغيل عام">تشغيل عام</option>
            <option value="إعلانات وتسويق">إعلانات وتسويق</option>
            <option value="إيجار ومرافق">إيجار ومرافق</option>
            <option value="رواتب">رواتب</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>

        <div className="sm:col-span-2 md:col-span-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            وصف المصروف
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="مثال: إيجار المحل / إعلانات فيسبوك"
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="md:col-span-2">
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
            <span>{isPending ? "جاري الحفظ..." : "إضافة"}</span>
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        {expenses.length === 0 ? (
          <EmptyState
            title="لا توجد مصروفات مسجلة"
            description="استخدم شريط الإضافة السريع بالأعلى لتسجيل أول مصروف."
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {expenses.map((exp) => (
                <div key={exp.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {exp.category ?? "تشغيل عام"}
                      </span>
                      <span className="text-xs text-slate-400">{exp.date}</span>
                    </div>
                    <CurrencyDisplay
                      amount={-exp.amount}
                      tone="negative"
                      className="text-sm font-semibold"
                    />
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    {exp.description}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500">
                      الخزينة: {exp.safeName}
                    </span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setDeleteTarget(exp)}
                      aria-label={`حذف ${exp.description}`}
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
                      التصنيف
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
                  {expenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className="border-t border-slate-100 transition-colors hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {exp.date}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                          {exp.category ?? "تشغيل عام"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {exp.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {exp.safeName}
                      </td>
                      <td className="px-6 py-4 text-end text-sm">
                        <CurrencyDisplay
                          amount={-exp.amount}
                          tone="negative"
                          className="text-sm font-semibold"
                        />
                      </td>
                      <td className="px-6 py-4 text-end">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setDeleteTarget(exp)}
                          aria-label={`حذف ${exp.description}`}
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
          إجمالي السجلات: {formatNumber(expenses.length)}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="إلغاء المصروف واسترداد المبلغ؟"
        description={`سيتم حذف المصروف "${deleteTarget?.description ?? ""}" وإعادة المبلغ تلقائياً إلى الخزينة وتوثيق ذلك في سجل الحركات.`}
        onConfirm={handleDelete}
        onCancel={() => !isPending && setDeleteTarget(null)}
      />
    </div>
  );
}
