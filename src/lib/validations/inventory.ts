import { z } from "zod";

export const productUpdateSchema = z.object({
  id: z.string().trim().min(1, { error: "معرف المنتج مطلوب" }),
  name: z
    .string({ error: "يرجى إدخال اسم المنتج" })
    .trim()
    .min(1, { error: "يرجى إدخال اسم المنتج" })
    .max(150, { error: "اسم المنتج طويل جداً" }),
  sellingPrice: z.coerce
    .number({ error: "سعر البيع يجب أن يكون رقماً صحيحاً" })
    .min(0, { error: "سعر البيع لا يمكن أن يكون سالباً" }),
});

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
