import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default function NotFound() {
  return (
    <div className="bg-calm-aurora flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="mb-6">
        <BrandLogo href="/" />
      </div>
      <div className="surface-glass w-full max-w-md rounded-2xl border border-slate-200/80 p-8 shadow-lg">
        <p className="tabular-nums text-4xl font-bold text-emerald-600">404</p>
        <h1 className="mt-3 text-xl font-bold text-slate-900">
          الصفحة غير موجودة
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          الصفحة التي تبحث عنها غير متاحة أو تم نقلها.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <ArrowRight className="h-4 w-4" />
          <span>العودة إلى لوحة التحكم</span>
        </Link>
      </div>
    </div>
  );
}
