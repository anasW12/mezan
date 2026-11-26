import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  LayoutDashboard,
  Package,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default function LandingPage() {
  return (
    <div className="bg-calm-aurora min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <BrandLogo href="/" />
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a
              href="#features"
              className="transition-colors hover:text-emerald-600"
            >
              المميزات
            </a>
            <a
              href="#pricing"
              className="transition-colors hover:text-emerald-600"
            >
              الأسعار
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              دخول
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
            >
              ابدأ مجاناً
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-20 text-center sm:px-6 lg:pt-28">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-4 py-1.5 text-xs font-medium text-emerald-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>مصمم خصيصاً لتجار الأونلاين والمشاريع الصغيرة في مصر</span>
          </div>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            حاسب شغلك بذكاء
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            نظام محاسبة ومخزون سحابي يجمع لك حركة الخزينة، تقييم البضاعة،
            التحصيلات، وصافي الربح الحقيقي في واجهة عربية هادئة وسريعة.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-emerald-600/25 transition-all duration-150 hover:bg-emerald-700"
            >
              <span>ابدأ تجربتك المجانية</span>
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/90 px-6 py-4 text-base font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <span>استكشف لوحة التحكم</span>
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-600" />
              ١٤ يوم مجاناً
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-600" />
              بدون بطاقة ائتمان
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-600" />
              تفعيل فوري بالـ ج.م
            </span>
          </div>
        </section>

        {/* Features Grid */}
        <section
          id="features"
          className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="surface-glass rounded-xl border border-slate-100 p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                لوحة تحكم شاملة
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                تابع الكاش في الخزينة، قيمة البضاعة في المخزن، المصروفات العامة،
                وصافي ربحك الحقيقي لحظة بلحظة بدون تعقيد القيود المحاسبية.
              </p>
            </div>

            <div className="surface-glass rounded-xl border border-slate-100 p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                مساعد ذكي بالعربي
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                اكتب أو سجّل أي عملية بيع أو شراء أو مصروف بالعربي، وسيقوم
                المساعد الذكي بتحليلها وعرض معاينة واضحة للتأكيد قبل الحفظ.
              </p>
            </div>

            <div className="surface-glass rounded-xl border border-slate-100 p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Package className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                إدارة المخزون والتحصيل
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                حساب تلقائي لمتوسط سعر التكلفة، تنبيهات انخفاض المخزون، ومتابعة
                أموال الدفع عند الاستلام (COD) بضغطة واحدة.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing / Trust strip */}
        <section
          id="pricing"
          className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6"
        >
          <div className="surface-glass flex flex-col items-center justify-between gap-6 rounded-2xl border border-slate-200/80 p-8 shadow-sm md:flex-row">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  ابدأ مجاناً لمدة ١٤ يوم كاملة
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  جرب كافة المميزات لشركتك، وبعدها فعّل اشتراكك بسهولة عبر
                  التحويل البنكي أو إنستا باي أو فودافون كاش.
                </p>
              </div>
            </div>
            <Link
              href="/register"
              className="shrink-0 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              أنشئ حساب شركتك الآن
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 bg-white/70 py-6 text-center text-sm text-slate-400">
        حقوق النشر © ٢٠٢٦ ميزان — جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
