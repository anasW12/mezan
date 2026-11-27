"use client";

import React, { useDeferredValue, useMemo, useState, useTransition } from "react";
import { Ban, CheckCircle2, LogOut, Search, Shield } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import { updateCompanyPlanAction } from "@/actions/admin";
import { logoutAction } from "@/actions/auth";
import { cn, formatNumber } from "@/lib/utils";
import type { CompanyTenantRow, PlanStatus } from "@/types";

interface AdminClientProps {
  companies: CompanyTenantRow[];
  adminName: string;
}

export function AdminClient({ companies, adminName }: AdminClientProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoggingOut, startLogout] = useTransition();

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<"ALL" | PlanStatus>("ALL");
  const [confirmAction, setConfirmAction] = useState<{
    company: CompanyTenantRow;
    nextStatus: "ACTIVE" | "EXPIRED";
  } | null>(null);

  const stats = useMemo(() => {
    return {
      total: companies.length,
      active: companies.filter((c) => c.planStatus === "ACTIVE").length,
      trial: companies.filter((c) => c.planStatus === "TRIAL").length,
      expired: companies.filter((c) => c.planStatus === "EXPIRED").length,
    };
  }, [companies]);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return companies.filter((comp) => {
      const matchesSearch =
        !q ||
        comp.name.toLowerCase().includes(q) ||
        comp.ownerName.toLowerCase().includes(q) ||
        comp.ownerEmail.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "ALL" || comp.planStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [companies, deferredSearch, statusFilter]);

  const handleConfirmStatusChange = () => {
    if (!confirmAction) return;
    const { company, nextStatus } = confirmAction;

    startTransition(async () => {
      const result = await updateCompanyPlanAction({
        companyId: company.id,
        planStatus: nextStatus,
      });
      setConfirmAction(null);

      if (!result.success) {
        showToast(result.error ?? "تعذر تحديث حالة الاشتراك", "error");
        return;
      }

      showToast(
        nextStatus === "ACTIVE"
          ? `تم تفعيل اشتراك "${company.name}" بنجاح`
          : `تم إنهاء اشتراك "${company.name}" بنجاح`
      );
    });
  };

  return (
    <div className="bg-calm-canvas min-h-screen">
      {/* Indigo Admin Top Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo href="/admin" accent="indigo" />
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              <Shield className="h-3.5 w-3.5" />
              بوابة الإدارة
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-slate-600 sm:inline">
              {adminName}
            </span>
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={() => startLogout(() => logoutAction())}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? "جاري الخروج..." : "تسجيل الخروج"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة الشركات</h1>
          <p className="mt-1 text-sm text-slate-500">
            مراجعة الحسابات المسجلة وتفعيل الاشتراكات بعد تأكيد الدفع اليدوي.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">إجمالي الشركات</p>
            <p className="tabular-nums mt-1 text-2xl font-bold text-slate-900">
              {formatNumber(stats.total)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">اشتراكات نشطة</p>
            <p className="tabular-nums mt-1 text-2xl font-bold text-emerald-600">
              {formatNumber(stats.active)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">فترة تجريبية</p>
            <p className="tabular-nums mt-1 text-2xl font-bold text-sky-600">
              {formatNumber(stats.trial)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">منتهية</p>
            <p className="tabular-nums mt-1 text-2xl font-bold text-rose-600">
              {formatNumber(stats.expired)}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم الشركة أو المالك أو البريد..."
                className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pe-3 ps-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { key: "ALL", label: "الكل" },
                  { key: "TRIAL", label: "تجريبي" },
                  { key: "ACTIVE", label: "نشط" },
                  { key: "EXPIRED", label: "منتهي" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === tab.key
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="لا توجد شركات مطابقة"
              description="جرب تغيير معايير البحث أو حالة الاشتراك."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                      الشركة
                    </th>
                    <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                      المالك
                    </th>
                    <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                      تاريخ التسجيل
                    </th>
                    <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                      الحالة
                    </th>
                    <th className="px-6 py-3.5 text-end text-xs font-semibold text-slate-500">
                      إجراء
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((comp) => (
                    <tr
                      key={comp.id}
                      className="border-t border-slate-100 transition-colors hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {comp.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700">
                          {comp.ownerName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {comp.ownerEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {comp.createdAt}
                      </td>
                      <td className="px-6 py-4">
                        {comp.planStatus === "ACTIVE" && (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            نشط
                          </span>
                        )}
                        {comp.planStatus === "TRIAL" && (
                          <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                            تجريبي
                          </span>
                        )}
                        {comp.planStatus === "EXPIRED" && (
                          <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                            منتهي
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-end">
                        <div className="flex items-center justify-end gap-2">
                          {comp.planStatus === "ACTIVE" ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>مفعّل</span>
                              </span>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  setConfirmAction({
                                    company: comp,
                                    nextStatus: "EXPIRED",
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                              >
                                <Ban className="h-3.5 w-3.5" />
                                <span>إيقاف</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                setConfirmAction({
                                  company: comp,
                                  nextStatus: "ACTIVE",
                                })
                              }
                              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                            >
                              تفعيل
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        variant={confirmAction?.nextStatus === "ACTIVE" ? "primary" : "destructive"}
        title={
          confirmAction?.nextStatus === "ACTIVE"
            ? "تفعيل اشتراك الشركة؟"
            : "إيقاف اشتراك الشركة؟"
        }
        description={
          confirmAction?.nextStatus === "ACTIVE"
            ? `سيتم تفعيل الاشتراك الكامل لشركة "${confirmAction?.company.name ?? ""}" ومنح المالك صلاحية الوصول الكاملة.`
            : `سيتم تحويل شركة "${confirmAction?.company.name ?? ""}" إلى حالة منتهي وإغلاق الوصول مؤقتاً مع حفظ كافة البيانات.`
        }
        confirmLabel={
          confirmAction?.nextStatus === "ACTIVE"
            ? "تفعيل الاشتراك"
            : "إيقاف الاشتراك"
        }
        onConfirm={handleConfirmStatusChange}
        onCancel={() => !isPending && setConfirmAction(null)}
      />
    </div>
  );
}
