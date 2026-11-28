import { z } from "zod";

const optionalDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "صيغة التاريخ غير صالحة" })
  .optional()
  .or(z.literal("").transform(() => undefined));

export const purchaseItemSchema = z
  .object({
    productId: z.string().trim().optional(),
    productName: z
      .string()
      .trim()
      .max(150, { error: "اسم المنتج طويل جداً" })
      .optional(),
    quantity: z.coerce
      .number({ error: "الكمية غير صالحة" })
      .int({ error: "الكمية يجب أن تكون رقماً صحيحاً" })
      .positive({ error: "الكمية يجب أن تكون أكبر من صفر" }),
    unitCost: z.coerce
      .number({ error: "سعر الوحدة غير صالح" })
      .min(0, { error: "سعر الوحدة لا يمكن أن يكون سالباً" }),
    sellingPrice: z.coerce
      .number({ error: "سعر البيع غير صالح" })
      .min(0, { error: "سعر البيع لا يمكن أن يكون سالباً" })
      .optional(),
  })
  .refine(
    (item) =>
      Boolean(item.productId && item.productId.length > 0) ||
      Boolean(item.productName && item.productName.length > 0),
    {
      error: "يرجى اختيار منتج من المخزن أو كتابة اسم الصنف الجديد",
      path: ["productName"],
    }
  );

export const purchaseSchema = z.object({
  safeId: z.string().trim().min(1, { error: "يرجى اختيار الخزينة" }),
  supplierName: z.string().trim().max(150).optional(),
  notes: z.string().trim().max(500).optional(),
  invoiceDate: optionalDateSchema,
  items: z
    .array(purchaseItemSchema)
    .min(1, { error: "يرجى إضافة منتج واحد على الأقل" }),
});

export const updatePurchaseSchema = purchaseSchema.extend({
  id: z.string().trim().min(1, { error: "معرف الفاتورة مطلوب" }),
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

const saleBaseSchema = z.object({
  paymentStatus: z.enum(["PAID", "PENDING_COLLECTION"]),
  safeId: z.string().trim().optional(),
  customerName: z.string().trim().max(150).optional(),
  directCost: z.coerce
    .number({ error: "التكلفة المباشرة غير صالحة" })
    .min(0, { error: "التكلفة المباشرة لا يمكن أن تكون سالبة" })
    .default(0),
  taxType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  taxValue: z.coerce
    .number({ error: "قيمة الضريبة غير صالحة" })
    .min(0, { error: "قيمة الضريبة لا يمكن أن تكون سالبة" })
    .default(0),
  notes: z.string().trim().max(500).optional(),
  invoiceDate: optionalDateSchema,
  items: z
    .array(saleItemSchema)
    .min(1, { error: "يرجى إضافة منتج واحد على الأقل" }),
});

function validateSaleSafeAndTax(
  data: {
    paymentStatus: "PAID" | "PENDING_COLLECTION";
    safeId?: string;
    taxType: "PERCENTAGE" | "FIXED";
    taxValue: number;
  },
  ctx: z.RefinementCtx
) {
  if (
    data.paymentStatus === "PAID" &&
    (!data.safeId || data.safeId.trim().length === 0)
  ) {
    ctx.addIssue({
      code: "custom",
      message: "يرجى اختيار الخزينة المستلمة للدفع النقدي",
      path: ["safeId"],
    });
  }

  if (data.taxType === "PERCENTAGE" && data.taxValue > 100) {
    ctx.addIssue({
      code: "custom",
      message: "نسبة الضريبة لا يمكن أن تتجاوز ١٠٠٪",
      path: ["taxValue"],
    });
  }
}

export const saleSchema = saleBaseSchema.superRefine(validateSaleSafeAndTax);

export const updateSaleSchema = saleBaseSchema
  .extend({
    id: z.string().trim().min(1, { error: "معرف الفاتورة مطلوب" }),
  })
  .superRefine(validateSaleSafeAndTax);

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

export type PurchaseInput = z.input<typeof purchaseSchema>;
export type ParsedPurchaseInput = z.output<typeof purchaseSchema>;
export type UpdatePurchaseInput = z.input<typeof updatePurchaseSchema>;
export type ParsedUpdatePurchaseInput = z.output<typeof updatePurchaseSchema>;
export type SaleInput = z.input<typeof saleSchema>;
export type ParsedSaleInput = z.output<typeof saleSchema>;
export type UpdateSaleInput = z.input<typeof updateSaleSchema>;
export type ParsedUpdateSaleInput = z.output<typeof updateSaleSchema>;
export type SettleSaleInput = z.infer<typeof settleSaleSchema>;
export type ExpenseInput = z.input<typeof expenseSchema>;
export type ParsedExpenseInput = z.output<typeof expenseSchema>;
export type WithdrawalInput = z.input<typeof withdrawalSchema>;
export type ParsedWithdrawalInput = z.output<typeof withdrawalSchema>;
