"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useToast } from "@/components/shared/ToastProvider";
import { googleLoginAction, loginAction } from "@/actions/auth";

interface LoginClientProps {
  isGoogleEnabled: boolean;
}

export function LoginClient({ isGoogleEnabled }: LoginClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("يرجى إدخال البريد الإلكتروني وكلمة المرور", "error");
      return;
    }

    startTransition(async () => {
      const result = await loginAction({ email, password });
      if (!result.success) {
        showToast(result.error ?? "فشل تسجيل الدخول", "error");
        return;
      }

      showToast("تم تسجيل الدخول بنجاح");
      router.push(result.data?.redirectTo ?? "/dashboard");
      router.refresh();
    });
  };

  const handleGoogleLogin = () => {
    if (!isGoogleEnabled) {
      showToast(
        "أضف GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET في .env لتفعيل الدخول بحساب Google",
        "error"
      );
      return;
    }

    startGoogleTransition(async () => {
      const result = await googleLoginAction();
      if (result && !result.success) {
        showToast(result.error ?? "تعذر تسجيل الدخول بحساب Google", "error");
      }
    });
  };

  return (
    <div className="bg-calm-aurora flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-6">
        <BrandLogo href="/" />
      </div>

      <div className="surface-glass w-full max-w-md rounded-2xl border border-slate-200/80 p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">
          تسجيل الدخول
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              البريد الإلكتروني <span className="text-rose-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-end text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              كلمة المرور <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
          </div>

          <button
            type="submit"
            disabled={isPending || isGooglePending}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-sm text-slate-400">أو</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          disabled={isPending || isGooglePending}
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
          >
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.09.73-2.48 1.16-4.22 1.16-3.24 0-5.99-2.19-6.97-5.13H1.04v3.14C3.05 21.14 7.21 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.03 14.02c-.25-.73-.39-1.52-.39-2.32s.14-1.59.39-2.32V6.24H1.04A11.96 11.96 0 0 0 0 11.7c0 1.94.46 3.77 1.04 5.46l3.99-3.14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.79 0 3.4.62 4.67 1.83l3.5-3.5C18.07 1.19 15.3 0 12 0 7.21 0 3.05 2.86 1.04 7.04l3.99 3.14c.98-2.94 3.73-5.43 6.97-5.43Z"
            />
          </svg>
          <span>
            {isGooglePending ? "جاري التحويل إلى Google..." : "الدخول بحساب Google"}
          </span>
        </button>

        <p className="mt-6 text-center text-sm text-slate-500">
          ما عندكش حساب؟{" "}
          <Link
            href="/register"
            className="font-medium text-emerald-600 hover:text-emerald-700"
          >
            سجل دلوقتي
          </Link>
        </p>
      </div>
    </div>
  );
}
