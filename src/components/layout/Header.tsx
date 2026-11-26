"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Shield, Sparkles } from "lucide-react";
import { ROUTE_TITLES } from "@/components/layout/nav-items";

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const pageTitle = ROUTE_TITLES[pathname] ?? "لوحة التحكم";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md lg:px-6">
      <button
        type="button"
        onClick={onOpenMobileMenu}
        aria-label="فتح القائمة"
        className="me-3 flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
        <span className="hidden rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 sm:inline-flex">
          شركة النور للتجارة
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/audit-logs"
          aria-label="التنبيهات وسجل الحركات"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Bell className="h-5 w-5" strokeWidth={1.75} />
          <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              أم
            </div>
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">
              أحمد محمد
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute end-0 z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">
                    أحمد محمد
                  </p>
                  <p className="text-xs text-slate-400">ahmed@alnour.eg</p>
                </div>
                <Link
                  href="/onboarding"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>معالج الإعداد الأولي</span>
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  <Shield className="h-4 w-4 text-indigo-600" />
                  <span>بوابة الإدارة</span>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
