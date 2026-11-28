import React from "react";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  tone?: "neutral" | "positive" | "negative" | "auto";
  showSign?: boolean;
  className?: string;
  currencyClassName?: string;
}

export function CurrencyDisplay({
  amount,
  tone = "neutral",
  showSign = false,
  className,
  currencyClassName,
}: CurrencyDisplayProps) {
  const formattedNumber = new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const resolvedTone =
    tone === "auto"
      ? amount > 0
        ? "positive"
        : amount < 0
          ? "negative"
          : "neutral"
      : tone;

  const signPrefix = showSign
    ? amount > 0
      ? "+"
      : amount < 0
        ? "-"
        : ""
    : amount < 0
      ? "-"
      : "";

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 whitespace-nowrap tabular-nums font-semibold",
        resolvedTone === "positive" && "text-emerald-600",
        resolvedTone === "negative" && "text-rose-600",
        resolvedTone === "neutral" && "text-slate-900",
        className
      )}
    >
      <span>
        {signPrefix}
        {formattedNumber}
      </span>
      <span
        className={cn("text-sm font-normal text-slate-400", currencyClassName)}
      >
        ج.م
      </span>
    </span>
  );
}
