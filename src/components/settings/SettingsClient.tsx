"use client";

import React, { useState, useTransition } from "react";
import { Building2, Download, Landmark, Plus, Trash2, Vault } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { useToast } from "@/components/shared/ToastProvider";
import {
  adjustSafeBalanceAction,
  createFixedAssetAction,
  createSafeAction,
  deleteFixedAssetAction,
  updateCompanyAction,
} from "@/actions/settings";
import type { FixedAssetRow, SafeAccount } from "@/types";

interface SettingsClientProps {
  initialCompanyName: string;
  currency: string;
  safes: SafeAccount[];
  fixedAssets: FixedAssetRow[];
}

export function SettingsClient({
  initialCompanyName,
  currency,
  safes,
  fixedAssets,
}: SettingsClientProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [newSafeName, setNewSafeName] = useState("");
  const [newSafeBalance, setNewSafeBalance] = useState("");

  const [adjustSafeId, setAdjustSafeId] = useState(safes[0]?.id ?? "");
  const [adjustDirection, setAdjustDirection] = useState<"ADD" | "SUB">("ADD");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const [assetName, setAssetName] = useState("");
  const [assetValue, setAssetValue] = useState("");
  const [assetDate, setAssetDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [deleteAssetTarget, setDeleteAssetTarget] =
    useState<FixedAssetRow | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showToast("يرجى إدخال اسم الشركة", "error");
      return;
    }

    startTransition(async () => {
      const result = await updateCompanyAction({ name: companyName.trim() });
      if (!result.success) {
        showToast(result.error ?? "تعذر حفظ اسم الشركة", "error");
        return;
      }
      showToast("تم حفظ بيانات الشركة بنجاح");
    });
  };

  const handleAddSafe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSafeName.trim()) {
      showToast("يرجى إدخال اسم الخزينة", "error");
      return;
    }

    startTransition(async () => {
      const result = await createSafeAction({
        name: newSafeName.trim(),
        initialBalance: Number(newSafeBalance) || 0,
      });

      if (!result.success) {
        showToast(result.error ?? "تعذر إضافة الخزينة", "error");
        return;
      }

      setNewSafeName("");
      setNewSafeBalance("");
      showToast("تم إضافة الخزينة الجديدة بنجاح");
    });
  };

  const handleAdjustSafe = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(adjustAmount);
    if (!adjustSafeId || !numeric || numeric <= 0 || !adjustReason.trim()) {
      showToast("يرجى اختيار الخزينة وإدخال مبلغ وسبب التسوية", "error");
      return;
    }

    const signedAmount = adjustDirection === "ADD" ? numeric : -numeric;

    startTransition(async () => {
      const result = await adjustSafeBalanceAction({
        safeId: adjustSafeId,
        amount: signedAmount,
        reason: adjustReason.trim(),
      });

      if (!result.success) {
        showToast(result.error ?? "تعذر تعديل رصيد الخزينة", "error");
        return;
      }

      setAdjustAmount("");
      setAdjustReason("");
      showToast("تم تحديث رصيد الخزينة وتوثيقه في سجل الحركات");
    });
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(assetValue);
    if (!assetName.trim() || !numeric || numeric <= 0 || !assetDate) {
      showToast("يرجى إدخال اسم الأصل وقيمته وتاريخ شرائه", "error");
      return;
    }

    startTransition(async () => {
      const result = await createFixedAssetAction({
        name: assetName.trim(),
        purchaseValue: numeric,
        purchaseDate: assetDate,
      });

      if (!result.success) {
        showToast(result.error ?? "تعذر إضافة الأصل الثابت", "error");
        return;
      }

      setAssetName("");
      setAssetValue("");
      showToast("تم إضافة الأصل الثابت بنجاح");
    });
  };

  const handleDeleteAsset = () => {
    if (!deleteAssetTarget) return;
    const targetId = deleteAssetTarget.id;

    startTransition(async () => {
      const result = await deleteFixedAssetAction(targetId);
      setDeleteAssetTarget(null);

      if (!result.success) {
        showToast(result.error ?? "تعذر حذف الأصل الثابت", "error");
        return;
      }

      showToast("تم حذف الأصل الثابت بنجاح");
    });
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const response = await fetch("/api/export", { method: "GET" });
      if (!response.ok) {
        const errBody = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        showToast(
          errBody?.error ?? "تعذر تصدير ملف البيانات الآن",
          "error"
        );
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const dateSlug = new Date().toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = `mezan-export-${dateSlug}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      showToast("تم تصدير جميع بيانات الشركة في ملف Excel بنجاح");
    } catch {
      showToast("حدث خطأ أثناء تحميل ملف Excel", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">الإعدادات</h2>
        <p className="mt-1 text-sm text-slate-500">
          إدارة بيانات الشركة، الخزائن والأرصدة الافتتاحية، والأصول الثابتة.
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
              value={
                currency === "EGP" ? "الجنيه المصري (ج.م)" : currency
              }
              className="h-10 w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-3 text-sm text-slate-500"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
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

        <form
          onSubmit={handleAddSafe}
          className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-12"
        >
          <input
            type="text"
            value={newSafeName}
            onChange={(e) => setNewSafeName(e.target.value)}
            placeholder="اسم خزينة جديدة (مثال: فودافون كاش)"
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-6"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={newSafeBalance}
            onChange={(e) => setNewSafeBalance(e.target.value)}
            placeholder="رصيد افتتاحي (اختياري)"
            className="tabular-nums h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-3"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 sm:col-span-3"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة خزينة</span>
          </button>
        </form>

        {/* Safe Balance Adjustment */}
        {safes.length > 0 && (
          <form
            onSubmit={handleAdjustSafe}
            className="mt-6 border-t border-slate-100 pt-5"
          >
            <h4 className="mb-3 text-sm font-semibold text-slate-800">
              إيداع رأس مال أو تسوية رصيد خزينة
            </h4>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
              <select
                value={adjustSafeId}
                onChange={(e) => setAdjustSafeId(e.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-3"
              >
                {safes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={adjustDirection}
                onChange={(e) =>
                  setAdjustDirection(e.target.value as "ADD" | "SUB")
                }
                className="h-10 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-2"
              >
                <option value="ADD">إيداع (+)</option>
                <option value="SUB">خصم (-)</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="المبلغ"
                className="tabular-nums h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-2"
              />
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="السبب (مثال: رصيد افتتاحي)"
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-3"
              />
              <button
                type="submit"
                disabled={isPending}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 sm:col-span-2"
              >
                تطبيق
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Fixed Assets */}
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <Landmark className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            الأصول الثابتة
          </h3>
        </div>

        {fixedAssets.length > 0 && (
          <div className="mb-4 space-y-2.5">
            {fixedAssets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium text-slate-800">
                    {asset.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    تاريخ الشراء: {asset.purchaseDate}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CurrencyDisplay
                    amount={asset.purchaseValue}
                    className="text-sm"
                  />
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setDeleteAssetTarget(asset)}
                    aria-label={`حذف ${asset.name}`}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleAddAsset}
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-12"
        >
          <input
            type="text"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="اسم الأصل (مثال: أجهزة كمبيوتر ومعدات)"
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-5"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={assetValue}
            onChange={(e) => setAssetValue(e.target.value)}
            placeholder="القيمة (ج.م)"
            className="tabular-nums h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-2"
          />
          <input
            type="date"
            value={assetDate}
            onChange={(e) => setAssetDate(e.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-3"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 sm:col-span-2"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة</span>
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
          disabled={isExporting}
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-4 w-4 text-emerald-600" />
          <span>{isExporting ? "جاري التجهيز..." : "تصدير Excel"}</span>
        </button>
      </div>

      <ConfirmDialog
        open={Boolean(deleteAssetTarget)}
        title="حذف الأصل الثابت؟"
        description={`سيتم حذف "${deleteAssetTarget?.name ?? ""}" من سجل الأصول الثابتة.`}
        onConfirm={handleDeleteAsset}
        onCancel={() => !isPending && setDeleteAssetTarget(null)}
      />
    </div>
  );
}
