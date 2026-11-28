import React from "react";
import { Clock, UserMinus } from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";

interface SecondaryStripProps {
  fundsUnderCollection: number;
  ownerWithdrawals: number;
}

export function SecondaryStrip({
  fundsUnderCollection,
  ownerWithdrawals,
}: SecondaryStripProps) {
  return (
    <section aria-label="المؤشرات الثانوية">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-white/75 px-4 py-3.5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Clock className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <span className="text-sm text-slate-500">فلوس تحت التحصيل:</span>
          </div>
          <CurrencyDisplay
            amount={fundsUnderCollection}
            className="text-sm font-semibold text-slate-700"
          />
        </div>

        <div className="h-px bg-slate-100 sm:hidden" />
        <div className="hidden h-5 w-px bg-slate-200 sm:block" />

        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <UserMinus className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <span className="text-sm text-slate-500">المسحوبات الشخصية:</span>
          </div>
          <CurrencyDisplay
            amount={ownerWithdrawals}
            className="text-sm font-semibold text-slate-700"
          />
        </div>
      </div>
    </section>
  );
}
