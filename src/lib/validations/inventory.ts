import { z } from "zod";

export const productCreateSchema = z.object({
  name: z
    .string({ error: "يرجى إدخال اسم المنتج" })
    .trim()
    .min(1, { error: "يرجى إدخال اسم المنتج" })
    .max(150, { error: "اسم المنتج طويل جداً" }),
  stockQuantity: z.coerce
    .number({ error: "الكمية يجب أن تكون رقماً صحيحاً" })
    .int({ error: "الكمية يجب أن تكون رقماً صحيحاً" })
    .min(0, { error: "الكمية لا يمكن أن تكون سالبة" }),
  averageCostPrice: z.coerce
    .number({ error: "التكلفة يجب أن تكون رقماً صحيحاً" })
    .min(0, { error: "التكلفة لا يمكن أن تكون سالبة" }),
  sellingPrice: z.coerce
    .number({ error: "سعر البيع يجب أن يكون رقماً صحيحاً" })
    .min(0, { error: "سعر البيع لا يمكن أن يكون سالباً" }),
});

export const productUpdateSchema = productCreateSchema.extend({
  id: z.string().trim().min(1, { error: "معرف المنتج مطلوب" }),
});

export const productDeleteSchema = z.object({
  id: z.string().trim().min(1, { error: "معرف المنتج مطلوب" }),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductDeleteInput = z.infer<typeof productDeleteSchema>;
