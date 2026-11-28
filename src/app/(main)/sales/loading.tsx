import React from "react";
import { DesktopTableSkeleton } from "@/components/shared/LoadingSkeleton";

export default function SalesLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="جاري تحميل المبيعات"
      className="space-y-6 animate-pulse"
    >
      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="h-7 w-40 rounded-md bg-slate-200 sm:h-8" />
          <div className="mt-2 h-4 w-72 max-w-full rounded-md bg-slate-100" />
        </div>
        <div className="h-11 w-full rounded-lg bg-emerald-200 sm:w-44" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-full rounded-md bg-slate-100 sm:w-80" />
          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2">
            <div className="h-8 w-full rounded-lg bg-emerald-100 sm:w-14" />
            <div className="h-8 w-full rounded-lg bg-slate-100 sm:w-16" />
            <div className="h-8 w-full rounded-lg bg-slate-100 sm:w-24" />
          </div>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-20 rounded bg-slate-200" />
                    <div className="h-5 w-16 rounded-full bg-emerald-100" />
                  </div>
                  <div className="h-3 w-24 rounded bg-slate-100" />
                </div>
                <div className="h-5 w-24 rounded bg-slate-200" />
              </div>

              <div className="h-4 w-4/5 rounded bg-slate-100" />

              <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5">
                <div className="h-8 rounded bg-slate-200/70" />
                <div className="h-8 rounded bg-slate-200/70" />
                <div className="h-8 rounded bg-slate-200/70" />
              </div>

              <div className="flex justify-end gap-2">
                <div className="h-9 w-16 rounded-lg bg-slate-100" />
                <div className="h-9 w-16 rounded-lg bg-slate-100" />
                <div className="h-9 w-16 rounded-lg bg-rose-50" />
              </div>
            </div>
          ))}
        </div>

        <DesktopTableSkeleton
          columnWidths={[
            "w-20",
            "w-20",
            "w-36",
            "w-20",
            "w-16",
            "w-16",
            "w-20",
            "w-16",
            "w-28",
          ]}
          rows={5}
        />

        <div className="border-t border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="h-4 w-28 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
