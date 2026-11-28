import React from "react";

/**
 * Minimal neutral fallback used only when a child route under `(main)` does not
 * define its own dedicated `loading.tsx`. Keeps zero Dashboard KPI leakage.
 */
export function NeutralMainLoadingFallback() {
  return (
    <div
      aria-busy="true"
      aria-label="جاري تحميل الصفحة"
      className="flex min-h-[45vh] w-full flex-col items-center justify-center gap-3 animate-pulse px-4"
    >
      <div className="h-10 w-10 rounded-full bg-slate-200" />
      <div className="h-4 w-36 rounded-md bg-slate-200" />
      <div className="h-3 w-52 rounded-md bg-slate-100" />
    </div>
  );
}

/**
 * Shared desktop table skeleton helper parameterized per route column count.
 */
export function DesktopTableSkeleton({
  columnWidths,
  rows = 5,
}: {
  columnWidths: string[];
  rows?: number;
}) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full">
        <thead className="bg-slate-50/80">
          <tr>
            {columnWidths.map((w, idx) => (
              <th key={idx} className="px-4 py-3.5 text-start lg:px-6">
                <div className={`h-3.5 ${w} rounded bg-slate-200`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx} className="border-t border-slate-100">
              {columnWidths.map((w, cIdx) => (
                <td key={cIdx} className="px-4 py-4 lg:px-6">
                  <div className={`h-4 ${w} rounded bg-slate-100`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Mirrors `NewPurchaseForm` (`mx-auto max-w-4xl space-y-6`) across create/edit routes.
 */
export function PurchaseFormSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="جاري تحميل نموذج فاتورة الشراء"
      className="mx-auto max-w-4xl space-y-6 animate-pulse"
    >
      <div>
        <div className="h-7 w-48 rounded-md bg-slate-200 sm:h-8" />
        <div className="mt-2 h-4 w-full max-w-xl rounded-md bg-slate-100" />
      </div>

      <div className="space-y-6 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx}>
              <div className="mb-1.5 h-4 w-24 rounded bg-slate-200" />
              <div className="h-10 w-full rounded-md bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="h-5 w-28 rounded bg-slate-200" />
            <div className="h-6 w-56 rounded-full bg-emerald-50" />
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-16 rounded bg-slate-200" />
              <div className="h-4 w-28 rounded bg-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-12">
              <div className="col-span-2 md:col-span-6">
                <div className="mb-1 h-3.5 w-16 rounded bg-slate-200" />
                <div className="h-10 w-full rounded-md bg-slate-200/70" />
              </div>
              <div className="col-span-1 md:col-span-3">
                <div className="mb-1 h-3.5 w-14 rounded bg-slate-200" />
                <div className="h-10 w-full rounded-md bg-slate-200/70" />
              </div>
              <div className="col-span-1 md:col-span-3">
                <div className="mb-1 h-3.5 w-24 rounded bg-slate-200" />
                <div className="h-10 w-full rounded-md bg-slate-200/70" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="h-5 w-32 rounded bg-emerald-100" />
            <div className="h-5 w-40 rounded bg-slate-200" />
          </div>
        </div>

        <div>
          <div className="mb-1.5 h-4 w-24 rounded bg-slate-200" />
          <div className="h-10 w-full rounded-md bg-slate-100" />
        </div>

        <div className="flex flex-col items-stretch justify-between gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
          <div className="h-6 w-48 rounded bg-slate-200" />
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className="h-11 rounded-lg bg-emerald-200 sm:w-32" />
            <div className="h-11 rounded-lg bg-slate-200 sm:w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Mirrors `NewSaleForm` (`mx-auto max-w-4xl space-y-6`) across create/edit routes.
 */
export function SaleFormSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="جاري تحميل نموذج فاتورة البيع"
      className="mx-auto max-w-4xl space-y-6 animate-pulse"
    >
      <div>
        <div className="h-7 w-44 rounded-md bg-slate-200 sm:h-8" />
        <div className="mt-2 h-4 w-80 max-w-full rounded-md bg-slate-100" />
      </div>

      <div className="space-y-6 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <div>
          <div className="mb-2 h-4 w-20 rounded bg-slate-200" />
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <div className="h-10 rounded-md bg-white" />
            <div className="h-10 rounded-md bg-slate-200/70" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx}>
              <div className="mb-1.5 h-4 w-24 rounded bg-slate-200" />
              <div className="h-10 w-full rounded-md bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="mb-4 h-5 w-24 rounded bg-slate-200" />
          <div className="grid grid-cols-12 gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/40 p-3 sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
            <div className="col-span-12 sm:col-span-5">
              <div className="mb-1 h-3.5 w-24 rounded bg-slate-200 sm:hidden" />
              <div className="h-10 w-full rounded-md bg-slate-200/70" />
            </div>
            <div className="col-span-5 sm:col-span-3">
              <div className="mb-1 h-3.5 w-14 rounded bg-slate-200 sm:hidden" />
              <div className="h-10 w-full rounded-md bg-slate-200/70" />
            </div>
            <div className="col-span-5 sm:col-span-3">
              <div className="mb-1 h-3.5 w-20 rounded bg-slate-200 sm:hidden" />
              <div className="h-10 w-full rounded-md bg-slate-200/70" />
            </div>
            <div className="col-span-2 flex items-end justify-end sm:col-span-1">
              <div className="h-10 w-10 rounded-md bg-slate-200/70" />
            </div>
          </div>
          <div className="mt-4 h-5 w-32 rounded bg-emerald-100" />
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 h-4 w-24 rounded bg-slate-200" />
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="h-10 w-full rounded-lg bg-slate-100 sm:w-44" />
              <div className="h-10 flex-1 rounded-md bg-slate-100" />
            </div>
          </div>
          <div>
            <div className="mb-1.5 h-4 w-24 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-md bg-slate-100" />
          </div>
        </div>

        <div className="flex flex-col items-stretch justify-between gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="h-4 w-56 rounded bg-slate-100" />
            <div className="h-6 w-48 rounded bg-slate-200" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className="h-11 rounded-lg bg-emerald-200 sm:w-32" />
            <div className="h-11 rounded-lg bg-slate-200 sm:w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
