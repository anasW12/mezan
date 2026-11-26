"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import { INITIAL_PRODUCTS } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";
import type { Product } from "@/types";

export default function InventoryPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "LOW">("ALL");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formName, setFormName] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formPrice, setFormPrice] = useState("");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.includes(search.trim()) ||
        p.sku.toLowerCase().includes(search.trim().toLowerCase());
      const matchesFilter = filter === "ALL" || p.stockQuantity < 10;
      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormQty("");
    setFormCost("");
    setFormPrice("");
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormQty(String(product.stockQuantity));
    setFormCost(String(product.averageCostPrice));
    setFormPrice(String(product.sellingPrice));
    setModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("يرجى إدخال اسم المنتج", "error");
      return;
    }

    const qty = Number(formQty) || 0;
    const cost = Number(formCost) || 0;
    const price = Number(formPrice) || 0;

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: formName.trim(),
                stockQuantity: qty,
                averageCostPrice: cost,
                sellingPrice: price,
              }
            : p
        )
      );
      showToast("تم تحديث بيانات المنتج بنجاح");
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: formName.trim(),
        sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
        stockQuantity: qty,
        averageCostPrice: cost,
        sellingPrice: price,
      };
      setProducts((prev) => [newProd, ...prev]);
      showToast("تم إضافة المنتج إلى المخزن بنجاح");
    }
    setModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    showToast("تم حذف المنتج بنجاح");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">المخزن</h2>
          <p className="mt-1 text-sm text-slate-500">
            إدارة المنتجات، الكميات المتوفرة، ومتوسط سعر التكلفة.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المنتج..."
              className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pe-3 ps-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={
                filter === "ALL"
                  ? "rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                  : "rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
              }
            >
              الكل ({formatNumber(products.length)})
            </button>
            <button
              type="button"
              onClick={() => setFilter("LOW")}
              className={
                filter === "LOW"
                  ? "rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700"
                  : "rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
              }
            >
              مخزون منخفض (
              {formatNumber(products.filter((p) => p.stockQuantity < 10).length)}
              )
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="لا توجد منتجات مطابقة"
            description="أضف أول منتج لبدء إدارة مخزونك وتتبع التكاليف تلقائياً."
            actionLabel="إضافة منتج جديد"
            onAction={openAddModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    #
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    اسم المنتج
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    الكمية
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    متوسط التكلفة
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-slate-500">
                    سعر البيع
                  </th>
                  <th className="px-6 py-3.5 text-end text-xs font-semibold text-slate-500">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, index) => {
                  const isLowStock = product.stockQuantity < 10;
                  return (
                    <tr
                      key={product.id}
                      className="border-t border-slate-100 transition-colors hover:bg-slate-50/50"
                    >
                      <td className="tabular-nums px-6 py-4 text-sm text-slate-400">
                        {formatNumber(index + 1)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {product.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {product.sku}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            <span className="tabular-nums">
                              {formatNumber(product.stockQuantity)} قطع (مخزون
                              منخفض)
                            </span>
                          </span>
                        ) : (
                          <span className="tabular-nums text-slate-700">
                            {formatNumber(product.stockQuantity)} قطعة
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <CurrencyDisplay
                          amount={product.averageCostPrice}
                          className="text-sm font-normal text-slate-600"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <CurrencyDisplay
                          amount={product.sellingPrice}
                          className="text-sm font-semibold text-slate-900"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            aria-label={`تعديل ${product.name}`}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            aria-label={`حذف ${product.name}`}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
          <span>
            عرض {formatNumber(filtered.length)} من{" "}
            {formatNumber(products.length)} منتجات
          </span>
          <div className="flex items-center gap-1">
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              ١
            </span>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingProduct ? "تعديل منتج" : "إضافة منتج جديد"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="إغلاق"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  اسم المنتج <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: تيشيرت قطن أوفرسايز"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    الكمية
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    placeholder="0"
                    className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    placeholder="0.00"
                    className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0.00"
                    className="tabular-nums h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  حفظ المنتج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف المنتج؟"
        description={`سيتم حذف "${deleteTarget?.name ?? ""}" نهائياً من المخزن. هذا الإجراء لا يمكن التراجع عنه.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
