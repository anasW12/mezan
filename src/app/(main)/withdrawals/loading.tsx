import React from "react";
import { DesktopTableSkeleton } from "@/components/shared/LoadingSkeleton";

export default function WithdrawalsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="جاري تحميل المسحوبات الشخصية"
      className="space-y-6 animate-pulse"
    >
      <div>
        <div className="h-7 w-40 rounded-md bg-slate-200 sm:h-8" />
        <div className="mt-2 h-9 w-96 max-w-full rounded-lg border border-slate-200 bg-white/80" />
      </div>

      {/* Quick-add Withdrawal Form */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-2 md:grid-cols-12 md:items-end">
        <div className="sm:col-span-2 md:col-span-5">
          <div className="mb-1.5 h-3.5 w-20 rounded bg-slate-200" />
          <div className="h-10 w-full rounded-md bg-slate-100" />
        </div>
        <div className="md:col-span-3">
          <div className="mb-1.5 h-3.5 w-20 rounded bg-slate-200" />
          <div className="h-10 w-full rounded-md bg-slate-100" />
        </div>
        <div className="md:col-span-2">
          <div className="mb-1.5 h-3.5 w-16 rounded bg-slate-200" />
          <div className="h-10 w-full rounded-md bg-slate-100" />
        </div>
        <div className="sm:col-span-2 md:col-span-2">
          <div className="h-10 w-full rounded-lg bg-emerald-200" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="divide-y divide-slate-100 md:hidden">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="h-3.5 w-20 rounded bg-slate-100" />
                <div className="h-4 w-20 rounded bg-rose-100" />
              </div>
              <div className="h-4 w-3/4 rounded bg-slate-200" />
              <div className="flex items-center justify-between pt-1">
                <div className="h-3.5 w-28 rounded bg-slate-100" />
                <div className="h-9 w-16 rounded-lg bg-rose-50" />
              </div>
            </div>
          ))}
        </div>

        <DesktopTableSkeleton
          columnWidths={["w-24", "w-52", "w-24", "w-20", "w-10"]}
          rows={5}
        />

        <div className="border-t border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="h-4 w-32 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
