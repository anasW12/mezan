"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import {
  MAIN_NAV_ITEMS,
  MOBILE_TAB_ITEMS,
  SETTINGS_NAV_ITEM,
} from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  companyName?: string;
}

export function MobileNav({
  drawerOpen,
  onCloseDrawer,
  companyName,
}: MobileNavProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!drawerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseDrawer();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen, onCloseDrawer]);

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="قائمة التنقل"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={onCloseDrawer}
        >
          <div
            className="fixed inset-y-0 start-0 flex w-[min(18rem,85vw)] flex-col bg-white pb-[env(safe-area-inset-bottom)] shadow-xl transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
              <BrandLogo href="/dashboard" />
              <button
                type="button"
                onClick={onCloseDrawer}
                aria-label="إغلاق القائمة"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {companyName && (
              <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-2.5">
                <p className="text-[11px] text-slate-400">الشركة النشطة</p>
                <p className="truncate text-sm font-semibold text-slate-800">
                  {companyName}
                </p>
              </div>
            )}
            <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
              {[...MAIN_NAV_ITEMS, SETTINGS_NAV_ITEM].map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    onClick={onCloseDrawer}
                    className={cn(
                      "flex min-h-[44px] items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "me-3 h-5 w-5 shrink-0",
                        active ? "text-emerald-600" : "text-slate-400"
                      )}
                      strokeWidth={1.75}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <nav
        aria-label="التنقل السريع"
        className="fixed inset-x-0 bottom-0 z-40 flex min-h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
      >
        {MOBILE_TAB_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center rounded-lg px-1 py-1.5 transition-colors",
                active ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              <span className="mt-0.5 max-w-full truncate text-[11px] font-medium">
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
