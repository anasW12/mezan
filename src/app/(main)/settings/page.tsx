"use client";

import React, { useState } from "react";
import { Building2, Download, Plus, Vault } from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { useToast } from "@/components/shared/ToastProvider";
import { INITIAL_SAFES } from "@/lib/mock-data";
import type { SafeAccount } from "@/types";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [companyName, setCompanyName] = useState("شركة النور للتجارة الإلكترونية");
  const [safes, setSafes] = useState<SafeAccount[]>(INITIAL_SAFES);
  const [newSafeName, setNewSafeName] = useState("");

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showToast("يرجى إدخال اسم الشركة", "error");
      return;
    }
    showToast("تم حفظ بيانات الشركة بنجاح");
  };

  const handleAddSafe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSafeName.trim()) return;
    setSafes((prev) => [
      ...prev,
      {
        id: `safe-${Date.now()}`,
        name: newSafeName.trim(),
        balance: 0,
        isDefault: false,
      },
    ]);
    setNewSafeName("");
    showToast("تم إضافة الخزينة الجديدة");
  };

  const handleExport = () => {
    showToast("تم تجهيز ملف البيانات (Excel / CSV) للتحميل");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">الإعدادات</h2>
        <p className="mt-1 text-sm text-slate-500">
          إدارة بيانات الشركة، الخزائن، وتصدير التقارير المالية.
        </p>
      </div>

      {/* Company Details */}
      <form
        onSubmit={handleSaveCompany}
        className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Building2 className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">بيانات الشركة</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              اسم الشركة
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              العملة الافتراضية
            </label>
            <input
              type="text"
              disabled
              value="الجنيه المصري (ج.م)"
              className="h-10 w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-3 text-sm text-slate-500"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            حفظ التغييرات
          </button>
        </div>
      </form>

      {/* Safes */}
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Vault className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            الخزائن والحسابات
          </h3>
        </div>

        <div className="space-y-3">
          {safes.map((safe) => (
            <div
              key={safe.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-4 py-3"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-medium text-slate-800">
                  {safe.name}
                </span>
                {safe.isDefault && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    افتراضية
                  </span>
                )}
              </div>
              <CurrencyDisplay amount={safe.balance} className="text-sm" />
            </div>
          ))}
        </div>

        <form onSubmit={handleAddSafe} className="mt-4 flex gap-2">
          <input
            type="text"
            value={newSafeName}
            onChange={(e) => setNewSafeName(e.target.value)}
            placeholder="اسم خزينة جديدة (مثال: فودافون كاش)"
            className="h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة خزينة</span>
          </button>
        </form>
      </div>

      {/* Export Data */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            تصدير البيانات (Excel)
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            حمّل نسخة كاملة من المبيعات والمشتريات والمخزون بضغطة واحدة.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Download className="h-4 w-4 text-emerald-600" />
          <span>تصدير Excel</span>
        </button>
      </div>
    </div>
  );
}
