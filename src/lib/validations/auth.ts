import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ error: "يرجى إدخال البريد الإلكتروني" })
    .trim()
    .toLowerCase()
    .email({ error: "يرجى إدخال بريد إلكتروني صحيح" }),
  password: z
    .string({ error: "يرجى إدخال كلمة المرور" })
    .min(1, { error: "يرجى إدخال كلمة المرور" }),
});

export const registerSchema = z.object({
  name: z
    .string({ error: "يرجى إدخال الاسم الكامل" })
    .trim()
    .min(2, { error: "الاسم الكامل يجب أن يكون حرفين على الأقل" })
    .max(100, { error: "الاسم طويل جداً" }),
  companyName: z
    .string({ error: "يرجى إدخال اسم الشركة" })
    .trim()
    .min(2, { error: "اسم الشركة يجب أن يكون حرفين على الأقل" })
    .max(100, { error: "اسم الشركة طويل جداً" }),
  email: z
    .string({ error: "يرجى إدخال البريد الإلكتروني" })
    .trim()
    .toLowerCase()
    .email({ error: "يرجى إدخال بريد إلكتروني صحيح" }),
  password: z
    .string({ error: "يرجى إدخال كلمة المرور" })
    .min(8, { error: "كلمة المرور يجب أن تكون ٨ أحرف على الأقل" })
    .max(100, { error: "كلمة المرور طويلة جداً" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
