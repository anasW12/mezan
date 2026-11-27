import { z } from "zod";

export const parseEntryRequestSchema = z.object({
  text: z
    .string({ error: "يرجى كتابة نص العملية" })
    .trim()
    .min(3, { error: "يرجى كتابة وصف أوضح للعملية (٣ أحرف على الأقل)" })
    .max(500, { error: "النص طويل جداً (الحد الأقصى ٥٠٠ حرف)" }),
});

export const aiParseItemSchema = z.object({
  productId: z.string().nullable().optional(),
  productName: z.string().trim().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
});

export const aiParseResponseSchema = z.object({
  action: z.enum([
    "PURCHASE",
    "SALE",
    "EXPENSE",
    "WITHDRAWAL",
    "ADD_PRODUCT",
    "SAFE_DEPOSIT",
  ]),
  paymentStatus: z
    .enum(["PAID", "PENDING_COLLECTION"])
    .nullable()
    .optional(),
  safeId: z.string().nullable().optional(),
  safeName: z.string().trim().min(1),
  supplierName: z.string().trim().nullable().optional(),
  customerName: z.string().trim().nullable().optional(),
  directCost: z.number().min(0).nullable().optional(),
  category: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  productName: z.string().trim().nullable().optional(),
  stockQuantity: z.number().int().min(0).nullable().optional(),
  averageCostPrice: z.number().min(0).nullable().optional(),
  sellingPrice: z.number().min(0).nullable().optional(),
  items: z.array(aiParseItemSchema).nullable().optional(),
  totalAmount: z.number().min(0),
  arabicSummary: z.string().trim().min(1),
});

export type ParseEntryRequest = z.infer<typeof parseEntryRequestSchema>;
export type AIParseResponse = z.infer<typeof aiParseResponseSchema>;
