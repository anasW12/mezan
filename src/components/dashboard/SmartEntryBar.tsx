"use client";

import React, { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Loader2,
  Mic,
  PackagePlus,
  Receipt,
  Send,
  Sparkles,
  Vault,
  X,
} from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { useToast } from "@/components/shared/ToastProvider";
import {
  createExpenseAction,
  createPurchaseAction,
  createSaleAction,
  createWithdrawalAction,
} from "@/actions/accounting";
import { adjustSafeBalanceAction } from "@/actions/settings";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  AIParseItem,
  AIParsePreview,
  AIProductFields,
  PaymentStatus,
  Product,
  SafeAccount,
} from "@/types";

interface SmartEntryBarProps {
  products: Product[];
  safes: SafeAccount[];
}

interface SpeechRecognitionResultEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

const CREATE_NEW_VALUE = "__CREATE_NEW__";

export function SmartEntryBar({ products, safes }: SmartEntryBarProps) {
  const { showToast } = useToast();
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [preview, setPreview] = useState<AIParsePreview | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const computedTotal = useMemo(() => {
    if (!preview) return 0;
    if (preview.action === "ADD_PRODUCT" && preview.productFields) {
      return (
        (preview.productFields.stockQuantity || 0) *
        (preview.productFields.averageCostPrice || 0)
      );
    }
    if (preview.items && preview.items.length > 0) {
      return preview.items.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
        0
      );
    }
    return preview.totalAmount;
  }, [preview]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isAnalyzing || isSaving) return;

    setIsAnalyzing(true);
    setConfirmError(null);
    try {
      const response = await fetch("/api/ai/parse-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        data?: AIParsePreview;
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.data) {
        const errMsg =
          payload.error ?? "تعذر تحليل العملية. حاول مرة أخرى.";
        setConfirmError(errMsg);
        showToast(errMsg, "error");
        return;
      }

      const defaultSafeId = safes[0]?.id ?? null;
      setPreview({
        ...payload.data,
        safeId: payload.data.safeId ?? defaultSafeId,
      });
    } catch {
      const errMsg = "تعذر الاتصال بخدمة التحليل الذكي، حاول مرة أخرى.";
      setConfirmError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const speechWin = window as unknown as WindowWithSpeech;
    const SpeechCtor =
      speechWin.SpeechRecognition ?? speechWin.webkitSpeechRecognition;

    if (!SpeechCtor) {
      showToast(
        "المتصفح الحالي لا يدعم الإملاء الصوتي — يمكنك كتابة العملية مباشرة",
        "error"
      );
      return;
    }

    const recognition = new SpeechCtor();
    recognition.lang = "ar-EG";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) {
        setInputText((prev) =>
          prev.trim() ? `${prev.trim()} ${transcript}` : transcript
        );
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      showToast("تعذر التقاط الصوت، حاول مرة أخرى أو اكتب النص", "error");
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const updateItem = (index: number, patch: Partial<AIParseItem>) => {
    setConfirmError(null);
    setPreview((prev) => {
      if (!prev || !prev.items) return prev;
      const nextItems = prev.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      );
      return { ...prev, items: nextItems };
    });
  };

  const updateProductFields = (patch: Partial<AIProductFields>) => {
    setConfirmError(null);
    setPreview((prev) => {
      if (!prev || !prev.productFields) return prev;
      return {
        ...prev,
        productFields: { ...prev.productFields, ...patch },
      };
    });
  };

  const handleConfirm = () => {
    if (!preview) return;
    setConfirmError(null);

    const resolvedSafeId = preview.safeId ?? safes[0]?.id ?? "";

    if (preview.action === "ADD_PRODUCT") {
      const fields = preview.productFields;
      if (!fields || !fields.name.trim()) {
        const msg = "يرجى إدخال اسم المنتج";
        setConfirmError(msg);
        showToast(msg, "error");
        return;
      }

      const qty = Math.round(fields.stockQuantity || 0);
      if (qty < 1) {
        const msg =
          "يجب أن تكون الكمية ١ على الأقل لتسجيل الصنف عبر فاتورة شراء";
        setConfirmError(msg);
        showToast(msg, "error");
        return;
      }

      if (!resolvedSafeId) {
        const msg = "يرجى اختيار الخزينة المدفوع منها";
        setConfirmError(msg);
        showToast(msg, "error");
        return;
      }

      startSaving(async () => {
        try {
          const result = await createPurchaseAction({
            safeId: resolvedSafeId,
            items: [
              {
                productName: fields.name.trim(),
                quantity: qty,
                unitCost: Math.max(0, Number(fields.averageCostPrice) || 0),
                sellingPrice: Math.max(0, Number(fields.sellingPrice) || 0),
              },
            ],
          });

          if (!result.success) {
            const msg = result.error ?? "تعذر تسجيل فاتورة الشراء وإضافة الصنف";
            setConfirmError(msg);
            showToast(msg, "error");
            return;
          }

          setConfirmError(null);
          setPreview(null);
          setInputText("");
          showToast(
            "تم تسجيل فاتورة الشراء وإنشاء الصنف وخصم التكلفة من الخزينة بنجاح"
          );
        } catch {
          const msg = "حدث خطأ أثناء الاتصال بالسيرفر، حاول مرة أخرى.";
          setConfirmError(msg);
          showToast(msg, "error");
        }
      });
      return;
    }

    if (preview.action === "SAFE_DEPOSIT") {
      if (!resolvedSafeId || preview.totalAmount <= 0) {
        const msg = "يرجى اختيار الخزينة وإدخال مبلغ إيداع أكبر من صفر";
        setConfirmError(msg);
        showToast(msg, "error");
        return;
      }

      startSaving(async () => {
        try {
          const result = await adjustSafeBalanceAction({
            safeId: resolvedSafeId,
            amount: preview.totalAmount,
            reason: preview.description?.trim() || "إيداع في الخزينة",
          });

          if (!result.success) {
            const msg = result.error ?? "تعذر إيداع المبلغ في الخزينة";
            setConfirmError(msg);
            showToast(msg, "error");
            return;
          }

          setConfirmError(null);
          setPreview(null);
          setInputText("");
          showToast("تم إيداع المبلغ في الخزينة وتحديث الرصيد بنجاح");
        } catch {
          const msg = "حدث خطأ أثناء الاتصال بالسيرفر، حاول مرة أخرى.";
          setConfirmError(msg);
          showToast(msg, "error");
        }
      });
      return;
    }

    if (preview.action === "SALE" || preview.action === "PURCHASE") {
      const items = preview.items ?? [];
      if (items.length === 0) {
        const msg = "لا توجد أصناف صالحة في الفاتورة";
        setConfirmError(msg);
        showToast(msg, "error");
        return;
      }

      if (preview.action === "SALE" && items.some((item) => !item.productId)) {
        const msg = "يرجى اختيار المنتج المطابق من المخزن لكل بند أولاً";
        setConfirmError(msg);
        showToast(msg, "error");
        return;
      }

      if (
        preview.action === "PURCHASE" &&
        items.some(
          (item) => !item.productId && (!item.createIfMissing || !item.productName.trim())
        )
      ) {
        const msg = "يرجى اختيار المنتج من المخزن أو كتابة اسم الصنف الجديد";
        setConfirmError(msg);
        showToast(msg, "error");
        return;
      }
    } else if (preview.totalAmount <= 0) {
      const msg = "يجب أن يكون المبلغ أكبر من صفر";
      setConfirmError(msg);
      showToast(msg, "error");
      return;
    }

    startSaving(async () => {
      try {
        let result;

        if (preview.action === "SALE") {
          const paymentStatus: PaymentStatus =
            preview.paymentStatus ?? "PAID";
          result = await createSaleAction({
            paymentStatus,
            safeId: paymentStatus === "PAID" ? resolvedSafeId : undefined,
            customerName: preview.customerName || undefined,
            directCost: preview.directCost ?? 0,
            items: (preview.items ?? []).map((item) => ({
              productId: item.productId!,
              quantity: Math.max(1, Math.round(item.quantity || 1)),
              unitPrice: Math.max(0, Number(item.unitPrice) || 0),
            })),
          });
        } else if (preview.action === "PURCHASE") {
          const resolvedItems = (preview.items ?? []).map((item) => {
            const qty = Math.max(1, Math.round(item.quantity || 1));
            const cost = Math.max(0, Number(item.unitPrice) || 0);

            if (item.productId) {
              return {
                productId: item.productId,
                quantity: qty,
                unitCost: cost,
              };
            }

            return {
              productName: item.productName.trim(),
              quantity: qty,
              unitCost: cost,
              sellingPrice: Math.max(
                0,
                Number(item.sellingPrice ?? item.unitPrice) || 0
              ),
            };
          });

          result = await createPurchaseAction({
            safeId: resolvedSafeId,
            supplierName: preview.supplierName || undefined,
            items: resolvedItems,
          });
        } else if (preview.action === "EXPENSE") {
          result = await createExpenseAction({
            safeId: resolvedSafeId,
            category: preview.category?.trim() || "تشغيل عام",
            description: preview.description?.trim() || preview.arabicSummary,
            amount: preview.totalAmount,
          });
        } else {
          result = await createWithdrawalAction({
            safeId: resolvedSafeId,
            notes: preview.description?.trim() || preview.arabicSummary,
            amount: preview.totalAmount,
          });
        }

        if (!result.success) {
          const msg = result.error ?? "تعذر حفظ العملية";
          setConfirmError(msg);
          showToast(msg, "error");
          return;
        }

        setConfirmError(null);
        setPreview(null);
        setInputText("");
        showToast("تم تأكيد وحفظ العملية في قاعدة البيانات بنجاح");
      } catch {
        const msg = "حدث خطأ أثناء الاتصال بالسيرفر، حاول مرة أخرى.";
        setConfirmError(msg);
        showToast(msg, "error");
      }
    });
  };

  const isInvoiceAction =
    preview?.action === "SALE" || preview?.action === "PURCHASE";

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
          onChange={(e) => {
            setInputText(e.target.value);
            if (!preview && confirmError) setConfirmError(null);
          }}
          disabled={isAnalyzing || isSaving}
          placeholder="اكتب أو سجّل عملية بالعربي... (مثال: ضيف في المخزن ايفون 17 برو 30 وحدة بسعر 50000)"
          className="flex-1 border-none bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60 sm:text-base"
        />
        <button
          type="button"
          onClick={handleVoiceToggle}
          disabled={isAnalyzing || isSaving}
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
          disabled={!inputText.trim() || isAnalyzing || isSaving}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>جاري التحليل...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>إرسال</span>
            </>
          )}
        </button>
      </form>

      {!preview && confirmError && (
        <div
          role="alert"
          className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{confirmError}</span>
        </div>
      )}

      {preview && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/70 pb-3">
            <div className="flex items-center gap-2">
              {preview.action === "ADD_PRODUCT" ? (
                <PackagePlus className="h-5 w-5 text-emerald-700" />
              ) : preview.action === "SAFE_DEPOSIT" ? (
                <Vault className="h-5 w-5 text-emerald-700" />
              ) : (
                <Receipt className="h-5 w-5 text-emerald-700" />
              )}
              <h3 className="text-base font-semibold text-slate-800">
                {preview.action === "ADD_PRODUCT"
                  ? "إضافة منتج جديد للمخزن"
                  : "معاينة العملية قبل الحفظ"}
              </h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 shadow-xs">
              النوع: {preview.actionLabel}
            </span>
          </div>

          {preview.action === "ADD_PRODUCT" && preview.productFields ? (
            <div className="mt-4 space-y-4 rounded-lg border border-emerald-100 bg-white p-4">
              <p className="text-xs text-slate-500">
                سيتم تسجيل فاتورة شراء لإنشاء هذا الصنف وإدخال رصيده للمخزن
                وخصم إجمالي التكلفة من الخزينة المختارة تلقائياً.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    اسم المنتج <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={preview.productFields.name}
                    onChange={(e) =>
                      updateProductFields({ name: e.target.value })
                    }
                    placeholder="مثال: آيفون 17 برو"
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    الخزينة المخصوم منها
                  </label>
                  <select
                    value={preview.safeId ?? ""}
                    onChange={(e) => {
                      setConfirmError(null);
                      setPreview((prev) =>
                        prev ? { ...prev, safeId: e.target.value } : prev
                      );
                    }}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {safes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({formatCurrency(s.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    الكمية
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={preview.productFields.stockQuantity}
                    onChange={(e) =>
                      updateProductFields({
                        stockQuantity: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    التكلفة (ج.م)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={preview.productFields.averageCostPrice}
                    onChange={(e) =>
                      updateProductFields({
                        averageCostPrice: Math.max(
                          0,
                          Number(e.target.value) || 0
                        ),
                      })
                    }
                    className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    سعر البيع (ج.م)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={preview.productFields.sellingPrice}
                    onChange={(e) =>
                      updateProductFields({
                        sellingPrice: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    الخزينة
                  </label>
                  <select
                    disabled={
                      preview.action === "SALE" &&
                      preview.paymentStatus === "PENDING_COLLECTION"
                    }
                    value={preview.safeId ?? ""}
                    onChange={(e) => {
                      setConfirmError(null);
                      setPreview((prev) =>
                        prev ? { ...prev, safeId: e.target.value } : prev
                      );
                    }}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {safes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({formatCurrency(s.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                {preview.action === "SALE" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        حالة السداد
                      </label>
                      <select
                        value={preview.paymentStatus ?? "PAID"}
                        onChange={(e) => {
                          setConfirmError(null);
                          setPreview((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  paymentStatus: e.target.value as PaymentStatus,
                                }
                              : prev
                          );
                        }}
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="PAID">مدفوع (كاش للخزينة)</option>
                        <option value="PENDING_COLLECTION">
                          تحت التحصيل (COD)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        تكلفة مباشرة (شحن وتغليف)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={preview.directCost ?? 0}
                        onChange={(e) => {
                          setConfirmError(null);
                          setPreview((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  directCost: Number(e.target.value) || 0,
                                }
                              : prev
                          );
                        }}
                        className="tabular-nums h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>

              {isInvoiceAction ? (
                preview.action === "SALE" && products.length === 0 ? (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    لا توجد منتجات في المخزن بعد لبيعها.{" "}
                    <Link
                      href="/purchases/new"
                      className="font-semibold underline hover:text-amber-900"
                    >
                      سجّل فاتورة شراء لإضافة منتجاتك أولاً
                    </Link>{" "}
                    أو اكتب عملية الشراء في الشات.
                  </div>
                ) : (
                  <div className="mt-4 overflow-x-auto rounded-lg border border-emerald-100 bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5 text-start">المنتج</th>
                          <th className="px-4 py-2.5 text-start">الكمية</th>
                          <th className="px-4 py-2.5 text-start">
                            {preview.action === "PURCHASE"
                              ? "تكلفة الوحدة"
                              : "سعر البيع"}
                          </th>
                          {preview.action === "PURCHASE" &&
                            (preview.items ?? []).some(
                              (i) => i.createIfMissing
                            ) && (
                              <th className="px-4 py-2.5 text-start">
                                سعر البيع للمنتج الجديد
                              </th>
                            )}
                          <th className="px-4 py-2.5 text-end">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(preview.items ?? []).map((item, idx) => {
                          const isCreatingNew =
                            preview.action === "PURCHASE" &&
                            Boolean(item.createIfMissing) &&
                            !item.productId;

                          return (
                            <tr key={idx} className="border-t border-slate-100">
                              <td className="px-4 py-2.5">
                                {preview.action === "PURCHASE" ? (
                                  <div className="space-y-1.5">
                                    <select
                                      value={
                                        item.productId
                                          ? item.productId
                                          : isCreatingNew
                                            ? CREATE_NEW_VALUE
                                            : ""
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === CREATE_NEW_VALUE) {
                                          updateItem(idx, {
                                            productId: null,
                                            createIfMissing: true,
                                          });
                                          return;
                                        }
                                        const picked = products.find(
                                          (p) => p.id === val
                                        );
                                        updateItem(idx, {
                                          productId: picked?.id ?? null,
                                          productName:
                                            picked?.name ?? item.productName,
                                          createIfMissing: false,
                                          unitPrice:
                                            item.unitPrice > 0
                                              ? item.unitPrice
                                              : picked?.averageCostPrice ?? 0,
                                        });
                                      }}
                                      className="h-9 w-full min-w-[190px] rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    >
                                      <option value={CREATE_NEW_VALUE}>
                                        + إنشاء منتج جديد: {item.productName}
                                      </option>
                                      {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.name} (متاح: {p.stockQuantity})
                                        </option>
                                      ))}
                                    </select>
                                    {isCreatingNew && (
                                      <input
                                        type="text"
                                        value={item.productName}
                                        onChange={(e) =>
                                          updateItem(idx, {
                                            productName: e.target.value,
                                          })
                                        }
                                        placeholder="اسم المنتج الجديد"
                                        className="h-8 w-full rounded-md border border-emerald-300 bg-emerald-50/40 px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                                      />
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <select
                                      value={item.productId ?? ""}
                                      onChange={(e) => {
                                        const picked = products.find(
                                          (p) => p.id === e.target.value
                                        );
                                        updateItem(idx, {
                                          productId: picked?.id ?? null,
                                          productName:
                                            picked?.name ?? item.productName,
                                          unitPrice:
                                            item.unitPrice > 0
                                              ? item.unitPrice
                                              : picked?.sellingPrice ?? 0,
                                        });
                                      }}
                                      className={cn(
                                        "h-9 w-full min-w-[180px] rounded-md border px-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                                        item.productId
                                          ? "border-slate-300 bg-white text-slate-800"
                                          : "border-amber-400 bg-amber-50 text-amber-900"
                                      )}
                                    >
                                      <option value="">
                                        اختر المنتج (المذكور: {item.productName})
                                      </option>
                                      {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.name} (متاح: {p.stockQuantity})
                                        </option>
                                      ))}
                                    </select>
                                    {!item.productId && (
                                      <p className="mt-1 text-xs text-amber-700">
                                        هذا الصنف غير مسجل بالمخزن — اختر صنفاً
                                        مطابقاً أو{" "}
                                        <Link
                                          href="/purchases/new"
                                          className="font-semibold underline hover:text-amber-900"
                                        >
                                          أدخله عبر فاتورة شراء أولاً
                                        </Link>
                                      </p>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2.5">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItem(idx, {
                                      quantity: Math.max(
                                        1,
                                        Number(e.target.value) || 1
                                      ),
                                    })
                                  }
                                  className="tabular-nums h-9 w-24 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                                />
                              </td>
                              <td className="px-4 py-2.5">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    updateItem(idx, {
                                      unitPrice: Math.max(
                                        0,
                                        Number(e.target.value) || 0
                                      ),
                                    })
                                  }
                                  className="tabular-nums h-9 w-28 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                                />
                              </td>
                              {preview.action === "PURCHASE" &&
                                (preview.items ?? []).some(
                                  (i) => i.createIfMissing
                                ) && (
                                  <td className="px-4 py-2.5">
                                    {isCreatingNew ? (
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                          item.sellingPrice ?? item.unitPrice
                                        }
                                        onChange={(e) =>
                                          updateItem(idx, {
                                            sellingPrice: Math.max(
                                              0,
                                              Number(e.target.value) || 0
                                            ),
                                          })
                                        }
                                        className="tabular-nums h-9 w-28 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                                      />
                                    ) : (
                                      <span className="text-xs text-slate-400">
                                        مسجل مسبقاً
                                      </span>
                                    )}
                                  </td>
                                )}
                              <td className="px-4 py-2.5 text-end">
                                <CurrencyDisplay
                                  amount={item.quantity * item.unitPrice}
                                  className="text-sm font-semibold text-slate-900"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-emerald-100 bg-white p-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      {preview.action === "SAFE_DEPOSIT"
                        ? "سبب الإيداع (لا يؤثر على صافي الربح)"
                        : "البيان / الوصف"}
                    </label>
                    <input
                      type="text"
                      value={preview.description ?? preview.arabicSummary}
                      onChange={(e) => {
                        setConfirmError(null);
                        setPreview((prev) =>
                          prev ? { ...prev, description: e.target.value } : prev
                        );
                      }}
                      className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      المبلغ (ج.م)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={preview.totalAmount}
                      onChange={(e) => {
                        setConfirmError(null);
                        setPreview((prev) =>
                          prev
                            ? {
                                ...prev,
                                totalAmount: Number(e.target.value) || 0,
                              }
                            : prev
                        );
                      }}
                      className="tabular-nums h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {confirmError && (
            <div
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{confirmError}</span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-emerald-200/70 pt-4">
            <div className="flex items-center gap-2 text-base font-bold text-slate-900">
              <span>
                {preview.action === "ADD_PRODUCT"
                  ? "المبلغ المخصوم من الخزينة:"
                  : "الإجمالي:"}
              </span>
              <CurrencyDisplay amount={computedTotal} className="text-lg" />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirm}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>تأكيد وحفظ</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setPreview(null);
                  setConfirmError(null);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
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
