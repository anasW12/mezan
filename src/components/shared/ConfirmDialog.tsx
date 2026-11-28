"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = "هل أنت متأكد؟",
  description = "سيتم حذف هذا السجل نهائياً. هذا الإجراء لا يمكن التراجع عنه.",
  confirmLabel = "حذف",
  cancelLabel = "إلغاء",
  variant = "destructive",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl transition-all duration-200 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={
            variant === "destructive"
              ? "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600"
              : "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"
          }
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-center text-lg font-semibold text-slate-900">
          {title}
        </h3>
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-500">
          {description}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:justify-center sm:gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className={
              variant === "destructive"
                ? "min-h-[44px] rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:ring-offset-2"
                : "min-h-[44px] rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-2"
            }
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-2"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
