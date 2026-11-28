import React from "react";

export default function SettingsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="جاري تحميل الإعدادات"
      className="mx-auto max-w-4xl space-y-6 animate-pulse"
    >
      <div>
        <div className="h-7 w-24 rounded-md bg-slate-200 sm:h-8" />
        <div className="mt-2 h-4 w-80 max-w-full rounded-md bg-slate-100" />
      </div>

      {/* Company Details Card */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-emerald-100" />
          <div className="h-6 w-28 rounded bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 h-4 w-20 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-md bg-slate-100" />
          </div>
          <div>
            <div className="mb-1.5 h-4 w-28 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-md bg-slate-100" />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <div className="h-11 w-full rounded-lg bg-emerald-200 sm:w-36" />
        </div>
      </div>

      {/* Safes Card */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-blue-100" />
          <div className="h-6 w-36 rounded bg-slate-200" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3.5 py-3 sm:px-4"
            >
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-4 w-24 rounded bg-slate-200" />
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-12">
          <div className="h-10 rounded-md bg-slate-100 md:col-span-6" />
          <div className="h-10 rounded-md bg-slate-100 md:col-span-3" />
          <div className="h-10 rounded-lg bg-emerald-200 sm:col-span-2 md:col-span-3" />
        </div>
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="mb-3 h-4 w-48 rounded bg-slate-200" />
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-12">
            <div className="h-10 rounded-md bg-slate-100 md:col-span-3" />
            <div className="h-10 rounded-md bg-slate-100 md:col-span-2" />
            <div className="h-10 rounded-md bg-slate-100 md:col-span-2" />
            <div className="h-10 rounded-md bg-slate-100 md:col-span-3" />
            <div className="h-10 rounded-lg bg-slate-200 sm:col-span-2 md:col-span-2" />
          </div>
        </div>
      </div>

      {/* Fixed Assets Card */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-purple-100" />
          <div className="h-6 w-28 rounded bg-slate-200" />
        </div>
        <div className="mb-4 h-14 rounded-lg border border-slate-100 bg-slate-50/70" />
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-12">
          <div className="h-10 rounded-md bg-slate-100 sm:col-span-2 md:col-span-5" />
          <div className="h-10 rounded-md bg-slate-100 md:col-span-2" />
          <div className="h-10 rounded-md bg-slate-100 md:col-span-3" />
          <div className="h-10 rounded-lg bg-emerald-200 sm:col-span-2 md:col-span-2" />
        </div>
      </div>

      {/* Account Security & Password Card */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-100" />
            <div className="space-y-1.5">
              <div className="h-5 w-36 rounded bg-slate-200" />
              <div className="h-3 w-40 rounded bg-slate-100" />
            </div>
          </div>
          <div className="h-6 w-36 rounded-full bg-emerald-50" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-10 rounded-md bg-slate-100 sm:col-span-2" />
          <div className="h-10 rounded-md bg-slate-100" />
          <div className="h-10 rounded-md bg-slate-100" />
        </div>
        <div className="mt-5 flex justify-end">
          <div className="h-11 w-full rounded-lg bg-emerald-200 sm:w-36" />
        </div>
      </div>

      {/* Export Excel Card */}
      <div className="flex flex-col items-stretch justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="space-y-2">
          <div className="h-5 w-36 rounded bg-slate-200" />
          <div className="h-4 w-64 max-w-full rounded bg-slate-100" />
        </div>
        <div className="h-11 w-full rounded-lg bg-slate-200 sm:w-36" />
      </div>
    </div>
  );
}
