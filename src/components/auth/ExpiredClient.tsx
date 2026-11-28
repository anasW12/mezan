"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, ShieldAlert } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useToast } from "@/components/shared/ToastProvider";
import { logoutAction, refreshSubscriptionAction } from "@/actions/auth";

interface ExpiredClientProps {
  companyName: string;
}

export function ExpiredClient({ companyName }: ExpiredClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isRefreshing, startRefreshing] = useTransition();
  const [isLoggingOut, startLogout] = useTransition();

  const handleCheckActivation = () => {
    startRefreshing(async () => {
      const result = await refreshSubscriptionAction();
      if (!result.success) {
        showToast(result.error ?? "تعذر التحقق من حالة الاشتراك", "error");
        return;
      }

      if (result.data?.planStatus !== "EXPIRED") {
        showToast("تم تفعيل اشتراكك بنجاح! جاري تحويلك للوحة التحكم");
        router.push("/dashboard");
        router.refresh();
      } else {
        showToast("الاشتراك ما زال قيد التفعيل، يرجى التواصل مع الإدارة", "error");
      }
    });
  };

  return (
    <div className="bg-calm-aurora flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-6">
        <BrandLogo href="/" />
      </div>

      <div className="surface-glass w-full max-w-lg rounded-2xl border border-slate-200/80 p-5 text-center shadow-lg sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          انتهت صلاحية الاشتراك
        </h1>
        <p className="mb-5 text-sm font-medium text-slate-500">
          الحساب: {companyName}
        </p>

        <p className="mb-6 text-sm leading-relaxed text-slate-600">
          انتهت الفترة التجريبية أو الاشتراك الحالي لشركتك. جميع بياناتك المالية
          والمخزنية محفوظة بأمان، ويمكنك تفعيل الاشتراك عن طريق التحويل اليدوي
          عبر <strong>فودافون كاش</strong> أو <strong>إنستا باي</strong> أو{" "}
          <strong>التحويل البنكي</strong> ثم تحديث حالة التفعيل من هنا.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={isRefreshing || isLoggingOut}
            onClick={handleCheckActivation}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>
              {isRefreshing
                ? "جاري التحقق..."
                : "التحقق من حالة التفعيل والدخول"}
            </span>
          </button>

          <button
            type="button"
            disabled={isRefreshing || isLoggingOut}
            onClick={() => startLogout(() => logoutAction())}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            <span>{isLoggingOut ? "جاري الخروج..." : "تسجيل الخروج"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
