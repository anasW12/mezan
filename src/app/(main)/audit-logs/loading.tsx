import React from "react";
import { DesktopTableSkeleton } from "@/components/shared/LoadingSkeleton";

const FILTER_PILL_WIDTHS = [
  "w-12",
  "w-12",
  "w-12",
  "w-14",
  "w-16",
  "w-14",
  "w-20",
  "w-16",
  "w-18",
];

export default function AuditLogsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="جاري تحميل سجل الحركات"
      className="space-y-6 animate-pulse"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="h-7 w-32 rounded-md bg-slate-200 sm:h-8" />
          <div className="mt-2 h-4 w-64 max-w-full rounded-md bg-slate-100" />
        </div>
        <div className="h-8 w-56 rounded-full border border-slate-200 bg-white" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-full rounded-md bg-slate-100 sm:w-80" />
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTER_PILL_WIDTHS.map((w, idx) => (
              <div
                key={idx}
                className={`h-7 ${w} rounded-lg ${
                  idx === 0 ? "bg-emerald-100" : "bg-slate-100"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-14 rounded-full bg-slate-200" />
                  <div className="h-3.5 w-28 rounded bg-slate-100" />
                </div>
                <div className="h-4 w-20 rounded bg-slate-200" />
              </div>
              <div className="h-4 w-4/5 rounded bg-slate-100" />
            </div>
          ))}
        </div>

        <DesktopTableSkeleton
          columnWidths={["w-32", "w-20", "w-64", "w-20"]}
          rows={6}
        />

        <div className="border-t border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="h-4 w-36 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
