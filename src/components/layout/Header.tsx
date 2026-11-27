"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Shield } from "lucide-react";
import { ROUTE_TITLES } from "@/components/layout/nav-items";
import { logoutAction } from "@/actions/auth";

interface HeaderProps {
  onOpenMobileMenu: () => void;
  userName: string;
  userEmail: string;
  companyName: string;
  isAdmin: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`;
  }
  return name.slice(0, 2) || "م";
}

export function Header({
  onOpenMobileMenu,
  userName,
  userEmail,
  companyName,
  isAdmin,
}: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, startLogout] = useTransition();

  const pageTitle = ROUTE_TITLES[pathname] ?? "لوحة التحكم";

  const handleLogout = () => {
    setMenuOpen(false);
    startLogout(async () => {
      await logoutAction();
    });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white/95 px-4 lg:px-6">
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
          {companyName}
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/audit-logs"
          prefetch={false}
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
              {getInitials(userName)}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">
              {userName}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute end-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {userName}
                  </p>
                  <p className="truncate text-xs text-slate-400">{userEmail}</p>
                </div>
                {isAdmin && (
                  <Link
                    href="/admin"
                    prefetch={false}
                    onClick={() => setMenuOpen(false)}
                    className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Shield className="h-4 w-4 text-indigo-600" />
                    <span>بوابة الإدارة</span>
                  </Link>
                )}
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  <span>
                    {isLoggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
