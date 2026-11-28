"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MainSectionError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("Route render error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-lg items-center justify-center p-4">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          تعذر تحميل الصفحة مؤقتاً
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          حدث انقطاع عابر في الاتصال بقاعدة البيانات أو الشبكة. اضغط إعادة
          المحاولة لاستئناف العمل.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span>إعادة المحاولة</span>
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            لوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  );
}
