"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useToast } from "@/components/shared/ToastProvider";
import { loginAction } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

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
            disabled={isPending}
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
          disabled
          title="متاح في المرحلة السادسة"
          className="flex w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-400"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500">
            G
          </span>
          <span>الدخول بحساب Google (قريباً)</span>
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
