import React from "react";

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-44 rounded-md bg-slate-200" />
        <div className="h-10 w-36 rounded-lg bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            <div className="h-10 w-10 rounded-lg bg-slate-200" />
            <div className="mt-4 h-4 w-24 rounded-md bg-slate-200" />
            <div className="mt-2 h-7 w-32 rounded-md bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 h-6 w-40 rounded-md bg-slate-200" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-10 w-full rounded-md bg-slate-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
