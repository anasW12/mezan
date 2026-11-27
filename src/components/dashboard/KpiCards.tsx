import React from "react";
import {
  Building2,
  Package,
  Receipt,
  TrendingUp,
  Vault,
  type LucideIcon,
} from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { cn } from "@/lib/utils";
import type { KpiSummary } from "@/types";

interface KpiCardConfig {
  key: keyof Pick<
    KpiSummary,
    | "cashbox"
    | "inventoryValue"
    | "fixedAssets"
    | "generalExpenses"
    | "netProfit"
  >;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const KPI_CARDS: KpiCardConfig[] = [
  {
    key: "cashbox",
    label: "الكاش في الخزينة",
    icon: Vault,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    key: "inventoryValue",
    label: "قيمة البضاعة في المخزن",
    icon: Package,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    key: "fixedAssets",
    label: "الأصول الثابتة",
    icon: Building2,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    key: "generalExpenses",
    label: "المصروفات العامة",
    icon: Receipt,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    key: "netProfit",
    label: "صافي ربح الفترة",
    icon: TrendingUp,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

export function KpiCards({ kpis }: { kpis: KpiSummary }) {
  return (
    <section aria-label="المؤشرات الرئيسية">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  card.iconBg,
                  card.iconColor
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500">
                {card.label}
              </p>
              <div className="mt-1">
                <CurrencyDisplay
                  amount={kpis[card.key]}
                  tone={card.key === "netProfit" ? "auto" : "neutral"}
                  className={cn(
                    "text-2xl font-bold",
                    card.key !== "netProfit" && "text-slate-900"
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
