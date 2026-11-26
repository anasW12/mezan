import { z } from "zod";

export const purchaseItemSchema = z.object({
  productId: z.string().trim().min(1, { error: "يرجى اختيار المنتج" }),
  quantity: z.coerce
    .number({ error: "الكمية غير صالحة" })
    .int({ error: "الكمية يجب أن تكون رقماً صحيحاً" })
    .positive({ error: "الكمية يجب أن تكون أكبر من صفر" }),
  unitCost: z.coerce
    .number({ error: "سعر الوحدة غير صالح" })
    .min(0, { error: "سعر الوحدة لا يمكن أن يكون سالباً" }),
});

export const purchaseSchema = z.object({
  safeId: z.string().trim().min(1, { error: "يرجى اختيار الخزينة" }),
  supplierName: z.string().trim().max(150).optional(),
  notes: z.string().trim().max(500).optional(),
  items: z
    .array(purchaseItemSchema)
    .min(1, { error: "يرجى إضافة منتج واحد على الأقل" }),
});

export const saleItemSchema = z.object({
  productId: z.string().trim().min(1, { error: "يرجى اختيار المنتج" }),
  quantity: z.coerce
    .number({ error: "الكمية غير صالحة" })
    .int({ error: "الكمية يجب أن تكون رقماً صحيحاً" })
    .positive({ error: "الكمية يجب أن تكون أكبر من صفر" }),
  unitPrice: z.coerce
    .number({ error: "سعر البيع غير صالح" })
    .min(0, { error: "سعر البيع لا يمكن أن يكون سالباً" }),
});

export const saleSchema = z
  .object({
    paymentStatus: z.enum(["PAID", "PENDING_COLLECTION"]),
    safeId: z.string().trim().optional(),
    customerName: z.string().trim().max(150).optional(),
    directCost: z.coerce
      .number({ error: "التكلفة المباشرة غير صالحة" })
      .min(0, { error: "التكلفة المباشرة لا يمكن أن تكون سالبة" })
      .default(0),
    notes: z.string().trim().max(500).optional(),
    items: z
      .array(saleItemSchema)
      .min(1, { error: "يرجى إضافة منتج واحد على الأقل" }),
  })
  .refine(
    (data) =>
      data.paymentStatus === "PENDING_COLLECTION" ||
      (typeof data.safeId === "string" && data.safeId.length > 0),
    {
      error: "يرجى اختيار الخزينة المستلمة للدفع النقدي",
      path: ["safeId"],
    }
  );

export const settleSaleSchema = z.object({
  invoiceId: z.string().trim().min(1, { error: "معرف الفاتورة مطلوب" }),
  safeId: z.string().trim().optional(),
});

export const expenseSchema = z.object({
  safeId: z.string().trim().min(1, { error: "يرجى اختيار الخزينة" }),
  category: z.string().trim().min(1).max(100).default("تشغيل عام"),
  description: z
    .string({ error: "يرجى إدخال وصف المصروف" })
    .trim()
    .min(1, { error: "يرجى إدخال وصف المصروف" })
    .max(300, { error: "الوصف طويل جداً" }),
  amount: z.coerce
    .number({ error: "المبلغ غير صالح" })
    .positive({ error: "المبلغ يجب أن يكون أكبر من صفر" }),
});

export const withdrawalSchema = z.object({
  safeId: z.string().trim().min(1, { error: "يرجى اختيار الخزينة" }),
  notes: z
    .string({ error: "يرجى إدخال وصف السحب" })
    .trim()
    .min(1, { error: "يرجى إدخال وصف السحب" })
    .max(300, { error: "الوصف طويل جداً" }),
  amount: z.coerce
    .number({ error: "المبلغ غير صالح" })
    .positive({ error: "المبلغ يجب أن يكون أكبر من صفر" }),
});

export const recordIdSchema = z.object({
  id: z.string().trim().min(1, { error: "المعرف مطلوب" }),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type SettleSaleInput = z.infer<typeof settleSaleSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
