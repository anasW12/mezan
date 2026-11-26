"use client";

import React, { useState } from "react";
import { Check, Mic, Receipt, Send, Sparkles, X } from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { useToast } from "@/components/shared/ToastProvider";
import { cn, formatNumber } from "@/lib/utils";
import type { AIParsePreview } from "@/types";

interface SmartEntryBarProps {
  onConfirmEntry: (preview: AIParsePreview) => void;
}

function parseArabicEntry(raw: string): AIParsePreview {
  const text = raw.trim();
  const numbers = text.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];

  if (text.includes("بعت") || text.includes("بيع")) {
    const qty = numbers[0] ?? 5;
    const price = numbers[1] ?? 150;
    const total = qty * price;
    return {
      action: "SALE",
      actionLabel: "فاتورة بيع (مدفوعة)",
      items: [{ productName: "تيشيرت قطن أوفرسايز", quantity: qty, unitPrice: price }],
      safeName: "الخزينة الرئيسية",
      totalAmount: total,
      arabicSummary: `بيع ${formatNumber(qty)} تيشيرت قطن أوفرسايز`,
    };
  }

  if (text.includes("مصروف") || text.includes("إيجار") || text.includes("إعلان")) {
    const amount = numbers[0] ?? 1200;
    return {
      action: "EXPENSE",
      actionLabel: "مصروف عام",
      description: text,
      safeName: "الخزينة الرئيسية",
      totalAmount: amount,
      arabicSummary: text,
    };
  }

  if (text.includes("سحب") || text.includes("مسحوب")) {
    const amount = numbers[0] ?? 500;
    return {
      action: "WITHDRAWAL",
      actionLabel: "مسحوبات شخصية",
      description: text,
      safeName: "الخزينة الرئيسية",
      totalAmount: amount,
      arabicSummary: text,
    };
  }

  const qty = numbers[0] ?? 100;
  const price = numbers[1] ?? 45;
  const total = qty * price;
  return {
    action: "PURCHASE",
    actionLabel: "فاتورة شراء",
    items: [{ productName: "تيشيرت قطن أوفرسايز", quantity: qty, unitPrice: price }],
    safeName: "الخزينة الرئيسية",
    totalAmount: total,
    arabicSummary: `شراء ${formatNumber(qty)} تيشيرت قطن أوفرسايز`,
  };
}

export function SmartEntryBar({ onConfirmEntry }: SmartEntryBarProps) {
  const { showToast } = useToast();
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [preview, setPreview] = useState<AIParsePreview | null>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setPreview(parseArabicEntry(inputText));
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    setIsListening(true);
    setTimeout(() => {
      const sample = "اشتريت 100 تيشيرت بسعر 45 جنيه";
      setInputText(sample);
      setPreview(parseArabicEntry(sample));
      setIsListening(false);
    }, 800);
  };

  const handleConfirm = () => {
    if (!preview) return;
    onConfirmEntry(preview);
    setPreview(null);
    setInputText("");
    showToast("تم تأكيد وحفظ العملية بنجاح");
  };

  return (
    <section aria-label="المساعد الذكي لإدخال العمليات">
      <form
        onSubmit={handleAnalyze}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-colors focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15"
      >
        <Sparkles className="ms-2 h-5 w-5 shrink-0 text-emerald-600" />
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="اكتب أو سجّل عملية بالعربي... (مثال: اشتريت ١٠٠ تيشيرت بسعر ٤٥ جنيه)"
          className="flex-1 border-none bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none sm:text-base"
        />
        <button
          type="button"
          onClick={handleVoiceToggle}
          aria-label="إدخال صوتي"
          title="إدخال صوتي"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
            isListening
              ? "animate-pulse bg-rose-50 text-rose-600"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          )}
        >
          <Mic className="h-5 w-5" />
        </button>
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span>إرسال</span>
        </button>
      </form>

      {preview && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/70 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-700" />
              <h3 className="text-base font-semibold text-slate-800">
                معاينة العملية
              </h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 shadow-xs">
              النوع: {preview.actionLabel}
            </span>
          </div>

          {preview.items && preview.items.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-lg border border-emerald-100 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 text-start">المنتج</th>
                    <th className="px-4 py-2.5 text-start">الكمية</th>
                    <th className="px-4 py-2.5 text-start">سعر الوحدة</th>
                    <th className="px-4 py-2.5 text-end">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.items.map((item, idx) => (
                    <tr key={idx} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {item.productName}
                      </td>
                      <td className="tabular-nums px-4 py-3 text-slate-600">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="px-4 py-3">
                        <CurrencyDisplay
                          amount={item.unitPrice}
                          className="text-sm font-normal text-slate-600"
                        />
                      </td>
                      <td className="px-4 py-3 text-end">
                        <CurrencyDisplay
                          amount={item.quantity * item.unitPrice}
                          className="text-sm font-semibold text-slate-900"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-700">
              {preview.arabicSummary}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-emerald-200/70 pt-4">
            <div className="flex items-center gap-2 text-base font-bold text-slate-900">
              <span>الإجمالي:</span>
              <CurrencyDisplay amount={preview.totalAmount} className="text-lg" />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <Check className="h-4 w-4" />
                <span>تأكيد وحفظ</span>
              </button>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                <span>إلغاء</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
