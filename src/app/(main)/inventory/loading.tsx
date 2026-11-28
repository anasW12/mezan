import React from "react";
import { DesktopTableSkeleton } from "@/components/shared/LoadingSkeleton";

export default function InventoryLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="جاري تحميل المخزن"
      className="space-y-6 animate-pulse"
    >
      <div>
        <div className="h-7 w-24 rounded-md bg-slate-200 sm:h-8" />
        <div className="mt-2 h-4 w-80 max-w-full rounded-md bg-slate-100" />
      </div>

      <div className="flex flex-col items-start justify-between gap-2.5 rounded-xl border border-emerald-200/70 bg-emerald-50/60 px-4 py-3 sm:flex-row sm:items-center">
        <div className="h-4 w-72 max-w-full rounded bg-emerald-100" />
        <div className="h-4 w-40 rounded bg-emerald-200/80" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-full rounded-md bg-slate-100 sm:w-80" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 rounded-lg bg-emerald-100" />
            <div className="h-8 w-28 rounded-lg bg-slate-100" />
          </div>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5">
                  <div className="h-4 w-36 rounded bg-slate-200" />
                  <div className="h-3 w-20 rounded bg-slate-100" />
                </div>
                <div className="h-9 w-16 rounded-lg bg-slate-100" />
              </div>
              <div className="h-6 w-28 rounded-full bg-slate-100" />
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5">
                <div className="h-8 rounded bg-slate-200/70" />
                <div className="h-8 rounded bg-slate-200/70" />
                <div className="h-8 rounded bg-slate-200/70" />
              </div>
            </div>
          ))}
        </div>

        <DesktopTableSkeleton
          columnWidths={["w-8", "w-36", "w-24", "w-20", "w-20", "w-24", "w-16"]}
          rows={5}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="h-4 w-28 rounded bg-slate-100" />
          <div className="h-4 w-48 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
