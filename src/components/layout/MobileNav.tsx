"use client";

import React from "react";
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
}

export function MobileNav({ drawerOpen, onCloseDrawer }: MobileNavProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={onCloseDrawer}
        >
          <div
            className="fixed inset-y-0 start-0 flex w-72 flex-col bg-white shadow-xl transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
              <BrandLogo href="/dashboard" />
              <button
                type="button"
                onClick={onCloseDrawer}
                aria-label="إغلاق القائمة"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {[...MAIN_NAV_ITEMS, SETTINGS_NAV_ITEM].map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={onCloseDrawer}
                    className={cn(
                      "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "me-3 h-5 w-5",
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
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 lg:hidden"
      >
        {MOBILE_TAB_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-lg px-2 py-1 transition-colors",
                active ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
              <span className="mt-0.5 text-[11px] font-medium">
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
