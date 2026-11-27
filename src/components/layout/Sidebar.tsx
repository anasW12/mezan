"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { MAIN_NAV_ITEMS, SETTINGS_NAV_ITEM } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-slate-200 bg-white lg:flex">
      <div className="flex h-16 items-center border-b border-slate-100 px-6">
        <BrandLogo href="/dashboard" />
      </div>

      <nav
        aria-label="القائمة الرئيسية"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
      >
        {MAIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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

      <div className="border-t border-slate-100 p-3">
        <Link
          href={SETTINGS_NAV_ITEM.href}
          prefetch={false}
          className={cn(
            "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-150",
            isItemActive(SETTINGS_NAV_ITEM.href)
              ? "bg-emerald-50 text-emerald-700"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <SETTINGS_NAV_ITEM.icon
            className={cn(
              "me-3 h-5 w-5 shrink-0",
              isItemActive(SETTINGS_NAV_ITEM.href)
                ? "text-emerald-600"
                : "text-slate-400"
            )}
            strokeWidth={1.75}
          />
          <span>{SETTINGS_NAV_ITEM.label}</span>
        </Link>
      </div>
    </aside>
  );
}
