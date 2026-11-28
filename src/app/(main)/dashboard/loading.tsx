import React from "react";
import { DesktopTableSkeleton } from "@/components/shared/LoadingSkeleton";

export default function DashboardLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="جاري تحميل لوحة التحكم"
      className="space-y-8 animate-pulse"
    >
      {/* 5 Primary KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:block sm:p-6"
          >
            <div className="flex items-center gap-3 sm:block">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-200" />
              <div className="h-4 w-24 rounded-md bg-slate-200 sm:mt-4" />
            </div>
            <div className="h-6 w-24 shrink-0 rounded-md bg-slate-200 sm:mt-2 sm:h-7 sm:w-32" />
          </div>
        ))}
      </div>

      {/* Compact Secondary Strip */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-white/75 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="h-8 w-8 rounded-lg bg-sky-100" />
            <div className="h-4 w-28 rounded bg-slate-200" />
          </div>
          <div className="h-4 w-20 rounded bg-slate-200" />
        </div>
        <div className="h-px bg-slate-100 sm:hidden" />
        <div className="hidden h-5 w-px bg-slate-200 sm:block" />
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-200" />
            <div className="h-4 w-32 rounded bg-slate-200" />
          </div>
          <div className="h-4 w-20 rounded bg-slate-200" />
        </div>
      </div>

      {/* AI Smart Entry Bar */}
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm sm:gap-2 sm:p-2">
        <div className="ms-1.5 h-5 w-5 shrink-0 rounded-full bg-emerald-100 sm:ms-2" />
        <div className="h-9 flex-1 rounded-md bg-slate-100" />
        <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100" />
        <div className="h-10 w-11 shrink-0 rounded-lg bg-emerald-200 sm:w-20" />
      </div>

      {/* Recent Transactions */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="h-6 w-28 rounded-md bg-slate-200" />
          <div className="h-4 w-28 rounded-md bg-emerald-100" />
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-14 rounded-full bg-slate-200" />
                  <div className="h-3.5 w-12 rounded bg-slate-100" />
                </div>
                <div className="h-4 w-20 rounded bg-slate-200" />
              </div>
              <div className="h-4 w-4/5 rounded bg-slate-100" />
            </div>
          ))}
        </div>

        <DesktopTableSkeleton
          columnWidths={["w-16", "w-14", "w-56", "w-20"]}
          rows={5}
        />
      </div>
    </div>
  );
}
