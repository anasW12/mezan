"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useToast } from "@/components/shared/ToastProvider";
import { cn } from "@/lib/utils";

interface AssetDraft {
  id: string;
  name: string;
  value: string;
}

interface ProductDraft {
  id: string;
  name: string;
  quantity: string;
  costPrice: string;
  sellingPrice: string;
}

const STEPS = [
  { id: 1, label: "بيانات الشركة" },
  { id: 2, label: "الأصول الثابتة" },
  { id: 3, label: "المنتجات الأولية" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState<number>(1);
  const [companyName, setCompanyName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [companyError, setCompanyError] = useState("");

  const [assets, setAssets] = useState<AssetDraft[]>([
    { id: "a-1", name: "", value: "" },
  ]);

  const [products, setProducts] = useState<ProductDraft[]>([
    { id: "p-1", name: "", quantity: "", costPrice: "", sellingPrice: "" },
  ]);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setCompanyError("يرجى إدخال اسم الشركة");
      return;
    }
    setCompanyError("");
    setStep(2);
  };

  const handleFinish = () => {
    showToast("تم إعداد حساب شركتك بنجاح! أهلاً بك في ميزان");
    router.push("/dashboard");
  };

  return (
    <div className="bg-calm-aurora flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <BrandLogo href="/" />
      </div>

      {/* RTL Step Indicator */}
      <div className="mb-8 flex w-full max-w-lg items-center justify-between px-4">
        {STEPS.map((s, idx) => {
          const completed = step > s.id;
          const active = step === s.id;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    completed || active
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  )}
                >
                  {completed ? <Check className="h-4 w-4" /> : s.id}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs",
                    active
                      ? "font-medium text-emerald-600"
                      : completed
                        ? "font-medium text-slate-700"
                        : "text-slate-400"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mb-5 h-0.5 flex-1 mx-2 transition-colors",
                    step > s.id ? "bg-emerald-600" : "bg-slate-200"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Centered Wizard Card */}
      <div className="surface-glass w-full max-w-lg rounded-2xl border border-slate-200/80 p-8 shadow-lg sm:p-10">
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                أهلاً بيك! خلينا نجهز حسابك 👋
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                خطوات بسيطة لتبدأ متابعة خزينتك ومخزونك بدقة.
              </p>
            </div>

            <div>
              <label
                htmlFor="company-name"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                اسم الشركة <span className="text-rose-500">*</span>
              </label>
              <input
                id="company-name"
                type="text"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  if (companyError) setCompanyError("");
                }}
                placeholder="مثال: شركة النور للتجارة"
                className={cn(
                  "h-10 w-full rounded-md border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2",
                  companyError
                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                )}
              />
              {companyError && (
                <p aria-live="polite" className="mt-1 text-xs text-rose-500">
                  {companyError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="opening-balance"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                رصيد الخزينة الافتتاحي
              </label>
              <div className="relative">
                <input
                  id="opening-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                  className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white pe-12 ps-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-medium text-slate-400">
                  ج.م
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <span>التالي</span>
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                الأصول الثابتة (اختياري)
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                أضف المعدات، الأجهزة، أو الأثاث المملوك للشركة وقيمتها التقديرية.
              </p>
            </div>

            <div className="space-y-3">
              {assets.map((asset, idx) => (
                <div key={asset.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={asset.name}
                    onChange={(e) => {
                      const next = [...assets];
                      next[idx].name = e.target.value;
                      setAssets(next);
                    }}
                    placeholder="اسم الأصل (مثال: لابتوب)"
                    className="h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <div className="relative w-32">
                    <input
                      type="number"
                      min="0"
                      value={asset.value}
                      onChange={(e) => {
                        const next = [...assets];
                        next[idx].value = e.target.value;
                        setAssets(next);
                      }}
                      placeholder="القيمة"
                      className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white pe-9 ps-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="pointer-events-none absolute inset-y-0 end-2 flex items-center text-[11px] text-slate-400">
                      ج.م
                    </span>
                  </div>
                  {assets.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setAssets((prev) =>
                          prev.filter((a) => a.id !== asset.id)
                        )
                      }
                      aria-label="حذف الأصل"
                      className="flex h-10 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setAssets((prev) => [
                  ...prev,
                  { id: `a-${Date.now()}`, name: "", value: "" },
                ])
              }
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة أصل آخر</span>
            </button>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <span>التالي</span>
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="block w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                تخطي هذه الخطوة
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                المنتجات الأولية (اختياري)
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                أضف البضاعة الموجودة حالياً في مخزنك أو ابدأ مباشرة وأضفها
                لاحقاً.
              </p>
            </div>

            <div className="space-y-3">
              {products.map((prod, idx) => (
                <div
                  key={prod.id}
                  className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={prod.name}
                      onChange={(e) => {
                        const next = [...products];
                        next[idx].name = e.target.value;
                        setProducts(next);
                      }}
                      placeholder="اسم المنتج (مثال: تيشيرت قطن)"
                      className="h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setProducts((prev) =>
                            prev.filter((p) => p.id !== prod.id)
                          )
                        }
                        aria-label="حذف المنتج"
                        className="flex h-10 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min="0"
                      value={prod.quantity}
                      onChange={(e) => {
                        const next = [...products];
                        next[idx].quantity = e.target.value;
                        setProducts(next);
                      }}
                      placeholder="الكمية"
                      className="tabular-nums h-10 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <input
                      type="number"
                      min="0"
                      value={prod.costPrice}
                      onChange={(e) => {
                        const next = [...products];
                        next[idx].costPrice = e.target.value;
                        setProducts(next);
                      }}
                      placeholder="التكلفة (ج.م)"
                      className="tabular-nums h-10 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <input
                      type="number"
                      min="0"
                      value={prod.sellingPrice}
                      onChange={(e) => {
                        const next = [...products];
                        next[idx].sellingPrice = e.target.value;
                        setProducts(next);
                      }}
                      placeholder="البيع (ج.م)"
                      className="tabular-nums h-10 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setProducts((prev) => [
                  ...prev,
                  {
                    id: `p-${Date.now()}`,
                    name: "",
                    quantity: "",
                    costPrice: "",
                    sellingPrice: "",
                  },
                ])
              }
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة منتج آخر</span>
            </button>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleFinish}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <Check className="h-4 w-4" />
                <span>حفظ والبدء</span>
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="block w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                تخطي والانتقال للوحة التحكم
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
