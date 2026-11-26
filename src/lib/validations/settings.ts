import { z } from "zod";

export const updateCompanySchema = z.object({
  name: z
    .string({ error: "يرجى إدخال اسم الشركة" })
    .trim()
    .min(2, { error: "اسم الشركة يجب أن يكون حرفين على الأقل" })
    .max(120, { error: "اسم الشركة طويل جداً" }),
});

export const createSafeSchema = z.object({
  name: z
    .string({ error: "يرجى إدخال اسم الخزينة" })
    .trim()
    .min(2, { error: "اسم الخزينة يجب أن يكون حرفين على الأقل" })
    .max(100, { error: "اسم الخزينة طويل جداً" }),
  initialBalance: z.coerce
    .number({ error: "الرصيد الافتتاحي غير صالح" })
    .min(0, { error: "الرصيد الافتتاحي لا يمكن أن يكون سالباً" })
    .default(0),
});

export const adjustSafeSchema = z.object({
  safeId: z.string().trim().min(1, { error: "يرجى اختيار الخزينة" }),
  amount: z.coerce
    .number({ error: "المبلغ غير صالح" })
    .refine((val) => val !== 0, {
      error: "مبلغ التسوية يجب ألا يساوي صفراً",
    }),
  reason: z
    .string({ error: "يرجى إدخال سبب التسوية" })
    .trim()
    .min(2, { error: "يرجى إدخال سبب التسوية" })
    .max(250, { error: "السبب طويل جداً" }),
});

export const createFixedAssetSchema = z.object({
  name: z
    .string({ error: "يرجى إدخال اسم الأصل الثابت" })
    .trim()
    .min(2, { error: "اسم الأصل يجب أن يكون حرفين على الأقل" })
    .max(150, { error: "اسم الأصل طويل جداً" }),
  purchaseValue: z.coerce
    .number({ error: "قيمة الشراء غير صالحة" })
    .positive({ error: "قيمة الأصل يجب أن تكون أكبر من صفر" }),
  purchaseDate: z
    .string()
    .trim()
    .min(1, { error: "يرجى تحديد تاريخ الشراء" }),
});

export const deleteFixedAssetSchema = z.object({
  id: z.string().trim().min(1, { error: "معرف الأصل مطلوب" }),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CreateSafeInput = z.infer<typeof createSafeSchema>;
export type AdjustSafeInput = z.infer<typeof adjustSafeSchema>;
export type CreateFixedAssetInput = z.infer<typeof createFixedAssetSchema>;
