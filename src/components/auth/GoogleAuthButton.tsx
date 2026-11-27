"use client";

import React, { useTransition } from "react";
import { googleLoginAction } from "@/actions/auth";
import { useToast } from "@/components/shared/ToastProvider";

interface GoogleAuthButtonProps {
  isGoogleEnabled: boolean;
  disabled?: boolean;
  label?: string;
}

export function GoogleAuthButton({
  isGoogleEnabled,
  disabled = false,
  label = "الدخول بحساب Google",
}: GoogleAuthButtonProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  if (!isGoogleEnabled) {
    return null;
  }

  const handleClick = () => {
    startTransition(async () => {
      const result = await googleLoginAction();
      if (result && !result.success) {
        showToast(result.error ?? "تعذر تسجيل الدخول بحساب Google", "error");
      }
    });
  };

  return (
    <button
      type="button"
      disabled={disabled || isPending}
      onClick={handleClick}
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
      <span>{isPending ? "جاري التحويل إلى Google..." : label}</span>
    </button>
  );
}
