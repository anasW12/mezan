import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  accent?: "emerald" | "indigo";
  className?: string;
}

export function BrandLogo({
  href = "/",
  accent = "emerald",
  className,
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm",
          accent === "emerald"
            ? "bg-emerald-600 shadow-emerald-600/20"
            : "bg-indigo-600 shadow-indigo-600/20"
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M9 10h6" />
          <path d="M12 7v6" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-none text-slate-900">
          ميزان
        </span>
        <span className="mt-0.5 text-[11px] font-medium text-slate-400">
          محاسبة ومخزون
        </span>
      </div>
    </Link>
  );
}
