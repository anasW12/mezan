"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useToast } from "@/components/shared/ToastProvider";
import { registerAction } from "@/actions/auth";

interface RegisterClientProps {
  isGoogleEnabled: boolean;
}

export function RegisterClient({ isGoogleEnabled }: RegisterClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z\u0600-\u06FF]/.test(password);
  const hasDigit = /\d/.test(password);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      showToast("يرجى إدخال الاسم الكامل (حرفان على الأقل)", "error");
      return;
    }
    if (!companyName.trim() || companyName.trim().length < 2) {
      showToast("يرجى إدخال اسم الشركة (حرفان على الأقل)", "error");
      return;
    }
    if (!email.trim()) {
      showToast("يرجى إدخال البريد الإلكتروني", "error");
      return;
    }
    if (!hasMinLength || !hasLetter || !hasDigit) {
      showToast(
        "كلمة المرور يجب أن تكون ٨ أحرف على الأقل وتحتوي على حروف وأرقام",
        "error"
      );
      return;
    }
    if (password !== confirmPassword) {
      showToast("كلمتا المرور غير متطابقتين", "error");
      return;
    }

    startTransition(async () => {
      const result = await registerAction({
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      if (!result.success) {
        showToast(result.error ?? "حدث خطأ أثناء إنشاء الحساب", "error");
        return;
      }

      showToast("تم إنشاء الحساب والشركة والخزينة الرئيسية بنجاح");
      router.push(result.data?.redirectTo ?? "/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="bg-calm-aurora flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-6">
        <BrandLogo href="/" />
      </div>

      <div className="surface-glass w-full max-w-md rounded-2xl border border-slate-200/80 p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">
          إنشاء حساب جديد
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          ابدأ تجربتك المجانية لمدة ١٤ يوم بدون بطاقة ائتمان
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              الاسم الكامل <span className="text-rose-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أحمد محمد"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="companyName"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              اسم الشركة <span className="text-rose-500">*</span>
            </label>
            <input
              id="companyName"
              type="text"
              autoComplete="organization"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="مثال: شركة النور للتجارة"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              البريد الإلكتروني <span className="text-rose-500">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              dir="ltr"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-end text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              كلمة المرور <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="٨ أحرف على الأقل (حروف + أرقام)"
                className="h-10 w-full rounded-md border border-slate-300 bg-white pe-10 ps-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                className="absolute inset-y-0 end-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                  hasMinLength
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Check className="h-3 w-3" />٨ أحرف على الأقل
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                  hasLetter && hasDigit
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Check className="h-3 w-3" />
                حروف وأرقام
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-confirm-password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              تأكيد كلمة المرور <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابة كلمة المرور"
                className="h-10 w-full rounded-md border border-slate-300 bg-white pe-10 ps-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                }
                className="absolute inset-y-0 end-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-xs text-rose-600">
                كلمتا المرور غير متطابقتين
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "جاري إنشاء الحساب..." : "ابدأ تجربتك المجانية"}
          </button>
        </form>

        {isGoogleEnabled && (
          <>
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-sm text-slate-400">أو</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <GoogleAuthButton
              isGoogleEnabled={isGoogleEnabled}
              disabled={isPending}
              label="المتابعة بحساب Google"
            />
          </>
        )}

        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>حساب واحد وكلمة مرور واحدة لكل بريد إلكتروني</span>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          لديك حساب بالفعل؟{" "}
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:text-emerald-700"
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
