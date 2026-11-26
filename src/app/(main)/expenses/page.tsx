"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import { INITIAL_EXPENSES, INITIAL_SAFES } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";
import type { ExpenseRow } from "@/types";

export default function ExpensesPage() {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<ExpenseRow[]>(INITIAL_EXPENSES);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [safeId, setSafeId] = useState(INITIAL_SAFES[0].id);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRow | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!description.trim() || !numericAmount || numericAmount <= 0) {
      showToast("يرجى إدخال وصف المصروف ومبلغ صحيح", "error");
      return;
    }

    const safeName =
      INITIAL_SAFES.find((s) => s.id === safeId)?.name ?? "الخزينة الرئيسية";

    const newExpense: ExpenseRow = {
      id: `exp-${Date.now()}`,
      date: "٢٦ نوفمبر ٢٠٢٦",
      description: description.trim(),
      safeName,
      amount: numericAmount,
    };

    setExpenses((prev) => [newExpense, ...prev]);
    setDescription("");
    setAmount("");
    showToast("تم تسجيل المصروف وخصمه من الخزينة");
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setExpenses((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    showToast("تم حذف المصروف بنجاح");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">المصروفات العامة</h2>
        <p className="mt-1 text-sm text-slate-500">
          تسجيل مصاريف التشغيل (الإيجار، الإعلانات، الرواتب) التي تخصم من صافي
          الربح.
        </p>
      </div>

      {/* Quick-add form */}
      <form
        onSubmit={handleAdd}
        className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-12 sm:items-end"
      >
        <div className="sm:col-span-5">
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
            <span>إضافة</span>
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
                {expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {exp.date}
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
                        onClick={() => setDeleteTarget(exp)}
                        aria-label={`حذف ${exp.description}`}
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
          إجمالي السجلات: {formatNumber(expenses.length)}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="هل أنت متأكد؟"
        description={`سيتم حذف المصروف "${deleteTarget?.description ?? ""}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
