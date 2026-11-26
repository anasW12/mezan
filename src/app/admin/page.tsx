"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/shared/ToastProvider";
import { INITIAL_COMPANIES } from "@/lib/mock-data";
import type { CompanyTenantRow } from "@/types";

export default function AdminPortalPage() {
  const { showToast } = useToast();
  const [companies, setCompanies] =
    useState<CompanyTenantRow[]>(INITIAL_COMPANIES);
  const [targetCompany, setTargetCompany] = useState<CompanyTenantRow | null>(
    null
  );

  const handleActivate = () => {
    if (!targetCompany) return;
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === targetCompany.id ? { ...c, planStatus: "ACTIVE" } : c
      )
    );
    showToast(`تم تفعيل اشتراك "${targetCompany.name}" بنجاح`);
    setTargetCompany(null);
  };

  return (
    <div className="bg-calm-canvas min-h-screen">
      {/* Indigo Admin Top Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo href="/admin" accent="indigo" />
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              <Shield className="h-3.5 w-3.5" />
              بوابة الإدارة
            </span>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowRight className="h-4 w-4" />
            <span>العودة للتطبيق</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة الشركات</h1>
          <p className="mt-1 text-sm text-slate-500">
            مراجعة الحسابات المسجلة وتفعيل الاشتراكات بعد تأكيد الدفع اليدوي.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
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
                {companies.map((comp) => (
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
                      {comp.planStatus === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>مفعّل</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setTargetCompany(comp)}
                          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
                        >
                          تفعيل
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={Boolean(targetCompany)}
        variant="primary"
        title="تفعيل اشتراك الشركة؟"
        description={`سيتم تفعيل الاشتراك الكامل لشركة "${targetCompany?.name ?? ""}" ومنح المالك صلاحية الوصول الكاملة.`}
        confirmLabel="تفعيل الاشتراك"
        onConfirm={handleActivate}
        onCancel={() => setTargetCompany(null)}
      />
    </div>
  );
}
