import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default function ExpiredPage() {
  return (
    <div className="bg-calm-aurora flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-6">
        <BrandLogo href="/" />
      </div>

      <div className="surface-glass w-full max-w-md rounded-2xl border border-slate-200/80 p-8 text-center shadow-lg">
        <h1 className="mb-3 text-2xl font-bold text-slate-900">
          انتهت صلاحية الاشتراك
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-slate-600">
          انتهت الفترة التجريبية أو الاشتراك الحالي لشركتك. جميع بياناتك محفوظة
          بأمان وسيتم تفعيل حسابك فور تجديد الاشتراك.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
